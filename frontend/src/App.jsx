import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./log";
import Register from "./reg";
import Layout from "./components/Layout";
import Dashboard from "./pages/dashboard";
import Branch from "./pages/branch";
import Routers from "./pages/routers";
import PackagesDashboard from "./pages/packages";
import Customers from "./pages/customers";
import Payments from "./pages/payments";
import Income from "./pages/income";
import Withdrawals from "./pages/withdrawals";
import CaptivePortal from "./pages/portal";
import Sessions from "./pages/sessions";
import Settings from "./pages/settings";
import Vouchers from "./pages/vouchers";

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
        <div style={{ padding: '20px', background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: '4px' }}>
          <h2>Something went wrong.</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{errorMessage}{"\n"}{stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("tenantUser") || "null");
  return user ? <Layout>{children}</Layout> : <Navigate to="/" replace />;
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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/branch" element={<ProtectedRoute><Branch /></ProtectedRoute>} />
          <Route path="/routers" element={<ProtectedRoute><Routers /></ProtectedRoute>} />
          <Route path="/packages" element={<ProtectedRoute><PackagesDashboard /></ProtectedRoute>} />
          <Route path="/vouchers" element={<ProtectedRoute><Vouchers /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
          <Route path="/income" element={<ProtectedRoute><Income /></ProtectedRoute>} />
          <Route path="/withdrawals" element={<ProtectedRoute><Withdrawals /></ProtectedRoute>} />
          <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
