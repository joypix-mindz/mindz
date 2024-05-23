import assert from 'node:assert';

import {
  CopilotCapability,
  CopilotChatOptions,
  CopilotImageOptions,
  CopilotImageToImageProvider,
  CopilotProviderType,
  CopilotTextToImageProvider,
  PromptMessage,
} from '../types';

export type FalConfig = {
  apiKey: string;
};

export type FalImage = {
  url: string;
  seed: number;
  file_name: string;
};

export type FalResponse = {
  detail: Array<{ msg: string }> | string;
  // normal sd/sdxl response
  images?: Array<FalImage>;
  // special i2i model response
  image?: FalImage;
  // image2text response
  output: string;
};

type FalPrompt = {
  image_url?: string;
  prompt?: string;
  lora?: string[];
};

export class FalProvider
  implements CopilotTextToImageProvider, CopilotImageToImageProvider
{
  static readonly type = CopilotProviderType.FAL;
  static readonly capabilities = [
    CopilotCapability.TextToImage,
    CopilotCapability.ImageToImage,
    CopilotCapability.ImageToText,
  ];

  readonly availableModels = [
    // text to image
    'fast-turbo-diffusion',
    // image to image
    'lcm-sd15-i2i',
    'clarity-upscaler',
    'face-to-sticker',
    'imageutils/rembg',
    'fast-sdxl/image-to-image',
    // image to text
    'llava-next',
  ];

  constructor(private readonly config: FalConfig) {
    assert(FalProvider.assetsConfig(config));
  }

  static assetsConfig(config: FalConfig) {
    return !!config.apiKey;
  }

  get type(): CopilotProviderType {
    return FalProvider.type;
  }

  getCapabilities(): CopilotCapability[] {
    return FalProvider.capabilities;
  }

  async isModelAvailable(model: string): Promise<boolean> {
    return this.availableModels.includes(model);
  }

  private extractError(resp: FalResponse): string {
    return Array.isArray(resp.detail)
      ? resp.detail[0]?.msg
      : typeof resp.detail === 'string'
        ? resp.detail
        : '';
  }

  private extractPrompt(message?: PromptMessage): FalPrompt {
    if (!message) throw new Error('Prompt is empty');
    const { content, attachments, params } = message;
    // prompt attachments require at least one
    if (!content && (!Array.isArray(attachments) || !attachments.length)) {
      throw new Error('Prompt or Attachments is empty');
    }
    if (Array.isArray(attachments) && attachments.length > 1) {
      throw new Error('Only one attachment is allowed');
    }
    const lora = (
      params?.lora
        ? Array.isArray(params.lora)
          ? params.lora
          : [params.lora]
        : []
    ).filter(v => typeof v === 'string' && v.length);
    return {
      image_url: attachments?.[0],
      prompt: content.trim(),
      lora: lora.length ? lora : undefined,
    };
  }

  async generateText(
    messages: PromptMessage[],
    model: string = 'llava-next',
    options: CopilotChatOptions = {}
  ): Promise<string> {
    if (!this.availableModels.includes(model)) {
      throw new Error(`Invalid model: ${model}`);
    }

    // by default, image prompt assumes there is only one message
    const prompt = this.extractPrompt(messages.pop());
    const data = (await fetch(`https://fal.run/fal-ai/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `key ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...prompt,
        sync_mode: true,
        enable_safety_checks: false,
      }),
      signal: options.signal,
    }).then(res => res.json())) as FalResponse;

    if (!data.output) {
      const error = this.extractError(data);
      throw new Error(
        error ? `Failed to generate image: ${error}` : 'No images generated'
      );
    }
    return data.output;
  }

  async *generateTextStream(
    messages: PromptMessage[],
    model: string = 'llava-next',
    options: CopilotChatOptions = {}
  ): AsyncIterable<string> {
    const result = await this.generateText(messages, model, options);

    for await (const content of result) {
      if (content) {
        yield content;
        if (options.signal?.aborted) {
          break;
        }
      }
    }
  }

  // ====== image to image ======
  async generateImages(
    messages: PromptMessage[],
    model: string = this.availableModels[0],
    options: CopilotImageOptions = {}
  ): Promise<Array<string>> {
    if (!this.availableModels.includes(model)) {
      throw new Error(`Invalid model: ${model}`);
    }

    // by default, image prompt assumes there is only one message
    const prompt = this.extractPrompt(messages.pop());
    const data = (await fetch(`https://fal.run/fal-ai/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `key ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...prompt,
        sync_mode: true,
        seed: options.seed || 42,
        enable_safety_checks: false,
      }),
      signal: options.signal,
    }).then(res => res.json())) as FalResponse;

    if (!data.images?.length && !data.image?.url) {
      const error = this.extractError(data);
      throw new Error(
        error ? `Failed to generate image: ${error}` : 'No images generated'
      );
    }

    if (data.image?.url) {
      return [data.image.url];
    }

    return data.images?.map(image => image.url) || [];
  }

  async *generateImagesStream(
    messages: PromptMessage[],
    model: string = this.availableModels[0],
    options: CopilotImageOptions = {}
  ): AsyncIterable<string> {
    const ret = await this.generateImages(messages, model, options);
    for (const url of ret) {
      yield url;
    }
  }
}
