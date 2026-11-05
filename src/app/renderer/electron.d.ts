import type { DesktopApi } from "../desktop-api";
import type { VideoDesktopApi } from "../../features/video-tags/contracts";

declare global {
  interface Window {
    audioTagApi?: DesktopApi;
    videoTagApi?: VideoDesktopApi;
  }
}

export {};
