import React, { useEffect, useRef, useState } from "react";
import JoditEditor from "jodit-react";

// Same variable style as your teammate (camelCase)
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
  "cartRows",
  "total",
  "amountPaid",
  "balanceOwing",
];

// Parse bodyHtml into a simple text block (main only)
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

/**
 * Fix broken cart table structure caused by WYSIWYG editors:
 * Ensure {{cartRows}} / {{CartRows}} lives inside the cart table <tbody>...</tbody>.
 *
 * Your backend injects <tr>...</tr> for cart rows.
 * If the placeholder sits outside <tbody>, email clients will "break" the table -> layout becomes wide/narrow.
 */
function fixCartRowsPlacement(html) {
  if (!html) return html;

  // Normalize placeholder variations
  const placeholderRegex = /\{\{\s*cartrows\s*\}\}|\{\{\s*CartRows\s*\}\}/gi;
  const hasPlaceholder = placeholderRegex.test(html);
  if (!hasPlaceholder) return html;

  // If placeholder already sits inside any <tbody> ... </tbody>, leave it
  const placeholderInsideTbody =
    /<tbody[^>]*>[\s\S]*\{\{\s*(?:cartrows|CartRows)\s*\}\}[\s\S]*<\/tbody>/i.test(
      html
    );

  if (placeholderInsideTbody) return html;

  // Remove placeholder from wherever it currently is (often ends up inside a <td> before the table)
  let cleaned = html.replace(placeholderRegex, "");

  // Try to insert into the <tbody> of the cart items table.
  // We anchor to the table that contains the "Item / Qty / Price / GST / Total" headers.
  const cartTableRegex =
    /(<table\b[^>]*>[\s\S]*?<th[^>]*>\s*Item\s*<\/th>[\s\S]*?<th[^>]*>\s*Qty\s*<\/th>[\s\S]*?<th[^>]*>\s*Price\s*<\/th>[\s\S]*?<th[^>]*>\s*GST\s*<\/th>[\s\S]*?<th[^>]*>\s*Total\s*<\/th>[\s\S]*?<tbody\b[^>]*>)/i;

  if (cartTableRegex.test(cleaned)) {
    cleaned = cleaned.replace(cartTableRegex, `$1\n{{CartRows}}\n`);
    return cleaned;
  }

  // Fallback: insert into the first <tbody> we can find (better than leaving it outside)
  const firstTbodyOpen = /(<tbody\b[^>]*>)/i;
  if (firstTbodyOpen.test(cleaned)) {
    cleaned = cleaned.replace(firstTbodyOpen, `$1\n{{CartRows}}\n`);
    return cleaned;
  }

  // If no tbody exists, just return cleaned (shouldn't happen with your template)
  return cleaned;
}

// Default “Payment Completed” receipt template
function defaultPaymentReceiptTemplate() {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Tax Receipt / Payment Receipt</title>
</head>

<body style="margin:0; padding:0; background:#f4f4f4; font-family:Arial, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px auto; background:white; border-radius:8px; padding:25px; border:1px solid #ddd;">

  <!-- HEADER -->
  <tr>
    <td>
      <h1 style="margin:0; font-size:24px; color:#111;">Tax Receipt / Payment Receipt</h1>

      <div style="font-size:12px; color:#777; margin-top:3px;">
        GST No: {{gstNumber}}
      </div>

      <div style="font-size:11px; color:#777;">
        Invoice No: {{invoiceNumber}}
      </div>

      <div style="font-size:11px; color:#777;">
        Invoice Date: {{invoiceDate}}
      </div>
    </td>

    <td align="right" style="font-size:13px; line-height:1.4; color:#444;">
      <strong>Academic Dress Hire</strong><br>
      3 Refectory Rd,<br>
      Massey University,<br>
      Palmerston North 4472<br>
      Email: info@masseygowns.org.nz<br>
      Ph: +64 6 350 4166
    </td>
  </tr>

  <tr><td colspan="2" style="padding-top:10px;"><hr></td></tr>

  <!-- INTRO -->
  <tr>
    <td colspan="2" style="font-size:14px; padding-top:10px; color:#333;">
      Thank you — we have received your payment. Please keep this receipt for your records.
    </td>
  </tr>

  <!-- CUSTOMER DETAILS -->
  <tr>
    <td colspan="2" style="padding-top:25px;">
      <table width="100%" cellpadding="8" cellspacing="0" style="font-size:14px;">

        <tr>
          <td width="50%" valign="top">
            <div><strong>Invoice Number</strong><br>{{invoiceNumber}}</div>
            <div style="margin-top:8px;"><strong>Name</strong><br>{{firstName}} {{lastName}}</div>
            <div style="margin-top:8px;"><strong>Email</strong><br>{{email}}</div>
            <div style="margin-top:8px;"><strong>Mobile</strong><br>{{mobile}}</div>
            <div style="margin-top:8px;"><strong>Student ID</strong><br>{{studentId}}</div>
          </td>

          <td width="50%" valign="top">
            <div><strong>Address</strong><br>{{address}}</div>
            <div style="margin-top:8px;"><strong>City, Post Code</strong><br>{{city}} {{postcode}}</div>
            <div style="margin-top:8px;"><strong>Country</strong><br>{{country}}</div>
            <div style="margin-top:8px;"><strong>Phone</strong><br>{{phone}}</div>
          </td>
        </tr>

      </table>
    </td>
  </tr>

  <!-- ITEMS TABLE -->
  <tr>
    <td colspan="2" style="padding-top:20px;">
      <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse; font-size:14px; border:1px solid #ddd;">

        <thead>
          <tr style="background:#f7f7f7; border-bottom:1px solid #ccc;">
            <th align="left" style="padding:10px;">Item</th>
            <th align="center" style="padding:10px;">Qty</th>
            <th align="right" style="padding:10px;">Price</th>
            <th align="right" style="padding:10px;">GST</th>
            <th align="right" style="padding:10px;">Total</th>
          </tr>
        </thead>

        <tbody>
          {{cartRows}}
        </tbody>

        <tfoot>
          <tr style="border-top:1px solid #ccc;">
            <td colspan="4" align="right" style="padding:10px;"><strong>Grand total</strong></td>
            <td align="right" style="padding:10px;"><strong>{{total}}</strong></td>
          </tr>

          <tr style="background:#e8f4e8;">
            <td colspan="4" align="right" style="padding:10px;"><strong>Amount paid</strong></td>
            <td align="right" style="padding:10px;"><strong>{{amountPaid}}</strong></td>
          </tr>

          <tr>
            <td colspan="4" align="right" style="padding:10px;"><strong>Balance owing</strong></td>
            <td align="right" style="padding:10px;"><strong>{{balanceOwing}}</strong></td>
          </tr>

          <tr>
            <td colspan="5" style="padding:10px; font-size:12px; color:#666;">
              All prices include GST.
            </td>
          </tr>
        </tfoot>

      </table>
    </td>
  </tr>

  <!-- NOTES -->
  <tr>
    <td colspan="2" style="padding-top:25px;">
      <div style="background:#fff8e1; border:1px solid #ffe28a; padding:15px; font-size:13px; color:#333;">
        <strong>Important notes:</strong>
        <ul style="margin:10px 0 0 18px; padding:0; line-height:1.6;">
          <li>Please bring this receipt when collecting regalia.</li>
          <li>Regalia must be returned by the due date to avoid extra fees.</li>
          <li>You may be invoiced for unreturned or damaged regalia.</li>
          <li>If couriering regalia back, include your contact details.</li>
        </ul>
      </div>
    </td>
  </tr>

  <!-- CONTACT FOOTER -->
  <tr>
    <td colspan="2" style="padding-top:25px; border-top:1px solid #ddd;">
      <h3 style="font-size:16px; margin:0 0 10px 0;">Contact Us</h3>

      <p style="font-size:13px; margin:0 0 10px 0;">
        You can click here to <a href="https://masseygowns.org.nz/contact" target="_blank">Contact Us</a>
        and then send us your queries.
      </p>

      <p style="font-size:13px; margin:0;">
        <strong>Customer Service:</strong><br>
        Phone: 06 350 4166<br>
        Hours: 9:00am – 2:30pm, Mon – Thurs
      </p>
    </td>
  </tr>

</table>

</body>
</html>
`.trim();
}

export default function PaymentEmailTemplateEditor({
  apiBase,
  template,
  onSaved,
}) {
  const receiptEditor = useRef(null);

  const [subject, setSubject] = useState("");

  // body text
  const [bodyGreeting, setBodyGreeting] = useState(""); // ignored
  const [bodyMain, setBodyMain] = useState("");
  const [bodyClosing, setBodyClosing] = useState("");

  // tax receipt html (full document)
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

    const existingReceipt = (template.taxReceiptHtml || "").trim();
    const initialReceipt = existingReceipt || defaultPaymentReceiptTemplate();

    // IMPORTANT: fix possible broken structure when loading from DB
    setTaxReceiptHtml(fixCartRowsPlacement(initialReceipt));
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
      // IMPORTANT: fix again before saving (Jodit may reshuffle HTML)
      const fixedReceipt = fixCartRowsPlacement(taxReceiptHtml);

      const payload = {
        subjectTemplate: subject,
        bodyHtml: buildBodyHtml(bodyGreeting, bodyMain, bodyClosing),
        taxReceiptHtml: fixedReceipt,
      };

      const res = await fetch(`${apiBase}/api/emailtemplates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Save failed");

      const updated = await res.json();
      onSaved?.(updated);

      // Keep editor state in sync with what we saved
      setTaxReceiptHtml(fixedReceipt);

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

          {/* Subject */}
          <div className="email-field">
            <label className="email-label">Subject</label>
            <input
              className="email-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject line sent to the customer"
            />
          </div>

          {/* Body content */}
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

          {/* Tax receipt editor */}
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

          {/* Save button + status */}
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
