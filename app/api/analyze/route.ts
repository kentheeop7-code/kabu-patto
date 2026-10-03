import Anthropic from "@anthropic-ai/sdk";
import { STOCKS } from "@/lib/stocks";
import { computeIndicators, fetchHistory, type Indicators } from "@/lib/history";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = process.env.ANALYSIS_MODEL || "claude-opus-5-5";

type Analysis = {
  outlook: "上昇" | "横ばい" | "下落";
  confidence: "低" | "中" | "高";
  summary: string;
  reasons: string[];
  risks: string[];
  support: number;
  resistance: number;
};

type Result = { analysis: Analysis; indicators: Indicators; model: string; generatedAt: number };

const SCHEMA = {
  type: "object",
  properties: {
    outlook: { type: "string", enum: ["上昇", "横ばい", "下落"] },
    confidence: { type: "string", enum: ["低", "中", "高"] },
    summary: { type: "string" },
    reasons: { type: "array", items: { type: "string" } },
    risks: { type: "array", items: { type: "string" } },
    support: { type: "number" },
    resistance: { type: "number" },
  },
  required: ["outlook", "confidence", "summary", "reasons", "risks", "support", "resistance"],
  additionalProperties: false,
} as const;

const SYSTEM = `あなたは日本株のテクニカル分析を行うアナリストです。
与えられた株価データと指標だけを根拠に、今後1〜5営業日の短期的な値動きの見通しを日本語で簡潔に述べてください。

ルール:
- 与えられていない情報(ニュース、決算、需給、為替など)を事実のように扱わない。必要なら「材料は考慮していない」と明記する。
- 断定しない。確度が低いときは confidence を「低」にし、方向感が弱ければ outlook は「横ばい」にする。
- reasons は指標の具体的な数値を引用して2〜4個、risks は見通しが外れる要因を1〜3個、各1文で書く。
- summary は2文以内。support は想定される下値の目安、resistance は上値の目安(どちらも円)。
- 投資の勧誘や売買の指示はしない。`;

// ---- 簡易レート制限とキャッシュ(サーバーレスのインスタンス単位) ----
const hits = new Map<string, number[]>();
const cache = new Map<string, Result>();
const CACHE_MS = 15 * 60 * 1000;
const LIMIT = 8;
const WINDOW_MS = 10 * 60 * 1000;

function limited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= LIMIT) {
    hits.set(ip, list);
    return true;
  }
  list.push(now);
  hits.set(ip, list);
  return false;
}

const err = (status: number, error: string, message: string) => Response.json({ error, message }, { status });

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return err(503, "not_configured", "AI分析は未設定です。環境変数 ANTHROPIC_API_KEY を設定してください。");
  }

  let code = "";
  try {
    code = String((await req.json())?.code ?? "");
  } catch {
    return err(400, "bad_request", "リクエストが不正です。");
  }
  const stock = STOCKS.find((s) => s.code === code);
  if (!stock) return err(400, "bad_request", "未対応の銘柄です。");

  const cached = cache.get(code);
  if (cached && Date.now() - cached.generatedAt < CACHE_MS) return Response.json(cached);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) return err(429, "rate_limited", "リクエストが多すぎます。しばらくしてからお試しください。");

  const history = await fetchHistory(code);
  if (!history) return err(502, "no_data", "株価の履歴を取得できませんでした。");
  const indicators = computeIndicators(history);

  const prompt = `銘柄: ${stock.name}(${stock.code}) / 業種: ${stock.sector}
最新終値(円): ${indicators.price}
前日比(%): ${indicators.ret1d} / 5日騰落率(%): ${indicators.ret5d} / 20日騰落率(%): ${indicators.ret20d}
移動平均(円): 5日=${indicators.sma5}, 25日=${indicators.sma25}, 75日=${indicators.sma75}
RSI(14): ${indicators.rsi14}
20日ヒストリカル・ボラティリティ(日次%): ${indicators.volatility20d}
直近3か月の高値/安値(円): ${indicators.high3m} / ${indicators.low3m}
出来高(直近/20日平均の比): ${indicators.volumeRatio}
直近15営業日の終値: ${indicators.recentCloses.map((c) => `${c.date}:${c.close}`).join(", ")}`;

  const client = new Anthropic();
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM,
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: prompt }],
    });

    if (response.stop_reason === "refusal") {
      return err(422, "refused", "この銘柄の分析は生成できませんでした。");
    }
    const text = response.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") return err(502, "bad_output", "分析結果を取得できませんでした。");
    const analysis = JSON.parse(text.text) as Analysis;

    const result: Result = { analysis, indicators, model: response.model, generatedAt: Date.now() };
    cache.set(code, result);
    return Response.json(result);
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return err(429, "rate_limited", "AIの利用上限に達しました。時間をおいてお試しください。");
    if (e instanceof Anthropic.AuthenticationError) return err(500, "auth", "APIキーが無効です。設定を確認してください。");
    if (e instanceof Anthropic.APIError) return err(502, "api_error", `AI分析でエラーが発生しました(${e.status})。`);
    return err(500, "unknown", "AI分析でエラーが発生しました。");
  }
}
