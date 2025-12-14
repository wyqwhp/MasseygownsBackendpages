import React, { useEffect, useState } from "react";

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

function parseTaxReceiptHtml(html) {
  const result = {
    eventTitle: "",
    headerFromBlock: "",
    invoiceFromBlock: "",
    footerText: "",
  };

  if (!html) return result;

  try {
    const div = document.createElement("div");
    div.innerHTML = html;

    const eventTd = div.querySelector('td[style*="border-left"]');
    if (eventTd) {
      result.eventTitle = eventTd.textContent.trim();
    }

    const headerTd = div.querySelector('td[data-adh="header-address"]');
    if (headerTd) {
      result.headerFromBlock = headerTd.textContent
        .replace(/\r?\n\s*/g, "\n")
        .trim();
    }

    // Invoice From
    const invoiceFromTd = div.querySelector('td[data-adh="invoice-from"]');
    if (invoiceFromTd) {
      let text = invoiceFromTd.textContent.replace(/\r?\n\s*/g, "\n").trim();

      const lines = text.split(/\r?\n/);
      // strip leading "Invoice From:" line if it exists
      if (lines.length && /^invoice from:/i.test(lines[0].trim())) {
        lines.shift();
      }

      result.invoiceFromBlock = lines.join("\n").trim();
    }

    // Fallback for older HTML without data-adh
    if (!result.invoiceFromBlock) {
      const allH3 = Array.from(div.querySelectorAll("h3"));
      const invoiceFromH3 = allH3.find((h) =>
        h.textContent.toLowerCase().includes("invoice from")
      );
      if (invoiceFromH3) {
        const p = invoiceFromH3.nextElementSibling;
        if (p && p.tagName === "P") {
          result.invoiceFromBlock = p.textContent
            .replace(/\r?\n\s*/g, "\n")
            .trim();
        }
      }
    }

    if (!result.headerFromBlock && result.invoiceFromBlock) {
      result.headerFromBlock = result.invoiceFromBlock;
    }
    if (!result.invoiceFromBlock && result.headerFromBlock) {
      result.invoiceFromBlock = result.headerFromBlock;
    }

    const ul = div.querySelector("ul");
    if (ul) {
      const lis = Array.from(ul.querySelectorAll("li"));
      const lines = lis
        .map((li) => li.textContent.trim())
        .filter((t) => t.length > 0);
      result.footerText = lines.join("\n");
    }
  } catch (e) {
    console.warn("Failed to parse tax receipt html", e);
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
  if (mainHtml) {
    parts.push(`<p>${mainHtml}</p>`);
  }
  if (closingHtml) {
    parts.push(`<p>${closingHtml}</p>`);
  }

  return parts.join("\n");
}

// --------- taxReceiptHtml footerText  ----------
function buildTaxReceiptHtml(
  eventTitle,
  headerFromBlock,
  invoiceFromBlock,
  footerText
) {
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

  const footerLines = (footerText || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const notesHtml = footerLines
    .map((line) => `<li>${escape(line)}</li>`)
    .join("\n              ");

  const headerFromHtml = formatLinesToHtml(headerFromBlock || invoiceFromBlock);
  const invoiceFromHtml = formatLinesToHtml(
    invoiceFromBlock || headerFromBlock
  );

  return `
<table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
  <tr>
    <td align="center">

      <table width="650" cellpadding="0" cellspacing="0" style="background:white; border-radius:8px; padding:30px;">

        <!-- Row 1: centered title -->
        <tr>
          <td colspan="2" style="padding-bottom:5px; text-align:center;">
            <h1
              style="margin:0; font-size:26px; color:#333; text-align:center;"
            >
              Tax Receipt
            </h1>
          </td>
        </tr>

        <!-- Row 2: left = GST / invoice details, right = header address -->
        <tr>
          <td width="50%" valign="top" style="border-bottom:2px solid #333; padding-bottom:15px;">
            <p style="margin:4px 0; font-size:14px; color:#555;">GST Number: <strong>{{GstNumber}}</strong></p>
            <p style="margin:4px 0; font-size:14px; color:#555;">Invoice Number: <strong>{{InvoiceNumber}}</strong></p>
            <p style="margin:4px 0; font-size:14px; color:#555;">Invoice Date: <strong>{{InvoiceDate}}</strong></p>
          </td>
          <td
            width="50%"
            valign="top"
            data-adh="header-address"
            style="border-bottom:2px solid #333; padding-bottom:15px; text-align:right;"
          >
            <p style="margin:0; line-height:1.6; text-align:right;">
              ${headerFromHtml}
            </p>
          </td>
        </tr>

        <!-- Invoice to/from row -->
        <tr>
          <td style="padding-top:25px;" colspan="2">
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

                <td
                  width="50%"
                  valign="top"
                  data-adh="invoice-from"
                  style="text-align:right;"
                >
                  <h3 style="margin:0 0 8px 0; font-size:16px;">Invoice From:</h3>
                  <p style="margin:0; line-height:1.6; text-align:right;">
                    ${invoiceFromHtml}
                  </p>
                </td>

              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="margin-top:30px; background:#eef3ff; padding:12px; border-left:4px solid #1e40af; font-weight:bold;" colspan="2">
            {{EventTitle}}
          </td>
        </tr>

        <tr>
          <td style="padding-top:25px;" colspan="2">
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
          <td style="padding-top:30px;" colspan="2">
            <table width="100%" cellpadding="8" cellspacing="0">

              <tr>
                <td align="right" style="font-size:16px;">Grand Total:</td>
                <td align="right" style="font-size:18px; font-weight:bold; width:150px;">
                  {{Total}}
                </td>
              </tr>

              <tr style="background:#e8f4e8;">
                <td align="right" style="font-size:16px; color:#2d7a2d;">Amount Paid:</td>
                <td align="right" style="font-size:18px; font-weight:bold; color:#2d7a2d; width:150px;">
                  {{AmountPaid}}
                </td>
              </tr>

              <tr style="background:#f7f7f7;">
                <td align="right" style="font-size:16px;">Balance Owing:</td>
                <td align="right" style="font-size:18px; font-weight:bold; width:150px;">
                  {{BalanceOwing}}
                </td>
              </tr>

            </table>
          </td>
        </tr>

        <tr>
          <td style="margin-top:20px; background:#fff8e1; padding:15px; border:1px solid #ffe28a;" colspan="2">
            <strong style="font-size:15px;">Important Notes:</strong>
            <ul style="padding-left:18px; line-height:1.7; font-size:14px;">
              ${notesHtml}
            </ul>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding-top:25px; font-size:12px; color:#888;" colspan="2">
            Academic Dress Hire | Massey University
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
`.trim();
}

// ---- component ---------------------------------------------------

export default function PaymentEmailTemplateEditor({
  apiBase,
  template,
  onSaved,
}) {
  const [subject, setSubject] = useState("");

  // body text
  const [bodyGreeting, setBodyGreeting] = useState(""); // no longer used
  const [bodyMain, setBodyMain] = useState("");
  const [bodyClosing, setBodyClosing] = useState("");

  // tax receipt text
  const [eventTitle, setEventTitle] = useState("");
  const [headerFromBlock, setHeaderFromBlock] = useState("");
  const [fromBlock, setFromBlock] = useState("");
  const [footerText, setFooterText] = useState("");

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  // when template changes, populate state
  useEffect(() => {
    if (!template) return;

    setStatus(null);
    setSubject(template.subjectTemplate || "");

    const bodyParts = parseBodyHtml(template.bodyHtml || "");
    // ignore old greeting like "dear customer"
    setBodyGreeting("");
    setBodyMain(bodyParts.main || "");
    setBodyClosing("");

    const receiptParts = parseTaxReceiptHtml(template.taxReceiptHtml || "");
    setEventTitle(receiptParts.eventTitle || "");

    const defaultFrom =
      "Academic Dress Hire\n3 Refectory Rd,\nMassey University,\nPalmerston North 4472\nTel: +64 6 350 4166";

    setHeaderFromBlock(
      receiptParts.headerFromBlock ||
        receiptParts.invoiceFromBlock ||
        defaultFrom
    );
    setFromBlock(
      receiptParts.invoiceFromBlock ||
        receiptParts.headerFromBlock ||
        defaultFrom
    );

    const defaultFooter =
      receiptParts.footerText ||
      [
        "Please bring this receipt when collecting regalia.",
        "Regalia must be returned by the due date to avoid extra fees.",
        "You will be invoiced for unreturned or damaged regalia.",
        "If couriering regalia back, include your contact details.",
      ].join("\n");

    setFooterText(defaultFooter);
  }, [template]);

  const handleSave = async () => {
    if (!template) return;

    setSaving(true);
    setStatus(null);

    try {
      const newBodyHtml = buildBodyHtml(bodyGreeting, bodyMain, bodyClosing);
      const newTaxReceiptHtml = buildTaxReceiptHtml(
        eventTitle,
        headerFromBlock,
        fromBlock,
        footerText
      );

      const payload = {
        subjectTemplate: subject,
        bodyHtml: newBodyHtml,
        taxReceiptHtml: newTaxReceiptHtml,
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

      if (onSaved) {
        onSaved(updated);
      }

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

          {/* Tax receipt content */}
          <p className="email-hint">
            <strong>Tax receipt content</strong> – these fields control the text
            in the tax receipt shown below the body.
          </p>

          {/* Event title field intentionally removed – comes from ceremony */}

          <div className="email-field">
            <label className="email-label">Header address (top right)</label>
            <textarea
              className="email-textarea"
              value={headerFromBlock}
              onChange={(e) => setHeaderFromBlock(e.target.value)}
              placeholder={
                "Academic Dress Hire\n3 Refectory Rd,\nMassey University,\nPalmerston North 4472\nTel: +64 6 350 4166"
              }
            />
          </div>

          <div className="email-field">
            <label className="email-label">Invoice From block</label>
            <textarea
              className="email-textarea"
              value={fromBlock}
              onChange={(e) => setFromBlock(e.target.value)}
              placeholder={
                "Academic Dress Hire\n3 Refectory Rd,\nMassey University,\nPalmerston North 4472\nTel: +64 6 350 4166"
              }
            />
          </div>

          <div className="email-field">
            <label className="email-label">Footer</label>
            <textarea
              className="email-textarea"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder={
                "Each line here will appear as a bullet point in the receipt footer."
              }
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
  );
}
