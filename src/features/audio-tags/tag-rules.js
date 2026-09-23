const TAG_KEY_ALIASES = {
  albumartist: "album_artist", track: "track_number", tracktotal: "track_total",
  disc: "disc_number", disctotal: "disc_total", initialkey: "initial_key",
  musicbrainzalbumid: "musicbrainz_album_id", musicbrainzalbumartistid: "musicbrainz_albumartist_id",
  musicbrainzartistid: "musicbrainz_artist_id", musicbrainztrackid: "musicbrainz_track_id",
};

export const SUPPORTED_TAG_KEYS = new Set([
  "image", "title", "artist", "album", "year", "genre", "bpm", "comment", "lyrics",
  "album_artist", "composer", "track_number", "track_total", "disc_number", "disc_total",
  "subtitle", "description", "grouping", "copyright", "conductor", "remixedby", "publisher",
  "isrc", "initial_key", "musicbrainz_artist_id", "musicbrainz_album_id", "musicbrainz_albumartist_id",
  "musicbrainz_track_id", "musicbrainz_release_group_id", "musicbrainz_disc_id",
  "musicbrainz_release_status", "musicbrainz_release_type", "musicbrainz_release_country",
  "musicip_id", "amazon_id",
]);

/**
 * Resolve known aliases without accepting inherited object properties.
 * @param {string} key
 * @returns {string}
 */
export function normalizeTagKey(key) {
  return Object.hasOwn(TAG_KEY_ALIASES, key) ? TAG_KEY_ALIASES[key] : key;
}
