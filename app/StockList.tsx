"use client";

import { useMemo, useState } from "react";
import type { Stock } from "@/lib/stocks";
import type { Quote } from "@/lib/quotes";

type Sort = "code" | "min" | "change";

const SORTS: [Sort, string][] = [
  ["code", "コード順"],
  ["min", "最低投資額が安い順"],
  ["change", "値上がり順"],
];

const yen = (n: number) => `¥${Math.round(n).toLocaleString("ja-JP")}`;

export default function StockList({
  stocks,
  quotes,
}: {
  stocks: Stock[];
  quotes: Record<string, Quote | null>;
}) {
  const [q, setQ] = useState("");
  const [onlyBenefit, setOnlyBenefit] = useState(false);
  const [sort, setSort] = useState<Sort>("code");
  const [open, setOpen] = useState<string | null>(null);

  const list = useMemo(() => {
    const kw = q.trim().toLowerCase();
    const rows = stocks.filter(
      (s) =>
        (!onlyBenefit || s.benefit) &&
        (!kw || s.name.toLowerCase().includes(kw) || s.code.includes(kw) || s.sector.includes(kw)),
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
  }, [stocks, quotes, q, onlyBenefit, sort]);

  return (
    <section>
      <div className="controls">
        <input
          className="search"
          placeholder="銘柄名・コード・業種で検索"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="chips">
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

      <ul className="grid">
        {list.map((s) => {
          const quote = quotes[s.code];
          const diff = quote ? quote.price - quote.prevClose : 0;
          const pct = quote ? (diff / quote.prevClose) * 100 : 0;
          const dir = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
          const isOpen = open === s.code;
          return (
            <li key={s.code} className="card">
              <button className="cardBtn" onClick={() => setOpen(isOpen ? null : s.code)} aria-expanded={isOpen}>
                <div className="top">
                  <div>
                    <span className="code">{s.code}</span>
                    <span className="sector">{s.sector}</span>
                    <h2>{s.name}</h2>
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
                  <div className={s.benefit ? "badge on" : "badge"}>{s.benefit ? "優待あり" : "優待なし"}</div>
                </div>
              </button>
              {isOpen && (
                <div className="detail">
                  <p>
                    <span className="label">事業内容</span>
                    {s.business}
                  </p>
                  <p>
                    <span className="label">株主優待</span>
                    {s.benefit ?? "現在、株主優待は実施されていません。"}
                    {s.benefitNote && <span className="note">{s.benefitNote}</span>}
                  </p>
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
        })}
      </ul>
      {list.length === 0 && <p className="empty">該当する銘柄がありません。</p>}
    </section>
  );
}
