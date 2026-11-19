import { Plugin } from "@opencode/plugin";
import { search } from "./search";
import type { SearchOptions } from "./types";

const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_COUNT = 10;

export default Plugin.define({
  id: "opencode-deepseek-websearch",
  async setup(ctx) {
    const deepseek = { providerID: "deepseek" };
    await ctx.session.hook("context", (event) => {
      delete event.tools.websearch;
    }, deepseek);

    await ctx.session.hook("http.request", async (event) => {
      const { request } = event;
      if (event.kind !== "primary" || request.method !== "POST") return;
      if (!new URL(request.url).pathname.endsWith("/chat/completions")) return;

      const body = await request.clone().json();
      // DeepSeek defaults to thinking enabled when the wire request omits this field.
      if (body.thinking?.type === "disabled") return;

      const tools: { type: string }[] = body.tools ?? [];
      for (const type of ["deepseek_web_search", "deepseek_read_url"]) {
        if (!tools.some((tool) => tool.type === type)) tools.push({ type });
      }
      const headers = new Headers(request.headers);
      headers.delete("content-length");
      event.request = new Request(request, { headers, body: JSON.stringify({ ...body, tools }) });
    }, deepseek);

    const options: SearchOptions = {
      baseURL: (
        optionalString(ctx.options.baseURL) ??
        optionalString(process.env.DEEPSEEK_BASE_URL) ??
        DEFAULT_BASE_URL
      ).replace(/\/+$/, ""),
      count: clampCount(ctx.options.count),
      needContent: ctx.options.needContent === true,
      localization: optionalString(ctx.options.localization),
    };

    async function apiKey() {
      const connection = await ctx.integration.connection.active("deepseek");
      const stored = connection ? await ctx.integration.connection.resolve(connection) : undefined;
      return (
        optionalString(ctx.options.apiKey) ??
        (stored?.type === "key" ? stored.key : undefined) ??
        optionalString(process.env.DEEPSEEK_API_KEY)
      );
    }

    await ctx.websearch.transform((editor) => {
      editor.add({
        id: "deepseek",
        name: "DeepSeek",
        execute: async ({ query }, { signal }) => {
          const key = await apiKey();
          if (!key) {
            throw new Error(
              "DeepSeek 网页搜索缺少 API Key：请在 OpenCode 中连接 DeepSeek，或设置环境变量 DEEPSEEK_API_KEY。",
            );
          }
          return search(query, key, options, signal);
        },
      });

      // Keep an explicitly configured provider; only fill in the default when none is set.
      if (editor.default.get() === undefined) editor.default.set("deepseek");
    });
  },
});

function optionalString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function clampCount(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return DEFAULT_COUNT;
  return Math.min(50, Math.max(1, Math.trunc(value)));
}
