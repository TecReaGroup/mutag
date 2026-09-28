import type { ChatCommand, ChatCommandContext, ChatCommandOutcome } from "../../music-library/command-contracts";
import type { ArtworkOutcome } from "../contracts";

/** Merge cover proposals into the existing tag review workflow. */
function proposeCovers(context: ChatCommandContext, artwork: ArtworkOutcome): ChatCommandOutcome {
  const images = new Map(artwork.updates.map((update) => [update.path, update.image]));
  const proposals = new Map(artwork.proposals?.map((proposal) => [proposal.path, proposal.pendingArtwork]));
  return {
    files: context.files.map((file) => {
      const pendingArtwork = proposals.get(file.path);
      const image = images.get(file.path) ?? (pendingArtwork?.filenames.includes("cover.jpg") ? pendingArtwork.image : undefined);
      const proposedFile = pendingArtwork ? { ...file, pendingArtwork } : file;
      return image && !file.savedTags.image && !(file.tempTags ?? file.savedTags).image
        ? { ...proposedFile, tempTags: { ...(file.tempTags ?? file.savedTags), image } } : proposedFile;
    }),
    selectedId: context.selectedId,
    message: artwork.messages.join("\n"),
  };
}

/** Fill missing artist images while preserving the current audio file state. */
async function executeImage(context: ChatCommandContext): Promise<ChatCommandOutcome> {
  const api = window.audioTagApi;
  if (!api || !context.projectRoot) throw new Error(context.t("commands.openArtworkFolder"));
  const artwork = await api.downloadImages(context.projectRoot, context.openAI);
  return proposeCovers(context, artwork);
}

/** Generate artist artwork and propose missing embedded covers. */
async function executeImageGeneration(context: ChatCommandContext): Promise<ChatCommandOutcome> {
  const api = window.audioTagApi;
  if (!api || !context.projectRoot) throw new Error(context.t("commands.openArtworkFolder"));
  context.signal.throwIfAborted();
  const requestId = crypto.randomUUID();
  const cancel = () => api.cancelImageGeneration(requestId);
  context.signal.addEventListener("abort", cancel, { once: true });
  try {
    return proposeCovers(context, await api.generateImages(context.projectRoot, context.openAI, requestId));
  } finally {
    context.signal.removeEventListener("abort", cancel);
  }
}

export const imageGenerationCommand: ChatCommand = {
  name: "/image_gen",
  descriptionKey: "commands.imageGeneration.description",
  progressKey: "commands.imageGeneration.progress",
  execute: executeImageGeneration,
};

export const imageCommand: ChatCommand = {
  name: "/image",
  descriptionKey: "commands.image.description",
  progressKey: "commands.image.progress",
  execute: executeImage,
};
