const METADATA_LINE = /^\[(?:ar|al|ti|by|offset|re|ve):[^\]\r\n]*\]$/;
const TIMESTAMP_PREFIX = /^(?:\[\d{2}:\d{2}\.\d{2}\])+/;

/** Reject malformed or unordered lyrics before touching audio tags. */
export function validateLrc(content) {
  const lyrics = content.trim();
  let previousTimestamp = -1;
  let lyricCount = 0;
  for (const line of lyrics.split(/\r?\n/)) {
    if (METADATA_LINE.test(line)) continue;
    const prefix = line.match(TIMESTAMP_PREFIX)?.[0];
    if (!prefix || !line.slice(prefix.length).trim()) throw new Error("模型未返回有效的 LRC 歌词。");
    for (const timestamp of prefix.matchAll(/\[(\d{2}):(\d{2})\.(\d{2})\]/g)) {
      const [, minutes, seconds, fraction] = timestamp;
      const currentTimestamp = Number(minutes) * 6000 + Number(seconds) * 100 + Number(fraction);
      if (Number(seconds) >= 60 || currentTimestamp < previousTimestamp) throw new Error("LRC 时间戳无效或未按时间排序。");
      previousTimestamp = currentTimestamp;
    }
    lyricCount += 1;
  }
  if (!lyricCount) throw new Error("模型未返回有效的 LRC 歌词。");
  return lyrics;
}
