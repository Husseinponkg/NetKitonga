import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../api";
import { getStoredTenantUser, getTenantId } from "../session";

export default function QrCodePage() {
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  getStoredTenantUser();
  const tenantId = getTenantId();

  const basePortalUrl = `${window.location.origin}/portal`;
  const portalUrl = tenantId ? `${basePortalUrl}/${tenantId}` : basePortalUrl;
  const qrParams = new URLSearchParams({ portal_url: portalUrl });
  if (tenantId) qrParams.set("tenant_id", tenantId);
  const qrImageUrl = `${API_BASE_URL}/qrcode/qrcode?${qrParams}&t=${refreshKey}`;

  return (
    <main style={{ minHeight: "100vh", background: "#0f0f0f", color: "#fff", fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <span style={{ fontSize: "1.6rem" }}>📶</span>
          <h1 style={{ margin: "0", fontSize: "1.4rem", fontWeight: 700, letterSpacing: 1 }}>Wi-Fi Portal QR Code</h1>
        </div>

        {error ? (
          <div style={{ background: "rgba(229,9,20,0.12)", border: "1px solid rgba(229,9,20,0.35)", color: "#ff6b6b", padding: 14, borderRadius: 8, marginBottom: 20 }}>
            <p style={{ margin: "0 0 16px", fontSize: "0.9rem", color: "#b3b3b3" }}>{error}</p>
          </div>
        ) : (
          <div style={{ background: "#1a1a1a", border: "1px solid #262626", borderRadius: 12, padding: 24, textAlign: "center" }}>
            <p style={{ margin: "0 0 16px", fontSize: "0.9rem", color: "#b3b3b3" }}>
              Scan to connect to the <strong>noma</strong> captive portal
            </p>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <img
                src={qrImageUrl}
                alt="Wi-Fi Portal QR Code"
                style={{ maxWidth: "100%", width: 300, height: 300, borderRadius: 8, border: "1px solid #262626", objectFit: "contain" }}
                loading="lazy"
                decoding="async"
                onError={() => setError("Could not load the QR code. Please refresh and try again.")}
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
          </div>
        )}
        <div style={{ marginTop: 24, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              setError("");
              setRefreshKey((key) => key + 1);
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
            Refresh
          </button>
          <a href={tenantId ? `/portal/${tenantId}` : "/portal"} style={{
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
