import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Droplet, Sparkles, Sun, ShieldCheck, Download, ChevronRight, CheckCircle2, RotateCcw, Gem } from "lucide-react";
import { COLORS } from "../colors.js";
import { EC_SITE_URL } from "../config.js";

// 商品セットのジャンル（concern）ごとに、意味の合ったアイコンを割り当てます
const CONCERN_ICON = {
  "乾燥・保湿ケア": Droplet,
  "シミ・美白ケア": Sun,
  "毛穴・角質ケア": ShieldCheck,
  "エイジング（ハリ・弾力）": Sparkles,
  "透明感・くすみ": Gem,
};

function RadarChart({ items }) {
  const size = 260;
  const center = size / 2;
  const maxR = 92;
  const n = items.length;
  const angleFor = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const point = (i, r) => {
    const a = angleFor(i);
    return [center + r * Math.cos(a), center + r * Math.sin(a)];
  };

  const ringPath = (frac) => items.map((_, i) => point(i, maxR * frac).join(",")).join(" ");
  const dataPath = items.map((item, i) => point(i, (item.value / 100) * maxR).join(",")).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={ringPath(f)} fill="none" stroke={COLORS.border} strokeWidth="1" />
      ))}
      {items.map((_, i) => {
        const [x, y] = point(i, maxR);
        return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke={COLORS.border} strokeWidth="1" />;
      })}
      <polygon points={dataPath} fill={COLORS.aqua} fillOpacity="0.35" stroke={COLORS.aqua} strokeWidth="2" strokeLinejoin="round" />
      {items.map((item, i) => {
        const [x, y] = point(i, (item.value / 100) * maxR);
        return <circle key={i} cx={x} cy={y} r="3.5" fill={COLORS.aqua} />;
      })}
      {items.map((item, i) => {
        const [x, y] = point(i, maxR + 24);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="12.5" fill={COLORS.text}>
            {item.label}
          </text>
        );
      })}
      {items.map((item, i) => {
        const [x, y] = point(i, maxR + 24);
        return (
          <text key={`v-${i}`} x={x} y={y + 14} textAnchor="middle" fontSize="11" fill={COLORS.wine} fontWeight="600">
            {item.value}
          </text>
        );
      })}
    </svg>
  );
}

function ScoreRing({ score }) {
  const r = 70;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  return (
    <div style={{ position: "relative", width: 168, height: 168, margin: "0 auto" }}>
      <svg width="168" height="168" viewBox="0 0 168 168">
        <circle cx="84" cy="84" r={r} fill="none" stroke={COLORS.pinkLight} strokeWidth="12" />
        <circle
          cx="84"
          cy="84"
          r={r}
          fill="none"
          stroke={COLORS.aqua}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 84 84)"
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "42px", fontWeight: 600, color: COLORS.text, lineHeight: 1 }}>
          {score}
        </span>
        <span style={{ fontSize: "12px", color: COLORS.textMuted }}>/ 100</span>
      </div>
    </div>
  );
}

export default function ResultScreen({ result, onRestart }) {
  // resultがまだない場合（直接この画面が開かれた場合など）の保険
  if (!result) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <button
          type="button"
          onClick={onRestart}
          style={{ padding: "12px 28px", borderRadius: "999px", border: "none", background: COLORS.dark, color: "#FFFFFF", fontSize: "14px", cursor: "pointer" }}
        >
          診断をはじめる
        </button>
      </div>
    );
  }

  const { score, radar, comment, skinAge, diagnosisType, careTips, careSet } = result;
  const reportRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    try {
      // カード（.pdf-card）ごとに個別に撮影し、ページの残りスペースに
      // 収まるかを確認しながら配置する。文章やカードの途中でページが
      // 切り替わらないようにするための仕組み。
      const cards = Array.from(reportRef.current.querySelectorAll(".pdf-card"));

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // 左右・上下の余白（mm）
      const gap = 5; // カード同士の間隔（mm）
      const imgWidth = pageWidth - margin * 2;

      let cursorY = margin;

      for (const card of cards) {
        const canvas = await html2canvas(card, {
          scale: 2,
          backgroundColor: COLORS.bg,
        });
        const imgData = canvas.toDataURL("image/png");
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // すでに何か配置済みのページで、このカードが残りスペースに
        // 収まらない場合だけ、次のページへ送る
        if (cursorY > margin && cursorY + imgHeight > pageHeight - margin) {
          pdf.addPage();
          cursorY = margin;
        }

        pdf.addImage(imgData, "PNG", margin, cursorY, imgWidth, imgHeight);
        cursorY += imgHeight + gap;
      }

      pdf.save("Lysea_AI_Skin_Report.pdf");
    } catch (e) {
      alert("PDFの生成に失敗しました。もう一度お試しください。");
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", justifyContent: "center", padding: "44px 16px 60px" }}>
      <div ref={reportRef} className="result-shell" style={{ width: "100%", maxWidth: "480px" }}>
        <div className="pdf-card">
        <p style={{ textAlign: "center", fontFamily: "'Montserrat', sans-serif", fontSize: "20px", letterSpacing: "0.15em", color: COLORS.text, marginBottom: "2px" }}>
          Lyséa
        </p>
        <p style={{ textAlign: "center", fontSize: "11px", letterSpacing: "0.12em", color: COLORS.gold, marginBottom: "0px" }}>
          AI SKIN REPORT
        </p>
        </div>

        <div className="result-two-col">
        <div>
        <div className="pdf-card" style={{ background: "#FFFFFF", borderRadius: "24px", border: `1px solid ${COLORS.border}`, padding: "32px 24px 26px", textAlign: "center", marginBottom: "20px", position: "relative", overflow: "hidden" }}>
          <Sparkles size={16} color={COLORS.gold} style={{ position: "absolute", top: 18, left: 20 }} />
          <Sparkles size={12} color={COLORS.bronze} style={{ position: "absolute", top: 30, right: 26 }} />
          <p style={{ fontSize: "13px", color: COLORS.textMuted, marginBottom: "14px" }}>あなたの美容スコア</p>
          <ScoreRing score={score} />

          <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: `1px dashed ${COLORS.border}` }}>
            <p style={{ fontSize: "11.5px", color: COLORS.textMuted, marginBottom: "2px" }}>あなたの診断タイプは</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <Sparkles size={16} color={COLORS.emerald} />
              <p style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: "25px", fontWeight: 700, color: COLORS.emerald, margin: 0 }}>{diagnosisType}</p>
              <Sparkles size={16} color={COLORS.emerald} />
            </div>
            <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: `1px dashed ${COLORS.border}` }}>
              <p style={{ fontSize: "11.5px", color: COLORS.textMuted, marginBottom: "2px" }}>あなたの推定肌年齢</p>
              <p style={{ margin: 0 }}>
                <span style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: "34px", fontWeight: 700, color: COLORS.wine }}>{skinAge}</span>
                <span style={{ fontSize: "15px", color: COLORS.wine, fontWeight: 700 }}>歳</span>
              </p>
            </div>
          </div>
        </div>

        <div className="pdf-card" style={{ background: "#FFFFFF", borderRadius: "24px", border: `1px solid ${COLORS.border}`, padding: "26px 12px 16px", marginBottom: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <p style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: "18px", fontWeight: 700, color: COLORS.text, marginBottom: "8px" }}>
            肌状態レーダー
          </p>
          <RadarChart items={radar} />
          <div style={{ width: "100%", marginTop: "18px", display: "flex", flexDirection: "column", gap: "9px" }}>
            {radar.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px" }}>
                <span style={{ width: "48px", color: COLORS.text, fontWeight: 500, flexShrink: 0 }}>{item.label}</span>
                <span style={{ width: "26px", color: COLORS.wine, fontWeight: 600, flexShrink: 0 }}>{item.value}</span>
                <span style={{ color: COLORS.textMuted }}>{item.comment}</span>
              </div>
            ))}
          </div>
        </div>
        </div>

        <div>
        <div className="pdf-card" style={{ background: "#FFFFFF", borderRadius: "24px", border: `1px solid ${COLORS.border}`, padding: "22px 20px", marginBottom: "20px" }}>
          <p style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: "18px", fontWeight: 700, color: COLORS.text, marginBottom: "14px" }}>
            AI総合診断コメント
          </p>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: COLORS.aqua, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
              <Droplet size={18} color="#FFFFFF" fill="#FFFFFF" fillOpacity={0.25} />
            </div>
            <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "4px 18px 18px 18px", padding: "16px 16px", fontSize: "13.5px", lineHeight: 1.9, color: COLORS.text, flex: 1 }}>
              {comment}
            </div>
          </div>
        </div>

        <div className="pdf-card" style={{ background: COLORS.greenLight, borderRadius: "20px", padding: "18px 20px", marginBottom: "20px" }}>
          <p style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: "18px", fontWeight: 700, color: COLORS.text, marginBottom: "14px" }}>
            おすすめのお手入れ
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
            {careTips.map((tip, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <CheckCircle2 size={15} color={COLORS.green} style={{ flexShrink: 0, marginTop: "1.5px" }} />
                <span style={{ fontSize: "13px", color: COLORS.text, lineHeight: 1.6 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pdf-card" style={{ background: "#FFFFFF", borderRadius: "24px", border: `1px solid ${COLORS.border}`, padding: "22px 20px 20px", marginBottom: "18px" }}>
          <p style={{ fontSize: "11px", color: COLORS.textMuted, marginBottom: "4px" }}>あなたにおすすめの商品</p>
          <p style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: "19px", fontWeight: 700, color: COLORS.text, marginBottom: "16px" }}>{careSet.title}</p>

          {careSet.products.map((p, i) => {
            const itemUrl = EC_SITE_URL ? `${EC_SITE_URL}/?item=${p.id}` : null;
            const RowTag = itemUrl ? "a" : "div";
            const ProductIcon = CONCERN_ICON[careSet.concern] || Droplet;
            return (
              <RowTag
                key={i}
                {...(itemUrl ? { href: itemUrl, target: "_blank", rel: "noopener noreferrer" } : {})}
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 4px", borderTop: i > 0 ? `1px solid ${COLORS.border}` : "none", textDecoration: "none", cursor: itemUrl ? "pointer" : "default" }}
              >
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: COLORS.terracottaLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ProductIcon size={18} color={COLORS.terracotta} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "13.5px", color: COLORS.text, marginBottom: "2px" }}>{p.name}</p>
                  <p style={{ fontSize: "11.5px", color: COLORS.textMuted }}>{p.price}</p>
                </div>
                <ChevronRight size={16} color={COLORS.textMuted} />
              </RowTag>
            );
          })}

          <a
            href={EC_SITE_URL ? `${EC_SITE_URL}/?concern=${encodeURIComponent(careSet.concern)}` : undefined}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              textAlign: "center",
              width: "100%",
              marginTop: "16px",
              padding: "13px",
              borderRadius: "999px",
              border: "none",
              background: EC_SITE_URL ? COLORS.dark : "#EDE7E3",
              color: EC_SITE_URL ? "#FFFFFF" : COLORS.textMuted,
              fontSize: "14px",
              letterSpacing: "0.03em",
              textDecoration: "none",
              pointerEvents: EC_SITE_URL ? "auto" : "none",
            }}
          >
            商品を見る
          </a>
        </div>
        </div>
        </div>

        <button
          type="button"
          className="no-print"
          onClick={onRestart}
          style={{ width: "100%", marginTop: "24px", marginBottom: "12px", padding: "13px", borderRadius: "999px", border: `1px solid ${COLORS.border}`, background: "#FFFFFF", color: COLORS.text, fontSize: "13.5px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer" }}
        >
          <RotateCcw size={15} />
          もう一度診断する
        </button>

        <button
          type="button"
          className="no-print"
          onClick={handleDownloadPdf}
          disabled={isGenerating}
          style={{ width: "100%", padding: "13px", borderRadius: "999px", border: `1px solid ${COLORS.gold}`, background: "transparent", color: COLORS.gold, fontSize: "13.5px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: isGenerating ? "default" : "pointer", opacity: isGenerating ? 0.6 : 1 }}
        >
          <Download size={15} />
          {isGenerating ? "PDFを作成しています…" : "診断結果をPDFで保存"}
        </button>
      </div>
    </div>
  );
}
