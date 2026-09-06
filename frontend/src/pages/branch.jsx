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

        .branch-container {
          max-width: 1400px;
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

        .content-wrapper {
          display: grid;
          grid-template-columns: minmax(280px, 360px) 1fr;
          gap: 20px;
          align-items: start;
        }

        .form-section {
          background: rgba(30, 30, 30, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 4px;
          padding: 20px;
          animation: fadeIn 0.6s ease-out 0.1s both;
          position: sticky;
          top: 20px;
        }

        .form-section:hover {
          border-color: rgba(229, 9, 20, 0.15);
        }

        .form-section h3 {
          margin: 0 0 16px 0;
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
        }

        .form-group {
          margin-bottom: 12px;
        }

        .form-group label {
          display: block;
          font-size: 0.7rem;
          font-weight: 600;
          color: #808080;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-group input {
          width: 100%;
          padding: 8px 12px;
          background: rgba(20, 20, 20, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 4px;
          color: #ffffff;
          font-size: 0.85rem;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .form-group input:focus {
          border-color: rgba(229, 9, 20, 0.4);
          outline: none;
          box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.08);
          background: rgba(30, 30, 30, 0.9);
        }

        .form-group input::placeholder {
          color: #555;
        }

        .submit-btn {
          width: 100%;
          padding: 8px 12px;
          background: #e50914;
          color: #ffffff;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
          margin-top: 8px;
        }

        .submit-btn:hover {
          background: #f40612;
          transform: scale(1.02);
          box-shadow: 0 4px 20px rgba(229, 9, 20, 0.3);
        }

        .submit-btn:active {
          transform: scale(0.98);
        }

        .message {
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 500;
          margin-top: 10px;
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

        .branches-section {
          background: rgba(30, 30, 30, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 4px;
          padding: 20px;
          animation: fadeIn 0.8s ease-out 0.15s both;
        }

        .branches-section:hover {
          border-color: rgba(229, 9, 20, 0.15);
        }

        .branches-section h2 {
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
          padding: 40px 20px;
          color: #808080;
        }

        .empty-icon {
          font-size: 2.5rem;
          display: block;
          margin-bottom: 10px;
          opacity: 0.4;
        }

        .empty-text {
          font-size: 0.9rem;
          margin: 0;
        }

        .empty-sub {
          font-size: 0.75rem;
          margin: 4px 0 0 0;
          opacity: 0.5;
        }

        .branches-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 14px;
        }

        .branch-card {
          background: rgba(20, 20, 20, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 4px;
          padding: 14px 16px;
          transition: all 0.3s ease;
          animation: fadeIn 0.6s ease-out;
          animation-fill-mode: both;
        }

        .branch-card:nth-child(1) { animation-delay: 0.05s; }
        .branch-card:nth-child(2) { animation-delay: 0.10s; }
        .branch-card:nth-child(3) { animation-delay: 0.15s; }
        .branch-card:nth-child(4) { animation-delay: 0.20s; }
        .branch-card:nth-child(5) { animation-delay: 0.25s; }
        .branch-card:nth-child(6) { animation-delay: 0.30s; }

        .branch-card:hover {
          background: rgba(30, 30, 30, 0.8);
          border-color: rgba(229, 9, 20, 0.15);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }

        .branch-name {
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 10px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .branch-icon {
          font-size: 1.2rem;
        }

        .branch-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .branch-info-item {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          font-size: 0.8rem;
          line-height: 1.4;
        }

        .branch-info-label {
          color: #666;
          min-width: 60px;
          font-weight: 500;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          flex-shrink: 0;
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

        /* Tablet */
        @media (max-width: 1024px) {
          .content-wrapper {
            grid-template-columns: 1fr;
          }

          .form-section {
            position: static;
            max-width: 500px;
            margin: 0 auto;
            width: 100%;
          }

          .branches-section {
            max-width: 500px;
            margin: 0 auto;
            width: 100%;
          }

          .branches-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .branch-container {
            padding: 0;
          }

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
        }

        @media (max-width: 480px) {
          .page-header h1 {
            font-size: 1.1rem;
          }

          .page-header p {
            font-size: 0.75rem;
          }

          .form-section,
          .branches-section {
            padding: 14px;
          }

          .branch-card {
            padding: 12px 14px;
          }

          .branch-name {
            font-size: 0.9rem;
          }

          .branch-info-item {
            font-size: 0.75rem;
          }

          .branch-info-label {
            min-width: 50px;
            font-size: 0.65rem;
          }
        }

        @media (max-width: 360px) {
          .page-header h1 {
            font-size: 0.95rem;
          }

          .form-group label {
            font-size: 0.65rem;
          }

          .form-group input {
            font-size: 0.8rem;
            padding: 6px 10px;
          }

          .submit-btn {
            font-size: 0.8rem;
            padding: 7px 10px;
          }
        }

        /* Touch devices */
        @media (hover: none) {
          .submit-btn:hover {
            transform: none;
            box-shadow: none;
          }

          .branch-card:hover {
            transform: none;
            box-shadow: none;
          }
        }
      `}</style>

      <div className="branch-container">
        {/* Header */}
        <div className="page-header">
          <h1>🏢 Branch <span>Management</span></h1>
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
            <h2>
              📍 Your Branches
              <span className="count-badge">{branches.length}</span>
            </h2>
            
            {branches.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🏪</span>
                <p className="empty-text">No branches created yet</p>
                <p className="empty-sub">Add your first branch using the form</p>
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
                        <span className="branch-info-label">Location</span>
                        <span className="branch-info-value location">{b.branch_location}</span>
                      </div>

                      <div className="branch-info-item">
                        <span className="branch-info-label">Email</span>
                        <span className="branch-info-value email">{b.branch_email}</span>
                      </div>

                      <div className="branch-info-item">
                        <span className="branch-info-label">Phone</span>
                        <span className="branch-info-value phone">{b.branch_phone}</span>
                      </div>

                      <div className="branch-info-item">
                        <span className="branch-info-label">Manager</span>
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