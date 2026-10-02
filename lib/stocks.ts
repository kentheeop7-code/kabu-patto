export type Stock = {
  code: string;
  name: string;
  sector: string;
  business: string;
  unit: number;
  benefit: string | null;
  benefitNote?: string;
};

// 優待内容は変更・廃止されることがあります。投資前に必ず各社のIR情報をご確認ください。
export const STOCKS: Stock[] = [
  { code: "7203", name: "トヨタ自動車", sector: "輸送用機器", business: "世界最大級の自動車メーカー。ハイブリッド車に強み。", unit: 100, benefit: null },
  { code: "9984", name: "ソフトバンクグループ", sector: "情報・通信", business: "世界のテック企業へ投資する投資持株会社。", unit: 100, benefit: null },
  { code: "6758", name: "ソニーグループ", sector: "電気機器", business: "ゲーム・音楽・映画・半導体(イメージセンサー)を展開。", unit: 100, benefit: null },
  { code: "8306", name: "三菱UFJフィナンシャル・G", sector: "銀行", business: "国内最大級の金融グループ。銀行・信託・証券。", unit: 100, benefit: null },
  { code: "9433", name: "KDDI", sector: "情報・通信", business: "携帯電話「au」を中心とした通信事業者。", unit: 100, benefit: "カタログギフト", benefitNote: "保有株数・継続保有年数に応じて内容が変わります。" },
  { code: "8267", name: "イオン", sector: "小売業", business: "総合スーパー「イオン」を中心とする国内最大級の流通グループ。", unit: 100, benefit: "オーナーズカード(買物金額に応じたキャッシュバック)", benefitNote: "保有株数に応じて返金率が変わります。" },
  { code: "2702", name: "日本マクドナルドHD", sector: "小売業", business: "「マクドナルド」を国内展開するハンバーガーチェーン。", unit: 100, benefit: "食事優待券", benefitNote: "バーガー類・サイドメニュー・ドリンクの引換券綴り。" },
  { code: "9020", name: "東日本旅客鉄道(JR東日本)", sector: "陸運業", business: "首都圏・東北を中心とする鉄道会社。駅ビル・Suicaも展開。", unit: 100, benefit: "株主優待割引券(運賃・料金の割引)" },
  { code: "9201", name: "日本航空(JAL)", sector: "空運業", business: "国内外の航空輸送を担う大手航空会社。", unit: 100, benefit: "国内線 50%割引券" },
  { code: "9202", name: "ANAホールディングス", sector: "空運業", business: "全日空を中核とする航空グループ。", unit: 100, benefit: "国内線 50%割引券" },
  { code: "4661", name: "オリエンタルランド", sector: "サービス業", business: "東京ディズニーリゾートの運営会社。", unit: 100, benefit: "テーマパーク パスポート", benefitNote: "人気が高く、権利確定日に向けて株価が動きやすい銘柄です。" },
  { code: "2802", name: "味の素", sector: "食料品", business: "調味料・冷凍食品・アミノ酸技術を持つ食品大手。", unit: 100, benefit: "自社商品の詰合せ" },
  { code: "2579", name: "コカ・コーラ ボトラーズジャパンHD", sector: "食料品", business: "コカ・コーラ製品の製造・販売を担う国内最大のボトラー。", unit: 100, benefit: "自社製品の詰合せ" },
  { code: "3197", name: "すかいらーくHD", sector: "小売業", business: "ガスト・バーミヤンなどを展開する外食大手。", unit: 100, benefit: "食事優待カード", benefitNote: "保有株数に応じた金額分を店舗で利用できます。" },
  { code: "7550", name: "ゼンショーHD", sector: "小売業", business: "すき家・ココスなどを運営する外食グループ。", unit: 100, benefit: "食事券" },
  { code: "9861", name: "吉野家HD", sector: "小売業", business: "牛丼「吉野家」を中心とする外食グループ。", unit: 100, benefit: "食事券・優待カード" },
  { code: "7581", name: "サイゼリヤ", sector: "小売業", business: "低価格イタリアンレストランチェーン。", unit: 100, benefit: "食事券" },
  { code: "9831", name: "ヤマダホールディングス", sector: "小売業", business: "家電量販店「ヤマダデンキ」を中心に住宅・家具も展開。", unit: 100, benefit: "優待買物券" },
];
