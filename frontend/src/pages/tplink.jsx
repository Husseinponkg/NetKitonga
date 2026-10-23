import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL as API_ROOT } from "../api";
import { clearTenantSession, getStoredTenantUser, getTenantId } from "../session";

function Tplink() {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [deviceName, setDeviceName] = useState("");
    const [macAddress, setMacAddress] = useState("");
    const [ipAddress, setIpAddress] = useState("");
    const [nasIdentifier, setNasIdentifier] = useState("");
    const [radiusSecret, setRadiusSecret] = useState("");
    const [portalUrl, setPortalUrl] = useState("");
    const [selectedBranchId, setSelectedBranchId] = useState("");
    const [selectedRouterId, setSelectedRouterId] = useState("");

    const [deviceList, setDeviceList] = useState([]);
    const deviceListRef = useRef(deviceList);
    deviceListRef.current = deviceList;
    const [provisioningConfig, setProvisioningConfig] = useState("");
    const [uiMessage, setUiMessage] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [branches, setBranches] = useState([]);
    const [routers, setRouters] = useState([]);

    const API_BASE_URL = `${API_ROOT}/tplink`;

    const user = getStoredTenantUser();

    const logout = () => {
        clearTenantSession();
        navigate("/");
    };

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>` },
    { to: "/routers", label: "Routers", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/><path d="M7.76 7.76a6 6 0 0 0 0 8.49"/><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>` },
    { to: "/tplink", label: "TP-Link", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>` },
    { to: "/settings", label: "Settings", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/></svg>` },
  ];

    const fetchDevices = async () => {
        try {
            const tenantId = getTenantId();
            if (!tenantId) {
                setDeviceList([]);
                setLoading(false);
                return;
            }
            const response = await fetch(`${API_BASE_URL}?tenant_id=${tenantId}`);
            if (response.ok) {
                const data = await response.json();
                setDeviceList(Array.isArray(data.devices) ? data.devices : []);
            }
        } catch (error) {
            console.error("Error fetching tplink devices:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const tenantId = getTenantId();
            if (!tenantId) return;
            const response = await fetch(`${API_ROOT}/branch/all?tenant_id=${tenantId}`);
            if (response.ok) {
                const data = await response.json();
                const list = Array.isArray(data.branches) ? data.branches : [];
                setBranches(list);
                if (list.length > 0 && !selectedBranchId) setSelectedBranchId(String(list[0].id));
            }
        } catch (error) {
            console.error("Error fetching branches:", error);
        }
    };

    const fetchRouters = async () => {
        try {
            const tenantId = getTenantId();
            if (!tenantId) return;
            const response = await fetch(`${API_ROOT}/routers?tenant_id=${tenantId}`);
            if (response.ok) {
                const data = await response.json();
                const list = Array.isArray(data.routers) ? data.routers : [];
                setRouters(list);
                if (list.length > 0 && !selectedRouterId) setSelectedRouterId(String(list[0].id));
            }
        } catch (error) {
            console.error("Error fetching routers:", error);
        }
    };

    useEffect(() => {
        fetchDevices();
        fetchBranches();
        fetchRouters();
    }, []);

    useEffect(() => {
        const statusTimer = setInterval(async () => {
            const current = deviceListRef.current;
            if (!current.length) return;
            try {
                const updates = await Promise.all(
                    current.map(async (d) => {
                        try {
                            const response = await fetch(`${API_BASE_URL}/status?tplink_id=${d.id}`);
                            if (!response.ok) return null;
                            const s = await response.json();
                            return { id: d.id, status: s.status };
                        } catch (e) {
                            return null;
                        }
                    })
                );
                setDeviceList((cur) =>
                    cur.map((d) => {
                        const u = updates.find((x) => x && x.id === d.id);
                        return u ? { ...d, status: u.status } : d;
                    })
                );
            } catch (e) {
                console.error("Error checking tplink status:", e);
            }
        }, 10000);
        return () => clearInterval(statusTimer);
    }, []);

    const clearForm = () => {
        setDeviceName("");
        setMacAddress("");
        setIpAddress("");
        setNasIdentifier("");
        setRadiusSecret("");
        setPortalUrl("");
        setEditingId(null);
        setProvisioningConfig("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUiMessage("");
        setProvisioningConfig("");
        const tenantId = getTenantId();
        if (!tenantId) {
            setUiMessage("Tenant session is missing. Please login again.");
            return;
        }
        if (!selectedBranchId || !selectedRouterId) {
            setUiMessage("Please select a branch and router first.");
            return;
        }
        const data = {
            tenant_id: Number(tenantId),
            branch_id: Number(selectedBranchId),
            router_id: Number(selectedRouterId),
            device_name: deviceName,
            mac_address: macAddress,
            ip_address: ipAddress,
            nas_identifier: nasIdentifier || null,
            radius_secret: radiusSecret || null,
            portal_url: portalUrl || null,
            status: "offline",
            last_heartbeat_at: null,
        };
        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (response.ok) {
                setUiMessage("TP-Link device saved successfully");
                if (result.configuration) {
                    setProvisioningConfig(JSON.stringify(result.configuration, null, 2));
                }
                clearForm();
                fetchDevices();
            } else {
                const detail = typeof result.detail === "string" ? result.detail : JSON.stringify(result.detail || result.message || {});
                setUiMessage(`Registration failed: ${detail}`);
            }
        } catch (error) {
            setUiMessage("Could not communicate with the billing server engine.");
        }
    };

    const handleUpdate = async (id) => {
        setUiMessage("");
        const response = await fetch(`${API_BASE_URL}/update`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                tplink_id: id,
                device_name: deviceName,
                branch_id: selectedBranchId ? Number(selectedBranchId) : null,
                router_id: selectedRouterId ? Number(selectedRouterId) : null,
                mac_address: macAddress,
                ip_address: ipAddress,
                nas_identifier: nasIdentifier || null,
                radius_secret: radiusSecret || null,
                portal_url: portalUrl || null,
            }),
        });
        const result = await response.json();
        if (response.ok) {
            setUiMessage("TP-Link device updated successfully");
            clearForm();
            fetchDevices();
        } else {
            const detail = typeof result.detail === "string" ? result.detail : JSON.stringify(result.detail || result.message || {});
            setUiMessage(`Update failed: ${detail}`);
        }
    };

    const deleteDevice = async (id) => {
        if (!window.confirm("Delete this TP-Link device?")) return;
        const response = await fetch(`${API_BASE_URL}/delete`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tplink_id: id }),
        });
        if (response.ok) {
            setUiMessage("TP-Link device deleted successfully");
            fetchDevices();
        } else {
            setUiMessage("Delete failed");
        }
    };

    const startEditing = (d) => {
        setEditingId(d.id);
        setDeviceName(d.device_name || "");
        setMacAddress(d.mac_address || "");
        setIpAddress(d.ip_address || "");
        setNasIdentifier(d.nas_identifier || "");
        setRadiusSecret(d.radius_secret || "");
        setPortalUrl(d.portal_url || "");
        if (d.branch_id) setSelectedBranchId(String(d.branch_id));
        if (d.router_id) setSelectedRouterId(String(d.router_id));
    };

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "#000", color: "#fff", fontFamily: "inherit" }}>
            <aside style={{ width: 220, borderRight: "1px solid #1a1a1a", padding: 12 }}>
                <h2 style={{ fontSize: "0.9rem", textTransform: "uppercase" }}>Net Kitonga</h2>
                <nav style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
                    {navItems.map((item) => (
                        <Link key={item.to} to={item.to} style={{ color: location.pathname === item.to ? "#e50914" : "#b3b3b3", textDecoration: "none", fontSize: "0.8rem" }}>
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <button onClick={logout} style={{ marginTop: 16, width: "100%", padding: 8, background: "#e50914", border: "none", color: "#fff", cursor: "pointer" }}>Logout</button>
            </aside>
            <main style={{ flex: 1, padding: 20 }}>
                <h1 style={{ fontSize: "1.1rem", textTransform: "uppercase" }}>TP-Link <span style={{ color: "#e50914" }}>EAP225</span></h1>
                {uiMessage && <div style={{ margin: "12px 0", padding: 10, background: "#0d0d0d", border: "1px solid #1a1a1a" }}>{uiMessage}</div>}
                <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 16, marginTop: 16 }}>
                    <form onSubmit={editingId ? (e) => { e.preventDefault(); handleUpdate(editingId); } : handleSubmit} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", padding: 16, borderRadius: 6 }}>
                        <h3 style={{ marginTop: 0 }}>{editingId ? "Edit Device" : "Register Device"}</h3>
                        <div style={{ marginBottom: 10 }}>
                            <label style={{ display: "block", fontSize: "0.65rem", textTransform: "uppercase", color: "#808080" }}>Branch</label>
                            <select value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)} style={{ width: "100%", padding: 8, background: "#000", color: "#fff", border: "1px solid #1f1f1f" }}>
                                <option value="">Select branch</option>
                                {branches.map((b) => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                            </select>
                        </div>
                        <div style={{ marginBottom: 10 }}>
                            <label style={{ display: "block", fontSize: "0.65rem", textTransform: "uppercase", color: "#808080" }}>Linked Router</label>
                            <select value={selectedRouterId} onChange={(e) => setSelectedRouterId(e.target.value)} style={{ width: "100%", padding: 8, background: "#000", color: "#fff", border: "1px solid #1f1f1f" }}>
                                <option value="">Select router</option>
                                {routers.map((r) => <option key={r.id} value={r.id}>{r.router_name}</option>)}
                            </select>
                        </div>
                        <div style={{ marginBottom: 10 }}>
                            <label style={{ display: "block", fontSize: "0.65rem", textTransform: "uppercase", color: "#808080" }}>Device Name</label>
                            <input required value={deviceName} onChange={(e) => setDeviceName(e.target.value)} style={{ width: "100%", padding: 8, background: "#000", color: "#fff", border: "1px solid #1f1f1f" }} />
                        </div>
                        <div style={{ marginBottom: 10 }}>
                            <label style={{ display: "block", fontSize: "0.65rem", textTransform: "uppercase", color: "#808080" }}>MAC Address</label>
                            <input required value={macAddress} onChange={(e) => setMacAddress(e.target.value)} style={{ width: "100%", padding: 8, background: "#000", color: "#fff", border: "1px solid #1f1f1f" }} />
                        </div>
                        <div style={{ marginBottom: 10 }}>
                            <label style={{ display: "block", fontSize: "0.65rem", textTransform: "uppercase", color: "#808080" }}>IP Address</label>
                            <input required value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} style={{ width: "100%", padding: 8, background: "#000", color: "#fff", border: "1px solid #1f1f1f" }} />
                        </div>
                        <div style={{ marginBottom: 10 }}>
                            <label style={{ display: "block", fontSize: "0.65rem", textTransform: "uppercase", color: "#808080" }}>NAS ID</label>
                            <input value={nasIdentifier} onChange={(e) => setNasIdentifier(e.target.value)} style={{ width: "100%", padding: 8, background: "#000", color: "#fff", border: "1px solid #1f1f1f" }} />
                        </div>
                        <div style={{ marginBottom: 10 }}>
                            <label style={{ display: "block", fontSize: "0.65rem", textTransform: "uppercase", color: "#808080" }}>RADIUS Secret</label>
                            <input value={radiusSecret} onChange={(e) => setRadiusSecret(e.target.value)} style={{ width: "100%", padding: 8, background: "#000", color: "#fff", border: "1px solid #1f1f1f" }} />
                        </div>
                        <div style={{ marginBottom: 10 }}>
                            <label style={{ display: "block", fontSize: "0.65rem", textTransform: "uppercase", color: "#808080" }}>Portal URL</label>
                            <input value={portalUrl} onChange={(e) => setPortalUrl(e.target.value)} style={{ width: "100%", padding: 8, background: "#000", color: "#fff", border: "1px solid #1f1f1f" }} />
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button type="submit" style={{ flex: 1, padding: 10, background: "#e50914", border: "none", color: "#fff", cursor: "pointer", fontWeight: 900 }}>{editingId ? "Update" : "Register"}</button>
                            {editingId && <button type="button" onClick={clearForm} style={{ flex: 1, padding: 10, background: "transparent", border: "1px solid #333", color: "#b3b3b3", cursor: "pointer" }}>Cancel</button>}
                        </div>
                    </form>
                    <div>
                        {provisioningConfig && (
                            <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", padding: 12, marginBottom: 12, borderRadius: 6 }}>
                                <h4 style={{ margin: 0 }}>Provisioning Config</h4>
                                <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.7rem", color: "#46d369" }}>{provisioningConfig}</pre>
                            </div>
                        )}
                        {loading ? <p>Loading...</p> : deviceList.length === 0 ? <p>No TP-Link devices registered.</p> : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                                {deviceList.map((d) => (
                                    <div key={d.id} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", padding: 12, borderRadius: 6 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                            <strong>{d.device_name}</strong>
                                            <span style={{ color: d.status === "online" ? "#46d369" : "#ff5252", fontSize: "0.7rem", textTransform: "uppercase" }}>{d.status}</span>
                                        </div>
                                        <div style={{ fontSize: "0.75rem", color: "#e5e5e5" }}>
                                            <div>MAC: {d.mac_address}</div>
                                            <div>IP: {d.ip_address}</div>
                                            <div>Branch: {d.branch_name || "-"}</div>
                                            <div>Router: {d.router_name || "-"}</div>
                                            <div>NAS ID: {d.nas_identifier || "-"}</div>
                                        </div>
                                        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                                            <button onClick={() => startEditing(d)} style={{ flex: 1, padding: 8, background: "transparent", border: "1px solid #262626", color: "#b3b3b3", cursor: "pointer" }}>Edit</button>
                                            <button onClick={() => deleteDevice(d.id)} style={{ flex: 1, padding: 8, background: "rgba(229,9,20,0.08)", border: "1px solid rgba(229,9,20,0.2)", color: "#ff5252", cursor: "pointer" }}>Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Tplink;
