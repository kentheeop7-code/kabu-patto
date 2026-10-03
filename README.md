# 株ぱっと

日本株の最新株価・最低投資額・株主優待・事業内容をひと目で確認でき、AIで短期の値動きも分析できるアプリ(Next.js App Router)。

- 株価: Yahoo! Finance のチャートAPIをサーバー側で取得。APIキー不要。
  - 「株価を更新」ボタンで最新値に更新(`/api/quotes`)。取引時間中(平日 9:00〜15:30)は1分ごとに自動更新。
- AI短期分析: 銘柄カードを開いて「AIで短期の値動きを分析」。過去約6か月の日足から移動平均・RSI・ボラティリティなどを計算し、
  Claude が今後1〜5営業日の見通しを返します(`/api/analyze`)。
- 銘柄・優待データ: `lib/stocks.ts` を編集して追加・更新してください。
- 最低投資額 = 株価 × 単元株数(100株)

## 環境変数

| 名前 | 必須 | 説明 |
|---|---|---|
| `ANTHROPIC_API_KEY` | AI分析を使う場合 | Anthropic APIキー。未設定ならAI分析ボタンは「未設定」と表示されます。 |
| `ANALYSIS_MODEL` | 任意 | 分析に使うモデル。既定は `claude-opus-5-5`。 |

ローカルでは `.env.local` に `ANTHROPIC_API_KEY=...` を書きます(Gitには含まれません)。

AI分析は銘柄ごとに15分キャッシュし、IPごとに10分あたり8回までに制限しています(サーバーレスのインスタンス単位の簡易制限)。
公開サイトで利用量を厳密に管理したい場合は、Anthropic側で利用上限を設定してください。

## 起動

```bash
npm install
npm run dev
```

## Vercelへデプロイ

GitHubにプッシュしてVercelでインポートします。AI分析を使うには Project Settings → Environment Variables に `ANTHROPIC_API_KEY` を追加して再デプロイしてください。
