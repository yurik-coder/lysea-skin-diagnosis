// USE_DUMMY_RESPONSE = true の時に使われる、あらかじめ用意した結果データです。
// バックエンドのレスポンス形式（app.pyのresultと同じ形）に合わせています。
export const DUMMY_RESULT = {
  score: 82,
  radar: [
    { key: "hydration", label: "水分", value: 72, comment: "もう少し伸ばせそうです" },
    { key: "spots", label: "シミ", value: 78, comment: "順調です" },
    { key: "pores", label: "毛穴", value: 81, comment: "順調です" },
    { key: "firmness", label: "ハリ", value: 84, comment: "順調です" },
    { key: "transparency", label: "透明感", value: 87, comment: "かなり良好です" },
  ],
  comment:
    "総合スコアは82点と高いレベルです。特に透明感のスコアが87と高く、明るい印象を支えています。一方でお答えいただいた「肌のカサつき」の通り、水分のスコアは72とやや控えめでした。保湿ケアをもう一段階足すことで、透明感の良さがさらに引き立ちそうです。今の肌の土台は十分に整っているので、ケアを重ねるほどなりたい肌に近づけます。",
  skinAge: 27,
  diagnosisType: "透明感かがやきタイプ",
  careTips: [
    "高保湿タイプの化粧水に切り替える、または重ね付けをする",
    "週2回程度、保湿パックを取り入れる",
    "乳液の後にセラミド配合クリームでうるおいに蓋をする",
  ],
  skinState: "乾燥傾向のある混合肌",
};
