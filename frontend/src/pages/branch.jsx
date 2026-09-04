import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../api";

function Branch() {
  const currentUser = JSON.parse(localStorage.getItem("tenantUser") || "null");
  const tenantId = currentUser?.id ?? null;

  const [branch_name, setBranchName] = useState("");
  const [branch_location, setBranchLocation] = useState("");
  const [branch_email, setBranchEmail] = useState("");
  const [branch_phone, setBranchPhone] = useState("");
  const [branch_manager, setBranchManager] = useState("");
  const [branches, setBranches] = useState([]);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    if (!tenantId) {
      setError("Tenant session is missing. Please login again.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/branch/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tenant_id: Number(tenantId),
          branch_name,
          branch_location,
          branch_email,
          branch_phone,
          branch_manager
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || "Branch created successfully");
        fetchBranches();
        setBranchName("");
        setBranchLocation("");
        setBranchEmail("");
        setBranchPhone("");
        setBranchManager("");
      } else {
        setError(data.message || data.detail || "Failed to create branch");
      }
    } catch (error) {
      console.error("Error creating branch:", error);
      setError("Error creating branch");
    }
  };

  const fetchBranches = async () => {
    if (!tenantId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/branch/all?tenant_id=${tenantId}`);
      const data = await response.json();
      setBranches(Array.isArray(data.branches) ? data.branches : []);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [tenantId]);

  return (
    <div style={{
      padding: "20px",
      fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
      background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)",
      minHeight: "100vh",
      color: "#ffffff"
    }}>
      <style>{`
        * {
          box-sizing: border-box;
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

        .branch-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 32px;
          animation: fadeIn 0.6s ease-out;
        }

        .page-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }

        .page-header p {
          font-size: 0.95rem;
          color: #b3b3b3;
          margin: 0;
        }

        .content-wrapper {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 24px;
          align-items: start;
        }

        .form-section {
          background: rgba(30, 30, 30, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 24px;
          animation: fadeIn 0.6s ease-out 0.1s both;
          position: sticky;
          top: 20px;
        }

        .form-section h3 {
          margin: 0 0 20px 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #ffffff;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: #b3b3b3;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .form-group input {
          width: 100%;
          padding: 10px 12px;
          background: rgba(51, 51, 51, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: #ffffff;
          font-size: 0.9rem;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .form-group input:focus {
          background: rgba(51, 51, 51, 1);
          border-color: rgba(229, 9, 20, 0.5);
          outline: none;
          box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.1);
        }

        .form-group input::placeholder {
          color: #666;
        }

        .submit-btn {
          width: 100%;
          padding: 10px 12px;
          background: linear-gradient(135deg, #e50914 0%, #c20812 100%);
          color: #ffffff;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
          margin-top: 12px;
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(229, 9, 20, 0.35);
          background: linear-gradient(135deg, #f20916 0%, #d40a16 100%);
        }

        .submit-btn:active {
          transform: translateY(0);
        }

        .message {
          padding: 10px 12px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 500;
          margin-top: 12px;
          animation: fadeIn 0.3s ease-out;
        }

        .message-success {
          background: rgba(76, 175, 80, 0.15);
          border: 1px solid rgba(76, 175, 80, 0.3);
          color: #81c784;
        }

        .message-error {
          background: rgba(229, 9, 20, 0.15);
          border: 1px solid rgba(229, 9, 20, 0.3);
          color: #ff6b6b;
        }

        .branches-section {
          background: rgba(30, 30, 30, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 24px;
          animation: fadeIn 0.8s ease-out 0.15s both;
        }

        .branches-section h2 {
          margin: 0 0 20px 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #ffffff;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #b3b3b3;
        }

        .empty-icon {
          font-size: 2.5rem;
          display: block;
          margin-bottom: 12px;
          opacity: 0.5;
        }

        .empty-text {
          font-size: 0.95rem;
          margin: 0;
        }

        .branches-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .branch-card {
          background: rgba(40, 40, 40, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 16px;
          transition: all 0.3s ease;
          animation: fadeIn 0.6s ease-out;
          animation-fill-mode: both;
        }

        .branch-card:nth-child(1) { animation-delay: 0.05s; }
        .branch-card:nth-child(2) { animation-delay: 0.10s; }
        .branch-card:nth-child(3) { animation-delay: 0.15s; }
        .branch-card:nth-child(4) { animation-delay: 0.20s; }
        .branch-card:nth-child(5) { animation-delay: 0.25s; }

        .branch-card:hover {
          background: rgba(40, 40, 40, 0.9);
          border-color: rgba(229, 9, 20, 0.3);
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(229, 9, 20, 0.15);
        }

        .branch-name {
          font-size: 1.1rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .branch-icon {
          font-size: 1.3rem;
        }

        .branch-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .branch-info-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 0.85rem;
        }

        .branch-info-label {
          color: #b3b3b3;
          min-width: 70px;
          font-weight: 500;
        }

        .branch-info-value {
          color: #e5e5e5;
          word-break: break-word;
          flex: 1;
        }

        .location {
          color: #81c784;
        }

        .email {
          color: #6495ed;
        }

        .phone {
          color: #fbc02d;
        }

        .manager {
          color: #b3b3b3;
        }

        /* Tablet Responsive */
        @media (max-width: 1024px) {
          .content-wrapper {
            grid-template-columns: 1fr;
          }

          .form-section {
            position: static;
          }

          .branches-grid {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          }
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .branch-container {
            padding: 0;
          }

          .page-header h1 {
            font-size: 1.5rem;
          }

          .form-section,
          .branches-section {
            padding: 20px;
          }

          .branches-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 12px;
          }
        }

        /* Small Mobile */
        @media (max-width: 480px) {
          .page-header h1 {
            font-size: 1.3rem;
          }

          .form-section,
          .branches-section {
            padding: 16px;
          }

          .branches-grid {
            grid-template-columns: 1fr;
          }

          .branch-card {
            padding: 12px;
          }

          .branch-name {
            font-size: 1rem;
            margin-bottom: 10px;
          }

          .branch-info-item {
            font-size: 0.8rem;
          }
        }

        /* Extra small devices */
        @media (max-width: 360px) {
          .page-header h1 {
            font-size: 1.1rem;
          }

          .form-group label {
            font-size: 0.75rem;
          }

          .form-group input {
            font-size: 0.85rem;
            padding: 8px 10px;
          }
        }
      `}</style>

      <div className="branch-container">
        {/* Header */}
        <div className="page-header">
          <h1>🏢 Branch Management</h1>
          <p>Create and manage multiple branches for your business</p>
        </div>

        {/* Main Content */}
        <div className="content-wrapper">
          {/* Form Section */}
          <form onSubmit={handleSubmit} className="form-section">
            <h3>➕ Add New Branch</h3>

            <div className="form-group">
              <label>Branch Name</label>
              <input
                type="text"
                value={branch_name}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="e.g., Downtown Branch"
                required
              />
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={branch_location}
                onChange={(e) => setBranchLocation(e.target.value)}
                placeholder="Street address"
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={branch_email}
                onChange={(e) => setBranchEmail(e.target.value)}
                placeholder="branch@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={branch_phone}
                onChange={(e) => setBranchPhone(e.target.value)}
                placeholder="+255 xxx xxx xxx"
                required
              />
            </div>

            <div className="form-group">
              <label>Manager Name</label>
              <input
                type="text"
                value={branch_manager}
                onChange={(e) => setBranchManager(e.target.value)}
                placeholder="Manager's name"
                required
              />
            </div>

            <button type="submit" className="submit-btn">Create Branch</button>

            {success && <div className="message message-success">{success}</div>}
            {error && <div className="message message-error">{error}</div>}
          </form>

          {/* Branches Section */}
          <div className="branches-section">
            <h2>📍 Your Branches</h2>
            
            {branches.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🏪</span>
                <p className="empty-text">No branches created yet</p>
              </div>
            ) : (
              <div className="branches-grid">
                {branches.map((b) => (
                  <div key={b.id} className="branch-card">
                    <h3 className="branch-name">
                      <span className="branch-icon">📍</span>
                      {b.branch_name}
                    </h3>

                    <div className="branch-info">
                      <div className="branch-info-item">
                        <span className="branch-info-label">Location:</span>
                        <span className="branch-info-value location">{b.branch_location}</span>
                      </div>

                      <div className="branch-info-item">
                        <span className="branch-info-label">Email:</span>
                        <span className="branch-info-value email">{b.branch_email}</span>
                      </div>

                      <div className="branch-info-item">
                        <span className="branch-info-label">Phone:</span>
                        <span className="branch-info-value phone">{b.branch_phone}</span>
                      </div>

                      <div className="branch-info-item">
                        <span className="branch-info-label">Manager:</span>
                        <span className="branch-info-value manager">{b.branch_manager}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Branch;