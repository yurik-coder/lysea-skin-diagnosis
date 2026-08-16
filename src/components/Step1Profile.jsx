import { useState } from "react";
import { COLORS } from "../colors.js";

const AGE_RANGES = ["10代", "20代前半", "20代後半", "30代前半", "30代後半", "40代", "50代以上"];
const SKIN_TYPES = ["乾燥肌", "脂性肌", "混合肌", "普通肌", "敏感肌"];
const CONCERNS = ["肌のカサつき", "シミ・くすみ", "毛穴", "ハリ不足", "赤み・ヒリつき", "ニキビ・肌荒れ"];
const SKINCARE_ITEMS = ["クレンジング", "洗顔", "化粧水", "乳液", "美容液・オイル", "クリーム", "UVケア", "その他"];

function PillGroup({ options, selected, onToggle, multi }) {
  const isActive = (opt) => (multi ? selected.includes(opt) : selected === opt);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onToggle(opt)}
          style={{
            padding: "9px 16px",
            borderRadius: "999px",
            fontSize: "14px",
            border: `1px solid ${isActive(opt) ? COLORS.sage : COLORS.border}`,
            background: isActive(opt) ? COLORS.sage : "#FFFFFF",
            color: isActive(opt) ? "#FFFFFF" : COLORS.text,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function Step1Profile({ onNext }) {
  const [age, setAge] = useState("");
  const [skinType, setSkinType] = useState("");
  const [concerns, setConcerns] = useState([]);
  const [skincareItems, setSkincareItems] = useState([]);
  const [error, setError] = useState("");

  const toggleConcern = (opt) => {
    setConcerns((prev) => (prev.includes(opt) ? prev.filter((c) => c !== opt) : [...prev, opt]));
  };
  const toggleSkincare = (opt) => {
    setSkincareItems((prev) => (prev.includes(opt) ? prev.filter((c) => c !== opt) : [...prev, opt]));
  };

  const handleNext = () => {
    if (!age || !skinType || concerns.length === 0 || skincareItems.length === 0) {
      setError("すべての項目を選択してください（肌悩み・スキンケアは1つ以上）");
      return;
    }
    setError("");
    onNext({ age, skinType, concerns, skincareItems });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        display: "flex",
        justifyContent: "center",
        padding: "48px 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "480px" }}>
        <p
          style={{
            textAlign: "center",
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "22px",
            letterSpacing: "0.15em",
            color: COLORS.text,
            marginBottom: "32px",
          }}
        >
          Lyséa
        </p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px" }}>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              style={{
                width: n === 1 ? "28px" : "20px",
                height: "3px",
                borderRadius: "2px",
                background: n === 1 ? COLORS.gold : COLORS.border,
              }}
            />
          ))}
        </div>
        <p style={{ textAlign: "center", fontSize: "12px", color: COLORS.textMuted, marginBottom: "28px", letterSpacing: "0.05em" }}>
          STEP 1 / 3　プロフィール
        </p>

        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border: `1px solid ${COLORS.border}`,
            padding: "36px 28px",
          }}
        >
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "26px",
              fontWeight: 600,
              color: COLORS.text,
              textAlign: "center",
              marginBottom: "6px",
            }}
          >
            あなたの肌について教えてください
          </h1>
          <p style={{ textAlign: "center", fontSize: "13px", color: COLORS.textMuted, marginBottom: "32px" }}>
            いくつかの質問から、AIがあなたに合うケアを診断します
          </p>

          <div style={{ marginBottom: "26px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: COLORS.text, marginBottom: "10px" }}>
              年代
            </label>
            <PillGroup options={AGE_RANGES} selected={age} onToggle={setAge} multi={false} />
          </div>

          <div style={{ marginBottom: "26px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: COLORS.text, marginBottom: "10px" }}>
              肌タイプ
            </label>
            <PillGroup options={SKIN_TYPES} selected={skinType} onToggle={setSkinType} multi={false} />
          </div>

          <div style={{ marginBottom: "26px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: COLORS.text, marginBottom: "10px" }}>
              肌悩み <span style={{ color: COLORS.textMuted, fontWeight: 400 }}>（複数選択可）</span>
            </label>
            <PillGroup options={CONCERNS} selected={concerns} onToggle={toggleConcern} multi={true} />
          </div>

          <div style={{ marginBottom: "8px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: COLORS.text, marginBottom: "10px" }}>
              現在のスキンケア <span style={{ color: COLORS.textMuted, fontWeight: 400 }}>（複数選択可）</span>
            </label>
            <PillGroup options={SKINCARE_ITEMS} selected={skincareItems} onToggle={toggleSkincare} multi={true} />
          </div>

          {error && (
            <p style={{ color: "#B3564A", fontSize: "13px", marginTop: "18px", textAlign: "center" }}>{error}</p>
          )}

          <button
            type="button"
            onClick={handleNext}
            style={{
              width: "100%",
              marginTop: "30px",
              padding: "14px",
              borderRadius: "999px",
              border: "none",
              background: COLORS.sage,
              color: "#FFFFFF",
              fontSize: "15px",
              letterSpacing: "0.05em",
              cursor: "pointer",
            }}
          >
            次へ（写真アップロード）
          </button>
        </div>
      </div>
    </div>
  );
}
