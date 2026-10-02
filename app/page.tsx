import { STOCKS } from "@/lib/stocks";
import { getQuotes, getNikkei225 } from "@/lib/quotes";
import StockList from "./StockList";

export const revalidate = 60;

export default async function Home() {
  const [quotes, nk] = await Promise.all([getQuotes(), getNikkei225()]);
  const nkDiff = nk ? nk.price - nk.prevClose : 0;
  const updated = Math.max(0, ...Object.values(quotes).map((q) => q?.time ?? 0));
  return (
    <main className="wrap">
      <header className="hero">
        <p className="eyebrow">KABU PATTO</p>
        <h1>株ぱっと</h1>
        <p className="lead">株価・最低投資額・株主優待を、ひと目で。</p>
        {nk && (
          <a
            className="index"
            href="https://www.nikkei.com/marketdata/quote/NK225/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="label">日経平均株価</span>
            <strong>{nk.price.toLocaleString("ja-JP", { maximumFractionDigits: 2 })}</strong>
            <span className={nkDiff > 0 ? "chg up" : nkDiff < 0 ? "chg down" : "chg flat"}>
              {nkDiff >= 0 ? "+" : ""}
              {nkDiff.toLocaleString("ja-JP", { maximumFractionDigits: 2 })} ({nkDiff >= 0 ? "+" : ""}
              {((nkDiff / nk.prevClose) * 100).toFixed(2)}%)
            </span>
          </a>
        )}
        {updated > 0 && (
          <p className="updated">
            株価更新: {new Date(updated * 1000).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
            (約20分遅延の場合あり)
          </p>
        )}
      </header>
      <StockList stocks={STOCKS} quotes={quotes} />
      <footer className="foot">
        株価は Yahoo! Finance のデータを利用しています(日経平均・各銘柄の詳細は日経電子版もご参照ください)。株主優待の内容は変更・廃止されることがあるため、
        必ず各社の公式IR情報をご確認ください。本サイトは投資勧誘を目的としたものではありません。
      </footer>
    </main>
  );
}
