export type History = {
  closes: number[];
  volumes: number[];
  dates: string[];
};

export type Indicators = {
  price: number;
  ret1d: number | null;
  ret5d: number | null;
  ret20d: number | null;
  sma5: number | null;
  sma25: number | null;
  sma75: number | null;
  rsi14: number | null;
  volatility20d: number | null;
  high3m: number;
  low3m: number;
  volumeRatio: number | null;
  recentCloses: { date: string; close: number }[];
};

/** 直近約6か月の日足(終値・出来高)を取得する */
export async function fetchHistory(code: string): Promise<History | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${code}.T?interval=1d&range=6mo`,
      { cache: "no-store", headers: { "User-Agent": "Mozilla/5.0" } },
    );
    if (!res.ok) return null;
    const r = (await res.json())?.chart?.result?.[0];
    const ts: number[] = r?.timestamp ?? [];
    const q = r?.indicators?.quote?.[0];
    if (!q || ts.length === 0) return null;
    const out: History = { closes: [], volumes: [], dates: [] };
    ts.forEach((t, i) => {
      const c = q.close?.[i];
      if (typeof c !== "number") return; // 欠損日は除く
      out.closes.push(c);
      out.volumes.push(typeof q.volume?.[i] === "number" ? q.volume[i] : 0);
      out.dates.push(new Date(t * 1000 + 9 * 3600 * 1000).toISOString().slice(0, 10));
    });
    return out.closes.length >= 30 ? out : null;
  } catch {
    return null;
  }
}

const avg = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

export function computeIndicators(h: History, livePrice?: number): Indicators {
  const closes = [...h.closes];
  // 最新値が日足に反映されていなければ差し替える
  if (livePrice && closes.length) closes[closes.length - 1] = livePrice;
  const n = closes.length;
  const last = closes[n - 1];
  const sma = (p: number) => (n >= p ? round(avg(closes.slice(-p))) : null);
  const ret = (d: number) => (n > d ? round(((last - closes[n - 1 - d]) / closes[n - 1 - d]) * 100) : null);

  let rsi: number | null = null;
  if (n > 14) {
    let gain = 0;
    let loss = 0;
    for (let i = n - 14; i < n; i++) {
      const d = closes[i] - closes[i - 1];
      if (d > 0) gain += d;
      else loss -= d;
    }
    rsi = loss === 0 ? 100 : round(100 - 100 / (1 + gain / loss), 1);
  }

  let vol: number | null = null;
  if (n > 20) {
    const rets = closes.slice(-20).map((c, i, a) => (i === 0 ? 0 : Math.log(c / a[i - 1]))).slice(1);
    const m = avg(rets);
    vol = round(Math.sqrt(avg(rets.map((x) => (x - m) ** 2))) * 100);
  }

  const last60 = closes.slice(-60);
  const vols = h.volumes;
  const volRatio =
    vols.length > 21 && avg(vols.slice(-21, -1)) > 0 ? round(vols[vols.length - 1] / avg(vols.slice(-21, -1))) : null;

  return {
    price: last,
    ret1d: ret(1),
    ret5d: ret(5),
    ret20d: ret(20),
    sma5: sma(5),
    sma25: sma(25),
    sma75: sma(75),
    rsi14: rsi,
    volatility20d: vol,
    high3m: Math.max(...last60),
    low3m: Math.min(...last60),
    volumeRatio: volRatio,
    recentCloses: closes.slice(-15).map((c, i) => ({ date: h.dates[n - 15 + i], close: round(c, 1) })),
  };
}
