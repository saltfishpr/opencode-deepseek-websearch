# DeepSeek 网页搜索

使用 `deepseek` 模型 provider 时，插件在主对话和编码工具执行后的 Chat Completions 请求中启用 [DeepSeek 服务端联网工具](https://api-docs.deepseek.com/zh-cn/guides/web_tools)。开启 thinking（含官方默认值）时追加 `deepseek_web_search` 和 `deepseek_read_url`；关闭 thinking 时不追加。编码工具和 thinking 设置保持原样，标题生成和上下文压缩不受影响。按 provider ID 匹配全部模型；官方联网工具指南指定的模型是 `deepseek-flash`。

插件从 DeepSeek 主请求的顶层工具中移除 `websearch`。OpenCode 2.3.2 的 **`full_codemode` 限制**：开启该实验功能时，`execute` 的目录在插件 hook 之前生成，仍可能发现并调用客户端搜索。需要同时阻止两个入口时，请保持 `full_codemode` 关闭。

其他模型 provider 继续使用原有的客户端搜索选择。插件注册的客户端搜索 provider `deepseek` 调用 `POST /v1/tools/search`，只在没有显式配置搜索 provider 时成为默认值。

## 加载

在 workspace 根目录的 `opencode.json` 中加载：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["./opencode-deepseek-websearch"]
}
```

修改代码后 OpenCode 会自动重载。

## 凭证

服务端联网复用当前模型请求的凭证。以下凭证顺序和插件选项仅用于客户端搜索：

1. 插件 options 里的 `apiKey`
2. OpenCode 中已连接的 DeepSeek 凭据（集成 `deepseek`）
3. 环境变量 `DEEPSEEK_API_KEY`

## 可选配置

需要自定义时，把 `plugins` 里的字符串换成对象形式：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    {
      "package": "./opencode-deepseek-websearch",
      "options": {
        "count": 10,
        "needContent": false
      }
    }
  ]
}
```

| 选项           | 类型    | 默认值                     | 说明                                     |
| -------------- | ------- | -------------------------- | ---------------------------------------- |
| `apiKey`       | string  | —                          | 直接指定 API Key，优先级最高             |
| `baseURL`      | string  | `https://api.deepseek.com` | API 地址，也可用 `DEEPSEEK_BASE_URL`     |
| `count`        | number  | `10`                       | 返回条数，范围 1～50                     |
| `needContent`  | boolean | `false`                    | 是否请求网页正文；开启后单条结果可能很长 |
| `localization` | string  | —                          | 用于优先返回本地化结果的 IP 地址         |

## 权限

内置 `websearch` 工具的权限默认是询问。首次使用时在弹窗里选择允许即可；也可以提前放行：

```jsonc
{
  "permission": {
    "websearch": "allow"
  }
}
```

## 计费与限制

- 服务端联网只按模型 Token 计费；联网工具本身不单独收费。是否联网由模型决定。
- 以下限制适用于客户端 Search API：按成功请求计费，5 元 / 1000 次；失败、无结果、超时不计费。
- 账号级限速 100 QPS。
- `query` 长度为 1～128 个字符，`count` 为 1～50。
- 插件对单次请求设置了 30 秒超时，并跟随会话取消。

## 验证

```bash
opencode api get '/api/websearch/provider?location%5Bdirectory%5D=%2Fhome%2Fubuntu%2Fworkspace'
```

输出中包含 `{"id":"deepseek","name":"DeepSeek"}` 即注册成功。也可以直接让模型搜索一次，观察结果是否来自 DeepSeek。
