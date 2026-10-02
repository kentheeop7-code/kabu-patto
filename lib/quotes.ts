import { STOCKS } from "./stocks";

export type Quote = {
  price: number;
  prevClose: number;
  time: number;
};

async function fetchSymbol(symbol: string): Promise<Quote | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
      { next: { revalidate: 60 }, headers: { "User-Agent": "Mozilla/5.0" } },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta || typeof meta.regularMarketPrice !== "number") return null;
    // range=1d のとき chartPreviousClose は前日終値になる(日足配列は欠損することがあるので使わない)
    return {
      price: meta.regularMarketPrice,
      prevClose: meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice,
      time: meta.regularMarketTime ?? 0,
    };
  } catch {
    return null;
  }
}

const fetchQuote = (code: string) => fetchSymbol(`${code}.T`);

export const getNikkei225 = () => fetchSymbol("^N225");

export async function getQuotes(): Promise<Record<string, Quote | null>> {
  // 銘柄数が多いので、同時リクエスト数を絞って取得する
  const BATCH = 12;
  const entries: (readonly [string, Quote | null])[] = [];
  for (let i = 0; i < STOCKS.length; i += BATCH) {
    const chunk = STOCKS.slice(i, i + BATCH);
    entries.push(...(await Promise.all(chunk.map(async (s) => [s.code, await fetchQuote(s.code)] as const))));
  }
  return Object.fromEntries(entries);
}
