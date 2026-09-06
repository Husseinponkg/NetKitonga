import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../api";

function getTenantId() {
  const user = JSON.parse(localStorage.getItem("tenantUser") || "{}");
  return user.id || 1;
}

function formatDate(value) {
  if (!value) return "Never";
  return new Date(value).toLocaleString();
}

function Vouchers() {
  const [packages, setPackages] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [packageId, setPackageId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [expiresAt, setExpiresAt] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const tenantId = getTenantId();

  const loadData = async () => {
    setLoading(true);
    try {
      const [packageResponse, voucherResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/packages/catalog?tenant_id=${tenantId}`),
        fetch(`${API_BASE_URL}/vouchers?tenant_id=${tenantId}`),
      ]);

      if (!packageResponse.ok || !voucherResponse.ok) {
        throw new Error("Unable to load voucher data.");
      }

      const packageData = await packageResponse.json();
      setPackages(packageData.filter((item) => item.status === "active"));
      setVouchers(await voucherResponse.json());
    } catch (error) {
      setMessage(error.message || "Unable to load voucher data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setCreating(true);

    try {
      const response = await fetch(`${API_BASE_URL}/vouchers/create?tenant_id=${tenantId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_id: Number(packageId),
          quantity: Number(quantity),
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || "Voucher creation failed.");
      }

      setMessage(`${result.length} voucher${result.length === 1 ? "" : "s"} created successfully.`);
      setVouchers((current) => [...result, ...current]);
      setQuantity(1);
      setExpiresAt("");
    } catch (error) {
      setMessage(error.message || "Voucher creation failed.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{
      padding: "16px 20px",
      fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
      background: "#141414",
      minHeight: "100vh",
      color: "#ffffff",
      margin: 0,
    }}>
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
          background: #141414;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .vouchers-container {
          max-width: 1100px;
          margin: 0 auto;
          width: 100%;
        }

        .page-header {
          margin-bottom: 24px;
          animation: slideIn 0.6s ease-out;
        }

        .page-header h1 {
          font-size: 1.6rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 4px 0;
          letter-spacing: -0.5px;
        }

        .page-header h1 span {
          color: #e50914;
        }

        .page-header p {
          font-size: 0.85rem;
          color: #808080;
          margin: 0;
        }

        .message-box {
          padding: 10px 14px;
          margin: 0 0 16px 0;
          border-radius: 4px;
          font-weight: 500;
          font-size: 0.85rem;
          animation: fadeIn 0.3s ease-out;
        }

        .message-success {
          background: rgba(76, 175, 80, 0.1);
          border: 1px solid rgba(76, 175, 80, 0.2);
          color: #81c784;
        }

        .message-error {
          background: rgba(229, 9, 20, 0.1);
          border: 1px solid rgba(229, 9, 20, 0.2);
          color: #ff5252;
        }

        .panel {
          background: rgba(30, 30, 30, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 4px;
          padding: 20px;
          margin-bottom: 20px;
          animation: fadeIn 0.6s ease-out;
        }

        .panel:hover {
          border-color: rgba(229, 9, 20, 0.15);
        }

        .panel h2 {
          margin: 0 0 16px 0;
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
        }

        .count-badge {
          background: rgba(229, 9, 20, 0.15);
          color: #e50914;
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          margin-left: 8px;
        }

        .empty-state {
          text-align: center;
          padding: 30px 20px;
          color: #808080;
        }

        .empty-state .empty-icon {
          font-size: 2.5rem;
          display: block;
          margin-bottom: 10px;
          opacity: 0.4;
        }

        .empty-state p {
          margin: 0;
          font-size: 0.9rem;
        }

        .empty-state a {
          color: #e50914;
          text-decoration: none;
          font-weight: 600;
        }

        .empty-state a:hover {
          text-decoration: underline;
        }

        .voucher-form {
          display: grid;
          grid-template-columns: 1.7fr 0.7fr 1.2fr auto;
          gap: 14px;
          align-items: end;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .form-group label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #808080;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 4px;
          background: rgba(20, 20, 20, 0.9);
          color: #ffffff;
          font-size: 0.85rem;
          font-family: inherit;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .form-group input:focus,
        .form-group select:focus {
          border-color: rgba(229, 9, 20, 0.4);
          outline: none;
          box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.08);
          background: rgba(30, 30, 30, 0.9);
        }

        .form-group input::placeholder {
          color: #555;
        }

        .form-group input[type="datetime-local"] {
          color-scheme: dark;
        }

        .form-group select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23808080' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 36px;
          cursor: pointer;
        }

        .form-group select option {
          background: #1a1a1a;
          color: #ffffff;
        }

        .submit-btn {
          padding: 8px 18px;
          border: none;
          border-radius: 4px;
          background: #e50914;
          color: #ffffff;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
          white-space: nowrap;
          min-height: 40px;
        }

        .submit-btn:hover:not(:disabled) {
          background: #f40612;
          transform: scale(1.02);
          box-shadow: 0 4px 20px rgba(229, 9, 20, 0.3);
        }

        .submit-btn:active:not(:disabled) {
          transform: scale(0.98);
        }

        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .submit-btn .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-top: 2px solid #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-right: 8px;
          vertical-align: middle;
        }

        .table-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
          min-width: 600px;
        }

        thead tr {
          background: rgba(20, 20, 20, 0.6);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        thead th {
          padding: 8px 12px;
          text-align: left;
          font-weight: 600;
          color: #808080;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        tbody tr {
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          transition: all 0.2s ease;
        }

        tbody tr:hover {
          background: rgba(40, 40, 40, 0.8);
        }

        tbody td {
          padding: 8px 12px;
          color: #e5e5e5;
          vertical-align: middle;
        }

        .voucher-code {
          font-family: 'Courier New', monospace;
          font-weight: 700;
          color: #e50914;
          letter-spacing: 0.08em;
          font-size: 0.8rem;
        }

        .status-badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: capitalize;
          letter-spacing: 0.3px;
        }

        .status-active {
          background: rgba(76, 175, 80, 0.12);
          color: #81c784;
        }

        .status-used {
          background: rgba(158, 158, 158, 0.12);
          color: #bdbdbd;
        }

        .status-expired {
          background: rgba(229, 9, 20, 0.12);
          color: #ff5252;
        }

        .status-default {
          background: rgba(255, 255, 255, 0.05);
          color: #808080;
        }

        .date-text {
          font-size: 0.75rem;
          color: #808080;
        }

        .package-name {
          color: #e5e5e5;
        }

        .loading-text {
          color: #808080;
          padding: 12px 0;
        }

        /* Tablet */
        @media (max-width: 860px) {
          .voucher-form {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .submit-btn {
            width: 100%;
          }
        }

        @media (max-width: 768px) {
          .vouchers-container {
            padding: 0;
          }

          .panel {
            padding: 16px;
          }

          table {
            min-width: 500px;
            font-size: 0.8rem;
          }

          thead th, tbody td {
            padding: 6px 10px;
          }
        }

        @media (max-width: 480px) {
          .page-header h1 {
            font-size: 1.2rem;
          }

          .panel {
            padding: 14px;
          }

          table {
            min-width: 400px;
            font-size: 0.7rem;
          }

          thead th, tbody td {
            padding: 4px 8px;
          }

          .voucher-code {
            font-size: 0.65rem;
          }

          .status-badge {
            font-size: 0.55rem;
            padding: 1px 6px;
          }

          .date-text {
            font-size: 0.65rem;
          }
        }

        /* Touch devices */
        @media (hover: none) {
          .submit-btn:hover:not(:disabled) {
            transform: none;
            box-shadow: none;
          }

          tbody tr:hover {
            background: transparent;
          }

          .submit-btn {
            min-height: 44px;
          }

          .form-group input,
          .form-group select {
            min-height: 40px;
          }
        }
      `}</style>

      <div className="vouchers-container">
        {/* Header */}
        <div className="page-header">
          <h1>🎫 <span>Vouchers</span></h1>
          <p>Generate access codes from packages owned by this tenant</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`message-box ${message.includes("successfully") ? "message-success" : "message-error"}`}>
            {message}
          </div>
        )}

        {/* Create Panel */}
        <div className="panel">
          {packages.length === 0 && !loading ? (
            <div className="empty-state">
              <span className="empty-icon">📦</span>
              <p>Create an active package before generating vouchers.</p>
              <p><Link to="/packages">Manage packages →</Link></p>
            </div>
          ) : (
            <form className="voucher-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="voucher-package">Package</label>
                <select
                  id="voucher-package"
                  value={packageId}
                  onChange={(event) => setPackageId(event.target.value)}
                  required
                >
                  <option value="">Select a package</option>
                  {packages.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.package_name} - TZS {Number(item.price).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="voucher-quantity">Quantity</label>
                <input
                  id="voucher-quantity"
                  type="number"
                  min="1"
                  max="500"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="voucher-expiry">Expires (optional)</label>
                <input
                  id="voucher-expiry"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                />
              </div>

              <button className="submit-btn" type="submit" disabled={creating || !packageId}>
                {creating ? (
                  <>
                    <span className="spinner"></span>
                    Creating...
                  </>
                ) : (
                  "Create vouchers"
                )}
              </button>
            </form>
          )}
        </div>

        {/* History Panel */}
        <div className="panel">
          <h2>
            📋 Voucher History
            <span className="count-badge">{vouchers.length}</span>
          </h2>

          {loading ? (
            <div className="loading-text">Loading vouchers...</div>
          ) : vouchers.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🎫</span>
              <p>No vouchers have been created yet</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Package</th>
                    <th>Status</th>
                    <th>Expires</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map((voucher) => {
                    const statusClass = voucher.status === 'active' ? 'status-active' :
                                      voucher.status === 'used' ? 'status-used' :
                                      voucher.status === 'expired' ? 'status-expired' : 'status-default';
                    return (
                      <tr key={voucher.id}>
                        <td className="voucher-code">{voucher.code}</td>
                        <td className="package-name">{voucher.package_name}</td>
                        <td>
                          <span className={`status-badge ${statusClass}`}>
                            {voucher.status}
                          </span>
                        </td>
                        <td className="date-text">{formatDate(voucher.expires_at)}</td>
                        <td className="date-text">{formatDate(voucher.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Vouchers;