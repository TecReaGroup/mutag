# 音频标签字段说明

## 默认显示标签字段

```json
{
  "title": "歌曲名称 (如：七里香)",
  "artist": "演唱者/艺术家，多位歌手建议使用分号等标准分隔符 (如：周杰伦; 温岚)",
  "album_artist": "专辑艺术家，极其重要，Navidrome 依据此标签将歌曲聚合为一张专辑，合辑通常填 Various Artists",
  "album": "所属专辑名称 (如：七里香)",
  "track_number": "音轨编号，决定歌曲在专辑中的播放顺序 (如：1 或 01/10)",
  "disc_number": "碟片编号，双碟或多碟发行的专辑必备，防止多碟曲目顺序交错 (如：1 或 1/2)",
  "year": "发行年份或精确发行日期 (如：2004 或 2004-08-03)",
  "composer": "作曲人",
  "lyricist": "作词人",
  "lyrics": "内嵌的非同步文本歌词内容 (USLT 帧)",
  "musicbrainz_artist_id": "MusicBrainz 歌手唯一 ID，Navidrome 依赖此 ID 去外部刮削高清歌手头像和英文生平简介",
  "musicbrainz_album_id": "MusicBrainz 专辑唯一 ID，用于精准匹配专辑元数据",
  "musicbrainz_albumartist_id": "MusicBrainz 专辑艺术家唯一 ID",
  "musicbrainz_track_id": "MusicBrainz 音轨唯一 ID",
  "comment": "备注信息，可用于记录压制参数、来源渠道或个人自定义标记",
  "bpm": "每分钟节拍数 (Beats Per Minute)，常用于电子乐或生成运动歌单 (如：120)"
}
```

## 可选基础标签字段

```json
{
  "title": "歌曲名称 (如：七里香)",
  "artist": "演唱者/艺术家，多位歌手建议使用分号等标准分隔符 (如：周杰伦; 温岚)",
  "album_artist": "专辑艺术家，极其重要，Navidrome 依据此标签将歌曲聚合为一张专辑，合辑通常填 Various Artists",
  "album": "所属专辑名称 (如：七里香)",
  "track_number": "音轨编号，决定歌曲在专辑中的播放顺序 (如：1 或 01/10)",
  "disc_number": "碟片编号，双碟或多碟发行的专辑必备，防止多碟曲目顺序交错 (如：1 或 1/2)",
  "year": "发行年份或精确发行日期 (如：2004 或 2004-08-03)",
  "genre": "音乐流派，用于分类和筛选 (如：Pop, R&B)",
  "composer": "作曲人",
  "lyricist": "作词人",
  "lyrics": "内嵌的非同步文本歌词内容 (USLT 帧)",
  "musicbrainz_artist_id": "MusicBrainz 歌手唯一 ID，Navidrome 依赖此 ID 去外部刮削高清歌手头像和英文生平简介",
  "musicbrainz_album_id": "MusicBrainz 专辑唯一 ID，用于精准匹配专辑元数据",
  "musicbrainz_albumartist_id": "MusicBrainz 专辑艺术家唯一 ID",
  "musicbrainz_track_id": "MusicBrainz 音轨唯一 ID",
  "comment": "备注信息，可用于记录压制参数、来源渠道或个人自定义标记",
  "bpm": "每分钟节拍数 (Beats Per Minute)，常用于电子乐或生成运动歌单 (如：120)"
}
```
