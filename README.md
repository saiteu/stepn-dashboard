# stepn-dashboard

個人用の STEPN GO 収益トラッカー。スクショを OCR して Supabase に保存し、GitHub Pages の React アプリで可視化する。

---

## アーキテクチャ

```
[ローカル: ~/dev/stepn-dashboard/]
  scripts/fetch_rates.sh       # CoinGecko API → Gist に書き込む（cron: 毎時0分）
  scripts/stepn_importer.py    # GUIアプリ: スクショ → OCR → Supabase
  scripts/import_activity.py   # CLIバッチ版

        ↓ GitHub API (PATCH /gists/:id)

[GitHub Gist]
  stepn_rates.json             # レート JSON（CORS フレンドリー）

        ↓ fetch()

[Supabase]
  activities テーブル

        ↓ @supabase/supabase-js

[GitHub Pages: saiteu.github.io/stepn-dashboard]
  React アプリ（Vite → gh-pages ブランチ）
```

---

## 技術スタック

| 用途 | 技術 |
|---|---|
| UI | React 18 + Vite + Tailwind CSS v3 |
| グラフ | Recharts |
| DB | Supabase（@supabase/supabase-js） |
| OCR | Apple Vision Framework（macOS標準） |
| GUI | Python tkinter + pyobjc |
| レート配信 | GitHub Gist |
| デプロイ | GitHub Actions → GitHub Pages |

---

## セットアップ

### 必要なツール

```bash
brew install jq python@3.14 python-tk@3.14
```

### Python 仮想環境（初回のみ）

```bash
cd ~/dev/stepn-dashboard/scripts
python3.14 -m venv venv
source venv/bin/activate
pip install pyobjc-framework-Vision pyobjc-framework-Quartz requests
```

### 環境変数

```bash
# scripts/.env を作成
GIST_ID=e22508f07d33d27720159220816ea28e
GITHUB_TOKEN=ghp_xxxxxxxxxxxx   # scope: gist のみ
```

```bash
# .env.local を作成（React アプリ用）
cp .env.local.example .env.local
# VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を記入
```

### フロントエンド起動確認

```bash
npm install
npm run dev
```

### cron 設定（レート自動更新）

```bash
crontab -e
# 以下を追加:
0 * * * * /Users/koukisaitou/dev/stepn-dashboard/scripts/fetch_rates.sh >> /Users/koukisaitou/dev/stepn-dashboard/scripts/rates.log 2>&1
```

---

## 日々の運用フロー

### スクショ撮影

1. STEPN GO で活動後、結果画面を**一番下までスクロール**
2. スクショ撮影（エネルギー・GGT・シューズが見える状態で）
3. Mac の所定フォルダにコピー（**ファイル名は英数字のみ**、日本語 NG）

### stepn_importer でアップロード

```bash
source ~/dev/stepn-dashboard/scripts/venv/bin/activate
cd ~/dev/stepn-dashboard/scripts
python3.14 stepn_importer.py
```

1. ファイルを選択
2. ▶ OCR ボタンを押す
3. 内容を確認して Supabase へアップロード

CLI バッチ版（複数ファイル一括処理）:

```bash
python3.14 import_activity.py *.png --yes
```

### レート更新

cron で毎時自動実行される。手動で更新したい場合:

```bash
/Users/koukisaitou/dev/stepn-dashboard/scripts/fetch_rates.sh
```

---

## ディレクトリ構成

```
stepn-dashboard/
  src/
    components/       # React コンポーネント
    hooks/            # useRates, useActivities など
    lib/              # supabase.js
  scripts/
    fetch_rates.sh    # レート取得・Gist アップロード
    stepn_importer.py # GUI アプリ（メイン運用ツール）
    import_activity.py# CLI バッチ版
    venv/             # Python 仮想環境（gitignore）
    .env              # GIST_ID, GITHUB_TOKEN（gitignore）
  .github/workflows/
    deploy.yml        # main push → GitHub Pages デプロイ
    update_rates.yml  # cron → Gist レート更新
  .env.local          # Supabase 接続情報（gitignore）
```

---

## トラブルシューティング

| 症状 | 確認箇所 |
|---|---|
| OCR が全部 null | ファイル名に日本語が含まれていないか確認 |
| スクショがスキップされる | 画面を一番下までスクロールして再撮影 |
| Supabase アップロード失敗 | `.env.local` の URL / anon key を確認 |
| レートが表示されない | Gist raw URL をブラウザで直接開いて確認 |
| GitHub Pages が 404 | `vite.config.js` の `base: '/stepn-dashboard/'` を確認 |
| GUI が起動しない | venv が有効化されているか確認 |

```bash
# Gist 疎通確認
curl -s "https://gist.githubusercontent.com/saiteu/e22508f07d33d27720159220816ea28e/raw/stepn_rates.json" | jq .

# cron ログ確認
cat ~/dev/stepn-dashboard/scripts/rates.log
```
