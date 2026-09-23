import type { DesktopApi } from "../desktop-api";

declare global {
  interface Window {
    audioTagApi?: DesktopApi;
  }
}

export {};
