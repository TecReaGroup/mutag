import type { AudioFile, AudioTag } from "../contracts";
import type { Language } from "../../../shared/renderer/localization";
import { normalizeTagKey } from "../tag-rules.js";
export { normalizeTagKey } from "../tag-rules.js";

export interface TagField { key: string; label: string }
export type DiffStatus = "unchanged" | "modified" | "added" | "deleted";

export const DEFAULT_FIELD_KEYS = ["image", "title", "artist", "album", "year", "genre", "comment", "lyrics"];
const TAG_LABELS: Record<string, string> = {
  image: "Album cover", title: "Title", artist: "Artist", album: "Album", year: "Year", genre: "Genre", bpm: "BPM", comment: "Comment", lyrics: "Lyrics",
  album_artist: "Album Artist", composer: "Composer", track_number: "Track Number", track_total: "Track Total", disc_number: "Disc Number", disc_total: "Disc Total",
  subtitle: "Subtitle", description: "Description", grouping: "Grouping", copyright: "Copyright", conductor: "Conductor", remixedby: "Remixed By", publisher: "Publisher", isrc: "ISRC", initial_key: "Initial Key",
  musicbrainz_artist_id: "MusicBrainz Artist ID", musicbrainz_album_id: "MusicBrainz Album ID", musicbrainz_albumartist_id: "MusicBrainz Album Artist ID", musicbrainz_track_id: "MusicBrainz Track ID",
  musicbrainz_release_group_id: "MusicBrainz Release Group ID", musicbrainz_disc_id: "MusicBrainz Disc ID", musicbrainz_release_status: "MusicBrainz Release Status", musicbrainz_release_type: "MusicBrainz Release Type", musicbrainz_release_country: "MusicBrainz Release Country", musicip_id: "MusicIP ID", amazon_id: "Amazon ID",
};
const CHINESE_TAG_LABELS: Record<string, string> = {
  title: "歌名", artist: "歌手", album: "专辑", album_artist: "专辑歌手", genre: "流派", year: "年份", track_number: "音轨", track_total: "总音轨数", disc_number: "碟号", disc_total: "总碟数", composer: "作曲", comment: "备注", lyrics: "歌词", image: "封面", bpm: "节拍", copyright: "版权", publisher: "发行方",
};

export const DIFF_STYLES: Record<DiffStatus, { field: string; badge: string; label: string }> = {
  unchanged: { field: "bg-surface border-border text-foreground", badge: "", label: "" },
  modified: { field: "bg-warning-muted border-warning-border text-warning-foreground", badge: "text-warning", label: "M" },
  added: { field: "bg-success-muted border-success-hover text-success-foreground", badge: "text-success-hover", label: "A" },
  deleted: { field: "bg-danger-muted border-destructive text-danger-foreground", badge: "text-destructive", label: "D" },
};

export function getTagValue(tags: AudioTag, key: string): string { return tags[normalizeTagKey(key)] ?? tags[key] ?? ""; }
export function tagLabel(key: string, language: Language): string {
  const normalized = normalizeTagKey(key);
  return (language === "zh-CN" ? CHINESE_TAG_LABELS[normalized] : undefined) ?? TAG_LABELS[normalized] ?? normalized.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
export function knownTagFields(language: Language): TagField[] {
  return Object.keys(TAG_LABELS).map((key) => ({ key, label: tagLabel(key, language) }));
}
export function fieldStatus(original: string, edited: string): DiffStatus {
  if (original !== "" && edited === "") return "deleted";
  if (original === "" && edited !== "") return "added";
  return original === edited ? "unchanged" : "modified";
}
export function hasTagChanges(file: AudioFile): boolean {
  return file.tempTags !== null && Object.keys({ ...file.savedTags, ...file.tempTags }).some((key) => getTagValue(file.savedTags, key) !== getTagValue(file.tempTags!, key));
}

/** Preserve configured ordering and append populated or explicitly added fields. */
export function fieldsForFile(file: AudioFile, defaults: string[], extraKeys: string[], language: Language): TagField[] {
  const keys = new Set(defaults.map(normalizeTagKey));
  for (const rawKey of Object.keys({ ...file.savedTags, ...file.tempTags })) {
    const key = normalizeTagKey(rawKey);
    if (getTagValue(file.savedTags, key) || getTagValue(file.tempTags ?? file.savedTags, key)) keys.add(key);
  }
  extraKeys.forEach((key) => keys.add(normalizeTagKey(key)));
  return Array.from(keys, (key) => ({ key, label: tagLabel(key, language) }));
}
