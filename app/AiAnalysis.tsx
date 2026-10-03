"use client";

import { useState } from "react";

type Indicators = {
  ret1d: number | null;
  ret5d: number | null;
  ret20d: number | null;
  sma5: number | null;
  sma25: number | null;
  rsi14: number | null;
  volatility20d: number | null;
};

type Result = {
  analysis: {
    outlook: "上昇" | "横ばい" | "下落";
    confidence: "低" | "中" | "高";
    summary: string;
    reasons: string[];
    risks: string[];
    support: number;
    resistance: number;
  };
  indicators: Indicators;
  generatedAt: number;
};

const yen = (n: number) => `¥${Math.round(n).toLocaleString("ja-JP")}`;
const pct = (n: number | null) => (n === null ? "—" : `${n > 0 ? "+" : ""}${n}%`);
const OUTLOOK_CLASS = { 上昇: "up", 下落: "down", 横ばい: "flat" } as const;

export default function AiAnalysis({ code }: { code: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [message, setMessage] = useState("");

  const run = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.message ?? "分析に失敗しました。");
        setState("error");
        return;
      }
      setResult(json as Result);
      setState("done");
    } catch {
      setMessage("通信に失敗しました。");
      setState("error");
    }
  };

  return (
    <div className="ai">
      {state !== "done" && (
        <button className="aiBtn" onClick={run} disabled={state === "loading"}>
          {state === "loading" ? "AIが分析中…(数秒〜十数秒)" : "✦ AIで短期の値動きを分析"}
        </button>
      )}
      {state === "error" && <p className="aiErr">{message}</p>}
      {state === "done" && result && (
        <div className="aiResult">
          <div className="aiHead">
            <span className="label">AI短期見通し(1〜5営業日)</span>
            <span className={`aiOutlook ${OUTLOOK_CLASS[result.analysis.outlook]}`}>{result.analysis.outlook}</span>
            <span className="aiConf">確度: {result.analysis.confidence}</span>
          </div>
          <p>{result.analysis.summary}</p>
          <ul>
            {result.analysis.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          <p className="aiLevels">
            下値目安 {yen(result.analysis.support)} / 上値目安 {yen(result.analysis.resistance)}
          </p>
          <span className="label">リスク要因</span>
          <ul className="risks">
            {result.analysis.risks.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          <p className="aiInd">
            5日 {pct(result.indicators.ret5d)} / 20日 {pct(result.indicators.ret20d)} / RSI {result.indicators.rsi14 ?? "—"} / 25日線{" "}
            {result.indicators.sma25 ? yen(result.indicators.sma25) : "—"}
          </p>
          <p className="aiNote">
            過去の株価データのみを根拠にしたAIの参考情報で、ニュースや決算は考慮していません。投資判断はご自身で行ってください。
          </p>
        </div>
      )}
    </div>
  );
}
