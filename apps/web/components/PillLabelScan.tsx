// apps/web/src/components/PillLabelScan.tsx

"use client";

import { useState } from "react";
import Tesseract from "tesseract.js";
import { parsePillLabel, ParsedPillLabel } from "@/lib/api";

interface PillLabelScanProps {
  onApply: (parsed: ParsedPillLabel) => void;
}

export default function PillLabelScan({ onApply }: PillLabelScanProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedPillLabel | null>(null);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsScanning(true);
    setProgress(0);
    setRawText(null);
    setParsed(null);

    try {
      // 1) Preprocess image → canvas
    const canvas = await preprocessImage(file);

    // 2) Tesseract OCR on the preprocessed canvas
    const { data } = await Tesseract.recognize(canvas, "eng", {
      logger: (m: { status: string; progress: number | null; }) => {
        if (m.status === "recognizing text" && m.progress != null) {
          setProgress(Math.round(m.progress * 100));
        }
      },
      // Optional configs:
      tessedit_char_whitelist:
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-/., mgMG",
      // You can also experiment with different psm (page segmentation mode)
      // 6 = Assume a single uniform block of text
      // 4 = Assume a single column
      // psm: 6,
    } as any);

    const text = data.text || "";
    setRawText(text);

    const result = await parsePillLabel(text);
    setParsed(result);
  } catch (err: any) {
    console.error("Pill label scan error:", err);
    setError(
      err?.message
        ? `Scan error: ${err.message}`
        : "We couldn't read this image. Please try another photo."
    );
  } finally {
    setIsScanning(false);
    e.target.value = "";
  }
  };

  const confidencePercent = parsed?.confidence != null
    ? Math.round(parsed.confidence * 100)
    : null;

  const handleApplyClick = () => {
    if (parsed) {
      onApply(parsed);
    }
  };

  async function preprocessImage(file: File): Promise<HTMLCanvasElement> {
  const img = new Image();
  img.src = URL.createObjectURL(file);

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (e) => reject(e);
  });

  const maxWidth = 1200; // or 1000–1500
  const scale = img.width > maxWidth ? maxWidth / img.width : 1;
  const width = img.width * scale;
  const height = img.height * scale;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Draw scaled image
  ctx.drawImage(img, 0, 0, width, height);

  // Get pixel data and convert to grayscale + simple contrast bump
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // contrast factor: 0 = none, 1 = strong
  const contrast = 0.3;
  const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // grayscale
    let gray = 0.299 * r + 0.587 * g + 0.114 * b;

    // contrast
    gray = factor * (gray - 128) + 128;
    gray = Math.max(0, Math.min(255, gray));

    data[i] = data[i + 1] = data[i + 2] = gray;
  }

  ctx.putImageData(imageData, 0, 0);

  return canvas;
}


  return (
    <div className="mt-4 p-4 bg-[#0B1127]/80 border border-cyan-400/30 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-cyan-100 font-[family-name:var(--font-space-grotesk)]">
            Scan from pill bottle
          </h3>
          <p className="text-xs text-cyan-300/70">
            Upload a clear photo of your prescription label to auto-fill
            medication details. You can review and edit before saving.
          </p>
        </div>
        <label className="inline-flex items-center px-3 py-2 rounded-md bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-xs font-semibold cursor-pointer hover:from-cyan-400 hover:to-teal-400 transition-all duration-200">
          {isScanning ? "Scanning..." : "Upload photo"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isScanning}
          />
        </label>
      </div>

      {isScanning && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-cyan-200 mb-1">
            <span>Reading label...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-cyan-900/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-400">
          {error}
        </p>
      )}

      {/* Suggested fields card */}
      {parsed && (
        <div className="mt-4 p-3 rounded-lg border border-cyan-400/40 bg-[#020617]/60">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-cyan-100 uppercase tracking-wide">
              Suggested details
            </h4>
            {confidencePercent != null && (
              <span className="text-[10px] text-cyan-300/80">
                Confidence: {confidencePercent}%
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-cyan-100">
            <div>
              <span className="text-cyan-300/70">Medication name</span>
              <div className="mt-1 text-sm font-medium">
                {parsed.drugName || <span className="text-cyan-500/60">Not detected</span>}
              </div>
            </div>
            <div>
              <span className="text-cyan-300/70">Strength</span>
              <div className="mt-1 text-sm font-medium">
                {parsed.strength || <span className="text-cyan-500/60">Not detected</span>}
              </div>
            </div>
            <div className="md:col-span-2">
              <span className="text-cyan-300/70">Directions (summary)</span>
              <div className="mt-1 text-xs">
                {parsed.directionsSummary || (
                  <span className="text-cyan-500/60">No directions extracted</span>
                )}
              </div>
            </div>
            {parsed.rawSig && (
              <div className="md:col-span-2">
                <span className="text-cyan-300/70">Label text</span>
                <div className="mt-1 text-[11px] font-mono text-cyan-200/90">
                  {parsed.rawSig}
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleApplyClick}
              className="px-3 py-2 rounded-md bg-gradient-to-r from-cyan-500 to-teal-500 text-xs font-semibold text-white hover:from-cyan-400 hover:to-teal-400 transition-all duration-200 disabled:opacity-60"
              disabled={!parsed.drugName && !parsed.strength && !parsed.directionsSummary}
            >
              Apply to form
            </button>
            <button
              type="button"
              onClick={() => {
                setParsed(null);
                setRawText(null);
                setError(null);
              }}
              className="text-[11px] text-cyan-300/70 hover:text-cyan-100 underline underline-offset-2"
            >
              Clear suggestion
            </button>
          </div>
        </div>
      )}

      {rawText && (
        <details className="mt-3 text-xs text-cyan-300/70">
          <summary className="cursor-pointer text-cyan-200">
            View raw OCR text
          </summary>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap bg-[#020617]/60 p-2 rounded border border-cyan-400/20">
            {rawText}
          </pre>
        </details>
      )}

      <p className="mt-3 text-[10px] text-cyan-300/50">
        ⚕️ This feature is for convenience only. Always follow the
        instructions provided by your pharmacy and healthcare team.
      </p>
    </div>
  );
}
