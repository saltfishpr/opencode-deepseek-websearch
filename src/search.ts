import type { WebSearch } from "@opencode/plugin";
import type { DeepSeekSearchResponse, SearchOptions } from "./types";

const SEARCH_PATH = "/v1/tools/search";
const REQUEST_TIMEOUT_MS = 30_000;

export async function search(
  query: string,
  apiKey: string,
  options: SearchOptions,
  signal: AbortSignal,
): Promise<readonly WebSearch.Result[]> {
  try {
    const response = await fetch(`${options.baseURL}${SEARCH_PATH}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        count: options.count,
        need_content: options.needContent,
        ...(options.localization ? { localization: options.localization } : {}),
      }),
      signal: AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]),
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      throw new Error(`DeepSeek 网页搜索失败（HTTP ${response.status}）：${detail || response.statusText}`);
    }

    const body = (await response.json()) as DeepSeekSearchResponse;
    if (!Array.isArray(body?.results)) {
      throw new Error("DeepSeek 网页搜索返回格式异常：缺少 results 数组");
    }

    return body.results.map((result) => {
      const title = result.title || undefined;
      const content = result.content || result.summary || result.snippet || undefined;
      // The web search schema encodes optional fields as optional keys, so undefined values must be omitted.
      return {
        url: result.url,
        ...(title ? { title } : {}),
        ...(content ? { content } : {}),
        time: publishedTime(result.date),
      };
    });
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new Error(`DeepSeek 网页搜索超时（${REQUEST_TIMEOUT_MS / 1000} 秒）`);
    }
    throw error;
  }
}

function isTimeoutError(error: unknown) {
  return typeof error === "object" && error !== null && "name" in error && error.name === "TimeoutError";
}

function publishedTime(date: string | null) {
  if (!date) return {};
  const published = Date.parse(date);
  return Number.isFinite(published) ? { published } : {};
}
