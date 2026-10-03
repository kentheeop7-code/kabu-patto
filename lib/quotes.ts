import { STOCKS } from "./stocks";

export type Quote = {
  price: number;
  prevClose: number;
  time: number;
};

export type Snapshot = {
  quotes: Record<string, Quote | null>;
  nikkei: Quote | null;
  /** 取得した時刻(ms) */
  fetchedAt: number;
};

const YAHOO = "https://query1.finance.yahoo.com/v8/finance/chart";

/** fresh=true のときはキャッシュを使わず最新を取得する */
async function fetchSymbol(symbol: string, fresh: boolean): Promise<Quote | null> {
  try {
    const res = await fetch(`${YAHOO}/${encodeURIComponent(symbol)}?interval=1d&range=1d`, {
      ...(fresh ? { cache: "no-store" as const } : { next: { revalidate: 60 } }),
      headers: { "User-Agent": "Mozilla/5.0" },
    });
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

export async function getSnapshot(fresh = false): Promise<Snapshot> {
  // 銘柄数が多いので、同時リクエスト数を絞って取得する
  const BATCH = 16;
  const entries: (readonly [string, Quote | null])[] = [];
  const nikkeiPromise = fetchSymbol("^N225", fresh);
  for (let i = 0; i < STOCKS.length; i += BATCH) {
    const chunk = STOCKS.slice(i, i + BATCH);
    entries.push(...(await Promise.all(chunk.map(async (s) => [s.code, await fetchSymbol(`${s.code}.T`, fresh)] as const))));
  }
  return { quotes: Object.fromEntries(entries), nikkei: await nikkeiPromise, fetchedAt: Date.now() };
}
