import React, { useState, useEffect, useCallback } from "react";
import { getStoredTenantUser, getTenantId } from "../session";

const WIFI_ICON = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const DOWNLOAD_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y1="3" />
  </svg>
);

const REFRESH_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 4v6h6" />
    <path d="M23 4v-6a9 9 0 0 0-9 9M4 20v6a9 9 0 0 0 9-9" />
    <path d="M20 4v6" />
    <path d="M4 20v6" />
  </svg>
);

// Tiny QR code encoder (version 1, error correction H) - no external dependencies
function getStringToBits(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i++) bytes.push(str.charCodeAt(i));
  return bytes;
}

function getBitBuffer(data) {
  const buffer = [];
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    for (let j = 7; j >= 0; j--) buffer.push((byte >> j) & 1);
  }
  return buffer;
}

function getPolynomial(degree) {
  const g = [1];
  for (let i = 0; i < degree; i++) {
    g.push(0);
    for (let j = g.length - 1; j > 0; j--) g[j] = gfMul(g[j], g[0]) ^ gfMul(g[j - 1], g[0]);
    g[0] = gfMul(g[0], g[0]);
  }
  return g;
}

const GF256 = [];
const GF256_INV = [];
function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF256[(GF256_INV[a] + GF256_INV[b]) % 255];
}
function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF256[i] = x;
    GF256_INV[x] = i;
    x = x << 1;
    if (x & 0x100) x = x ^ 0x11d;
    x &= 0xff;
  }
}
initGF();

function calculateEC(data, eccCount) {
  const gen = getPolynomial(eccCount);
  const info = data.slice();
  while (info.length >= gen.length) {
    const lead = info[0];
    if (lead !== 0) {
      const coef = GF256_INV[lead];
      for (let i = 1; i < gen.length; i++) info[i] ^= GF256[(GF256_INV[gen[i]] + coef) % 255];
    }
    info.shift();
  }
  return info.slice(info.length - gen.length + 1);
}

function generateQR(text) {
  const mode = 0x4;
  const charCount = text.length;
  const bitBuffer = [];
  bitBuffer.push(0, 0, 0, mode);
  for (let i = 7; i >= 0; i--) bitBuffer.push((charCount >> i) & 1);
  const bytes = getStringToBits(text);
  const bitData = getBitBuffer(bytes);
  for (const bit of bitData) bitBuffer.push(bit);
  while (bitBuffer.length % 8 !== 0) bitBuffer.push(0);
  const totalBytes = bitBuffer.length / 8;
  const targetBytes = Math.min(totalBytes + 3, 26);
  while (bitBuffer.length / 8 < targetBytes) {
    bitBuffer.push(0xec, 0x11, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11);
  }
  const finalBytes = Math.min(targetBytes, bitBuffer.length / 8);
  bitBuffer.length = finalBytes * 8;
  const ecCount = 17; // Version 1-H has 17 EC codewords per block
  const ec = calculateEC(bitBuffer, ecCount);
  const finalBits = [...bitBuffer, ...ec];

  const size = 21;
  const matrix = Array.from({ length: size }, () => Array(size).fill(null));

  function putFinder(x, y) {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if ((i === 0 || i === 6 || j === 0 || j === 6) || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) matrix[y + i][x + j] = 1;
        else matrix[y + i][x + j] = 0;
      }
    }
  }
  putFinder(0, 0);
  putFinder(size - 7, 0);
  putFinder(0, size - 7);

  for (let i = 0; i < 8; i++) {
    matrix[7][i] = 0;
    matrix[i][7] = 0;
    matrix[size - 1 - i][7] = 0;
    matrix[7][size - 1 - i] = 0;
  }

  for (let i = 8; i < size - 8; i++) {
    matrix[i][6] = i % 2 === 0 ? 1 : 0;
    matrix[6][i] = i % 2 === 0 ? 1 : 0;
  }

  const formatBits = [1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 0, 1];
  for (let i = 0; i < 6; i++) matrix[i][8] = formatBits[i];
  matrix[7][8] = formatBits[6];
  matrix[8][8] = formatBits[7];
  matrix[8][7] = formatBits[8];
  matrix[8][size - 7] = formatBits[9];
  for (let i = 9; i < 15; i++) matrix[8][size - 1 - (i - 9)] = formatBits[i];
  for (let i = 0; i < 6; i++) matrix[size - 1 - i][8] = formatBits[i];

  let bitIdx = 0;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (let row = 0; row < size; row++) {
      const r = (col % 2 === 0) ? size - 1 - row : row;
      if (matrix[r][col] === null && bitIdx < finalBits.length) matrix[r][col] = finalBits[bitIdx++];
      if (col > 0) {
        const r2 = (col % 2 === 0) ? row : size - 1 - row;
        if (matrix[r2][col - 1] === null && bitIdx < finalBits.length) matrix[r2][col - 1] = finalBits[bitIdx++];
      }
    }
  }

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (matrix[i][j] === null) matrix[i][j] = 0;
      if ((i + j) % 2 === 0) matrix[i][j] = matrix[i][j] ^ 1;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = size * 10;
  canvas.height = size * 10;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000000";
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (matrix[i][j] === 1) ctx.fillRect(j * 10, i * 10, 10, 10);
    }
  }
  return canvas.toDataURL("image/png");
}

export default function QrCodePage() {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [error, setError] = useState("");

  const user = getStoredTenantUser();
  const tenantId = getTenantId();

  const basePortalUrl = `${window.location.origin}/portal`;
  const portalUrl = tenantId ? `${basePortalUrl}/${tenantId}` : basePortalUrl;

  const generateQr = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const dataUrl = generateQR(portalUrl);
      setQrDataUrl(dataUrl);
    } catch (err) {
      setError(err.message || "Could not generate QR code.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [portalUrl]);

  useEffect(() => {
    generateQr();
  }, [generateQr]);

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `noma-portal-tenant-${tenantId || "general"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e8e8e8", fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          {WIFI_ICON}
          <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, letterSpacing: 0.5 }}>Wi-Fi Portal QR Code</h1>
        </div>

        {error ? (
          <div style={{ background: "rgba(229,9,20,0.12)", border: "1px solid rgba(229,9,20,0.35)", color: "#ff6b6b", padding: 14, borderRadius: 8, marginBottom: 20 }}>
            <p style={{ margin: "0 0 10", fontSize: "0.9rem", color: "#ff6b6b" }}>{error}</p>
          </div>
        ) : (
          <div style={{ background: "#121212", border: "1px solid #262626", borderRadius: 12, padding: 24, textAlign: "center" }}>
            <p style={{ margin: "0 0 20", fontSize: "0.9rem", color: "#b3b3b3" }}>
              Scan to connect to the <strong style={{ color: "#fff" }}>noma</strong> captive portal
            </p>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Wi-Fi Portal QR Code"
                  style={{ width: 320, height: 320, borderRadius: 10, border: "2px solid #e50914", objectFit: "contain", background: "#fff" }}
                />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 320, background: "#1a1a1a", borderRadius: 10, border: "1px dashed #333", color: "#666", fontSize: "0.85rem" }}>
                  Generating QR code...
                </div>
              )}
            </div>
            <p style={{ margin: "0 0 12", fontSize: "0.85rem", color: "#808080" }}>
              Portal URL:{' '}
              <code style={{ color: "#e50914", wordBreak: "break-all" }}>{portalUrl}</code>
            </p>
            {tenantId ? (
              <span style={{ display: "block", marginBottom: 12, fontSize: "0.75rem", color: "#e50914" }}>
                Tenant-specific: tenant ID {tenantId}
              </span>
            ) : null}
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button
                onClick={downloadQr}
                disabled={!qrDataUrl}
                style={{
                  padding: "10px 18px",
                  background: qrDataUrl ? "#e50914" : "#333",
                  border: "none",
                  color: "#fff",
                  borderRadius: 6,
                  cursor: qrDataUrl ? "pointer" : "not-allowed",
                  fontWeight: 600,
                }}
              >
                {DOWNLOAD_ICON} Download QR Code
              </button>
              <button
                onClick={() => {
                  setError("");
                  generateQr();
                }}
                style={{
                  padding: "10px 18px",
                  background: "transparent",
                  border: "1px solid #333",
                  color: "#ccc",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {REFRESH_ICON} Refresh
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
