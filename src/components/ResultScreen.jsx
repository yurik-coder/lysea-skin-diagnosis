import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Droplet, Sparkles, Sun, ShieldCheck, Download, ChevronRight, Sprout, CheckCircle2 } from "lucide-react";
import { COLORS } from "../colors.js";

// 商品セットはカタログ連携前の仮データです（次のステップで差し替え予定）
const PRODUCTS = [
  { name: "ブライトニング美容液", icon: Sparkles },
  { name: "セラミドクリーム", icon: Droplet },
  { name: "UVケア", icon: Sun },
];

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
          <text key={`v-${i}`} x={x} y={y + 14} textAnchor="middle" fontSize="11" fill={COLORS.gold} fontWeight="600">
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
        <circle cx="84" cy="84" r={r} fill="none" stroke={COLORS.sageLight} strokeWidth="12" />
        <circle
          cx="84"
          cy="84"
          r={r}
          fill="none"
          stroke={COLORS.gold}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 84 84)"
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "42px", fontWeight: 600, color: COLORS.text, lineHeight: 1 }}>
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
          style={{ padding: "12px 28px", borderRadius: "999px", border: "none", background: COLORS.sage, color: "#FFFFFF", fontSize: "14px", cursor: "pointer" }}
        >
          診断をはじめる
        </button>
      </div>
    );
  }

  const { score, radar, comment, skinAge, diagnosisType, careTips, skinState } = result;
  const reportRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    try {
      // 画面のHTMLを画像として撮影する（scale:2で高解像度に）
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: COLORS.bg,
        // no-printクラスがついた要素（PDF保存ボタン自身など）は撮影に含めない
        ignoreElements: (el) => el.classList?.contains("no-print"),
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // 画像の縦幅がA4の1ページに収まらない場合は、複数ページに分割して貼り付ける
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
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
      <div ref={reportRef} style={{ width: "100%", maxWidth: "480px" }}>
        <p style={{ textAlign: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", letterSpacing: "0.15em", color: COLORS.text, marginBottom: "2px" }}>
          Lyséa
        </p>
        <p style={{ textAlign: "center", fontSize: "11px", letterSpacing: "0.12em", color: COLORS.gold, marginBottom: "28px" }}>
          AI SKIN REPORT
        </p>

        <div style={{ background: "#FFFFFF", borderRadius: "24px", border: `1px solid ${COLORS.border}`, padding: "32px 24px 26px", textAlign: "center", marginBottom: "16px", position: "relative", overflow: "hidden" }}>
          <Sparkles size={16} color={COLORS.gold} style={{ position: "absolute", top: 18, left: 20 }} />
          <Sparkles size={12} color={COLORS.coral} style={{ position: "absolute", top: 30, right: 26 }} />
          <p style={{ fontSize: "13px", color: COLORS.textMuted, marginBottom: "14px" }}>あなたの美容スコア</p>
          <ScoreRing score={score} />

          <div style={{ marginTop: "18px", marginBottom: "4px" }}>
            <span style={{ fontSize: "10.5px", color: COLORS.textMuted, marginRight: "6px" }}>肌タイプ：</span>
            <span style={{ display: "inline-block", padding: "5px 14px", background: COLORS.sageLight, borderRadius: "999px", fontSize: "12.5px", color: COLORS.text }}>
              {skinState}
            </span>
          </div>
          <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: `1px dashed ${COLORS.border}` }}>
            <p style={{ fontSize: "11.5px", color: COLORS.textMuted, marginBottom: "6px" }}>あなたの診断タイプは</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <Sparkles size={16} color={COLORS.coral} />
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "25px", fontWeight: 600, color: COLORS.coral }}>{diagnosisType}</p>
              <Sparkles size={16} color={COLORS.coral} />
            </div>
          </div>
        </div>

        <div style={{ background: COLORS.sageLight, borderRadius: "18px", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "20px" }}>
          <Sprout size={18} color={COLORS.sage} />
          <span style={{ fontSize: "13.5px", color: COLORS.text }}>あなたの推定肌年齢は</span>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontWeight: 600, color: COLORS.sage }}>{skinAge}歳</span>
          <span style={{ fontSize: "13.5px", color: COLORS.text }}>です</span>
        </div>

        <div style={{ background: "#FFFFFF", borderRadius: "24px", border: `1px solid ${COLORS.border}`, padding: "26px 12px 16px", marginBottom: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "18px", fontWeight: 600, color: COLORS.text, marginBottom: "8px" }}>
            肌状態レーダー
          </p>
          <RadarChart items={radar} />
          <div style={{ width: "100%", marginTop: "18px", display: "flex", flexDirection: "column", gap: "9px" }}>
            {radar.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px" }}>
                <span style={{ width: "48px", color: COLORS.text, fontWeight: 500, flexShrink: 0 }}>{item.label}</span>
                <span style={{ width: "26px", color: COLORS.gold, fontWeight: 600, flexShrink: 0 }}>{item.value}</span>
                <span style={{ color: COLORS.textMuted }}>{item.comment}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "18px", alignItems: "flex-start" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: COLORS.aqua, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
            <Droplet size={18} color="#FFFFFF" fill="#FFFFFF" fillOpacity={0.25} />
          </div>
          <div style={{ background: "#FFFFFF", border: `1px solid ${COLORS.border}`, borderRadius: "4px 18px 18px 18px", padding: "18px 18px", fontSize: "13.5px", lineHeight: 1.9, color: COLORS.text, flex: 1 }}>
            {comment}
          </div>
        </div>

        <div style={{ background: COLORS.blush, borderRadius: "20px", padding: "18px 20px", marginBottom: "20px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: COLORS.text, marginBottom: "10px" }}>おすすめのお手入れ</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
            {careTips.map((tip, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <CheckCircle2 size={15} color={COLORS.coral} style={{ flexShrink: 0, marginTop: "1.5px" }} />
                <span style={{ fontSize: "13px", color: COLORS.text, lineHeight: 1.6 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#FFFFFF", borderRadius: "24px", border: `1px solid ${COLORS.border}`, padding: "22px 20px 20px", marginBottom: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: COLORS.blush, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={14} color={COLORS.coral} />
            </div>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "19px", fontWeight: 600, color: COLORS.text }}>透明感ケアセット</p>
          </div>

          {PRODUCTS.map((p, i) => {
            const Icon = p.icon;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 4px", borderTop: i > 0 ? `1px solid ${COLORS.border}` : "none" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: COLORS.sageLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={18} color={COLORS.sage} />
                </div>
                <span style={{ fontSize: "13.5px", color: COLORS.text, flex: 1 }}>{p.name}</span>
                <ChevronRight size={16} color={COLORS.textMuted} />
              </div>
            );
          })}

          <button type="button" style={{ width: "100%", marginTop: "16px", padding: "13px", borderRadius: "999px", border: "none", background: COLORS.sage, color: "#FFFFFF", fontSize: "14px", letterSpacing: "0.03em", cursor: "pointer" }}>
            商品を見る
          </button>
        </div>

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
