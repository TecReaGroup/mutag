import { EN } from "./en";
import { ZH_CN } from "./zh-CN";

export type Language = "en" | "zh-CN";
export type TranslationKey = keyof typeof EN;
export type TranslationCatalog = Record<TranslationKey, string>;
type Placeholders<Text extends string> = Text extends `${string}{${infer Name}}${infer Rest}` ? Name | Placeholders<Rest> : never;
type TranslationArguments<Key extends TranslationKey> = [Placeholders<typeof EN[Key]>] extends [never]
  ? [] : [parameters: Record<Placeholders<typeof EN[Key]>, string | number>];
export type Translate = <Key extends TranslationKey>(key: Key, ...args: TranslationArguments<Key>) => string;
export type StaticTranslationKey = { [Key in TranslationKey]: TranslationArguments<Key> extends [] ? Key : never }[TranslationKey];

export const LANGUAGE_OPTIONS = [
  { key: "en", label: "English", value: "en" },
  { key: "zh-CN", label: "简体中文", value: "zh-CN" },
] as const;

const CATALOGS: Record<Language, TranslationCatalog> = { en: EN, "zh-CN": ZH_CN };

/** Bind a language and require each message's interpolation parameters. */
export function createTranslator(language: Language): Translate {
  return <Key extends TranslationKey>(key: Key, ...args: TranslationArguments<Key>): string => {
    const parameters = args[0] as Record<string, string | number> | undefined;
    const message = CATALOGS[language][key] ?? EN[key];
    return message.replace(/\{(\w+)\}/g, (placeholder, name: string) => parameters?.[name] === undefined ? placeholder : String(parameters[name]));
  };
}
