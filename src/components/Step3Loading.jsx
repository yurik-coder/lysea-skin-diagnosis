import { useState, useEffect } from "react";
import { COLORS } from "../colors.js";
import { USE_DUMMY_RESPONSE, API_BASE_URL } from "../config.js";
import { DUMMY_RESULT } from "../dummyResult.js";

const MESSAGES = [
  "肌のうるおいを分析しています…",
  "透明感・くすみをチェックしています…",
  "毛穴の状態を確認しています…",
  "あなたに合うケアを考えています…",
];

// APIがどれだけ速く返ってきても、最低でもこの時間はローディング演出を見せます
const MIN_DISPLAY_MS = 3000;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchResult(profile, photoFile) {
  const formData = new FormData();
  formData.append("profile", JSON.stringify(profile));
  if (photoFile) {
    formData.append("photo", photoFile);
  }
  const res = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `サーバーエラー（${res.status}）`);
  }
  return res.json();
}

export default function Step3Loading({ profile, photoFile, onComplete }) {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes walk {
        0% { transform: translateX(0); opacity: 0; }
        6% { opacity: 1; }
        88% { transform: translateX(188px); opacity: 1; }
        96% { transform: translateX(188px); opacity: 0; }
        100% { transform: translateX(0); opacity: 0; }
      }
      @keyframes trailFill {
        0% { width: 0%; }
        92% { width: 100%; }
        100% { width: 100%; }
      }
      @keyframes hop {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-9px); }
      }
      @keyframes twinkle {
        0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); }
        50% { opacity: 1; transform: scale(1) rotate(20deg); }
      }
      @keyframes blink {
        0%, 92%, 100% { transform: scaleY(1); }
        95% { transform: scaleY(0.1); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const [msgIndex, setMsgIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [loopCount, setLoopCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMsgIndex((prev) => {
          const next = (prev + 1) % MESSAGES.length;
          if (next === 0) setLoopCount((c) => c + 1);
          return next;
        });
        setFade(true);
      }, 250);
    }, 1900);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const resultPromise = USE_DUMMY_RESPONSE
          ? Promise.resolve(DUMMY_RESULT)
          : fetchResult(profile, photoFile);

        const [result] = await Promise.all([resultPromise, wait(MIN_DISPLAY_MS)]);
        if (!cancelled) onComplete(result);
      } catch (e) {
        if (!cancelled) setError(e.message || "分析に失敗しました");
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [profile, photoFile, onComplete]);

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", justifyContent: "center", alignItems: "center", padding: "48px 16px" }}>
        <div style={{ textAlign: "center", maxWidth: "340px" }}>
          <p style={{ fontSize: "14px", color: COLORS.text, marginBottom: "8px" }}>分析中にエラーが発生しました</p>
          <p style={{ fontSize: "12.5px", color: COLORS.textMuted, marginBottom: "20px" }}>{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ padding: "10px 24px", borderRadius: "999px", border: "none", background: COLORS.dark, color: "#FFFFFF", fontSize: "13px", cursor: "pointer" }}
          >
            最初からやり直す
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "48px 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px", textAlign: "center" }}>
        <p
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: "22px",
            letterSpacing: "0.15em",
            color: COLORS.text,
            marginBottom: "48px",
          }}
        >
          Lyséa
        </p>

        <div style={{ position: "relative", width: "236px", height: "108px", margin: "0 auto 8px" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              bottom: "8px",
              width: "206px",
              height: "7px",
              borderRadius: "999px",
              background: COLORS.bgBeige,
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: "999px",
                background: COLORS.aqua,
                animation: "trailFill 3.6s ease-in-out infinite",
              }}
            />
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              bottom: "10px",
              animation: "walk 3.6s ease-in-out infinite",
            }}
          >
            <div style={{ position: "relative", animation: "hop 0.5s ease-in-out infinite" }}>
              <svg width="44" height="52" viewBox="0 0 100 116">
                <path
                  d="M50 4 C50 4 14 52 14 78 C14 99 30 112 50 112 C70 112 86 99 86 78 C86 52 50 4 50 4 Z"
                  fill={COLORS.aqua}
                />
                <ellipse cx="34" cy="60" rx="7" ry="11" fill="#FFFFFF" opacity="0.3" />
                <ellipse cx="30" cy="86" rx="6" ry="4" fill="#E7A9A0" opacity="0.55" />
                <ellipse cx="70" cy="86" rx="6" ry="4" fill="#E7A9A0" opacity="0.55" />
                <g style={{ animation: "blink 3.4s ease-in-out infinite", transformOrigin: "38px 78px" }}>
                  <ellipse cx="38" cy="78" rx="4" ry="5" fill={COLORS.text} />
                </g>
                <g style={{ animation: "blink 3.4s ease-in-out infinite", transformOrigin: "62px 78px" }}>
                  <ellipse cx="62" cy="78" rx="4" ry="5" fill={COLORS.text} />
                </g>
                <path d="M42 90 Q50 96 58 90" stroke={COLORS.text} strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </svg>
              <svg
                viewBox="0 0 24 24"
                style={{ position: "absolute", top: "-6px", right: "-10px", width: 12, height: 12, animation: "twinkle 1.2s ease-in-out infinite" }}
              >
                <path d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z" fill={COLORS.gold} />
              </svg>
            </div>
          </div>
        </div>

        <h1
          style={{
            fontFamily: "'Zen Kaku Gothic New', sans-serif",
            fontSize: "24px",
            fontWeight: 700,
            color: COLORS.text,
            marginBottom: "14px",
          }}
        >
          AIがあなたの肌状態を分析しています
        </h1>

        <p
          style={{
            fontSize: "13.5px",
            color: COLORS.pink,
            minHeight: "20px",
            opacity: fade ? 1 : 0,
            transition: "opacity 0.25s ease",
          }}
        >
          {MESSAGES[msgIndex]}
        </p>

        <p style={{ fontSize: "12px", color: COLORS.textMuted, marginTop: "28px" }}>
          {loopCount > 0 ? "もう少しで完了します。このままお待ちください" : "このまま少々お待ちください"}
        </p>
      </div>
    </div>
  );
}
