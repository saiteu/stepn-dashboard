# stepn-dashboard

個人用のSTEPN Go収益トラッカー。
ローカルのシェルスクリプトがCoinGecko APIからレートを取得してGistにアップロードし、
GitHub PagesのReactアプリがそのJSONを読み込んで表示する。
アクティビティデータはGUIアプリ（stepn_importer.py）でスクショをOCR→Supabaseに保存する。

---

## アーキテクチャ

```
[ローカル: ~/dev/stepn-dashboard/]
  scripts/fetch_rates.sh       # CoinGecko APIを叩いてGistに上げる（cron: 毎時0分）
  scripts/stepn_importer.py    # GUIアプリ: スクショ→OCR→Supabaseアップロード
  scripts/import_activity.py   # CLIバッチ版: *.png --yes で一括処理

        ↓ GitHub API (PATCH /gists/:id)

[GitHub Gist]
  stepn_rates.json             # レートJSON（CORSヘッダー付きで公開）

        ↓ fetch() ブラウザから直接OK

[Supabase]
  activities テーブル          # アクティビティ記録（設定済み）

        ↓ @supabase/supabase-js

[GitHub Pages: saiteu.github.io/stepn-dashboard]
  Reactアプリ（Viteでビルド → gh-pagesブランチにデプロイ）
```

---

## 技術スタック

| 用途             | 採用技術                                  |
| ---------------- | ----------------------------------------- |
| UIフレームワーク | React 18                                  |
| ビルドツール     | Vite                                      |
| スタイリング     | Tailwind CSS v3                           |
| グラフ           | Recharts                                  |
| DBクライアント   | @supabase/supabase-js                     |
| OCR              | Apple Vision Framework（macOS標準・無料） |
| GUIアプリ        | Python tkinter + pyobjc                   |
| レート配信       | GitHub Gist（CORSフレンドリー）           |
| デプロイ         | GitHub Actions → gh-pagesブランチ         |

---

## ディレクトリ構成

```
stepn-dashboard/
  src/                         # Reactアプリ（これから実装）
    components/
    hooks/
    lib/
  scripts/
    fetch_rates.sh             # レート取得・Gistアップロード（設定済み）
    stepn_importer.py          # GUIアプリ（設定済み・メイン運用ツール）
    import_activity.py         # CLIバッチ版（設定済み）
    venv/                      # Python仮想環境（python3.14）
    requirements.txt           # Python依存ライブラリ
    .env                       # GIST_ID, GITHUB_TOKEN（gitignore）
    rates.log                  # cronログ（gitignore）
  CLAUDE.md
  PROMPTS.md
  package.json
  vite.config.js
  .gitignore
```

---

## Python実行環境

```bash
# venv有効化（毎回必要）
source ~/dev/stepn-dashboard/scripts/venv/bin/activate

# GUIアプリ起動
python3.14 stepn_importer.py

# CLIバッチ
python3.14 import_activity.py *.png --yes --batch-output activities.json
```

---

## 環境変数 (scripts/.env)

```bash
GIST_ID=e22508f07d33d27720159220816ea28e
GITHUB_TOKEN=ghp_xxxxxxxxxxxx   # scope: gist のみ
```

---

## Gist情報

| 項目    | 値                                                                                                |
| ------- | ------------------------------------------------------------------------------------------------- |
| Gist ID | `e22508f07d33d27720159220816ea28e`                                                                |
| raw URL | `https://gist.githubusercontent.com/saiteu/e22508f07d33d27720159220816ea28e/raw/stepn_rates.json` |

```javascript
// Webアプリからfetch（キャッシュバスター必須）
const RATES_URL =
  "https://gist.githubusercontent.com/saiteu/e22508f07d33d27720159220816ea28e/raw/stepn_rates.json";
const res = await fetch(RATES_URL + "?t=" + Date.now());
```

---

## Supabase情報

| 項目        | 値                                               |
| ----------- | ------------------------------------------------ |
| Project URL | `https://swclijxfprwklcymwkbm.supabase.co`       |
| anon key    | `sb_publishable_PMviioq9SftBXiFmOKH-JQ_Wpls8qTZ` |
| テーブル    | `activities`                                     |

```javascript
// Reactアプリでの初期化
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  "https://swclijxfprwklcymwkbm.supabase.co",
  "sb_publishable_PMviioq9SftBXiFmOKH-JQ_Wpls8qTZ",
);
```

---

## Supabase テーブル定義 (activities)

```sql
create table activities (
  id            uuid default gen_random_uuid() primary key,
  date          date not null,
  start_time    time,
  distance_km   numeric(5,2),
  duration      interval,
  avg_speed_kmh numeric(4,1),
  energy_used   numeric(4,1),
  gst_earned    numeric(8,2),
  shoe_type     text,
  shoe_id       text,
  mint_quarter  integer default 0,
  source_file   text,
  imported_at   timestamptz default now()
);
```

### フィールド説明

| フィールド     | 説明                                            |
| -------------- | ----------------------------------------------- |
| `gst_earned`   | GST獲得量（最重要）                             |
| `energy_used`  | エネルギー消費量                                |
| `mint_quarter` | ミントクォーター獲得数（ハートアイコン横の +N） |
| `shoe_type`    | シューズ種類（JOGGER/RUNNER/WALKER/TRAINER）    |
| `shoe_id`      | シューズID（数字またはTrial Sneaker等）         |
| `source_file`  | 元のスクショファイル名（重複チェックに使用）    |

---

## レートJSONフォーマット (stepn_rates.json)

```json
{
  "green-satoshi-token": {
    "usd": 0.00164,
    "usd_24h_change": -1.89,
    "jpy": 0.26,
    "jpy_24h_change": -1.4
  },
  "stepn": {
    "usd": 0.01047,
    "usd_24h_change": -2.28,
    "jpy": 1.66,
    "jpy_24h_change": -1.79
  },
  "polygon-ecosystem-token": {
    "usd": 0.0864,
    "usd_24h_change": -6.78,
    "jpy": 13.73,
    "jpy_24h_change": -6.33
  },
  "updated_at": "2026-04-09T06:45:53Z"
}
```

---

## スクショ運用フロー

```
1. STEPN GOで活動後、結果画面を一番下までスクロール
2. スクショ撮影（エネルギー・GST・シューズが見える状態で）
3. Macの所定フォルダにコピー（ファイル名は英数字のみ）
4. stepn_importer.py を起動
5. ファイルを選択 → ▶ OCR → Supabaseへアップロード
```

### スクショ撮影の注意

- 必ず**一番下までスクロール**してから撮影
- ファイル名は**英数字のみ**（日本語NG）
- 不完全なスクショ（GST未検出）は自動スキップ・警告あり

---

## fetch_rates.sh（設定済み）

```bash
#!/bin/bash
source "$(dirname "$0")/.env"
RATES=$(curl -s "https://api.coingecko.com/api/v3/simple/price?ids=green-satoshi-token,stepn,polygon-ecosystem-token&vs_currencies=usd,jpy&include_24hr_change=true")
JSON=$(echo $RATES | jq --arg ts "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" '. + {updated_at: $ts}')
curl -s -X PATCH \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"files\":{\"stepn_rates.json\":{\"content\":$(echo $JSON | jq -Rs .)}}}" \
  "https://api.github.com/gists/$GIST_ID" > /dev/null
echo "$(date): レート更新完了"
```

---

## cron設定（設定済み）

```
0 * * * * /Users/koukisaitou/dev/stepn-dashboard/scripts/fetch_rates.sh >> /Users/koukisaitou/dev/stepn-dashboard/scripts/rates.log 2>&1
```

---

## vite.config.js

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/stepn-dashboard/",
});
```

---

## GitHub Actions デプロイ (.github/workflows/deploy.yml)

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## .gitignore

```
node_modules/
dist/
scripts/.env
scripts/rates.log
scripts/venv/
scripts/*.json
```

---

## GitHub Pages

公開URL: `https://saiteu.github.io/stepn-dashboard/`
Settings → Pages → Source: `gh-pages` ブランチ

---

## トラブルシューティング

| 症状                     | 確認箇所                               |
| ------------------------ | -------------------------------------- |
| OCRが全部null            | ファイル名に日本語が入っていないか確認 |
| スクショがスキップされる | 画面を一番下までスクロールして再撮影   |
| Supabaseアップロード失敗 | anon keyとProject URLを確認            |
| レートが表示されない     | Gist raw URLをブラウザで直接開いて確認 |
| GitHub Pagesが404        | vite.config.js の base 設定を確認      |
| GUIが起動しない          | venvが有効化されているか確認           |

```bash
# Gist疎通確認
curl -s "https://gist.githubusercontent.com/saiteu/e22508f07d33d27720159220816ea28e/raw/stepn_rates.json" | jq .

# 手動レート更新
/Users/koukisaitou/dev/stepn-dashboard/scripts/fetch_rates.sh

# ログ確認
cat /Users/koukisaitou/dev/stepn-dashboard/scripts/rates.log
```

---

## 依存ツール

| ツール                    | 用途              | 備考                          |
| ------------------------- | ----------------- | ----------------------------- |
| `curl`                    | API通信・Gist更新 | macOS標準                     |
| `jq`                      | JSON整形          | `brew install jq`             |
| `python3.14`              | OCR・GUIアプリ    | `brew install python@3.14`    |
| `python-tk@3.14`          | tkinter GUI       | `brew install python-tk@3.14` |
| `pyobjc-framework-Vision` | Apple Vision OCR  | venv内でpip install           |
| `pyobjc-framework-Quartz` | 画像処理          | venv内でpip install           |
| `requests`                | Supabase REST API | venv内でpip install           |
