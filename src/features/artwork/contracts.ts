export interface PendingArtwork {
  token: string;
  image: string;
  filenames: string[];
}

export interface ArtworkOutcome {
  proposals?: { path: string; pendingArtwork: PendingArtwork }[];
  updates: { path: string; image: string }[];
  messages: string[];
}
