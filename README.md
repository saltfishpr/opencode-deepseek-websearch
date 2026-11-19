# DeepSeek 网页搜索

在 OpenCode 中使用 DeepSeek 对话时，开启思考模式即可让模型按需搜索网页、阅读链接。使用 [DeepSeek 官方联网工具](https://api-docs.deepseek.com/zh-cn/guides/web_tools)只按模型 Token 计费，搜索和阅读链接不另外收费。关闭思考模式后，官方联网工具也会关闭，编码工具仍可正常使用。

## 快速开始

1. 将本仓库放在项目的 `opencode-deepseek-websearch/` 目录下，并在项目的 `opencode.json` 中添加插件（也可以换成插件的实际路径）：

   ```json
   {
     "$schema": "https://opencode.ai/config.json",
     "plugins": ["./opencode-deepseek-websearch"]
   }
   ```

2. 在 OpenCode 中连接 DeepSeek，选择 `deepseek/deepseek-flash` 并开启思考模式。联网使用同一个 DeepSeek 账号，无需再配置搜索用的 API Key。
3. 试着问：“请查阅 DeepSeek 官方更新日志，告诉我最近发布了什么，并附上来源链接。”

**如果只想按 Token 付费：** 在 OpenCode 2.3.2 中，请保持实验功能 `full_codemode` 关闭。开启它时，DeepSeek 仍可能使用按次计费的客户端 `websearch`。

## 在其他模型中使用 DeepSeek 搜索

切换到其他模型 provider 后，OpenCode 会沿用你选择的搜索服务。如果没有指定，插件会将 DeepSeek 设为默认搜索服务。这种方式使用 [DeepSeek 网页搜索 API](https://api-docs.deepseek.com/zh-cn/api/search)，每 1000 次成功搜索收费 5 元。首次使用 `websearch` 时，按 OpenCode 提示授权即可。

如果已在 OpenCode 中连接 DeepSeek，通常无需额外配置。也可以设置环境变量 `DEEPSEEK_API_KEY`。如需调整客户端搜索，将 `plugins` 中的路径替换为带 `options` 的对象，例如：

```json
{
  "package": "./opencode-deepseek-websearch",
  "options": { "count": 5 }
}
```

| 客户端搜索选项 | 用途 |
| --- | --- |
| `count` | 每次最多返回多少条结果，默认 10，可设为 1～50。 |
| `needContent` | 设为 `true` 可获取网页正文，默认关闭。 |
| `localization` | 提供 IP 地址，优先返回对应地区的结果。 |
| `apiKey` | 指定搜索用的 API Key，优先于已连接账号和环境变量。 |
| `baseURL` | 自定义搜索服务地址，默认 `https://api.deepseek.com`，也可通过 `DEEPSEEK_BASE_URL` 设置。 |
