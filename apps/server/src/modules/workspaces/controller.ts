import type { Storage } from '@affine/storage';
import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';

import { StorageProvide } from '../../storage';

@Controller('/api/workspaces')
export class WorkspacesController {
  constructor(@Inject(StorageProvide) private readonly storage: Storage) {}

  @Get('/:id/blobs/:name')
  async blob(
    @Param('id') workspaceId: string,
    @Param('name') name: string,
    @Res() res: Response
  ) {
    const blob = await this.storage.blob(workspaceId, name);

    if (!blob) {
      throw new NotFoundException('Blob not found');
    }

    res.setHeader('content-type', blob.contentType);
    res.setHeader('last-modified', blob.lastModified);
    res.setHeader('content-length', blob.size);

    res.send(blob.data);
  }
}
