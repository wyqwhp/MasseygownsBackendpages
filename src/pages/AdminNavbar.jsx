import React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import ReactDOM from "react-dom";
import "./AdminNavbar.css";
import "./Spinner.css";
import { useAuth } from "@/components/AuthContext.jsx";
// import printOrdersWrapper from "@/components/PrintLabels.jsx"
import {
  generateLabelsPDF,
  generateManifestPDF,
} from "@/components/PrintLabels.jsx";

const API_URL = import.meta.env.VITE_GOWN_API_BASE;

function MenuItem({ printLabels, loading, children }) {
  return (
    <a
      onClick={!loading ? printLabels : undefined}
      style={{
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.6 : 1,
      }}
    >
      {children ? children : loading ? "PRINTING..." : "PRINT LABELS"}
    </a>
  );
}

function FullscreenSpinner() {
  return ReactDOM.createPortal(
    <div className="spinner-overlay">
      <div className="spinner-center"></div>
    </div>,
    document.body
  );
}

function AdminNavbar() {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);

  async function printLabels() {
    setLoading(true);
    try {
      let response = await fetch(`${API_URL}/orders`);
      let orders = await response.json();
      generateLabelsPDF(orders);
      console.log("Backend result:", orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function printManifest() {
    setLoading(true);
    try {
      let response = await fetch(`${API_URL}/orders`);
      let orders = await response.json();
      generateManifestPDF(orders);
      // console.log("Backend result:", orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/">
          <img src="/logo.jpg" alt="MasseyGowns" className="logo" />
        </Link>
        <ul className="navbar-menu">
          <li className="has-dropdown">
            <a>EDIT CONTENT</a>
            <ul className="dropdown-panel">
              <li className="dropdown-item">
                <Link to="/admineditceremonies">CEREMONIES</Link>
              </li>
              <li className="dropdown-item">
                <Link to="/admineditdegrees">DEGREES</Link>
              </li>
              <li className="dropdown-item">
                <Link to="/adminedititems">ITEMS</Link>
              </li>
              <li className="dropdown-item">
                <Link to="/HomePageAdminHero">Homepage</Link>
              </li>
              {/*<li className="dropdown-item">*/}
              {/*    <Link to="/admintest">*/}
              {/*        TEST*/}
              {/*    </Link>*/}
              {/*</li>*/}
            </ul>
          </li>
          <li>
            <Link to="/adminqueries">QUERIES</Link>
          </li>
          <li>
            <Link to="/BuyRegalia">SHOW BUY ORDERS</Link>
          </li>
          <li>
            <Link to="/HireRegalia">SHOW HIRE ORDERS</Link>
          </li>
          <li className="has-dropdown">
            <a>PRINT</a>
            <ul className="dropdown-panel">
              {loading && <FullscreenSpinner />}
              <a onClick={printLabels} style={{ cursor: "pointer" }}>
                PRINT LABELS
              </a>
              {loading && <FullscreenSpinner />}
              <a onClick={printManifest} style={{ cursor: "pointer" }}>
                PRINT MANIFEST
              </a>
            </ul>
          </li>
          <li>
            <i
              onClick={logout}
              className="fa fa-sign-out logout-icon"
              style={{ cursor: "pointer" }}
            ></i>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default AdminNavbar;
