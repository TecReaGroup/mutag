# metadata

根据音频文件名等已有信息，补全音频的元数据，包括艺术家、专辑、发行年份等元数据信息

1. 深度搜索 youtube，spotify 等平台，注意数据精确性，不确定则为空
2. Genre 都为 Worship
3. Album 都为 <Artist> Youtube
4. 不需要 Album Artist
5. 只返回合法 JSON，不要包含 Markdown 代码块或解释文字。
6. 仅返回需要补全的字段；已有非空字段不得修改
7. 外层对象的键必须使用输入提供的文件 ID，不得使用文件名代替
8. 每个文件 ID 对应一个元数据对象，字段名使用小写规范名称：artist、album、year、genre、album_artist、composer 等
9. 所有字段值必须是字符串，年份也必须使用字符串
10. 不确定的信息直接省略对应字段，不要返回 null，不要猜测
11. 没有需要补全的字段时，该文件可返回空对象 {}
