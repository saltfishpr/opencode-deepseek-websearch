# DeepSeek 网页搜索

把 OpenCode 内置的 `websearch` 工具接到 [DeepSeek 网页搜索 API](https://api-docs.deepseek.com/zh-cn/api/search)。

插件注册一个 id 为 `deepseek` 的搜索 provider，并在没有显式配置 provider 时把它设为默认。模型调用 `websearch` 时就会走 `POST https://api.deepseek.com/v1/tools/search`。

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

`execute` 按以下顺序取 API Key：

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

- Search 按成功请求计费，5 元 / 1000 次；失败、无结果、超时不计费。
- 账号级限速 100 QPS。
- `query` 长度为 1～128 个字符，`count` 为 1～50。
- 插件对单次请求设置了 30 秒超时，并跟随会话取消。

## 验证

```bash
opencode api get '/api/websearch/provider?location%5Bdirectory%5D=%2Fhome%2Fubuntu%2Fworkspace'
```

输出中包含 `{"id":"deepseek","name":"DeepSeek"}` 即注册成功。也可以直接让模型搜索一次，观察结果是否来自 DeepSeek。
