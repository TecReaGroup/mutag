export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatCommand<Context, Outcome> {
  name: string;
  description: string;
  descriptionEn: string;
  progressMessage: string;
  execute: (context: Context) => Promise<Outcome>;
}
