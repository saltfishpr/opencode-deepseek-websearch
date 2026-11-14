export type SearchOptions = {
  baseURL: string;
  // Number of results requested from DeepSeek, clamped to 1–50.
  count: number;
  // Request full page content. Off by default because a single page can be very long.
  needContent: boolean;
  // IP address used to prefer localized results.
  localization?: string;
};

export type DeepSeekSearchResult = {
  title: string;
  url: string;
  snippet: string;
  summary: string;
  content: string;
  date: string | null;
};

export type DeepSeekSearchResponse = {
  results: DeepSeekSearchResult[];
};
