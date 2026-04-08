#!/usr/bin/env python3
from __future__ import annotations
"""
STEPN Go アクティビティ画像 -> JSON変換スクリプト
Apple Vision Framework版 (macOS専用・無料)

使い方:
  python3 import_activity.py <画像ファイルパス>
  python3 import_activity.py <画像ファイルパス> --output result.json
  python3 import_activity.py <画像ファイルパス> --yes
  python3 import_activity.py <画像ファイルパス> --debug

依存:
  pip install pyobjc-framework-Vision pyobjc-framework-Quartz
"""

import json
import re
import argparse
import sys
from pathlib import Path
from datetime import datetime


def vision_ocr(image_path):
    try:
        import Vision
        from Foundation import NSURL
    except ImportError:
        print("ERROR: pyobjc が見つかりません。以下を実行してください:")
        print("  pip install pyobjc-framework-Vision pyobjc-framework-Quartz")
        sys.exit(1)

    url = NSURL.fileURLWithPath_(str(Path(image_path).resolve()))

    request = Vision.VNRecognizeTextRequest.alloc().init()
    request.setRecognitionLevel_(Vision.VNRequestTextRecognitionLevelAccurate)
    request.setUsesLanguageCorrection_(False)

    handler = Vision.VNImageRequestHandler.alloc().initWithURL_options_(url, {})
    handler.performRequests_error_([request], None)

    results = []
    for obs in (request.results() or []):
        text = obs.topCandidates_(1)[0].string()
        box = obs.boundingBox()
        results.append({
            "text": text,
            "x": box.origin.x,
            "y": 1.0 - box.origin.y - box.size.height,
            "w": box.size.width,
            "h": box.size.height,
        })

    results.sort(key=lambda r: r["y"])
    return results


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


def parse_activity(image_path):
    print("  Apple Vision でOCR実行中...")
    blocks = vision_ocr(image_path)

    if not blocks:
        print("ERROR: テキストが検出されませんでした")
        return {}

    result = {}

    # 日付・時刻: 全ブロックから直接検索
    # "25/01/2026 11:48" or "27/11/202509:04" など複数パターン対応
    result['date'] = None
    result['start_time'] = None
    for b in blocks:
        text = b["text"]
        # スペースあり: "25/01/2026 11:48"
        m = re.search(r'(\d{2})/(\d{2})/(\d{4})\s+(\d{2}:\d{2})', text)
        if not m:
            # スペースなし: "25/01/202611:48"
            m = re.search(r'(\d{2})/(\d{2})/(\d{4})(\d{2}:\d{2})', text)
        if m:
            dd, mm, yyyy, hhmm = m.groups()
            if not (2020 <= int(yyyy) <= 2035):
                yyyy = str(datetime.now().year)
            result['date'] = '{}-{}-{}'.format(yyyy, mm, dd)
            result['start_time'] = hhmm
            break
    # 時刻が取れなかった場合、日付だけのブロックから日付だけ取得
    if result['date'] is None:
        for b in blocks:
            m = re.search(r'(\d{2})/(\d{2})/(\d{4})', b["text"])
            if m:
                dd, mm, yyyy = m.groups()
                if not (2020 <= int(yyyy) <= 2035):
                    yyyy = str(datetime.now().year)
                result['date'] = '{}-{}-{}'.format(yyyy, mm, dd)
                break

    # 距離 km (1桁・2桁小数両対応、x座標が左側)
    km_raw = find_text(blocks, r'^\d+\.\d{1,2}$', x_max=0.45, y_min=0.55, y_max=0.72)
    if not km_raw:
        km_raw = find_near(blocks, r'^Km$', r'\d+\.\d+')
    result['distance_km'] = float(km_raw) if km_raw else None

    # 時間
    dur_raw = find_text(blocks, r'\d{2}:\d{2}:\d{2}', y_min=0.5)
    result['duration'] = dur_raw

    # 平均速度 ("402 km/h" -> 4.2 のような誤読を補正)
    spd_raw = find_near(blocks, r'Avg\s*Speed', r'[\d.]+')
    if not spd_raw:
        spd_raw = find_text(blocks, r'[\d.]+ km/h', x_min=0.5, y_min=0.5, y_max=0.75)
    if spd_raw:
        m = re.search(r'([\d.]+)', spd_raw)
        if m:
            v = m.group(1).replace('.', '')  # 402 -> 402
            # 3桁以上で小数点なし -> 先頭以外を小数部に (402 -> 4.2)
            if len(v) >= 3 and '.' not in m.group(1):
                spd = float(v[0] + '.' + v[1:].lstrip('0') or '0')
            else:
                spd = float(m.group(1))
            result['avg_speed_kmh'] = spd
        else:
            result['avg_speed_kmh'] = None
    else:
        result['avg_speed_kmh'] = None

    # エネルギー消費
    energy_raw = find_text(blocks, r'-\s*\d+\.\d', x_min=0.4, y_min=0.6)
    if energy_raw:
        m = re.search(r'(\d+\.\d)', energy_raw)
        result['energy_used'] = float(m.group(1)) if m else None
    else:
        result['energy_used'] = None

    # GST獲得 ("+7.12", "+7:12", "+ 712" など複数パターンに対応)
    gst_raw = find_text(blocks, r'\+\s*[\d.:,]+', x_min=0.4, y_min=0.65)
    if not gst_raw:
        gst_raw = find_text(blocks, r'^[\d.:,]+$', x_min=0.5, y_min=0.65)
    if gst_raw:
        # コロン・カンマをピリオドに変換
        normalized = re.sub(r'[^\d.]', lambda mo: '.' if mo.group() in ':,' else '', gst_raw)
        # ピリオドあり: そのまま使用
        m = re.search(r'(\d+\.\d+)', normalized)
        if m:
            result['gst_earned'] = float(m.group(1))
        else:
            # ピリオドなしの整数: 下2桁を小数部に (712 -> 7.12, 2944 -> 29.44)
            digits = re.sub(r'\D', '', gst_raw)
            if digits and len(digits) >= 3:
                result['gst_earned'] = float(digits[:-2] + '.' + digits[-2:])
            else:
                result['gst_earned'] = None
    else:
        result['gst_earned'] = None

    # GST未取得でもenergy_usedが取れていれば0として扱う
    # （アイテムドロップ形式など、GSTが発生しない活動）
    if result['gst_earned'] is None and result['energy_used'] is not None:
        result['gst_earned'] = 0.0

    # シューズ
    shoe_raw = find_text(blocks, r'[A-Z]{3,}\s*#', y_min=0.7)
    if not shoe_raw:
        shoe_raw = find_text(blocks, r'^(JOGGER|RUNNER|WALKER|TRAINER)', y_min=0.7)
    # シューズ: 全ブロックから直接検索（find_textだと#前後で分割される場合があるため）
    result['shoe_type'] = None
    result['shoe_id'] = None
    for b in blocks:
        t = b["text"]
        # 数字ID: "JOGGER #494088181" or "JOGGER 494088181"
        m = re.search(r'(JOGGER|RUNNER|WALKER|TRAINER)\s*#?\s*(\d{6,})', t)
        if m:
            result['shoe_type'] = m.group(1)
            result['shoe_id'] = m.group(2)
            break
        # 文字列ID: "TRAINER #Trial Sneaker"
        m = re.search(r'(JOGGER|RUNNER|WALKER|TRAINER)\s*#\s*([A-Za-z][\w\s]+)', t)
        if m:
            result['shoe_type'] = m.group(1)
            result['shoe_id'] = m.group(2).strip()
            break

    # ミントクォーター: 画面右下の "+" ブロックの隣にある1桁数字
    # "+" と数字が別ブロックに分離されるケースに対応
    # ※ GSTの "+ 30.94" と混同しないよう、y > 0.83 かつ 1桁のみを対象にする
    result['mint_quarter'] = 0
    # パターン1: "+ 0" や "+ 1" が1ブロックで来る場合（y > 0.83）
    for b in blocks:
        if b["y"] > 0.83 and b["x"] > 0.4:
            m = re.match(r'^\+\s*(\d)$', b["text"].strip())
            if m:
                result['mint_quarter'] = int(m.group(1))
                break
    # パターン2: "+" と数字が別ブロックの場合
    if result['mint_quarter'] == 0:
        plus_block = None
        for b in blocks:
            if b["text"].strip() == "+" and b["x"] > 0.4 and b["y"] > 0.83:
                plus_block = b
                break
        if plus_block:
            # plusブロックのy座標の"下"にある1桁数字のみ対象（上のGSTと混同しない）
            for b in blocks:
                if (b["y"] > plus_block["y"]  # 必ずplusより下
                        and abs(b["x"] - plus_block["x"]) < 0.2
                        and b["y"] < plus_block["y"] + 0.05):
                    m = re.match(r'^(\d)$', b["text"].strip())
                    if m:
                        result['mint_quarter'] = int(m.group(1))
                        break

    return result


LABELS = {
    'date':          ('日付',           'YYYY-MM-DD'),
    'start_time':    ('開始時刻',       'HH:MM'),
    'distance_km':   ('距離(km)',       '例: 6.97'),
    'duration':      ('時間',           'HH:MM:SS'),
    'avg_speed_kmh': ('平均速度(km/h)', '例: 7.8'),
    'energy_used':   ('エネルギー消費', '例: 6.0'),
    'gst_earned':    ('GST獲得量',      '例: 117.88'),
    'shoe_type':     ('シューズ種類',   '例: JOGGER'),
    'shoe_id':       ('シューズID',     '例: 494088181'),
    'mint_quarter': ('ポイント獲得',   '例: 0'),
}


def confirm_and_edit(result):
    print('\n' + '='*50)
    print('読み取り結果を確認してください')
    print('='*50)
    for k, v in result.items():
        lb, hint = LABELS.get(k, (k, ''))
        status = 'OK' if v is not None else 'NG'
        print('  [{}] [{}] {}: {}'.format(status, k, lb, v))

    print('\n修正したい項目のキーを入力してください（なければEnter）\n')
    inp = input('修正する項目名: ').strip()
    while inp:
        if inp in result:
            lb, hint = LABELS.get(inp, (inp, ''))
            nv = input('  {} ({}) -> '.format(lb, hint)).strip()
            if nv:
                if inp in ('distance_km', 'avg_speed_kmh', 'energy_used', 'gst_earned'):
                    try:
                        result[inp] = float(nv)
                    except ValueError:
                        result[inp] = nv
                elif inp == 'mint_quarter':
                    try:
                        result[inp] = int(nv)
                    except ValueError:
                        result[inp] = nv
                else:
                    result[inp] = nv
                print('  -> {}'.format(result[inp]))
        else:
            print('  "{}" は存在しないキーです'.format(inp))
        inp = input('他に修正する項目名 (なければEnter): ').strip()
    return result


def debug_mode(image_path):
    print('\nデバッグ: {}'.format(image_path))
    blocks = vision_ocr(image_path)
    print('検出テキスト数: {}'.format(len(blocks)))
    print('{:>8} {:>8}  {}'.format('y座標', 'x座標', 'テキスト'))
    print('-' * 50)
    for b in blocks:
        print('  {:.3f}   {:.3f}   {}'.format(b["y"], b["x"], b["text"]))


def main():
    ap = argparse.ArgumentParser(description='STEPN Go スクショ -> JSON (Apple Vision)')
    ap.add_argument('images', nargs='+', help='スクリーンショットのパス（複数指定可）')
    ap.add_argument('--output', '-o', default=None, help='出力JSONファイル名（単体時のみ）')
    ap.add_argument('--batch-output', '-b', default='activities.json', help='バッチ出力ファイル名（デフォルト: activities.json）')
    ap.add_argument('--yes', '-y', action='store_true', help='確認をスキップ')
    ap.add_argument('--debug', '-d', action='store_true', help='検出テキストを全表示')
    args = ap.parse_args()

    # デバッグモード
    if args.debug:
        for img in args.images:
            debug_mode(img)
        return

    # 単体モード
    if len(args.images) == 1:
        img = args.images[0]
        print('\n解析中: {}'.format(img))
        result = parse_activity(img)
        if not result:
            sys.exit(1)
        if not args.yes:
            result = confirm_and_edit(result)
        result['imported_at'] = datetime.now().isoformat()
        out = args.output or Path(img).stem + '_activity.json'
        with open(out, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print('\n保存完了: {}'.format(out))
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return

    # バッチモード
    print('\nバッチ処理開始: {}件'.format(len(args.images)))
    print('=' * 50)

    # GSTがnullだと収益管理にならないので必須フィールドを定義
    REQUIRED_FIELDS = ['date', 'energy_used', 'shoe_type']

    results = []
    errors = []
    skipped = []

    for i, img in enumerate(sorted(args.images), 1):
        print('\n[{}/{}] {}'.format(i, len(args.images), Path(img).name))
        try:
            result = parse_activity(img)
            if not result:
                errors.append((img, 'テキスト未検出'))
                continue

            # 必須フィールドが欠けていたらスキップ
            missing = [k for k in REQUIRED_FIELDS if result.get(k) is None]
            if missing:
                print('  スキップ: {} が未取得（スクロール不足の可能性）'.format(', '.join(missing)))
                skipped.append((Path(img).name, missing))
                continue

            # NGフィールドを表示（必須以外）
            ng_fields = [k for k, v in result.items() if v is None and k not in ('imported_at', 'source_file')]
            if ng_fields:
                print('  NG項目（任意）: {}'.format(', '.join(ng_fields)))
            else:
                print('  全項目OK')

            result['source_file'] = Path(img).name
            result['imported_at'] = datetime.now().isoformat()
            results.append(result)

        except Exception as e:
            print('  エラー: {}'.format(e))
            errors.append((img, str(e)))

    # 結果サマリー
    print('\n' + '=' * 50)
    print('処理完了: 成功 {} / スキップ {} / エラー {} （合計 {} 件）'.format(
        len(results), len(skipped), len(errors), len(args.images)))
    if skipped:
        print('\nスキップしたファイル（再撮影推奨）:')
        for name, missing in skipped:
            print('  ⚠️  {}: {} が未取得'.format(name, ', '.join(missing)))
    if errors:
        print('\nエラー:')
        for img, err in errors:
            print('  - {}: {}'.format(Path(img).name, err))

    if not results:
        print('出力データなし')
        sys.exit(1)

    # 日付順にソート
    results.sort(key=lambda r: (r.get('date') or '', r.get('start_time') or ''))

    # JSON出力
    out = args.batch_output
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print('\n保存完了: {} ({} 件)'.format(out, len(results)))


if __name__ == '__main__':
    main()