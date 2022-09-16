import en from './en.json';
import es from './es.json';
import zh_Hans from './zh.json';
import zh_Hant from './zh-Hant.json';

export const LOCALES = [
    {
        name: 'English',
        tag: 'en',
        originalName: 'English',
        res: en,
    },
    {
        name: 'Simplified Chinese',
        tag: 'zh-Hans',
        originalName: '简体中文',
        res: zh_Hans,
    },
    {
        name: 'Traditional Chinese',
        tag: 'zh-Hant',
        originalName: '繁體中文',
        res: zh_Hant,
    },
    {
        name: 'Spanish',
        tag: 'es',
        originalName: 'español',
        res: es,
    },
] as const;
