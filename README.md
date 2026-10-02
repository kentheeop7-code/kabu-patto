# 株ぱっと

日本株の最新株価・最低投資額・株主優待・事業内容をひと目で確認できるアプリ(Next.js App Router)。

- 株価: Yahoo! Finance のチャートAPIをサーバー側で取得(60秒キャッシュ)。APIキー不要。
- 銘柄・優待データ: `lib/stocks.ts` を編集して追加・更新してください。
- 最低投資額 = 株価 × 単元株数(100株)

## 起動

```bash
npm install
npm run dev
```

## Vercelへデプロイ

GitHubにプッシュしてVercelでインポートするだけです(環境変数不要)。
