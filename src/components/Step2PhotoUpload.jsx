import { useState, useRef } from "react";
import { COLORS } from "../colors.js";

export default function Step2PhotoUpload({ onNext }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f || !f.type.startsWith("image/")) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
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
      <div className="app-shell" style={{ width: "100%", maxWidth: "480px" }}>
        <p
          style={{
            textAlign: "center",
            fontFamily: "'Montserrat', sans-serif",
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
                width: n <= 2 ? "28px" : "20px",
                height: "3px",
                borderRadius: "2px",
                background: n <= 2 ? COLORS.gold : COLORS.border,
              }}
            />
          ))}
        </div>
        <p style={{ textAlign: "center", fontSize: "12px", color: COLORS.textMuted, marginBottom: "28px", letterSpacing: "0.05em" }}>
          STEP 2 / 3　写真アップロード
        </p>

        <div
          className="step-card"
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border: `1px solid ${COLORS.border}`,
            padding: "36px 28px",
          }}
        >
          <h1
            style={{
              fontFamily: "'Zen Kaku Gothic New', sans-serif",
              fontSize: "26px",
              fontWeight: 700,
              color: COLORS.text,
              textAlign: "center",
              marginBottom: "6px",
            }}
          >
            お顔の写真はありますか？
          </h1>
          <p style={{ textAlign: "center", fontSize: "13px", color: COLORS.textMuted, marginBottom: "8px" }}>
            任意です。スキップしても診断できます
          </p>
          <p
            style={{
              textAlign: "center",
              fontSize: "12.5px",
              color: COLORS.pink,
              background: COLORS.pinkLight,
              borderRadius: "8px",
              padding: "8px 12px",
              marginBottom: "26px",
            }}
          >
            画像を追加すると、肌状態の分析精度が向上します
          </p>

          {!preview ? (
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: `1.5px dashed ${dragOver ? COLORS.pink : COLORS.border}`,
                borderRadius: "12px",
                padding: "40px 20px",
                textAlign: "center",
                cursor: "pointer",
                background: dragOver ? COLORS.pinkLight : "#FCFAF6",
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: COLORS.pinkLight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                  fontSize: "22px",
                  color: COLORS.pink,
                }}
              >
                ＋
              </div>
              <p style={{ fontSize: "14px", color: COLORS.text, marginBottom: "4px" }}>タップして写真を選択</p>
              <p style={{ fontSize: "12px", color: COLORS.textMuted }}>またはドラッグ＆ドロップ</p>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e.target.files?.[0])}
                style={{ display: "none" }}
              />
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <img
                src={preview}
                alt="アップロードした写真のプレビュー"
                style={{
                  width: "180px",
                  height: "180px",
                  objectFit: "cover",
                  borderRadius: "12px",
                  border: `1px solid ${COLORS.border}`,
                  marginBottom: "12px",
                }}
              />
              <p style={{ fontSize: "12.5px", color: COLORS.textMuted, marginBottom: "12px" }}>{file?.name}</p>
              <button
                type="button"
                onClick={handleRemove}
                style={{
                  fontSize: "12.5px",
                  color: COLORS.pink,
                  background: "none",
                  border: "none",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                写真を変更する
              </button>
            </div>
          )}

          <div
            style={{
              marginTop: "18px",
              padding: "14px 16px",
              background: "#FCFAF6",
              border: `1px solid ${COLORS.border}`,
              borderRadius: "10px",
            }}
          >
            <p style={{ fontSize: "12px", fontWeight: 500, color: COLORS.text, marginBottom: "8px" }}>
              正確に診断するために
            </p>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: COLORS.textMuted, lineHeight: 1.9 }}>
              <li>ノーメイクの状態で撮影してください</li>
              <li>明るい場所で、正面から撮影してください</li>
              <li>メガネ・マスクは外してください</li>
              <li>前髪で顔が隠れないようにしてください</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => onNext(file)}
            style={{
              width: "100%",
              marginTop: "28px",
              padding: "14px",
              borderRadius: "999px",
              border: "none",
              background: COLORS.dark,
              color: "#FFFFFF",
              fontSize: "15px",
              letterSpacing: "0.05em",
              cursor: "pointer",
            }}
          >
            {preview ? "この写真で診断する" : "スキップして次へ"}
          </button>
        </div>
      </div>
    </div>
  );
}
