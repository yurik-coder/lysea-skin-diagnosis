import os
import json
import re
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)  # フロントエンド（localhost:5173）からのアクセスを許可

API_KEY = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=API_KEY) if API_KEY else None

MODEL_NAME = "gemini-3.5-flash"  # 2026年8月時点の標準モデル。エラーが出る場合は "gemini-3.6-flash" もお試しください

RADAR_KEYS = ["hydration", "spots", "pores", "firmness", "transparency"]
LABELS = {
    "hydration": "水分",
    "spots": "シミ",
    "pores": "毛穴",
    "firmness": "ハリ",
    "transparency": "透明感",
}

# ---- ここから下は「AIに聞かずJSで決める」ロジック ----
# 画像がない場合のスコアは、問診の回答から機械的に計算します。
# こうすることで、同じ回答なら毎回同じスコアになり、結果がブレません。

CONCERN_MAP = {
    "肌のカサつき": {"hydration": -15},
    "シミ・くすみ": {"spots": -15, "transparency": -8},
    "毛穴": {"pores": -15},
    "ハリ不足": {"firmness": -15},
    "赤み・ヒリつき": {"hydration": -8, "transparency": -5},
    "ニキビ・肌荒れ": {"pores": -8, "transparency": -8},
}

SKINTYPE_BASE = {
    "乾燥肌": {"hydration": -10},
    "脂性肌": {"pores": -10},
    "混合肌": {},
    "普通肌": {"hydration": 5, "spots": 5, "pores": 5, "firmness": 5, "transparency": 5},
    "敏感肌": {"hydration": -5, "transparency": -5},
}

SKINCARE_BONUS = {
    "化粧水": {"hydration": 4},
    "乳液": {"hydration": 4},
    "美容液・オイル": {"firmness": 5, "transparency": 3},
    "クリーム": {"hydration": 5},
    "UVケア": {"spots": 6},
    "クレンジング": {"pores": 3},
    "洗顔": {"pores": 3},
    "その他": {},
}

AGE_MIDPOINT = {
    "10代": 17,
    "20代前半": 22,
    "20代後半": 27,
    "30代前半": 32,
    "30代後半": 37,
    "40代": 43,
    "50代以上": 53,
}

TYPE_NAMES = {
    "hydration": "うるツヤタイプ",
    "spots": "クリアスキンタイプ",
    "pores": "つるすべ美肌タイプ",
    "firmness": "ハリ美人タイプ",
    "transparency": "透明感かがやきタイプ",
}

CARE_TIPS_MAP = {
    "hydration": [
        "高保湿タイプの化粧水に切り替える、または重ね付けをする",
        "週2回程度、保湿パックを取り入れる",
        "乳液の後にセラミド配合クリームでうるおいに蓋をする",
    ],
    "spots": [
        "UVケアを毎日欠かさず行う",
        "ビタミンC誘導体配合の美容液を取り入れる",
        "摩擦を避け、優しくスキンケアする",
    ],
    "pores": [
        "洗顔料をぬるま湯でしっかり泡立てて使う",
        "収れん化粧水で毛穴を引き締める",
        "週1回程度、毛穴ケア用パックを取り入れる",
    ],
    "firmness": [
        "レチノールやペプチド配合の美容液を取り入れる",
        "顔全体を優しくマッサージする習慣をつける",
        "たんぱく質を意識した食生活を心がける",
    ],
    "transparency": [
        "ピーリングケアを週1回取り入れる",
        "美白美容液で透明感をサポートする",
        "十分な睡眠でターンオーバーを整える",
    ],
}

SKIN_STATE_PREFIX = {
    "hydration": "乾燥傾向のある",
    "spots": "くすみが気になる",
    "pores": "毛穴が気になる",
    "firmness": "ハリ不足が気になる",
    "transparency": "透明感が控えめな",
}

# 実際のECサイトの商品カタログ（script.jsのproductDataと同じID・情報）
# 「?item=商品ID」でECサイト側の商品モーダルを直接開ける
CARE_SET_MAP = {
    "hydration": {
        "title": "うるおいチャージセット",
        "concern": "乾燥・保湿ケア",
        "products": [
            {"id": "moist-charge-lotion", "name": "モイスト チャージ ローション", "price": "¥4,400 (税込)"},
            {"id": "moist-charge-serum", "name": "モイスト チャージ セラム", "price": "¥5,500 (税込)"},
            {"id": "moist-charge-cream", "name": "モイスト チャージ クリーム", "price": "¥5,200 (税込)"},
        ],
    },
    "spots": {
        "title": "透明感・美白ケアセット",
        "concern": "シミ・美白ケア",
        "products": [
            {"id": "brightening-serum", "name": "ブライトニング セラム", "price": "¥6,500 (税込)"},
            {"id": "brightening-spot-essence", "name": "ブライトニング スポットケア美容液", "price": "¥5,800 (税込)"},
            {"id": "brightening-cream", "name": "ブライトニング クリーム", "price": "¥6,000 (税込)"},
        ],
    },
    "pores": {
        "title": "毛穴クリアケアセット",
        "concern": "毛穴・角質ケア",
        "products": [
            {"id": "pure-milk-cleanse", "name": "ピュア ミルク クレンズ", "price": "¥3,800 (税込)"},
            {"id": "moist-whip-wash", "name": "モイスト ホイップ ウォッシュ", "price": "¥3,200 (税込)"},
        ],
    },
    "firmness": {
        "title": "ハリ育成エイジングケアセット",
        "concern": "エイジング（ハリ・弾力）",
        "products": [
            {"id": "advanced-rich-serum", "name": "アドバンスド リッチ セラム", "price": "¥6,800 (税込)"},
            {"id": "advanced-rich-cream", "name": "アドバンスド リッチ クリーム", "price": "¥7,500 (税込)"},
            {"id": "advanced-rich-eye-cream", "name": "アドバンスド リッチ アイクリーム", "price": "¥6,000 (税込)"},
        ],
    },
    "transparency": {
        "title": "透明感かがやきセット",
        "concern": "透明感・くすみ",
        "products": [
            {"id": "day-protect-uv-essence", "name": "デイプロテクト UVエッセンス", "price": "¥3,500 (税込)"},
            {"id": "brightening-lotion", "name": "ブライトニング ローション", "price": "¥5,000 (税込)"},
            {"id": "brightening-emulsion", "name": "ブライトニング エマルジョン", "price": "¥5,200 (税込)"},
        ],
    },
}


def pick_care_set(scores):
    """スコアが最も低い項目に応じて、実商品のおすすめセットを選ぶ"""
    weakest_key = min(scores, key=scores.get)
    return CARE_SET_MAP[weakest_key]


def rule_based_scores(profile):
    """問診内容だけからスコアを計算する（画像がない場合に使用）"""
    scores = {k: 75 for k in RADAR_KEYS}
    for k, delta in SKINTYPE_BASE.get(profile.get("skinType", ""), {}).items():
        scores[k] += delta
    for concern in profile.get("concerns", []):
        for k, delta in CONCERN_MAP.get(concern, {}).items():
            scores[k] += delta
    for item in profile.get("skincareItems", []):
        for k, delta in SKINCARE_BONUS.get(item, {}).items():
            scores[k] += delta
    return {k: max(40, min(95, round(v))) for k, v in scores.items()}


def item_comment(value):
    if value >= 85:
        return "かなり良好です"
    if value >= 75:
        return "順調です"
    if value >= 65:
        return "もう少し伸ばせそうです"
    return "重点的にケアしたい項目です"


def compute_skin_age(age_range, scores):
    """
    肌年齢を算出する。
    単純な5項目平均だけだと、Geminiのコメントが注目する
    「一番良い項目／一番悪い項目」の影響が薄まってしまうため、
    その2項目を重めに反映する。

    また、肌診断を受ける人は美容意識が高く、前向きな結果の方が
    お手入れへのモチベーションにつながりやすいと考えられるため、
    ・一番良い項目の若返り効果はやや強め
    ・一番悪い項目の老化効果はやや弱め
    ・全体にわずかな若返りの下駄（POSITIVE_BIAS）
    という調整を加えている。ただし極端な数字にならないよう、
    若返り・年齢アップともに上限を設けている。
    """
    POSITIVE_BIAS = 1.5  # 全体にかける、わずかな若返りの下駄（年）
    MAX_YOUNGER = 6  # 実年齢からどれだけ若く出してよいかの上限（年）
    MAX_OLDER = 3  # 実年齢からどれだけ上に出してよいかの上限（年）

    base = AGE_MIDPOINT.get(age_range, 27)
    values = list(scores.values())
    highest = max(values)
    lowest = min(values)
    # 最高・最低を除いた残りの項目の平均を「基準」にする
    middle_values = sorted(values)[1:-1] if len(values) > 2 else values
    middle_avg = sum(middle_values) / len(middle_values)

    # 一番良い項目→若返り効果を強め、一番悪い項目→年齢アップ効果を弱める
    extremes_effect = (highest - middle_avg) / 3.5 - (middle_avg - lowest) / 5
    baseline_effect = (middle_avg - 75) / 6

    adjustment = extremes_effect + baseline_effect + POSITIVE_BIAS
    adjustment = max(-MAX_OLDER, min(MAX_YOUNGER, adjustment))
    return max(15, round(base - adjustment))


def pick_diagnosis_type(scores):
    top_key = max(scores, key=scores.get)
    return TYPE_NAMES[top_key]


def pick_care_tips(scores):
    weakest_key = min(scores, key=scores.get)
    return CARE_TIPS_MAP[weakest_key]


def pick_skin_state(scores, skin_type):
    weakest_key = min(scores, key=scores.get)
    return f"{SKIN_STATE_PREFIX[weakest_key]}{skin_type or '肌'}"


# ---- ここから下は「Geminiに聞く」部分 ----


def build_image_and_comment_prompt(profile):
    return f"""あなたはスキンケアブランド「Lyséa」の美容カウンセラーです。添付された顔写真と以下の問診内容をもとに、
肌状態を5項目でスコア化し、あわせて総合コメントも書いてください。画像の印象を60%、問診内容を40%の重みでスコアを判断してください。

【問診内容】
年代: {profile.get("age")}
肌タイプ: {profile.get("skinType")}
肌悩み: {", ".join(profile.get("concerns", []))}
現在のスキンケア: {", ".join(profile.get("skincareItems", []))}

以下のJSON形式のみで出力してください（説明文・Markdown記法は一切不要です）:
{{
  "hydration": 0-100の整数,
  "spots": 0-100の整数,
  "pores": 0-100の整数,
  "firmness": 0-100の整数,
  "transparency": 0-100の整数,
  "comment": "総合コメント（日本語で187文字前後）。最初に5項目の中で最もスコアが高い項目に触れて褒める。次に、ユーザーの肌悩みに触れながら、5項目の中で最もスコアが低い項目について優しく指摘する。前向きな一文で締めくくる。丁寧で親しみやすいトーン（「〜です」「〜ます」調）。見出しや記号、箇条書きは使わない。"
}}
"""


def generate_with_retry(contents, max_retries=1, delay_seconds=2):
    """Gemini APIが混雑（503 UNAVAILABLE）している時、少し待って最大2回まで再試行する"""
    last_error = None
    for attempt in range(max_retries + 1):
        try:
            return client.models.generate_content(model=MODEL_NAME, contents=contents)
        except Exception as e:
            last_error = e
            is_busy = "503" in str(e) or "UNAVAILABLE" in str(e)
            if is_busy and attempt < max_retries:
                time.sleep(delay_seconds)
                continue
            raise last_error


def analyze_and_comment_with_gemini(image_bytes, mime_type, profile):
    prompt = build_image_and_comment_prompt(profile)
    response = generate_with_retry(
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            prompt,
        ]
    )
    data = extract_json(response.text)
    scores = {k: max(0, min(100, int(data[k]))) for k in RADAR_KEYS}
    comment = str(data["comment"]).strip()
    return scores, comment


def build_comment_prompt(profile, scores):
    top_key = max(scores, key=scores.get)
    low_key = min(scores, key=scores.get)
    return f"""あなたはスキンケアブランド「Lyséa」の美容カウンセラーです。以下の診断結果をもとに、
ユーザーへの総合コメントを日本語で187文字前後で書いてください。

【問診内容】
年代: {profile.get("age")}
肌タイプ: {profile.get("skinType")}
肌悩み: {", ".join(profile.get("concerns", []))}
現在のスキンケア: {", ".join(profile.get("skincareItems", []))}

【診断スコア】
水分: {scores["hydration"]} / シミ: {scores["spots"]} / 毛穴: {scores["pores"]} / ハリ: {scores["firmness"]} / 透明感: {scores["transparency"]}

【書き方のルール】
- 最初にスコアが最も高い項目（{LABELS[top_key]}）について触れて褒める
- 次に、ユーザーが回答した肌悩みに触れながら、スコアが最も低い項目（{LABELS[low_key]}）について優しく指摘する
- 前向きな一文で締めくくる
- 丁寧で親しみやすいトーン（「〜です」「〜ます」調）
- 出力は本文のみ（見出しや記号、箇条書きは不要）
"""


def extract_json(text):
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError("Geminiのレスポンスからスコアを読み取れませんでした")
    return json.loads(match.group())


def generate_comment(profile, scores):
    prompt = build_comment_prompt(profile, scores)
    response = generate_with_retry(contents=[prompt])
    return response.text.strip()


@app.route("/api/analyze", methods=["POST"])
def analyze():
    if not client:
        return jsonify({"error": "GEMINI_API_KEYが設定されていません（.envを確認してください）"}), 500

    profile_raw = request.form.get("profile")
    if not profile_raw:
        return jsonify({"error": "profileが送信されていません"}), 400
    profile = json.loads(profile_raw)

    photo = request.files.get("photo")

    try:
        if photo:
            image_bytes = photo.read()
            scores, comment = analyze_and_comment_with_gemini(image_bytes, photo.mimetype, profile)
        else:
            scores = rule_based_scores(profile)
            comment = generate_comment(profile, scores)
    except Exception as e:
        return jsonify({"error": f"分析中にエラーが発生しました: {str(e)}"}), 500

    radar = [
        {"key": k, "label": LABELS[k], "value": scores[k], "comment": item_comment(scores[k])}
        for k in RADAR_KEYS
    ]
    overall_score = round(sum(scores.values()) / len(scores))

    result = {
        "score": overall_score,
        "radar": radar,
        "comment": comment,
        "skinAge": compute_skin_age(profile.get("age"), scores),
        "diagnosisType": pick_diagnosis_type(scores),
        "careTips": pick_care_tips(scores),
        "careSet": pick_care_set(scores),
        "skinState": pick_skin_state(scores, profile.get("skinType", "")),
    }
    return jsonify(result)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)
