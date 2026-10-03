"use client";

import { useCallback, useEffect, useState } from "react";
import type { Stock } from "@/lib/stocks";
import type { Snapshot } from "@/lib/quotes";
import StockList from "./StockList";

const AUTO_REFRESH_MS = 60_000;

/** 東証の取引時間帯(平日 9:00〜15:30 JST)かどうか。祝日は考慮しない。 */
function isMarketOpen(now = new Date()) {
  const jst = new Date(now.getTime() + (now.getTimezoneOffset() + 540) * 60_000);
  const day = jst.getDay();
  const minutes = jst.getHours() * 60 + jst.getMinutes();
  return day >= 1 && day <= 5 && minutes >= 9 * 60 && minutes <= 15 * 60 + 30;
}

const fmtTime = (ms: number) =>
  new Date(ms).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });

export default function Dashboard({ stocks, initial }: { stocks: Stock[]; initial: Snapshot }) {
  const [snap, setSnap] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quotes", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      setSnap((await res.json()) as Snapshot);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // 取引時間中は1分ごとに自動更新(タブが見えているときだけ)
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible" && isMarketOpen()) refresh();
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const nk = snap.nikkei;
  const nkDiff = nk ? nk.price - nk.prevClose : 0;
  const latest = Math.max(0, ...Object.values(snap.quotes).map((q) => q?.time ?? 0));

  return (
    <>
      <div className="infoRow">
        {nk && (
          <a className="index" href="https://www.nikkei.com/marketdata/quote/NK225/" target="_blank" rel="noopener noreferrer">
            <span className="label">日経平均株価</span>
            <strong>{nk.price.toLocaleString("ja-JP", { maximumFractionDigits: 2 })}</strong>
            <span className={nkDiff > 0 ? "chg up" : nkDiff < 0 ? "chg down" : "chg flat"}>
              {nkDiff >= 0 ? "+" : ""}
              {nkDiff.toLocaleString("ja-JP", { maximumFractionDigits: 2 })} ({nkDiff >= 0 ? "+" : ""}
              {((nkDiff / nk.prevClose) * 100).toFixed(2)}%)
            </span>
          </a>
        )}
        <button className="refresh" onClick={refresh} disabled={loading}>
          {loading ? "更新中…" : "↻ 株価を更新"}
        </button>
      </div>
      <p className="updated">
        {latest > 0 && <>相場データ: {fmtTime(latest * 1000)}(約20分遅延の場合あり) / </>}
        取得: {fmtTime(snap.fetchedAt)}
        {isMarketOpen() && " / 取引時間中は1分ごとに自動更新"}
        {failed && <span className="warn"> / 更新に失敗しました。時間をおいて再度お試しください。</span>}
      </p>
      <StockList stocks={stocks} quotes={snap.quotes} />
    </>
  );
}
