"use client";

import { useMemo, useState } from "react";
import { PREFECTURES, type Stock } from "@/lib/stocks";
import type { Quote } from "@/lib/quotes";
import AiAnalysis from "./AiAnalysis";

type Sort = "code" | "min" | "change";
type Quotes = Record<string, Quote | null>;

const SORTS: [Sort, string][] = [
  ["code", "コード順"],
  ["min", "最低投資額が安い順"],
  ["change", "値上がり順"],
];

const yen = (n: number) => `¥${Math.round(n).toLocaleString("ja-JP")}`;

function Card({
  s,
  quote,
  isOpen,
  onToggle,
}: {
  s: Stock;
  quote: Quote | null | undefined;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const diff = quote ? quote.price - quote.prevClose : 0;
  const pct = quote ? (diff / quote.prevClose) * 100 : 0;
  const dir = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
  const badge = s.benefit ? "優待あり" : s.benefit === null ? "優待なし" : "優待 要確認";
  return (
    <li className="card">
      <button className="cardBtn" onClick={onToggle} aria-expanded={isOpen}>
        <div className="top">
          <div>
            <span className="code">{s.code}</span>
            <span className="sector">{s.sector}</span>
            <h3>{s.name}</h3>
          </div>
          <div className="priceBox">
            {quote ? (
              <>
                <div className="price">{yen(quote.price)}</div>
                <div className={`chg ${dir}`}>
                  {diff >= 0 ? "+" : ""}
                  {diff.toLocaleString("ja-JP", { maximumFractionDigits: 1 })} ({pct >= 0 ? "+" : ""}
                  {pct.toFixed(2)}%)
                </div>
              </>
            ) : (
              <div className="price na">取得不可</div>
            )}
          </div>
        </div>
        <div className="meta">
          <div>
            <span className="label">最低投資額({s.unit}株)</span>
            <strong>{quote ? yen(quote.price * s.unit) : "—"}</strong>
          </div>
          <div className={s.benefit ? "badge on" : "badge"}>{badge}</div>
        </div>
      </button>
      {isOpen && (
        <div className="detail">
          <p>
            <span className="label">本社所在地</span>
            {s.pref}
          </p>
          <p>
            <span className="label">事業内容</span>
            {s.business}
          </p>
          <p>
            <span className="label">株主優待</span>
            {s.benefit ??
              (s.benefit === null
                ? "現在、株主優待は実施されていません。"
                : "優待の有無は未確認です。公式IR情報をご確認ください。")}
            {s.benefitNote && <span className="note">{s.benefitNote}</span>}
          </p>
          <AiAnalysis code={s.code} />
          <a
            className="ext"
            href={`https://www.nikkei.com/nkd/company/?scode=${s.code}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            日経で詳細を見る →
          </a>
        </div>
      )}
    </li>
  );
}

export default function StockList({ stocks, quotes }: { stocks: Stock[]; quotes: Quotes }) {
  const [q, setQ] = useState("");
  const [onlyBenefit, setOnlyBenefit] = useState(false);
  const [sort, setSort] = useState<Sort>("code");
  const [pref, setPref] = useState<string | null>(null);
  const [grouped, setGrouped] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  const prefCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of stocks) m.set(s.pref, (m.get(s.pref) ?? 0) + 1);
    return PREFECTURES.filter((p) => m.has(p)).map((p) => [p, m.get(p)!] as const);
  }, [stocks]);

  const list = useMemo(() => {
    const kw = q.trim().toLowerCase();
    const rows = stocks.filter(
      (s) =>
        (!pref || s.pref === pref) &&
        (!onlyBenefit || s.benefit) &&
        (!kw ||
          s.name.toLowerCase().includes(kw) ||
          s.code.includes(kw) ||
          s.sector.includes(kw) ||
          s.pref.includes(kw)),
    );
    const min = (s: Stock) => {
      const x = quotes[s.code];
      return x ? x.price * s.unit : Infinity;
    };
    const chg = (s: Stock) => {
      const x = quotes[s.code];
      return x ? (x.price - x.prevClose) / x.prevClose : -Infinity;
    };
    return [...rows].sort((a, b) =>
      sort === "min" ? min(a) - min(b) : sort === "change" ? chg(b) - chg(a) : a.code.localeCompare(b.code),
    );
  }, [stocks, quotes, q, onlyBenefit, sort, pref]);

  const groups = useMemo(
    () =>
      PREFECTURES.map((p) => [p, list.filter((s) => s.pref === p)] as const).filter(([, rows]) => rows.length > 0),
    [list],
  );

  const renderCard = (s: Stock) => (
    <Card key={s.code} s={s} quote={quotes[s.code]} isOpen={open === s.code} onToggle={() => setOpen(open === s.code ? null : s.code)} />
  );

  return (
    <section>
      <div className="controls">
        <input
          className="search"
          placeholder="銘柄名・コード・業種・都道府県で検索"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="chips prefs" role="group" aria-label="都道府県">
          <button className={pref === null ? "chip on" : "chip"} onClick={() => setPref(null)}>
            全国 ({stocks.length})
          </button>
          {prefCounts.map(([p, n]) => (
            <button key={p} className={pref === p ? "chip on" : "chip"} onClick={() => setPref(pref === p ? null : p)}>
              {p} ({n})
            </button>
          ))}
        </div>
        <div className="chips">
          <button className={grouped ? "chip on" : "chip"} onClick={() => setGrouped(!grouped)}>
            都道府県でまとめる
          </button>
          <button className={onlyBenefit ? "chip on" : "chip"} onClick={() => setOnlyBenefit(!onlyBenefit)}>
            優待ありのみ
          </button>
          {SORTS.map(([k, label]) => (
            <button key={k} className={sort === k ? "chip on" : "chip"} onClick={() => setSort(k)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {grouped ? (
        groups.map(([p, rows]) => (
          <div key={p} className="group">
            <h2 className="groupTitle">
              {p} <span>{rows.length}銘柄</span>
            </h2>
            <ul className="grid">{rows.map(renderCard)}</ul>
          </div>
        ))
      ) : (
        <ul className="grid">{list.map(renderCard)}</ul>
      )}
      {list.length === 0 && <p className="empty">該当する銘柄がありません。</p>}
    </section>
  );
}
