export interface VideoTags { title: string; creator: string; album: string; image: string }
export interface VideoFile { path: string; name: string; savedTags: VideoTags; draft: VideoTags }
export type VideoOutcome<T> = ({ ok: true } & T) | { ok: false; canceled?: boolean; error?: string };
export interface VideoDesktopApi {
  openFolder: () => Promise<VideoOutcome<{ root: string; files: VideoFile[]; warnings: string[] }>>;
  saveTags: (path: string, tags: VideoTags) => Promise<VideoOutcome<{ tags: VideoTags }>>;
  importImage: () => Promise<VideoOutcome<{ image: string }>>;
  exportImage: (path: string) => Promise<VideoOutcome<{ path: string }>>;
}
