import React from "react";
import { Link, useNavigate } from "react-router-dom";

function Layout({ children }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("tenantUser") || "null");
  const businessName = user?.business_name || "My Business";

  const logout = () => {
    localStorage.removeItem("tenantUser");
    navigate("/");
  };

  return (
    <div>
      <header style={styles.header}>
        <h1 style={styles.brand}>{businessName}</h1>
        <nav style={styles.nav}>
          <Link to="/dashboard" style={styles.link}>Dashboard</Link>
          <Link to="/income" style={styles.link}>Income</Link>
          <Link to="/withdrawals" style={styles.link}>Withdrawals</Link>
          <Link to="/branch" style={styles.link}>Branches</Link>
          <button type="button" onClick={logout} style={styles.logout}>Logout</button>
        </nav>
      </header>
      <main style={styles.main}>
        {children}
      </main>
    </div>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 2rem",
    backgroundColor: "#1a1a2e",
    color: "#fff",
  },
  brand: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: "bold",
  },
  nav: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
  },
  link: {
    color: "#fff",
    textDecoration: "none",
    fontSize: "0.95rem",
  },
  logout: {
    background: "#e94560",
    color: "#fff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "4px",
    cursor: "pointer",
  },
  main: {
    padding: "2rem",
  },
};

export default Layout;
