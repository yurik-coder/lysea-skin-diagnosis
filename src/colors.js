// ECサイト（Lyséa本体）のCSS変数（:root）をベースに、
// メリハリをつけるための強調色（wine）と濃色（dark）を追加しています。
export const COLORS = {
  bg: "#fdf8f7", // --bg-base
  bgWhite: "#ffffff", // --bg-white
  bgBeige: "#f7efec", // --bg-beige
  bgCard: "#f7f6f4", // --bg-card
  pink: "#C49A9A", // --accent-pink（バッジ・チャート等の穏やかな装飾用）
  pinkLight: "#f2e6e6",
  gold: "#C5A059", // --accent-gold（STEP進捗バーなど控えめな箇所のみ）
  bronze: "#C49A87", // --accent-bronze（診断タイプ名）
  wine: "#A8536B", // NEW: スコア・数値など「目立たせたい」要素専用の濃いめアクセント
  dark: "#3f3532", // NEW: ボタンなど強いコントラストが欲しい要素用（--footer-bgと同色）
  aqua: "#7EC1D6", // ローディング画面のしずくキャラクター専用（水色）
  aquaLight: "#E4F1F5", // 水色の淡色版（レーダーチャート・美容スコア周辺のみ）
  emerald: "#4C9A8C", // 診断タイプ名専用
  green: "#6FA287", // おすすめのお手入れ（チェックマーク）専用
  greenLight: "#EAF3EE", // おすすめのお手入れの背景
  terracotta: "#D98B6B", // 商品アイコン専用
  terracottaLight: "#FBE9E1", // 商品アイコンの背景
  border: "#E2DBD4",
  text: "#534541",
  textMuted: "#78716c",
  footerBg: "#3f3532",
  footerText: "#e8e2dc",
};
