import React, { useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";
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

export default function QrCodePage() {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const user = getStoredTenantUser();
  const tenantId = getTenantId();

  const PUBLIC_PORTAL_URL = "https://netkitonga.com/portal";
  const portalUrl = tenantId ? `${PUBLIC_PORTAL_URL}/${tenantId}` : PUBLIC_PORTAL_URL;

  const generateQr = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const dataUrl = await QRCode.toDataURL(portalUrl, {
        width: 512,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
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
            <button
              onClick={() => { setError(""); setLoading(true); generateQr(); }}
              style={{ padding: "8px 16px", background: "#e50914", border: "none", color: "#fff", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}
            >
              Regenerate
            </button>
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
                onClick={() => { setError(""); setLoading(true); generateQr(); }}
                style={{ padding: "10px 18px", background: "transparent", border: "1px solid #333", color: "#ccc", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}
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
