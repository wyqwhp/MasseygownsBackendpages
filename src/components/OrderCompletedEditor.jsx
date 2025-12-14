// src/components/OrderCompletedEditor.jsx
import React, { useEffect, useState } from "react";

export default function OrderCompletedEditor({ apiBase, template, onSaved }) {
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!template) return;
    setSubject(template.subjectTemplate || "");
    setBodyHtml(template.bodyHtml || "");
  }, [template]);

  const handleSave = async () => {
    if (!template) return;
    setSaving(true);
    setStatus(null);

    try {
      const payload = {
        subjectTemplate: subject,
        bodyHtml: bodyHtml,

        taxReceiptHtml: template.taxReceiptHtml,
      };

      const res = await fetch(`${apiBase}/api/emailtemplates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Save failed");
      }

      const updated = await res.json();
      onSaved && onSaved(updated);

      setStatus({ type: "success", message: "Changes saved." });
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: "Failed to save changes." });
    } finally {
      setSaving(false);
    }
  };

  if (!template) {
    return null;
  }

  return (
    <div className="email-editor-card">
      <h2 className="email-editor-title">
        {template.name || "OrderCompleted"}
      </h2>

      <div className="email-field">
        <label className="email-label">Subject</label>
        <input
          className="email-input"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject line for order completed"
        />
      </div>

      <div className="email-field">
        <label className="email-label">Body HTML</label>
        <textarea
          className="email-textarea"
          value={bodyHtml}
          onChange={(e) => setBodyHtml(e.target.value)}
          placeholder="HTML content of the email"
        />
      </div>

      <div className="email-save-row">
        <button
          className="email-save-button"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>

        {status && (
          <span
            className={
              "email-status" +
              (status.type === "error" ? " email-status-error" : "")
            }
          >
            {status.message}
          </span>
        )}
      </div>
    </div>
  );
}
