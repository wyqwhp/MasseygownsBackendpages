import React, { useEffect, useRef, useState } from "react";
import JoditEditor from "jodit-react";

const variableList = [
  "gstNumber",
  "invoiceNumber",
  "invoiceDate",
  "firstName",
  "lastName",
  "address",
  "city",
  "postcode",
  "country",
  "studentId",
  "email",
  "mobile",
  "phone",
  // cartRows is not editable / not shown in CMS
  "total",
  "amountPaid",
  "balanceOwing",
  "eventTitle",
];

function parseBodyHtml(html) {
  const result = { greeting: "", main: "", closing: "" };
  if (!html) return result;

  try {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;

    const p = wrapper.querySelector("p");
    const raw = (p ? p.innerHTML : wrapper.innerHTML) || "";

    const withNewlines = raw.replace(/<br\s*\/?>/gi, "\n");
    const textOnly = withNewlines.replace(/<[^>]+>/g, "");
    result.main = textOnly.trim();
  } catch (e) {
    console.warn("Failed to parse body html", e);
  }

  return result;
}

function buildBodyHtml(_greetingIgnored, main, closing) {
  const escape = (str) =>
    (str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const toHtmlPreserveNewlines = (str) => {
    if (!str) return "";
    const escaped = escape(str);
    return escaped.replace(/\r?\n/g, "<br/>");
  };

  const mainHtml = toHtmlPreserveNewlines(main);
  const closingHtml = toHtmlPreserveNewlines(closing);

  const parts = [];
  if (mainHtml) parts.push(`<p>${mainHtml}</p>`);
  if (closingHtml) parts.push(`<p>${closingHtml}</p>`);
  return parts.join("\n");
}

export default function PaymentEmailTemplateEditor({
  apiBase,
  template,
  onSaved,
}) {
  const receiptEditor = useRef(null);

  const [subject, setSubject] = useState("");

  const [bodyGreeting, setBodyGreeting] = useState(""); // ignored
  const [bodyMain, setBodyMain] = useState("");
  const [bodyClosing, setBodyClosing] = useState("");

  const [taxReceiptHtml, setTaxReceiptHtml] = useState("");

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!template) return;

    setStatus(null);
    setSubject(template.subjectTemplate || "");

    const bodyParts = parseBodyHtml(template.bodyHtml || "");
    setBodyGreeting("");
    setBodyMain(bodyParts.main || "");
    setBodyClosing("");

    setTaxReceiptHtml((template.taxReceiptHtml || "").trim());
  }, [template]);

  const insertVariable = (key) => {
    const j = receiptEditor.current?.editor;
    if (!j) return;
    j.selection.focus();
    j.execCommand("insertHTML", false, `{{${key}}}`);
  };

  const handleSave = async () => {
    if (!template) return;

    setSaving(true);
    setStatus(null);

    try {
      // Always take the latest value from editor (Jodit state can lag)
      const currentHtml =
        receiptEditor.current?.editor?.value ?? taxReceiptHtml ?? "";

      const payload = {
        subjectTemplate: subject,
        bodyHtml: buildBodyHtml(bodyGreeting, bodyMain, bodyClosing),
        taxReceiptHtml: currentHtml, // store as-is
      };

      const res = await fetch(`${apiBase}/api/emailtemplates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Save failed: ${res.status} ${txt}`);
      }

      const updated = await res.json();
      onSaved?.(updated);

      // Keep local state in sync with what we saved
      setTaxReceiptHtml(currentHtml);

      setStatus({ type: "success", message: "Changes saved." });
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: "Failed to save changes." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="email-editor-card">
      {template ? (
        <>
          <h2 className="email-editor-title">
            {template.name || "Email template"}
          </h2>

          <div className="email-field">
            <label className="email-label">Subject</label>
            <input
              className="email-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject line sent to the customer"
            />
          </div>

          <p className="email-hint">
            <strong>Body content</strong> – text at the top of the email.
          </p>

          <div className="email-field">
            <label className="email-label">Main message</label>
            <textarea
              className="email-textarea"
              value={bodyMain}
              onChange={(e) => setBodyMain(e.target.value)}
              placeholder="Thank you for your payment..."
            />
          </div>

          <p className="email-hint">
            <strong>Tax receipt HTML</strong> – edit the receipt layout below.
          </p>

          <div style={{ marginBottom: 12 }}>
            <strong>Variables (Drag or Drop):</strong>
            <div style={{ marginTop: 8 }}>
              {variableList.map((key) => (
                <button
                  key={key}
                  draggable
                  onDragStart={(e) =>
                    e.dataTransfer.setData("text/plain", `{{${key}}}`)
                  }
                  onClick={() => insertVariable(key)}
                  style={{
                    margin: "5px",
                    padding: "6px 12px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    background: "#fafafa",
                    cursor: "grab",
                    fontSize: "14px",
                  }}
                >
                  {`{{${key}}}`}
                </button>
              ))}
            </div>
          </div>

          <JoditEditor
            ref={receiptEditor}
            value={taxReceiptHtml}
            config={{
              height: 700,
              enableDragAndDropFileToEditor: false,
              cleanHTML: { fillEmptyParagraph: false },
              events: {
                drop: (event) => {
                  event.preventDefault();
                  const data = event.dataTransfer.getData("text/plain");
                  const j = receiptEditor.current?.editor;
                  if (j && data) j.execCommand("insertHTML", false, data);
                },
                dragover: (event) => event.preventDefault(),
              },
            }}
            onBlur={(newContent) => setTaxReceiptHtml(newContent)}
          />

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
        </>
      ) : (
        <p className="email-empty">
          Select a template on the left to start editing.
        </p>
      )}
    </div>
  );
}
