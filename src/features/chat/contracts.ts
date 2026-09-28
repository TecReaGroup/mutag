export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatCommand<Context, Outcome> {
  name: string;
  descriptionKey: StaticTranslationKey;
  progressKey: StaticTranslationKey;
  execute: (context: Context) => Promise<Outcome>;
}
import type { StaticTranslationKey } from "../../shared/localization";
