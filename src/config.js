// 発表当日、通信が不安定な場合の保険用スイッチです。
// true にすると、実際のAPIを呼ばずダミーデータを返します（dummyResult.js参照）。
export const USE_DUMMY_RESPONSE = false;

export const API_BASE_URL = "https://lysea-skin-diagnosis-api.onrender.com";

// ECサイト（Lyséa本体）のURL。商品詳細への導線に使います。
// 例: "https://yurik-coder.github.io/lysea-ec"
// 末尾にスラッシュは付けないでください。
export const EC_SITE_URL = "https://yurik-coder.github.io/lysea-beaute";
