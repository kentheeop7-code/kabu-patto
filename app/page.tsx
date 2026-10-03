import { STOCKS } from "@/lib/stocks";
import { getSnapshot } from "@/lib/quotes";
import Dashboard from "./Dashboard";

export const revalidate = 60;

export default async function Home() {
  const initial = await getSnapshot();
  return (
    <main className="wrap">
      <header className="hero">
        <p className="eyebrow">KABU PATTO</p>
        <h1>株ぱっと</h1>
        <p className="lead">株価・最低投資額・株主優待を、ひと目で。</p>
      </header>
      <Dashboard stocks={STOCKS} initial={initial} />
      <footer className="foot">
        株価は Yahoo! Finance のデータを利用しています(日経平均・各銘柄の詳細は日経電子版もご参照ください)。
        株主優待の内容は変更・廃止されることがあるため、必ず各社の公式IR情報をご確認ください。
        AIによる短期分析は過去の株価データから機械的に算出した参考情報であり、将来の値動きを保証するものではありません。
        本サイトは投資勧誘を目的としたものではなく、投資の最終判断はご自身でお願いします。
      </footer>
    </main>
  );
}
