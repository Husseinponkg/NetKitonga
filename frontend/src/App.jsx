import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { getStoredTenantUser, hasValidTenantSession, getTenantId } from "./session";
import Login from "./log";
import Register from "./reg";
import { API_BASE_URL } from "./api";
import Layout from "./components/Layout";
import Dashboard from "./pages/dashboard";
import Branch from "./pages/branch";
import Routers from "./pages/routers";
import Tplink from "./pages/tplink";
import Subscription from "./pages/subscription";
import PackagesDashboard from "./pages/packages";
import Customers from "./pages/customers";
import Payments from "./pages/payments";
import Income from "./pages/income";
import Withdrawals from "./pages/withdrawals";
import CaptivePortal from "./pages/portal";
import Sessions from "./pages/sessions";
import Settings from "./pages/settings";
import Vouchers from "./pages/vouchers";
import Admin from "./pages/admin";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import SupportDesk from "./pages/supportdesk";
import TermsAndConditions from "./pages/TermsAndConditions";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error ? this.state.error.toString() : "Unknown error";
      const stack = this.state.errorInfo?.componentStack || "No stack trace available";
      return (
        <div style={{ padding: '20px', background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: '4px', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2>Something went wrong.</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{errorMessage}{"\n"}{stack}</pre>
          <button onClick={() => window.location.href = "/"} style={{ marginTop: '16px', padding: '8px 16px', cursor: 'pointer' }}>Go to Login</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({ children }) {
  const user = getStoredTenantUser();
  console.log("[ProtectedRoute]", { path: window.location.pathname, hasUser: !!user, valid: hasValidTenantSession() });
  if (!user || !hasValidTenantSession()) {
    return <Navigate to="/" replace />;
  }
  return <Layout>{children}</Layout>;
}

async function fetchSubscriptionStatus(tenantId) {
  const response = await fetch(`${API_BASE_URL}/subscriptions/status?tenant_id=${tenantId}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Could not verify subscription status.");
  return data;
}

function SubscriptionProtectedRoute({ children }) {
  const tenantId = getTenantId();
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadStatus = async () => {
    if (!tenantId) return;
    setLoading(true);
    setError("");
    try {
      setStatus(await fetchSubscriptionStatus(tenantId));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (tenantId) {
      fetchSubscriptionStatus(tenantId)
        .then((data) => {
          if (active) setStatus(data);
        })
        .catch((requestError) => {
          if (active) setError(requestError.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [tenantId]);

  if (!tenantId || !hasValidTenantSession()) {
    return <Navigate to="/" replace />;
  }
  if (loading) {
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>Checking subscription…</div>;
  }
  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#fff", background: "#0f0f0f" }}>
        <div>
          <p role="alert">{error}</p>
          <button onClick={() => { setLoading(true); setError(""); loadStatus(); }}>Retry</button>{" "}
          <Link to="/subscription" style={{ color: "#fff" }}>Open subscription page</Link>
        </div>
      </div>
    );
  }
  if (!status?.active) return <Navigate to="/subscription" replace />;
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

function AdminRoute({ children }) {
  const adminUser = typeof window !== "undefined" ? localStorage.getItem("adminUser") : null;
  return adminUser ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/portal" element={<CaptivePortal />} />
          <Route path="/portal/:tenantId?" element={<CaptivePortal />} />
          <Route path="/dashboard" element={<SubscriptionProtectedRoute><Dashboard /></SubscriptionProtectedRoute>} />
          <Route path="/branch" element={<SubscriptionProtectedRoute><Branch /></SubscriptionProtectedRoute>} />
          <Route path="/routers" element={<SubscriptionProtectedRoute><Routers /></SubscriptionProtectedRoute>} />
          <Route path="/tplink" element={<SubscriptionProtectedRoute><Tplink /></SubscriptionProtectedRoute>} />
          <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
          <Route path="/packages" element={<SubscriptionProtectedRoute><PackagesDashboard /></SubscriptionProtectedRoute>} />
          <Route path="/vouchers" element={<SubscriptionProtectedRoute><Vouchers /></SubscriptionProtectedRoute>} />
          <Route path="/customers" element={<SubscriptionProtectedRoute><Customers /></SubscriptionProtectedRoute>} />
          <Route path="/payments" element={<SubscriptionProtectedRoute><Payments /></SubscriptionProtectedRoute>} />
          <Route path="/income" element={<SubscriptionProtectedRoute><Income /></SubscriptionProtectedRoute>} />
          <Route path="/withdrawals" element={<SubscriptionProtectedRoute><Withdrawals /></SubscriptionProtectedRoute>} />
          <Route path="/sessions" element={<SubscriptionProtectedRoute><Sessions /></SubscriptionProtectedRoute>} />
          <Route path="/settings" element={<SubscriptionProtectedRoute><Settings /></SubscriptionProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="*" element={<Login />} />
          <Route path="/support-desk" element={<SubscriptionProtectedRoute><SupportDesk /></SubscriptionProtectedRoute>} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
