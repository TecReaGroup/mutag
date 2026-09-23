# LLM 设置与命令

所有 LLM 命令使用当前选中模型的配置。模型名包含 `gemini` 时（不区分大小写），设置中显示以下两个开关，默认关闭，按模型保存。

| 开关 | 作用 |
| --- | --- |
| Upload audio（音频上传） | 仅在 `/lyris` 中上传音频，供模型识别歌词及演唱时间。 |
| Web search（联网搜索） | 为 `/meta`、`/image`、`/lyris` 启用 Gemini 的 Google 搜索工具，由模型按需调用。 |

联网搜索能力需要接口地址支持 Gemini 原生 API。关闭开关后不向模型声明 Google 搜索工具；`/image` 自带的 Wikipedia、Apple Music 图片候选检索仍会执行。

## 请求数量与等待时间

- `/meta` 按音频文件分批，每批数量由 Files per request 决定。
- `/image` 按歌手目录分批，每批数量由 Files per request 决定。
- `/lyris` 每首歌单独请求，不使用 Files per request。
- 三个命令均遵循 Concurrency 和 Maximum wait 设置，超时按单次模型请求计算。
- 普通对话使用单次请求，不上传音频，也不启用上述 Google 搜索工具。

## 生成歌词

打开音乐目录并选中 Gemini 模型后，在聊天框发送 `/lyris`。命令会处理当前目录及扫描到的子目录音频，将校验通过的 LRC 直接写入音频的 `lyrics` 标签，覆盖已有歌词，不生成独立 `.lrc` 文件。单首失败会显示原因并继续处理其他歌曲。

开启 Upload audio 后使用内联音频，请求总大小限制为 20 MiB。关闭时只发送歌曲信息，提示词要求使用可靠的对应版本 LRC，不能编造时间戳。无法获得有效歌词时不会写入标签。

歌词提示词位于 [lyris_prompt.md](../data/prompt/lyris_prompt.md)。
