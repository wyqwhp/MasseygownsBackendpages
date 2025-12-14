// src/pages/EmailTemplatesPage.jsx
import React, { useEffect, useState } from "react";
import "../components/EmailEdit.css";
import PaymentEmailTemplateEditor from "../components/PaymentEmailTemplateEditor";

const API_BASE = import.meta.env.VITE_GOWN_API_BASE;

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null); // only for load error

  // load all templates once
  useEffect(() => {
    const loadTemplates = async () => {
      setLoading(true);
      setStatus(null);

      try {
        const res = await fetch(`${API_BASE}/api/emailtemplates`);
        if (!res.ok) {
          throw new Error("Failed to load templates");
        }
        const data = await res.json();
        setTemplates(data || []);
        if (data && data.length > 0) {
          setSelected(data[0]);
        }
      } catch (err) {
        console.error(err);
        setStatus({
          type: "error",
          message: "Failed to load email templates.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

  const handleSelect = (tpl) => {
    setStatus(null);
    setSelected(tpl);
  };

  // called by the editor after PUT succeeds
  const handleSaved = (updated) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
    setSelected(updated);
  };

  return (
    <div className="email-admin-page">
      <h1 className="email-page-title">Email Templates</h1>

      {loading ? (
        <p className="email-status">Loading email templates…</p>
      ) : (
        <div className="email-layout">
          {/* Left side */}
          <div className="email-list-card">
            <div className="email-list-header">Templates</div>

            {status && status.type === "error" && (
              <p className="email-status email-status-error">
                {status.message}
              </p>
            )}

            {templates.length === 0 ? (
              <p className="email-empty">No email templates found.</p>
            ) : (
              <ul className="email-list">
                {templates.map((tpl) => (
                  <li
                    key={tpl.id}
                    onClick={() => handleSelect(tpl)}
                    className={
                      "email-list-item" +
                      (selected && selected.id === tpl.id ? " is-active" : "")
                    }
                  >
                    <div className="email-list-title">
                      {tpl.name || "Untitled template"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Right side */}
          <PaymentEmailTemplateEditor
            apiBase={API_BASE}
            template={selected}
            onSaved={handleSaved}
          />
        </div>
      )}
    </div>
  );
}
