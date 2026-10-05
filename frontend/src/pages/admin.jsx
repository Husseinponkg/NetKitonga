import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";

const SECTIONS = [
    { key: "dashboard", label: "Dashboard" },
    { key: "tenants", label: "Tenants" },
    { key: "routers", label: "Routers" },
    { key: "packages", label: "Packages" },
    { key: "vouchers", label: "Vouchers" },
    { key: "payments", label: "Payments" },
    { key: "sessions", label: "Sessions" },
    { key: "logs", label: "System Logs" },
    { key: "admins", label: "Admins" },
];

function Admin() {
    const navigate = useNavigate();
    const [section, setSection] = useState("dashboard");
    const [stats, setStats] = useState({ tenants: 0, routers: 0, active_sessions: 0, payments_today: 0 });
    const [logs, setLogs] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [routers, setRouters] = useState([]);
    const [packages, setPackages] = useState([]);
    const [vouchers, setVouchers] = useState([]);
    const [payments, setPayments] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [adminUser, setAdminUser] = useState(null);
    const [newAdmin, setNewAdmin] = useState({ name: "", email: "", password: "" });

    useEffect(() => {
        if (section === "dashboard") loadDashboard();
        else if (section === "logs") loadLogs();
        else if (section === "tenants") loadTenants();
        else if (section === "routers") loadRouters();
        else if (section === "packages") loadPackages();
        else if (section === "vouchers") loadVouchers();
        else if (section === "payments") loadPayments();
        else if (section === "sessions") loadSessions();
        else if (section === "admins") loadAdmins();
    }, [section]);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const [statsRes, logsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/admin/stats`),
                fetch(`${API_BASE_URL}/admin/logs?limit=10`),
            ]);
            if (statsRes.ok) setStats(await statsRes.json());
            if (logsRes.ok) setLogs(await logsRes.json());
        } catch (err) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/logs?limit=100`);
            if (res.ok) setLogs(await res.json());
        } catch (err) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadTenants = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/tenants`);
            if (res.ok) setTenants(await res.json());
        } catch (err) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadRouters = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/routers`);
            if (res.ok) setRouters(await res.json());
        } catch (err) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadPackages = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/packages`);
            if (res.ok) setPackages(await res.json());
        } catch (err) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadVouchers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/vouchers`);
            if (res.ok) setVouchers(await res.json());
        } catch (err) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadPayments = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/payments`);
            if (res.ok) setPayments(await res.json());
        } catch (err) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadSessions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/sessions`);
            if (res.ok) setSessions(await res.json());
        } catch (err) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadAdmins = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/admins`);
            if (res.ok) setAdmins(await res.json());
        } catch (err) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("adminUser");
        navigate("/");
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        setMessage("");
        try {
            const res = await fetch(`${API_BASE_URL}/admin/admins`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newAdmin),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || data.message || "Failed to create admin");
            setMessage(data.message || "Admin created successfully");
            setNewAdmin({ name: "", email: "", password: "" });
            loadAdmins();
        } catch (err) {
            setMessage(err.message);
        }
    };

    const handleAction = async (url, options = {}) => {
        try {
            const res = await fetch(`${API_BASE_URL}${url}`, {
                method: options.method || "POST",
                headers: { "Content-Type": "application/json" },
                body: options.body ? JSON.stringify(options.body) : undefined,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || data.message || "Action failed");
            setMessage(data.message || "Success");
            if (options.refresh) options.refresh();
        } catch (err) {
            setMessage(err.message);
        }
    };

    const fmt = (n) =>
        new Intl.NumberFormat("en-TZ", { style: "currency", currency: "TZS", minimumFractionDigits: 0 }).format(n || 0);

    return (
        <div style={{ minHeight: "100vh", background: "#0f0f0f", color: "#fff", fontFamily: "'Inter', system-ui, sans-serif", display: "flex" }}>
            <style>{`
                * { box-sizing: border-box; }
                body { margin: 0; padding: 0; background: #0f0f0f; }
                .sidebar { width: 240px; background: #000; border-right: 1px solid #1a1a1a; padding: 16px 0; flex-shrink: 0; }
                .sidebar-title { font-size: 0.9rem; font-weight: 900; color: #fff; padding: 0 18px 12px; letter-spacing: 0.6px; text-transform: uppercase; }
                .nav-item { display: block; padding: 10px 18px; color: #b3b3b3; text-decoration: none; font-size: 0.8rem; font-weight: 600; cursor: pointer; border-left: 3px solid transparent; }
                .nav-item:hover, .nav-item.active { background: #141414; color: #fff; border-left-color: #e50914; }
                .main { flex: 1; padding: 20px 24px; overflow-y: auto; }
                .card { background: rgba(25,25,25,0.95); border: 1px solid #1a1a1a; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px; }
                .stat-card { background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 10px; padding: 16px; }
                .stat-label { font-size: 0.7rem; color: #808080; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
                .stat-value { font-size: 1.6rem; font-weight: 900; color: #fff; }
                table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
                th { text-align: left; padding: 10px; border-bottom: 1px solid #1a1a1a; color: rgba(255,255,255,0.5); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; }
                td { padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .btn { padding: 8px 12px; border-radius: 6px; border: 1px solid #1a1a1a; background: #e50914; color: #fff; cursor: pointer; font-weight: 700; font-size: 0.75rem; }
                .btn:hover { background: #f6121d; }
                .btn-ghost { background: transparent; color: #ff5252; border-color: rgba(255,82,82,0.3); }
                .btn-ghost:hover { background: rgba(255,82,82,0.1); border-color: #ff5252; }
                .msg { padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; font-size: 0.85rem; font-weight: 700; }
                .msg.success { background: rgba(70,211,105,0.1); border: 1px solid rgba(70,211,105,0.3); color: #46d369; }
                .msg.error { background: rgba(229,9,20,0.1); border: 1px solid rgba(229,9,20,0.3); color: #ff5252; }
                .form-input { padding: 10px 12px; border-radius: 6px; border: 1px solid #1a1a1a; background: #0d0d0d; color: #fff; font-size: 0.85rem; }
                .form-input:focus { outline: none; border-color: #e50914; }
            `}</style>

            <aside className="sidebar">
                <div className="sidebar-title">Admin Panel</div>
                <nav>
                    {SECTIONS.map((s) => (
                        <div key={s.key} className={`nav-item ${section === s.key ? "active" : ""}`} onClick={() => { setSection(s.key); setMessage(""); }}>
                            {s.label}
                        </div>
                    ))}
                </nav>
                <div style={{ marginTop: "auto", padding: "16px 18px" }}>
                    <button onClick={handleLogout} className="btn btn-ghost" style={{ width: "100%" }}>Logout</button>
                </div>
            </aside>

            <main className="main">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 900 }}>{SECTIONS.find(s => s.key === section)?.label}</h1>
                        <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>
                            {adminUser ? `Logged in as ${adminUser.email}` : "System management"}
                        </p>
                    </div>
                </div>

                {message && <div className={`msg ${message.includes("success") || message.includes("terminated") || message.includes("updated") || message.includes("deleted") ? "success" : "error"}`}>{message}</div>}

                {section === "dashboard" && (
                    <>
                        <div className="stats-grid">
                            <div className="stat-card"><div className="stat-label">Tenants</div><div className="stat-value">{stats.tenants || 0}</div></div>
                            <div className="stat-card"><div className="stat-label">Routers</div><div className="stat-value">{stats.routers || 0}</div></div>
                            <div className="stat-card"><div className="stat-label">Active Sessions</div><div className="stat-value">{stats.active_sessions || 0}</div></div>
                            <div className="stat-card"><div className="stat-label">Payments Today</div><div className="stat-value">{fmt(stats.payments_today)}</div></div>
                        </div>
                        <div className="card">
                            <h3 style={{ marginTop: 0 }}>Recent System Logs</h3>
                            {logs.length === 0 ? <p style={{ color: "rgba(255,255,255,0.4)" }}>No recent logs found.</p> : (
                                <table>
                                    <thead><tr><th>Action</th><th>Entity</th><th>Entity ID</th><th>Tenant</th><th>Created At</th></tr></thead>
                                    <tbody>
                                        {logs.slice(0, 10).map((log) => (
                                            <tr key={log.id}><td>{log.action}</td><td>{log.entity_type}</td><td>{log.entity_id ?? "-"}</td><td>{log.business_name || `Tenant ${log.tenant_id || "-"}`}</td><td>{log.created_at ? new Date(log.created_at).toLocaleString() : "-"}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}

                {section === "tenants" && (
                    <div className="card">
                        <h3 style={{ marginTop: 0 }}>All Tenants</h3>
                        {tenants.length === 0 ? <p style={{ color: "rgba(255,255,255,0.4)" }}>No tenants found.</p> : (
                            <table>
                                <thead><tr><th>ID</th><th>Business Name</th><th>System Name</th><th>Email</th><th>Created At</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {tenants.map((t) => (
                                        <tr key={t.id}><td>{t.id}</td><td>{t.business_name}</td><td>{t.system_name}</td><td>{t.email}</td><td>{new Date(t.created_at).toLocaleDateString()}</td>
                                        <td><button className="btn btn-ghost" onClick={() => handleAction(`/admin/tenants/status`, { body: { tenant_id: t.id, status: "active" } }, { refresh: loadTenants })}>Activate</button> <button className="btn btn-ghost" onClick={() => handleAction(`/admin/tenants/status`, { body: { tenant_id: t.id, status: "suspended" } }, { refresh: loadTenants })}>Suspend</button> <button className="btn btn-ghost" onClick={() => handleAction(`/admin/tenants/${t.id}`, { method: "DELETE" }, { refresh: loadTenants })}>Delete</button></td></tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {section === "routers" && (
                    <div className="card">
                        <h3 style={{ marginTop: 0 }}>All Routers</h3>
                        {routers.length === 0 ? <p style={{ color: "rgba(255,255,255,0.4)" }}>No routers found.</p> : (
                            <table>
                                <thead><tr><th>ID</th><th>Tenant</th><th>Router Name</th><th>IP Address</th><th>Status</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {routers.map((r) => (
                                        <tr key={r.id}><td>{r.id}</td><td>{r.business_name}</td><td>{r.router_name}</td><td>{r.ip_address}</td><td>{r.status}</td>
                                        <td><button className="btn btn-ghost" onClick={() => handleAction(`/admin/routers/status`, { body: { router_id: r.id, status: "online" } }, { refresh: loadRouters })}>Online</button> <button className="btn btn-ghost" onClick={() => handleAction(`/admin/routers/status`, { body: { router_id: r.id, status: "offline" } }, { refresh: loadRouters })}>Offline</button> <button className="btn btn-ghost" onClick={() => handleAction(`/admin/routers/${r.id}`, { method: "DELETE" }, { refresh: loadRouters })}>Delete</button></td></tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {section === "packages" && (
                    <div className="card">
                        <h3 style={{ marginTop: 0 }}>All Packages</h3>
                        {packages.length === 0 ? <p style={{ color: "rgba(255,255,255,0.4)" }}>No packages found.</p> : (
                            <table>
                                <thead><tr><th>ID</th><th>Tenant</th><th>Package</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {packages.map((p) => (
                                        <tr key={p.id}><td>{p.id}</td><td>{p.business_name}</td><td>{p.package_name}</td><td>{fmt(p.price)}</td><td>{p.status}</td>
                                        <td><button className="btn btn-ghost" onClick={() => handleAction(`/admin/packages/status`, { body: { package_id: p.id, status: "active" } }, { refresh: loadPackages })}>Activate</button> <button className="btn btn-ghost" onClick={() => handleAction(`/admin/packages/status`, { body: { package_id: p.id, status: "inactive" } }, { refresh: loadPackages })}>Disable</button> <button className="btn btn-ghost" onClick={() => handleAction(`/admin/packages/${p.id}`, { method: "DELETE" }, { refresh: loadPackages })}>Delete</button></td></tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {section === "vouchers" && (
                    <div className="card">
                        <h3 style={{ marginTop: 0 }}>All Vouchers</h3>
                        {vouchers.length === 0 ? <p style={{ color: "rgba(255,255,255,0.4)" }}>No vouchers found.</p> : (
                            <table>
                                <thead><tr><th>ID</th><th>Tenant</th><th>Package</th><th>Code</th><th>Status</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {vouchers.map((v) => (
                                        <tr key={v.id}><td>{v.id}</td><td>{v.business_name}</td><td>{v.package_name}</td><td>{v.code}</td><td>{v.status}</td>
                                        <td><button className="btn btn-ghost" onClick={() => handleAction(`/admin/vouchers/status`, { body: { voucher_id: v.id, status: "used" } }, { refresh: loadVouchers })}>Mark Used</button> <button className="btn btn-ghost" onClick={() => handleAction(`/admin/vouchers/${v.id}`, { method: "DELETE" }, { refresh: loadVouchers })}>Delete</button></td></tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {section === "payments" && (
                    <div className="card">
                        <h3 style={{ marginTop: 0 }}>All Payments</h3>
                        {payments.length === 0 ? <p style={{ color: "rgba(255,255,255,0.4)" }}>No payments found.</p> : (
                            <table>
                                <thead><tr><th>ID</th><th>Tenant</th><th>Amount</th><th>Gateway</th><th>Status</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {payments.map((p) => (
                                        <tr key={p.id}><td>{p.id}</td><td>{p.business_name}</td><td>{fmt(p.amount)}</td><td>{p.payment_gateway}</td><td>{p.status}</td>
                                        <td><button className="btn btn-ghost" onClick={() => handleAction(`/admin/payments/status`, { body: { payment_id: p.id, status: "completed" } }, { refresh: loadPayments })}>Complete</button> <button className="btn btn-ghost" onClick={() => handleAction(`/admin/payments/status`, { body: { payment_id: p.id, status: "failed" } }, { refresh: loadPayments })}>Fail</button></td></tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {section === "sessions" && (
                    <div className="card">
                        <h3 style={{ marginTop: 0 }}>All Sessions</h3>
                        {sessions.length === 0 ? <p style={{ color: "rgba(255,255,255,0.4)" }}>No sessions found.</p> : (
                            <table>
                                <thead><tr><th>ID</th><th>Tenant</th><th>Router</th><th>Buyer MAC</th><th>IP</th><th>Status</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {sessions.map((s) => (
                                        <tr key={s.id}><td>{s.id}</td><td>{s.business_name}</td><td>{s.router_name}</td><td>{s.buyer_mac}</td><td>{s.assigned_ip}</td><td>{s.status}</td>
                                        <td><button className="btn btn-ghost" onClick={() => handleAction(`/admin/sessions/terminate`, { body: { session_id: s.session_id } }, { refresh: loadSessions })}>Terminate</button></td></tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {section === "admins" && (
                    <div className="card">
                        <h3 style={{ marginTop: 0 }}>Admin Accounts</h3>
                        <form onSubmit={handleCreateAdmin} style={{ marginBottom: 16, display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                            <input className="form-input" placeholder="Name" value={newAdmin.name} onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })} required />
                            <input className="form-input" placeholder="Email" type="email" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} required />
                            <input className="form-input" placeholder="Password" type="password" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} required />
                            <button type="submit" className="btn">Create Admin</button>
                        </form>
                        {admins.length === 0 ? <p style={{ color: "rgba(255,255,255,0.4)" }}>No admins found.</p> : (
                            <table>
                                <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Created At</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {admins.map((a) => (
                                        <tr key={a.id}><td>{a.id}</td><td>{a.name}</td><td>{a.email}</td><td>{new Date(a.created_at).toLocaleDateString()}</td>
                                        <td><button className="btn btn-ghost" onClick={() => handleAction(`/admin/admins/${a.id}`, { method: "DELETE" }, { refresh: loadAdmins })}>Delete</button></td></tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {section === "logs" && (
                    <div className="card">
                        <h3 style={{ marginTop: 0 }}>System Logs</h3>
                        {logs.length === 0 ? <p style={{ color: "rgba(255,255,255,0.4)" }}>No logs found.</p> : (
                            <table>
                                <thead><tr><th>ID</th><th>Action</th><th>Entity</th><th>Entity ID</th><th>Tenant</th><th>Created At</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {logs.map((log) => (
                                        <tr key={log.id}><td>{log.id}</td><td>{log.action}</td><td>{log.entity_type}</td><td>{log.entity_id ?? "-"}</td><td>{log.business_name || `Tenant ${log.tenant_id || "-"}`}</td><td>{log.created_at ? new Date(log.created_at).toLocaleString() : "-"}</td>
                                        <td><button className="btn btn-ghost" onClick={() => handleAction(`/admin/logs/${log.id}`, { method: "DELETE" }, { refresh: loadLogs })}>Delete</button></td></tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

export default Admin;
