import { STOCKS } from "./stocks";

export type Quote = {
  price: number;
  prevClose: number;
  time: number;
};

async function fetchSymbol(symbol: string): Promise<Quote | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`,
      { next: { revalidate: 60 }, headers: { "User-Agent": "Mozilla/5.0" } },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta || typeof meta.regularMarketPrice !== "number") return null;
    // chartPreviousClose は取得期間の直前の終値(=5日前)なので、日足の終値から前日分を取る
    const closes: number[] = (json.chart.result[0].indicators?.quote?.[0]?.close ?? []).filter(
      (c: unknown): c is number => typeof c === "number",
    );
    return {
      price: meta.regularMarketPrice,
      prevClose: closes.length >= 2 ? closes[closes.length - 2] : (meta.previousClose ?? meta.regularMarketPrice),
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
