# AGENTS.md

`README.md` 面向使用者，记录功能、配置、权限、限制和验证方式。

## 构建与开发

```sh
pnpm install
pnpm run typecheck
```

## 代码结构

- `src/index.ts`：服务端入口，定义插件，读取 options 和环境变量，解析 DeepSeek 凭据，注册 `deepseek` websearch provider。
- `src/search.ts`：调用 `POST /v1/tools/search`，处理错误、超时和结果映射。
- `src/types.ts`：插件 options 和 DeepSeek 响应类型。

## Provider 约定

- provider id 为 `deepseek`，名称 `DeepSeek`。
- 只有在 `editor.default.get()` 返回 `undefined` 时才把它设为默认，不覆盖用户在 `opencode.json` 中配置的 provider。
- `execute` 返回 `WebSearch.Result[]`，供内置 `websearch` 工具使用。

## 凭证

按以下顺序读取 API Key：

1. 插件 options 的 `apiKey`
2. OpenCode 集成 `deepseek` 的当前凭据（`ctx.integration.connection.active` + `resolve`）
3. 环境变量 `DEEPSEEK_API_KEY`

凭据在每次执行时读取，用户可以在插件加载后再连接 DeepSeek，不需要重载。

## 配置

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `apiKey` | — | 直接指定 API Key |
| `baseURL` | `https://api.deepseek.com` | 也可用 `DEEPSEEK_BASE_URL`；末尾斜杠会被去掉 |
| `count` | `10` | 限制在 1～50 |
| `needContent` | `false` | 传给 `need_content`；开启后正文可能很长 |
| `localization` | — | 传给 `localization` |

## 结果映射

- 请求字段为 `query`、`count`、`need_content`，可选 `localization`。
- `content` 为空时按 `summary`、`snippet` 依次回退。
- `date` 解析为毫秒时间戳，写入 `time.published`；无法解析时返回空对象。
- `WebSearch.Result` 的可选字段在编码时是 optional key，值为 `undefined` 会导致编码失败。因此 `title` 和 `content` 必须用条件展开省略，不能直接赋 `undefined`。

## 上游接口

- 文档：<https://api-docs.deepseek.com/zh-cn/api/search>
- Endpoint：`POST https://api.deepseek.com/v1/tools/search`
- 鉴权：`Authorization: Bearer <API Key>`
- 错误响应为 OpenAI 兼容格式，`400`/`401`/`402`/`429`/`5xx` 等状态码原样带在错误信息中。
- 单次请求超时 30 秒，并跟随会话的 `AbortSignal`。
- 计费按成功请求计，5 元 / 1000 次；账号级限速 100 QPS。
