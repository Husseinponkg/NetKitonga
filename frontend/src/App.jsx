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
function ProtectedRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("tenantUser") || "null");
  return user ? <Layout>{children}</Layout> : <Navigate to="/" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/portal" element={<CaptivePortal />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/branch" element={<ProtectedRoute><Branch /></ProtectedRoute>} />
        <Route path="/routers" element={<ProtectedRoute><Routers /></ProtectedRoute>} />
        <Route path="/packages" element={<ProtectedRoute><PackagesDashboard /></ProtectedRoute>} />
        <Route path="/customers"element={<ProtectedRoute><Customers /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
        <Route path="/income" element={<ProtectedRoute><Income /></ProtectedRoute>} />
        <Route path="/withdrawals" element={<ProtectedRoute><Withdrawals /></ProtectedRoute>} />
        <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
