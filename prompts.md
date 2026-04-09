# プロンプト集 — stepn-dashboard

Claude Codeに渡すプロンプトのテンプレート。
状況に応じてコピペして使う。

---

## 01. プロジェクト初期セットアップ

```
CLAUDE.mdを読んで、プロジェクトの構成を把握してください。

React + Vite + Tailwind CSS でプロジェクトをセットアップしてください。

【手順】
1. `npm create vite@latest . -- --template react` でViteプロジェクトを初期化
2. Tailwind CSS v3をインストール・設定
3. Recharts・@supabase/supabase-jsをインストール
4. vite.config.js に `base: '/stepn-dashboard/'` を設定（CLAUDE.md参照）
5. .github/workflows/deploy.yml を作成（CLAUDE.md参照）
6. src/lib/supabase.js を作成（CLAUDE.mdのSupabase情報を使って初期化）
7. 不要なボイラープレート（src/assets/, App.css等）を削除
8. .gitignore を CLAUDE.md の内容に更新

セットアップ完了後 `npm run dev` で起動確認してください。
```

---

## 02. メイン画面の実装

```
CLAUDE.mdを読んで、プロジェクトの構成を把握してください。

stepn-dashboard のメイン画面を実装してください。

【全体方針】
- ダークテーマ固定（背景: #0a0e0d）
- アクセントカラー: #00e5a0
- DM Mono フォント（Google Fonts）をデータ表示部に使用
- モバイル対応（レスポンシブ）

【データソース】
- レート: Gistのraw URLからfetch（CLAUDE.md参照、キャッシュバスター必須）
- アクティビティ: Supabaseのactivitiesテーブルから取得（CLAUDE.md参照）

【実装するコンポーネント】

1. src/lib/supabase.js
   - Supabaseクライアント初期化（CLAUDE.mdの接続情報を使用）

2. hooks/useRates.js
   - GistからGST/GMT/SOLのレートをfetch
   - 返却: { rates, updatedAt, loading, error }

3. hooks/useActivities.js
   - Supabaseのactivitiesテーブルから全件取得（date降順）
   - 返却: { activities, loading, error, refetch }

4. components/RateCard.jsx
   - GST/GMT/SOLのUSD・JPY価格、24h変動率を表示
   - GST=green(#00e5a0), GMT=amber, SOL=purple で色分け

5. components/SummaryCards.jsx
   - 累計GST収益（JPY換算）、今月の収益・活動日数、総距離、ミントクォーター総数

6. components/EarningsChart.jsx
   - Rechartsで直近30日のGST獲得量を折れ線グラフ表示

7. components/ActivityList.jsx
   - 最近の活動一覧（date/distance/duration/gst_earned/mint_quarter）
   - ページネーション（20件ずつ）

8. components/MintQuarterStats.jsx
   - ミントクォーターの月別出現回数をバーチャートで表示

【App.jsx レイアウト（上から順）】
ヘッダー（ロゴ+最終更新時刻）
→ レートカード3枚
→ サマリーカード4枚
→ 収益チャート
→ ミントクォーター統計
→ 活動一覧
```

---

## 03. 月別サマリー画面の追加

```
CLAUDE.mdを読んでください。

ミントクォーター (直近6ヶ月)を日ごと、月ごと、年単位で把握できるようにする

【表示内容】
- 日ごと；何年何月にミントクォーターが取得できたか把握できるグラフ
- 月ごと：月に取得したミントクォーターの推移
- 年ごと：年単位で取得できたミントクォーターの推移

【データ取得】
- Supabaseのactivitiesテーブルをdate範囲でクエリ
- 年、月、日ごとにグループ化して集計

既存のデザインテイストを崩さないこと。
```

---

## 04. シューズ管理画面の追加

```
CLAUDE.mdを読んでください。

シューズ管理画面を追加してください。

【Supabaseテーブル（新規作成）】
create table shoes (
  id           uuid default gen_random_uuid() primary key,
  name         text not null,
  type         text,  -- JOGGER/RUNNER/WALKER/TRAINER
  shoe_id      text,
  level        integer,
  durability   numeric(5,2),
  efficiency   numeric(5,2),
  luck         numeric(5,2),
  comfort      numeric(5,2),
  is_active    boolean default true,
  created_at   timestamptz default now()
);

【表示内容】
- 所持シューズ一覧（カード形式）
- 各シューズの種類・レベル・耐久度バー・ステータス
- シューズ追加・編集・削除機能

既存のデザインテイストを崩さないこと。
```

---

## 05. バグ修正・調整

```
CLAUDE.mdを読んでください。

以下の問題を修正してください。

【問題】
（ここに具体的な症状を書く）

【エラーメッセージ】
（ブラウザのコンソールに出ているエラーをここに貼る）

【確認済みのこと】
（試したことを書く）
```

---

## 06. デプロイトラブル対応

```
CLAUDE.mdを読んでください。

GitHub Pagesへのデプロイで以下の問題が発生しています。

【問題】
（症状を書く）例: ページが真っ白 / 404 / CSSが当たっていない

【Actionsのログ】
（GitHub ActionsのエラーログのURLまたは内容を貼る）
```
