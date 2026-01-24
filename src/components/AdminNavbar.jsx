import React, { useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import ReactDOM from "react-dom";
import "./AdminNavbar.css";
import "./Spinner.css";
import { useAuth } from "@/components/AuthContext.jsx";
import {
  generateLabelsPDF,
  generateManifestPDF,
} from "@/components/PrintLabels.jsx";
import PrintReportOrder from "@/components/PrintReportOrder.jsx";

const API_URL = import.meta.env.VITE_GOWN_API_BASE;

function FullscreenSpinner() {
  return ReactDOM.createPortal(
    <div className="spinner-overlay">
      <div className="spinner-center"></div>
    </div>,
    document.body
  );
}

// ----------------------------
// CONFIG: Top menu + Sub-tabs
// ----------------------------
const NAV = [
  {
    key: "orders",
    label: "ORDERS",
    match: (path) =>
      ["/BuyRegalia", "/HireRegalia"].some((p) => path.startsWith(p)),
    to: "/BuyRegalia",
    sub: [
      { label: "buy orders", to: "/BuyRegalia" },
      { label: "hire orders", to: "/HireRegalia" },
    ],
  },
  {
    key: "enquiries",
    label: "ENQUIRIES",
    match: (path) => path.startsWith("/adminqueries"),
    to: "/adminqueries",
    sub: [],
  },
  {
    key: "items",
    label: "ITEMS",
    match: (path) =>
      path.startsWith("/adminedititems") || path.startsWith("/editDelivery"),
    to: "/adminedititems",
    sub: [
      { label: "items", to: "/adminedititems" },
      { label: "delivery", to: "/editDelivery" },
    ],
  },
  {
    key: "content",
    label: "CONTENT",
    match: (path) =>
      [
        "/admineditceremonies",
        "/admineditdegrees",
        "/HoodEditor",
        "/HomepageEdit",
        "/EmailEdit",
        "/adminusers",
      ].some((p) => path.startsWith(p)),
    to: "/admineditceremonies",
    sub: [
      { label: "ceremonies", to: "/admineditceremonies" },
      { label: "degrees", to: "/admineditdegrees" },
      { label: "hood qualifications", to: "/HoodEditor" },
      { label: "text & image", to: "/HomepageEdit" },
      { label: "cms templates", to: "/EmailEdit" },
      { label: "users", to: "/adminusers" },
    ],
  },
  {
    key: "database",
    label: "DATABASE",
    match: (path) =>
      ["/IndOrder", "/BulkOrder", "/ImportBulk", "/PrintAddressLabels", "/InternalManagementForm"].some(
        (p) => path.startsWith(p)
      ),
    to: "/IndOrder",
    sub: [
      { label: "individual orders", to: "/IndOrder" },
      { label: "bulk orders", to: "/BulkOrder" },
      { label: "import bulk hire", to: "/ImportBulk" },
      { label: "print address labels", to: "/PrintAddressLabels" },
      { label: "internal management forms", to: "/InternalManagementForm" },
    ],
  },
];

function AdminNavbar() {
  const { logout } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const activeSection = useMemo(() => {
    const path = location.pathname;
    return NAV.find((s) => s.match(path)) || NAV[0];
  }, [location.pathname]);

  async function printLabels() {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/orders`);
      const orders = await response.json();
      generateLabelsPDF(orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function printManifest() {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/orders`);
      const orders = await response.json();
      generateManifestPDF(orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <header className="admin-nav">
      {/* TOP DARK BAR */}
      <div className="admin-topbar">
        <div className="admin-topbar-left">
          <Link to="/" className="admin-brand">
            <img src="/logo.jpg" alt="MasseyGowns" className="admin-logo" />
          </Link>

          <nav className="admin-primary">
            {NAV.map((item) => (
              <NavLink
                key={item.key}
                to={item.to}
                className={({ isActive }) =>
                  "admin-primary-link" +
                  (item.match(location.pathname) ? " is-active" : "")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="admin-topbar-right">
          <button
            className="admin-icon-btn"
            onClick={logout}
            title="Logout"
            type="button"
          >
            <i className="fa fa-sign-out" />
          </button>
        </div>
      </div>

      {/* SECOND LIGHT BAR (SUB TABS) */}
      <div className="admin-subbar">
        <div className="admin-subbar-inner">
          <nav className="admin-subtabs">
            {(activeSection.sub || []).map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                className={({ isActive }) =>
                  "admin-subtab" + (isActive ? " is-active" : "")
                }
              >
                {t.label}
              </NavLink>
            ))}

            {/* Example: action buttons shown when REPORTS is active (like “print orders”) */}
            {activeSection.key === "database" && (
              <>
                <button
                  className="admin-subtab admin-subtab-btn"
                  onClick={printLabels}
                  disabled={loading}
                  type="button"
                >
                  print labels
                </button>
                <button
                  className="admin-subtab admin-subtab-btn"
                  onClick={printManifest}
                  disabled={loading}
                  type="button"
                >
                  print manifest
                </button>
                <button
                  className="admin-subtab admin-subtab-btn"
                  onClick={PrintReportOrder}
                  disabled={loading}
                  type="button"
                >
                  print report
                </button>
              </>
            )}
          </nav>
        </div>
      </div>

      {loading && <FullscreenSpinner />}
    </header>
  );
}

export default AdminNavbar;
