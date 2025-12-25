import React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { NavLink } from "react-router-dom";
import ReactDOM from "react-dom";
import "./AdminNavbar.css";
import "./Spinner.css";
import { useAuth } from "@/components/AuthContext.jsx";
import {
  generateLabelsPDF,
  generateManifestPDF,
} from "@/components/PrintLabels.jsx";
import {PrintPDF} from "@/components/PrintManifest.js"

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
                <NavLink to="/admineditceremonies">Ceremonies</NavLink>
              </li>
              <li className="dropdown-item">
                <NavLink to="/admineditdegrees">Degrees</NavLink>
              </li>
              <li className="dropdown-item">
                <NavLink to="/adminedititems">Items</NavLink>
              </li>
              <li className="dropdown-item">
                <NavLink to="/HoodEditor">Hood Qualifications</NavLink>
              </li>
              <li className="dropdown-item">
                <NavLink to="/HomepageEdit">Text & Image</NavLink>
              </li>
              <li className="dropdown-item">
                <NavLink to="/EmailEdit">CMS Templates</NavLink>
              </li>
              <li className="dropdown-item">
                <NavLink to="/adminusers">Users</NavLink>
              </li>
              {/*<li className="dropdown-item">*/}
              {/*    <Link to="/admintest">*/}
              {/*        TEST*/}
              {/*    </Link>*/}
              {/*</li>*/}
            </ul>
          </li>
          <li>
            <NavLink to="/adminqueries">QUERIES</NavLink>
          </li>
          <li>
            <NavLink to="/BuyRegalia">SHOW BUY ORDERS</NavLink>
          </li>
          <li>
            <NavLink to="/HireRegalia">SHOW HIRE ORDERS</NavLink>
          </li>
          <li className="has-dropdown">
            <a>DATABASE</a>
            <ul className="dropdown-panel">
              <NavLink to="/IndOrder">Individual Orders</NavLink>
              <NavLink to="/BulkOrder">Bulk Orders</NavLink>
              <NavLink to="/ImportBulk">Import Bulk Hire</NavLink>
              {loading && <FullscreenSpinner />}
              <a onClick={printLabels} style={{ cursor: "pointer" }}>
                PRINT LABELS
              </a>
              {loading && <FullscreenSpinner />}
              <a onClick={printManifest} style={{ cursor: "pointer" }}>
                PRINT MANIFEST
              </a>
              <a onClick={PrintPDF} style={{ cursor: "pointer" }}>
                Print Report
              </a>
              <NavLink to="/PrintAddressLabels">PRINT ADDRESS LABELS</NavLink>
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
