import React, { useEffect, useState } from "react";
import "./EmailEdit.css";

const API_BASE = import.meta.env.VITE_GOWN_API_BASE;

/**
 * Parse bodyHtml into three simple text blocks:
 *  - greeting
 *  - main
 *  - closing
 */
function parseBodyHtml(html) {
  const result = {
    greeting: "",
    main: "",
    closing: "",
  };
  if (!html) return result;

  try {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    const ps = Array.from(wrapper.querySelectorAll("p"));

    if (ps[0]) {
      result.greeting = ps[0].textContent.trim();
    }
    if (ps[1]) {
      result.main = ps[1].textContent.trim();
    }
    if (ps[2]) {
      // For closing we want to preserve line breaks from <br> tags
      const inner = ps[2].innerHTML || "";
      const withNewlines = inner.replace(/<br\s*\/?>/gi, "\n");
      const textOnly = withNewlines.replace(/<[^>]+>/g, "");
      result.closing = textOnly.trim();
    }
  } catch (e) {
    console.warn("Failed to parse body html", e);
  }

  return result;
}

/**
 * Parse taxReceiptHtml into:
 *  - eventTitle
 *  - fromBlock (Invoice From block, as multiline text)
 *  - notes: up to 4 bullet points
 */
function parseTaxReceiptHtml(html) {
  const result = {
    eventTitle: "",
    fromBlock: "",
    notes: ["", "", "", ""],
  };

  if (!html) return result;

  try {
    const div = document.createElement("div");
    div.innerHTML = html;

    // Event title: the TD with the blue left border
    const eventTd = div.querySelector('td[style*="border-left"]');
    if (eventTd) {
      result.eventTitle = eventTd.textContent.trim();
    }

    // Invoice From block: <h3>Invoice From:</h3> followed by <p>
    const allH3 = Array.from(div.querySelectorAll("h3"));
    const invoiceFromH3 = allH3.find((h) =>
      h.textContent.toLowerCase().includes("invoice from")
    );
    if (invoiceFromH3) {
      const p = invoiceFromH3.nextElementSibling;
      if (p && p.tagName === "P") {
        result.fromBlock = p.textContent.replace(/\r?\n\s*/g, "\n").trim();
      }
    }

    // Notes: first <ul> list items
    const ul = div.querySelector("ul");
    if (ul) {
      const lis = Array.from(ul.querySelectorAll("li"));
      lis.forEach((li, idx) => {
        if (idx < 4) {
          result.notes[idx] = li.textContent.trim();
        }
      });
    }
  } catch (e) {
    console.warn("Failed to parse tax receipt html", e);
  }

  return result;
}

/**
 * Build bodyHtml from three text blocks.
 * We escape HTML and convert newlines in the closing into <br/>.
 */
function buildBodyHtml(greeting, main, closing) {
  const escape = (str) =>
    (str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const closingHtml = (closing || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => escape(line))
    .join("<br/>");

  return `
<p>${escape(greeting)}</p>
<p>${escape(main)}</p>
<p>${closingHtml}</p>
`.trim();
}

/**
 * Build taxReceiptHtml from:
 *   eventTitle, fromBlock (multiline), notes[4]
 * This keeps the layout in HTML but lets business users edit text only.
 */
function buildTaxReceiptHtml(eventTitle, fromBlock, notes) {
  const escape = (str) =>
    (str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const formatLinesToHtml = (text) =>
    (text || "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => escape(l))
      .join("<br/>\n                ");

  const notesHtml = (notes || [])
    .filter((n) => n && n.trim())
    .map((n) => `<li>${escape(n.trim())}</li>`)
    .join("\n              ");

  const fromBlockHtml = formatLinesToHtml(fromBlock);

  return `
<table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
  <tr>
    <td align="center">

      <table width="650" cellpadding="0" cellspacing="0" style="background:white; border-radius:8px; padding:30px;">

        <tr>
          <td style="border-bottom:2px solid #333; padding-bottom:15px;">
            <h1 style="margin:0; font-size:26px; color:#333;">Tax Receipt</h1>
            <p style="margin:4px 0; font-size:14px; color:#555;">GST Number: <strong>{{GstNumber}}</strong></p>
            <p style="margin:4px 0; font-size:14px; color:#555;">Invoice Number: <strong>{{InvoiceNumber}}</strong></p>
            <p style="margin:4px 0; font-size:14px; color:#555;">Invoice Date: <strong>{{InvoiceDate}}</strong></p>
          </td>
        </tr>

        <tr>
          <td style="padding-top:25px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>

                <td width="50%" valign="top">
                  <h3 style="margin:0 0 8px 0; font-size:16px;">Invoice To:</h3>
                  <p style="margin:0; line-height:1.6;">
                    <strong>{{FirstName}} {{LastName}}</strong><br/>
                    {{Address}}<br/>
                    {{City}}, {{Postcode}}<br/>
                    {{Country}}<br/><br/>
                    <strong>Student ID:</strong> {{StudentId}}<br/>
                    <strong>Email:</strong> {{Email}}
                  </p>
                </td>

                <td width="50%" valign="top">
                  <h3 style="margin:0 0 8px 0; font-size:16px;">Invoice From:</h3>
                  <p style="margin:0; line-height:1.6;">
                    ${fromBlockHtml}
                  </p>
                </td>

              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="margin-top:30px; background:#eef3ff; padding:12px; border-left:4px solid #1e40af; font-weight:bold;">
            ${escape(eventTitle || "")}
          </td>
        </tr>

        <tr>
          <td style="padding-top:25px;">
            <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">

              <thead>
                <tr style="background:#333; color:white;">
                  <th align="left" style="padding:10px;">Item</th>
                  <th align="center" style="padding:10px;">Qty</th>
                  <th align="right" style="padding:10px;">Price</th>
                  <th align="right" style="padding:10px;">GST</th>
                  <th align="right" style="padding:10px;">Total</th>
                </tr>
              </thead>

              <tbody>
                {{CartRows}}
              </tbody>

            </table>
          </td>
        </tr>

        <tr>
          <td style="padding-top:30px;">
            <table width="100%" cellpadding="8" cellspacing="0">

              <tr>
                <td align="right" style="font-size:16px;">Grand Total:</td>
                <td align="right" style="font-size:18px; font-weight:bold; width:150px;">
                  {{ Total }}
                </td>
              </tr>

              <tr style="background:#e8f4e8;">
                <td align="right" style="font-size:16px; color:#2d7a2d;">Amount Paid:</td>
                <td align="right" style="font-size:18px; font-weight:bold; color:#2d7a2d; width:150px;">
                  {{ AmountPaid }}
                </td>
              </tr>

              <tr style="background:#f7f7f7;">
                <td align="right" style="font-size:16px;">Balance Owing:</td>
                <td align="right" style="font-size:18px; font-weight:bold; width:150px;">
                  {{ BalanceOwing }}
                </td>
              </tr>

            </table>
          </td>
        </tr>

        <tr>
          <td style="margin-top:20px; background:#fff8e1; padding:15px; border:1px solid #ffe28a;">
            <strong style="font-size:15px;">Important Notes:</strong>
            <ul style="padding-left:18px; line-height:1.7; font-size:14px;">
              ${notesHtml}
            </ul>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding-top:25px; font-size:12px; color:#888;">
            Academic Dress Hire | Massey University
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
`.trim();
}

export default function EmailEdit() {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);

  const [subject, setSubject] = useState("");

  // Body text blocks for business users
  const [bodyGreeting, setBodyGreeting] = useState("");
  const [bodyMain, setBodyMain] = useState("");
  const [bodyClosing, setBodyClosing] = useState("");

  // Tax receipt text blocks
  const [eventTitle, setEventTitle] = useState("");
  const [fromBlock, setFromBlock] = useState("");
  const [note1, setNote1] = useState("");
  const [note2, setNote2] = useState("");
  const [note3, setNote3] = useState("");
  const [note4, setNote4] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // { type: "success" | "error", message }

  // Load templates once on mount
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
          applyTemplateToState(data[0]);
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

  /**
   * Apply a template object to all local state:
   * subject, body parts, receipt parts.
   */
  const applyTemplateToState = (tpl) => {
    setSelected(tpl);
    setSubject(tpl.subjectTemplate || "");

    // Body
    const bodyParts = parseBodyHtml(tpl.bodyHtml || "");
    setBodyGreeting(bodyParts.greeting || "Hi {{FirstName}},");
    setBodyMain(bodyParts.main || "Thank you for your payment...");
    setBodyClosing(bodyParts.closing || "Regards,\nAcademic Dress Hire");

    // Tax receipt
    const receiptParts = parseTaxReceiptHtml(tpl.taxReceiptHtml || "");
    setEventTitle(
      receiptParts.eventTitle || "Massey University Graduation Event"
    );
    setFromBlock(
      receiptParts.fromBlock ||
        "Academic Dress Hire\nRefectory Rd, University Ave,\nMassey University, Tennent Drive\nPalmerston North\nTel: +64 6 350 4166"
    );
    setNote1(
      receiptParts.notes[0] ||
        "Please bring this receipt when collecting regalia."
    );
    setNote2(
      receiptParts.notes[1] ||
        "Regalia must be returned by the due date to avoid extra fees."
    );
    setNote3(
      receiptParts.notes[2] ||
        "You will be invoiced for unreturned or damaged regalia."
    );
    setNote4(
      receiptParts.notes[3] ||
        "If couriering regalia back, include your contact details."
    );
  };

  const handleSelect = (tpl) => {
    setStatus(null);
    applyTemplateToState(tpl);
  };

  // Save template: build HTML from simple fields then PUT to API
  const handleSave = async () => {
    if (!selected) return;

    setSaving(true);
    setStatus(null);

    try {
      const newBodyHtml = buildBodyHtml(bodyGreeting, bodyMain, bodyClosing);
      const newTaxReceiptHtml = buildTaxReceiptHtml(eventTitle, fromBlock, [
        note1,
        note2,
        note3,
        note4,
      ]);

      const payload = {
        subjectTemplate: subject,
        bodyHtml: newBodyHtml,
        taxReceiptHtml: newTaxReceiptHtml,
      };

      const res = await fetch(`${API_BASE}/api/emailtemplates/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Save failed");
      }

      const updated = await res.json();

      setTemplates((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
      applyTemplateToState(updated);

      setStatus({ type: "success", message: "Changes saved." });
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: "Failed to save changes." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="email-admin-page">
      <h1 className="email-page-title">Email Templates</h1>

      {loading ? (
        <p className="email-status">Loading email templates…</p>
      ) : (
        <div className="email-layout">
          {/* Left: template list */}
          <div className="email-list-card">
            <div className="email-list-header">Templates</div>
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

          {/* Right: editor */}
          <div className="email-editor-card">
            {selected ? (
              <>
                <h2 className="email-editor-title">
                  {selected.name || "Email template"}
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

                <div className="email-field">
                  <label className="email-label">Closing</label>
                  <textarea
                    className="email-textarea"
                    value={bodyClosing}
                    onChange={(e) => setBodyClosing(e.target.value)}
                    placeholder={"Regards,\nAcademic Dress Hire"}
                  />
                </div>

                {/* Tax receipt content */}
                <p className="email-hint">
                  <strong>Tax receipt content</strong> – these fields control
                  the text in the tax receipt shown below the body.
                </p>

                <div className="email-field">
                  <label className="email-label">Event title</label>
                  <input
                    className="email-input"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Massey University Graduation Event"
                  />
                </div>

                <div className="email-field">
                  <label className="email-label">Invoice From block</label>
                  <textarea
                    className="email-textarea"
                    value={fromBlock}
                    onChange={(e) => setFromBlock(e.target.value)}
                    placeholder={
                      "Academic Dress Hire\nRefectory Rd, University Ave,\nMassey University, Tennent Drive\nPalmerston North\nTel: +64 6 350 4166"
                    }
                  />
                </div>

                <div className="email-field">
                  <label className="email-label">Note 1</label>
                  <input
                    className="email-input"
                    value={note1}
                    onChange={(e) => setNote1(e.target.value)}
                  />
                </div>
                <div className="email-field">
                  <label className="email-label">Note 2</label>
                  <input
                    className="email-input"
                    value={note2}
                    onChange={(e) => setNote2(e.target.value)}
                  />
                </div>
                <div className="email-field">
                  <label className="email-label">Note 3</label>
                  <input
                    className="email-input"
                    value={note3}
                    onChange={(e) => setNote3(e.target.value)}
                  />
                </div>
                <div className="email-field">
                  <label className="email-label">Note 4</label>
                  <input
                    className="email-input"
                    value={note4}
                    onChange={(e) => setNote4(e.target.value)}
                  />
                </div>

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
        </div>
      )}
    </div>
  );
}
