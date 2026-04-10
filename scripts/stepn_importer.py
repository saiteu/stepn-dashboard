#!/usr/bin/env python3
"""
STEPN Go インポーター
スクショをドロップ → OCR → Supabase アップロード

依存:
  pip install pyobjc-framework-Vision pyobjc-framework-Quartz requests
"""

from __future__ import annotations
import json
import re
import threading
import tkinter as tk
from tkinter import filedialog, ttk
from pathlib import Path
from datetime import datetime
import requests
import os
from dotenv import load_dotenv
from pathlib import Path

# ── 設定 ──────────────────────────────────────────────
load_dotenv(Path(__file__).parent / '.env')
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
TABLE_NAME   = "activities"

# ── Apple Vision OCR ──────────────────────────────────

def vision_ocr(image_path):
    try:
        import Vision
        from Foundation import NSURL
    except ImportError:
        raise RuntimeError("pyobjc が見つかりません: pip install pyobjc-framework-Vision pyobjc-framework-Quartz")

    url = NSURL.fileURLWithPath_(str(Path(image_path).resolve()))
    request = Vision.VNRecognizeTextRequest.alloc().init()
    request.setRecognitionLevel_(Vision.VNRequestTextRecognitionLevelAccurate)
    request.setUsesLanguageCorrection_(False)
    handler = Vision.VNImageRequestHandler.alloc().initWithURL_options_(url, {})
    handler.performRequests_error_([request], None)

    results = []
    for obs in (request.results() or []):
        text = obs.topCandidates_(1)[0].string()
        box  = obs.boundingBox()
        results.append({
            "text": text,
            "x": box.origin.x,
            "y": 1.0 - box.origin.y - box.size.height,
            "w": box.size.width,
            "h": box.size.height,
        })
    results.sort(key=lambda r: r["y"])
    return results

# ── パーサー ──────────────────────────────────────────

def find_text(blocks, pattern, x_min=0.0, x_max=1.0, y_min=0.0, y_max=1.0):
    for b in blocks:
        if not (x_min <= b["x"] <= x_max and y_min <= b["y"] <= y_max):
            continue
        m = re.search(pattern, b["text"])
        if m:
            return m.group(0)
    return None

def find_near(blocks, label_pattern, value_pattern, y_tolerance=0.05):
    for b in blocks:
        if re.search(label_pattern, b["text"], re.IGNORECASE):
            label_y = b["y"]
            for b2 in blocks:
                if abs(b2["y"] - label_y) <= y_tolerance:
                    m = re.search(value_pattern, b2["text"])
                    if m:
                        return m.group(0)
    return None

def clean_float(raw, max_val=None):
    m = re.search(r'(\d+\.\d+)', raw)
    if not m:
        return None
    v = float(m.group(1))
    if max_val and v > max_val:
        try:
            v = float(re.sub(r'^\d', '', str(v)))
        except Exception:
            pass
    return v

def parse_activity(image_path):
    blocks = vision_ocr(image_path)
    if not blocks:
        return None

    result = {}

    # 日付・時刻
    result['date'] = None
    result['start_time'] = None
    for b in blocks:
        text = b["text"]
        m = re.search(r'(\d{2})/(\d{2})/(\d{4})\s+(\d{2}:\d{2})', text)
        if not m:
            m = re.search(r'(\d{2})/(\d{2})/(\d{4})(\d{2}:\d{2})', text)
        if m:
            dd, mm, yyyy, hhmm = m.groups()
            if not (2020 <= int(yyyy) <= 2035):
                yyyy = str(datetime.now().year)
            result['date'] = '{}-{}-{}'.format(yyyy, mm, dd)
            result['start_time'] = hhmm
            break
    if result['date'] is None:
        for b in blocks:
            m = re.search(r'(\d{2})/(\d{2})/(\d{4})', b["text"])
            if m:
                dd, mm, yyyy = m.groups()
                if not (2020 <= int(yyyy) <= 2035):
                    yyyy = str(datetime.now().year)
                result['date'] = '{}-{}-{}'.format(yyyy, mm, dd)
                break

    # stats行のy座標を動的検出
    stats_y = None
    for y in range(1190, 1270, 5):
        # ブロックのy座標（0-1正規化）で判定
        pass
    # 正規化座標で距離・時間・速度を探す
    km_raw = find_text(blocks, r'^\d+\.\d{1,2}$', x_max=0.45, y_min=0.55, y_max=0.72)
    if not km_raw:
        km_raw = find_near(blocks, r'^Km$', r'\d+\.\d+')
    result['distance_km'] = float(km_raw) if km_raw else None

    dur_raw = find_text(blocks, r'\d{2}:\d{2}:\d{2}', y_min=0.5)
    result['duration'] = dur_raw

    spd_raw = find_near(blocks, r'Avg\s*Speed', r'[\d.]+')
    if not spd_raw:
        spd_raw = find_text(blocks, r'[\d.]+ km/h', x_min=0.5, y_min=0.5, y_max=0.75)
    if spd_raw:
        m = re.search(r'([\d.]+)', spd_raw)
        if m:
            v = m.group(1).replace('.', '')
            if len(v) >= 3 and '.' not in m.group(1):
                spd = float(v[0] + '.' + v[1:].lstrip('0') or '0')
            else:
                spd = float(m.group(1))
            result['avg_speed_kmh'] = spd if spd <= 25 else None
        else:
            result['avg_speed_kmh'] = None
    else:
        result['avg_speed_kmh'] = None

    # エネルギー
    energy_raw = find_text(blocks, r'-\s*\d+\.\d', x_min=0.4, y_min=0.6)
    if energy_raw:
        m = re.search(r'(\d+\.\d)', energy_raw)
        result['energy_used'] = float(m.group(1)) if m else None
    else:
        result['energy_used'] = None

    # GST
    gst_raw = find_text(blocks, r'\+\s*[\d.:,]+', x_min=0.4, y_min=0.65)
    if not gst_raw:
        gst_raw = find_text(blocks, r'^[\d.:,]+$', x_min=0.5, y_min=0.65)
    if gst_raw:
        normalized = re.sub(r'[^\d.]', lambda mo: '.' if mo.group() in ':,' else '', gst_raw)
        m = re.search(r'(\d+\.\d+)', normalized)
        if m:
            result['gst_earned'] = float(m.group(1))
        else:
            digits = re.sub(r'\D', '', gst_raw)
            if digits and len(digits) >= 3:
                result['gst_earned'] = float(digits[:-2] + '.' + digits[-2:])
            else:
                result['gst_earned'] = None
    else:
        result['gst_earned'] = None

    # GST未取得でもenergy_usedが取れていれば活動は存在する
    # ダイヤアイコンなし（アイテムドロップ形式等）の場合は0として扱う
    if result['gst_earned'] is None and result['energy_used'] is not None:
        result['gst_earned'] = 0.0

    # シューズ
    result['shoe_type'] = None
    result['shoe_id'] = None
    for b in blocks:
        t = b["text"]
        m = re.search(r'(JOGGER|RUNNER|WALKER|TRAINER)\s*#?\s*(\d{6,})', t)
        if m:
            result['shoe_type'] = m.group(1)
            result['shoe_id'] = m.group(2)
            break
        m = re.search(r'(JOGGER|RUNNER|WALKER|TRAINER)\s*#\s*([A-Za-z][\w\s]+)', t)
        if m:
            result['shoe_type'] = m.group(1)
            result['shoe_id'] = m.group(2).strip()
            break

    # ミントクォーター
    result['mint_quarter'] = 0
    for b in blocks:
        if b["y"] > 0.83 and b["x"] > 0.4:
            m = re.match(r'^\+\s*(\d)$', b["text"].strip())
            if m:
                result['mint_quarter'] = int(m.group(1))
                break
    if result['mint_quarter'] == 0:
        plus_block = None
        for b in blocks:
            if b["text"].strip() == "+" and b["x"] > 0.4 and b["y"] > 0.83:
                plus_block = b
                break
        if plus_block:
            for b in blocks:
                if (b["y"] > plus_block["y"]
                        and abs(b["x"] - plus_block["x"]) < 0.2
                        and b["y"] < plus_block["y"] + 0.05):
                    m = re.match(r'^(\d)$', b["text"].strip())
                    if m:
                        result['mint_quarter'] = int(m.group(1))
                        break

    return result

REQUIRED_FIELDS = ['date', 'energy_used', 'shoe_type']

# ── Supabase アップロード ──────────────────────────────

def upload_to_supabase(record):
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    # duration を文字列からそのまま送る（PostgreSQL intervalとして解釈される）
    res = requests.post(
        "{}/rest/v1/{}".format(SUPABASE_URL, TABLE_NAME),
        headers=headers,
        json=record,
        timeout=10,
    )
    return res.status_code in (200, 201)

def check_duplicate(date, source_file):
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
    }
    res = requests.get(
        "{}/rest/v1/{}?date=eq.{}&source_file=eq.{}&select=id".format(
            SUPABASE_URL, TABLE_NAME, date, source_file),
        headers=headers,
        timeout=10,
    )
    if res.status_code == 200:
        return len(res.json()) > 0
    return False

# ── GUIアプリ ─────────────────────────────────────────

class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("STEPN Go インポーター")
        self.geometry("600x700")
        self.resizable(True, True)
        self.configure(bg="#f5f5f5"); self.update()

        self.files = []
        self.results = []
        self._build_ui()

    def _build_ui(self):
        # ヘッダー
        header = tk.Frame(self, bg="#f5f5f5")
        header.pack(fill="x", padx=20, pady=(20, 0))
        tk.Label(header, text="🏃 STEPN Go インポーター",
                 bg="#f5f5f5", fg="#00805a",
                 font=("Courier", 16, "bold")).pack(anchor="w")
        tk.Label(header, text="スクショをOCR解析してSupabaseにアップロード",
                 bg="#f5f5f5", fg="#666666",
                 font=("Courier", 10)).pack(anchor="w", pady=(4, 0))

        # ドロップゾーン
        self.drop_frame = tk.Frame(self, bg="#ffffff",
                                   highlightbackground="#00e5a0",
                                   highlightthickness=1,
                                   cursor="hand2")
        self.drop_frame.pack(fill="x", padx=20, pady=16)
        self.drop_label = tk.Label(self.drop_frame,
                                   text="📂  クリックしてスクショを選択\n（複数選択可）",
                                   bg="#ffffff", fg="#666666",
                                   font=("Courier", 11),
                                   pady=30)
        self.drop_label.pack()
        self.drop_frame.bind("<Button-1>", lambda e: self._select_files())
        self.drop_label.bind("<Button-1>", lambda e: self._select_files())

        # ファイルリスト
        list_frame = tk.Frame(self, bg="#f5f5f5")
        list_frame.pack(fill="both", expand=True, padx=20)

        self.tree = ttk.Treeview(list_frame, columns=("file", "status", "gst"),
                                  show="headings", height=10)
        self.tree.heading("file",   text="ファイル")
        self.tree.heading("status", text="状態")
        self.tree.heading("gst",    text="GST獲得")
        self.tree.column("file",   width=220)
        self.tree.column("status", width=120, anchor="center")
        self.tree.column("gst",    width=100, anchor="center")

        style = ttk.Style()
        style.theme_use("clam")
        style.configure("Treeview",
                         background="#ffffff",
                         foreground="#222222",
                         fieldbackground="#ffffff",
                         font=("Courier", 10))
        style.configure("Treeview.Heading",
                         background="#e8e8e8",
                         foreground="#00805a",
                         font=("Courier", 10, "bold"))

        scrollbar = ttk.Scrollbar(list_frame, orient="vertical",
                                   command=self.tree.yview)
        self.tree.configure(yscrollcommand=scrollbar.set)
        self.tree.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

        # ボタン
        btn_frame = tk.Frame(self, bg="#f5f5f5")
        btn_frame.pack(fill="x", padx=20, pady=12)

        self.clear_btn = tk.Button(btn_frame, text="クリア",
                                    bg="#dddddd", fg="#444444",
                                    font=("Courier", 11),
                                    relief="raised", bd=2,
                                    padx=16, pady=8,
                                    cursor="hand2",
                                    activebackground="#cccccc",
                                    activeforeground="#444444",
                                    command=self._clear)
        self.clear_btn.pack(side="left")

        self.run_btn = tk.Button(btn_frame, text="▶  OCR → Supabaseへアップロード",
                                  bg="#00e5a0", fg="#ffffff",
                                  font=("Courier", 11, "bold"),
                                  relief="flat", padx=16, pady=8,
                                  cursor="hand2",
                                  command=self._run)
        self.run_btn.pack(side="right")

        # ステータスバー
        self.status_var = tk.StringVar(value="ファイルを選択してください")
        self.status_label = tk.Label(self, textvariable=self.status_var,
                                      bg="#f5f5f5", fg="#666666",
                                      font=("Courier", 10), anchor="w")
        self.status_label.pack(fill="x", padx=20, pady=(0, 16))

    def _select_files(self):
        paths = filedialog.askopenfilenames(
            title="スクショを選択",
            filetypes=[("PNG files", "*.png"), ("All files", "*.*")]
        )
        if paths:
            self.files = list(paths)
            self._refresh_list()
            self.status_var.set("{}件のファイルを選択しました".format(len(self.files)))

    def _refresh_list(self):
        for row in self.tree.get_children():
            self.tree.delete(row)
        for f in self.files:
            self.tree.insert("", "end", values=(Path(f).name, "待機中", "-"))

    def _clear(self):
        self.files = []
        self.results = []
        for row in self.tree.get_children():
            self.tree.delete(row)
        self.status_var.set("ファイルを選択してください")

    def _run(self):
        if not self.files:
            self.status_var.set("ファイルが選択されていません")
            return
        self.run_btn.config(state="disabled", text="⏳ 処理中...", bg="#aaaaaa")
        threading.Thread(target=self._process, daemon=True).start()

    def _update_row(self, index, status, gst=""):
        rows = self.tree.get_children()
        if index < len(rows):
            fname = Path(self.files[index]).name
            self.tree.item(rows[index], values=(fname, status, gst))

    def _process(self):
        success = skip = error = duplicate = 0

        for i, fpath in enumerate(self.files):
            fname = Path(fpath).name
            self._update_row(i, "⏳ OCR中...", "")
            self.status_var.set("[{}/{}] OCR中: {}".format(i+1, len(self.files), fname))

            try:
                result = parse_activity(fpath)

                if result is None:
                    self._update_row(i, "❌ 未検出")
                    error += 1
                    continue

                missing = [k for k in REQUIRED_FIELDS if result.get(k) is None]
                if missing:
                    self._update_row(i, "⚠️ スキップ")
                    skip += 1
                    continue

                # 重複チェック
                result['source_file'] = fname
                if check_duplicate(result['date'], fname):
                    self._update_row(i, "⏭️ 重複", str(result.get('gst_earned', '')))
                    duplicate += 1
                    continue

                # アップロード
                self._update_row(i, "⬆️ アップロード中", str(result.get('gst_earned', '')))
                ok = upload_to_supabase(result)

                if ok:
                    gst_str = "+{} GST".format(result.get('gst_earned', ''))
                    self._update_row(i, "✅ 完了", gst_str)
                    success += 1
                else:
                    self._update_row(i, "❌ 失敗")
                    error += 1

            except Exception as e:
                self._update_row(i, "❌ エラー")
                error += 1
                print("Error: {} - {}".format(fname, e))

        # 完了
        self.run_btn.config(state="normal", text="▶  OCR → Supabaseへアップロード", bg="#00a87a")
        msg = "完了: ✅{}件 ⚠️スキップ{}件 ⏭️重複{}件 ❌エラー{}件".format(
            success, skip, duplicate, error)
        self.status_var.set(msg)


if __name__ == "__main__":
    app = App()
    app.mainloop()