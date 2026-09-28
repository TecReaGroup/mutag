import type { AudioFile, AudioTag } from "../contracts";
import type { Translate, StaticTranslationKey } from "../../../shared/localization";
import { normalizeTagKey } from "../tag-rules.js";
export { normalizeTagKey } from "../tag-rules.js";

export interface TagField { key: string; label: string }
export type DiffStatus = "unchanged" | "modified" | "added" | "deleted";

export const DEFAULT_FIELD_KEYS = ["image", "title", "artist", "album", "year", "genre", "comment", "lyrics"];
const TAG_LABEL_KEYS: Record<string, StaticTranslationKey> = {
  image: "fields.image", title: "fields.title", artist: "fields.artist", album: "fields.album", year: "fields.year", genre: "fields.genre", bpm: "fields.bpm", comment: "fields.comment", lyrics: "fields.lyrics",
  album_artist: "fields.album_artist", composer: "fields.composer", track_number: "fields.track_number", track_total: "fields.track_total", disc_number: "fields.disc_number", disc_total: "fields.disc_total",
  subtitle: "fields.subtitle", description: "fields.description", grouping: "fields.grouping", copyright: "fields.copyright", conductor: "fields.conductor", remixedby: "fields.remixedby", publisher: "fields.publisher", isrc: "fields.isrc", initial_key: "fields.initial_key",
  musicbrainz_artist_id: "fields.musicbrainz_artist_id", musicbrainz_album_id: "fields.musicbrainz_album_id", musicbrainz_albumartist_id: "fields.musicbrainz_albumartist_id", musicbrainz_track_id: "fields.musicbrainz_track_id",
  musicbrainz_release_group_id: "fields.musicbrainz_release_group_id", musicbrainz_disc_id: "fields.musicbrainz_disc_id", musicbrainz_release_status: "fields.musicbrainz_release_status", musicbrainz_release_type: "fields.musicbrainz_release_type", musicbrainz_release_country: "fields.musicbrainz_release_country", musicip_id: "fields.musicip_id", amazon_id: "fields.amazon_id",
};

export const DIFF_STYLES: Record<DiffStatus, { field: string; badge: string; label: string }> = {
  unchanged: { field: "bg-surface border-border text-foreground", badge: "", label: "" },
  modified: { field: "bg-warning-muted border-warning-border text-warning-foreground", badge: "text-warning", label: "M" },
  added: { field: "bg-success-muted border-success-hover text-success-foreground", badge: "text-success-hover", label: "A" },
  deleted: { field: "bg-danger-muted border-destructive text-danger-foreground", badge: "text-destructive", label: "D" },
};

export function getTagValue(tags: AudioTag, key: string): string { return tags[normalizeTagKey(key)] ?? tags[key] ?? ""; }
export function tagLabel(key: string, t: Translate): string {
  const normalized = normalizeTagKey(key);
  return Object.hasOwn(TAG_LABEL_KEYS, normalized) ? t(TAG_LABEL_KEYS[normalized]) : normalized.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
export function knownTagFields(t: Translate): TagField[] {
  return Object.keys(TAG_LABEL_KEYS).map((key) => ({ key, label: tagLabel(key, t) }));
}
export function fieldStatus(original: string, edited: string): DiffStatus {
  if (original !== "" && edited === "") return "deleted";
  if (original === "" && edited !== "") return "added";
  return original === edited ? "unchanged" : "modified";
}
export function hasTagChanges(file: AudioFile): boolean {
  if (file.pendingArtwork) return true;
  return file.tempTags !== null && Object.keys({ ...file.savedTags, ...file.tempTags }).some((key) => getTagValue(file.savedTags, key) !== getTagValue(file.tempTags!, key));
}

/** Preserve configured ordering and append populated or explicitly added fields. */
export function fieldsForFile(file: AudioFile, defaults: string[], extraKeys: string[], t: Translate): TagField[] {
  const keys = new Set(defaults.map(normalizeTagKey));
  for (const rawKey of Object.keys({ ...file.savedTags, ...file.tempTags })) {
    const key = normalizeTagKey(rawKey);
    if (getTagValue(file.savedTags, key) || getTagValue(file.tempTags ?? file.savedTags, key)) keys.add(key);
  }
  extraKeys.forEach((key) => keys.add(normalizeTagKey(key)));
  return Array.from(keys, (key) => ({ key, label: tagLabel(key, t) }));
}
