import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../api";
import { getStoredTenantUser, getTenantId } from "../session";

export default function QrCodePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [portalUrl, setPortalUrl] = useState("");

  const user = getStoredTenantUser();
  const tenantId = getTenantId();

  const basePortalUrl = `${window.location.origin}/portal`;
  const effectivePortalUrl = tenantId ? `${basePortalUrl}/${tenantId}` : basePortalUrl;

  useEffect(() => {
    setPortalUrl(effectivePortalUrl);
    fetchQrCode();
  }, [tenantId, effectivePortalUrl]);

  const fetchQrCode = async () => {
    if (!portalUrl) return;
    setLoading(true);
    setError("");
    try {
      const resp = await fetch(
        `${API_BASE_URL}/qrcode/qrcode?tenant_id=${tenantId || ""}&url=${encodeURIComponent(portalUrl)}`
      );
      if (!resp.ok) {
        throw new Error(`QR generation failed (${resp.status})`);
      }
      const blob = await resp.blob();
      setQrUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err.message || "Could not generate QR code");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadQr = () => {
    if (!qrUrl) return;
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = `noma-portal-tenant-${tenantId || "general"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(qrUrl);
  };

  return (
    <main style={{ minHeight: "100vh", background: "#0f0f0f", color: "#fff", fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <span style={{ fontSize: "1.6rem" }}>📶</span>
          <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700, letterSpacing: 1 }}>Wi-Fi Portal QR Code</h1>
        </div>

        {error ? (
          <div style={{ background: "rgba(229,9,20,0.12)", border: "1px solid rgba(229,9,20,0.35)", color: "#ff6b6b", padding: 14, borderRadius: 8, marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>{error}</p>
          </div>
        ) : (
          <div style={{ background: "#1a1a1a", border: "1px solid #262626", borderRadius: 12, padding: 24, textAlign: "center" }}>
            <p style={{ margin: "0 0 16", fontSize: "0.9rem", color: "#b3b3b3" }}>
              Scan to connect to the <strong>noma</strong> captive portal
            </p>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <img
                src={qrUrl}
                alt="Wi-Fi Portal QR Code"
                style={{ maxWidth: "100%", width: 280, height: 280, borderRadius: 8, border: "1px solid #262626", objectFit: "contain" }}
                loading="lazy"
                decoding="async"
              />
            </div>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#808080" }}>
              Portal URL:{' '}
              <code style={{ color: "#ff6b6b", wordBreak: "break-all" }}>{portalUrl}</code>
            </p>
            {tenantId ? (
              <span style={{ display: "block", marginTop: 6, fontSize: "0.75rem", color: "#ff6b6b" }}>
                Tenant-specific: tenant ID {tenantId}
              </span>
            ) : null}
            <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "center" }}>
              <button
                onClick={downloadQr}
                disabled={!qrUrl}
                style={{
                  padding: "10px 18px",
                  background: "#ff6b6b",
                  border: "none",
                  color: "#fff",
                  borderRadius: 6,
                  cursor: qrUrl ? "pointer" : "not-allowed",
                  fontWeight: 600,
                }}
              >
                Download QR Code
              </button>
              <button
                onClick={() => {
                  setError("");
                  setLoading(true);
                  fetchQrCode();
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
                Regenerate
              </button>
            </div>
          </div>
        )}
        <div style={{ marginTop: 24, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              setError("");
              setLoading(true);
              fetchQrCode();
            }}
            style={{
              padding: "10px 18px",
              background: "#ff6b6b",
              border: "none",
              color: "#fff",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Regenerate
          </button>
          <a href="/portal" style={{
            padding: "10px 18px",
            background: "transparent",
            border: "1px solid #333",
            color: "#ccc",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600,
            textDecoration: "none",
          }}>
            Open Portal
          </a>
        </div>
      </div>
    </main>
  );
}
