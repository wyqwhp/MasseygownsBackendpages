import React, { useMemo, useRef, useState, useEffect } from "react";
import AdminNavbar from "@/components/AdminNavbar";
import "./AdminInternalManagementForm.css";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const API_BASE = import.meta.env.VITE_GOWN_API_BASE;

export default function AdminInternalManagementForm() {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [formType, setFormType] = useState("all"); // all | casual | sales
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [loading, setLoading] = useState(false);
  const [forms, setForms] = useState([]);

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  const [printQueue, setPrintQueue] = useState([]);
  const pagesRef = useRef(null);

  const title = useMemo(() => "Internal Management Forms", []);

  useEffect(() => {
    async function loadForms() {
      try {
        const res = await fetch(`${API_BASE}/api/admin/internal-forms`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to load forms (${res.status}): ${text}`);
        }
        const json = await res.json();
        console.log("internal forms:", json);
        setForms(json);
      } catch (err) {
        console.error(err);
      }
    }

    loadForms();
  }, []);

  const filteredForms = useMemo(() => {
    return (forms || [])
      .filter((row) => {
        const type = row.orderType ?? row.type ?? "";

        if (formType !== "all" && type !== formType) return false;

        if (search.trim()) {
          const keyword = search.toLowerCase();
          const target = `${row.name || ""} ${row.address || ""} ${
            row.contactNo || ""
          } ${row.email || ""}${row.orderNo || ""}`.toLowerCase();
          if (!target.includes(keyword)) return false;
        }

        // list endpoint uses orderDate as yyyy-mm-dd (string)
        const od = row.orderDate || row.date || "";
        if (dateFrom && od < dateFrom) return false;
        if (dateTo && od > dateTo) return false;

        return true;
      })
      .sort((a, b) => {
        const getOrderNoNumber = (v) =>
          Number(String(v || "").replace(/\D/g, "")) || 0;

        return getOrderNoNumber(b.orderNo) - getOrderNoNumber(a.orderNo);
      });
  }, [forms, search, dateFrom, dateTo, formType]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, dateFrom, dateTo, formType]);

  const totalPages = Math.ceil(filteredForms.length / PAGE_SIZE);

  const pagedForms = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredForms.slice(start, start + PAGE_SIZE);
  }, [filteredForms, page]);

  function clearFilters() {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setFormType("all");
    setSelectedIds(new Set());
    setPage(1);
  }

  function toggleOne(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // NOTE: This selects ALL filtered results (across pages), not only current page.
  function toggleAllVisible() {
    const visibleIds = filteredForms.map((x) => x.id);
    const allSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  }

  async function onPrint() {
    let sandbox = null;

    try {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) {
        alert("Please select at least one record to print.");
        return;
      }

      setLoading(true);

      // 1) load print-data from backend
      const res = await fetch(
        `${API_BASE}/api/admin/internal-forms/print-data`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to load print data (${res.status}): ${text}`);
      }

      const printData = await res.json();
      console.log("print data from backend:", printData);

      // 2) render hidden pages from backend print data
      setPrintQueue(printData);
      await new Promise((r) => setTimeout(r, 250));

      const pages = Array.from(
        pagesRef.current?.querySelectorAll(".imf-print-page") || []
      );

      if (!pages.length) {
        alert("No pages found to print.");
        return;
      }

      // 3) pdf generation
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      sandbox = createPdfSandbox();

      for (let i = 0; i < pages.length; i++) {
        const canvas = await renderPageToCanvas(pages[i], sandbox);
        const imgData = canvas.toDataURL("image/png");

        const imgProps = pdf.getImageProperties(imgData);
        const imgRatio = imgProps.width / imgProps.height;

        let imgW = pageWidth;
        let imgH = imgW / imgRatio;

        if (imgH > pageHeight) {
          imgH = pageHeight;
          imgW = imgH * imgRatio;
        }

        const x = (pageWidth - imgW) / 2;
        const y = (pageHeight - imgH) / 2;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", x, y, imgW, imgH);
      }

      pdf.save("internal-management-forms.pdf");
      setPrintQueue([]);
    } catch (err) {
      console.error("[IMF] print failed:", err);
      alert("Print failed. Check console for error.");
    } finally {
      if (sandbox) sandbox.remove();
      setLoading(false);
    }
  }

  function createPdfSandbox() {
    const sandbox = document.createElement("div");
    sandbox.id = "imf-pdf-export-sandbox";
    sandbox.style.position = "fixed";
    sandbox.style.left = "-99999px";
    sandbox.style.top = "0";
    sandbox.style.width = "210mm";
    sandbox.style.background = "#fff";
    sandbox.style.zIndex = "-1";

    const style = document.createElement("style");
    style.innerHTML = `
      #imf-pdf-export-sandbox { box-sizing:border-box; font-family: Arial, Helvetica, sans-serif; background:#fff !important; color:#000 !important; }
      #imf-pdf-export-sandbox * { box-sizing:border-box; font-family:inherit; color:#000 !important; background:transparent !important; }
      #imf-pdf-export-sandbox .imf-print-page { width:210mm; height:297mm; padding:14mm; background:#fff !important; }
    `;
    sandbox.appendChild(style);

    document.body.appendChild(sandbox);
    return sandbox;
  }

  async function renderPageToCanvas(pageEl, sandbox) {
    sandbox.querySelectorAll(".imf-print-page").forEach((n) => n.remove());

    const clone = pageEl.cloneNode(true);
    sandbox.appendChild(clone);

    clone
      .querySelectorAll('style, link[rel="stylesheet"]')
      .forEach((n) => n.remove());

    return await html2canvas(clone, {
      scale: 1.25,
      useCORS: true,
      backgroundColor: "#ffffff",
      onclone: (clonedDoc) => {
        // remove oklch()
        clonedDoc.querySelectorAll("style").forEach((styleEl) => {
          const txt = styleEl.textContent || "";
          if (txt.includes("oklch(")) styleEl.remove();
        });
        clonedDoc
          .querySelectorAll('link[rel="stylesheet"]')
          .forEach((lnk) => lnk.remove());

        const safe = clonedDoc.createElement("style");
        safe.innerHTML = `
          html, body { background:#fff !important; color:#000 !important; }
          * {
            background-color: transparent !important;
            color: #000 !important;
            border-color: #000 !important;
            box-shadow: none !important;
            text-shadow: none !important;
            filter: none !important;
          }
        `;
        clonedDoc.head.appendChild(safe);
      },
    });
  }

  const allVisibleSelected =
    filteredForms.length > 0 &&
    filteredForms.every((x) => selectedIds.has(x.id));

  const safeTotalPages = Math.max(1, totalPages || 1);
  const safePage = Math.min(Math.max(1, page), safeTotalPages);

  // keep page in range if data changes
  useEffect(() => {
    if (page !== safePage) setPage(safePage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeTotalPages]);

  return (
    <>
      <AdminNavbar />

      <div className="imf-page">
        <div className="imf-toolbar">
          <div className="imf-toolbar-left">
            <input
              className="imf-search"
              placeholder="Search name/address/email/phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="imf-field">
              <span className="imf-label">From:</span>
              <input
                className="imf-date"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="imf-field">
              <span className="imf-label">To:</span>
              <input
                className="imf-date"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <button className="imf-clear" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>

          <div className="imf-toolbar-right">
            <div className="imf-type">
              <span className="imf-label">Form:</span>
              <select
                className="imf-select"
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
              >
                <option value="all">All</option>
                <option value="casual">Casual Hire (CS1)</option>
                <option value="sales">Sales (CS2)</option>
              </select>
            </div>

            <button className="imf-print" onClick={onPrint} disabled={loading}>
              {loading ? "Printing..." : "Print Forms"}
            </button>
          </div>
        </div>

        <div className="imf-title">{title}</div>

        <table className="imf-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAllVisible}
                />
              </th>
              <th>OrderNo</th>
              <th>Date</th>
              <th>Form Type</th>
              <th>To Name</th>
              <th>Address</th>
              <th>Phone</th>
              <th>Paid</th>
              <th>Amount</th>
            </tr>
          </thead>

          <tbody>
            {pagedForms.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: 16, opacity: 0.6 }}>
                  No records found.
                </td>
              </tr>
            ) : (
              pagedForms.map((row) => {
                return (
                  <tr key={row.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleOne(row.id)}
                      />
                    </td>
                    <td>{row.orderNo}</td>
                    <td>{row.orderDate}</td>
                    <td>{row.orderType}</td>
                    <td>{row.name}</td>
                    <td>{row.address}</td>
                    <td>{row.contactNo}</td>
                    <td>{row.paid ? "Yes" : "No"}</td>
                    <td>{`$${Number(row.amountPaid ?? 0).toFixed(2)}`}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* pagination */}
        <div className="imf-pagination">
          <button
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>

          <span>
            Page {safePage} of {safeTotalPages} ({filteredForms.length} records)
          </span>

          <button
            disabled={safePage >= safeTotalPages}
            onClick={() => setPage((p) => Math.min(safeTotalPages, p + 1))}
          >
            Next
          </button>
        </div>

        {/* hidden print pages */}
        <div
          ref={pagesRef}
          aria-hidden="true"
          style={{
            position: "fixed",
            left: "-99999px",
            top: 0,
            width: "210mm",
            background: "#fff",
            zIndex: -1,
          }}
        >
          {printQueue.map((row, idx) => (
            <div
              key={row.id}
              className="imf-print-page"
              id={`imf-print-page-${idx}`}
            >
              <PrintPage
                row={row}
                pageIndex={idx}
                totalPages={printQueue.length}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function PrintPage({ row }) {
  const heading =
    row.type === "casual" ? "Casual Hire Worksheet" : "Sales Worksheet";

  // backend print-data uses addressLine1
  const address = row.addressLine1 ?? row.address ?? "";

  // use studentId as Access No for now
  const accessNo = row.studentId ?? row.accessNo ?? "";

  return (
    <div className="imf-form">
      <div className="imf-form-heading">{heading}</div>

      <div className="imf-top-grid">
        <div className="imf-left-block">
          <div className="imf-name">{row.name}</div>
          <div className="imf-address">{address}</div>
        </div>

        <div className="imf-right-block">
          <div className="imf-form-date">{row.formDateText}</div>

          <div className="imf-right-kv">
            <RightKVRow label="Access No:" value={accessNo} />
            <RightKVRow label="Receipt No:" value={row.receiptNo || ""} />
            <RightKVRow label="Web Order No:" value={row.webOrderNo || ""} />
            <RightKVRow label="Email:" value={row.email} />
          </div>
        </div>
      </div>

      <div className="imf-contact">
        <b>Contact No:</b> {row.contactNo}
      </div>

      <table className="imf-items">
        <thead>
          <tr>
            <Th className="imf-col-item">Item</Th>
            <Th className="imf-col-size">Regalia</Th>
            <Th className="imf-col-date">Date Sent</Th>
            <Th className="imf-col-date">Date Returned</Th>
          </tr>
        </thead>

        <tbody>
          {(row.items || []).map((it, i) => {
            const itemName = (it.itemName || "").trim() || `SKU ${it.skuId}`;
            const sizeName = (it.sizeName || "").trim();
            const itemType = (it.itemType || "").trim();

            // left: item name + qty
            const left = `${itemName} x${it.quantity}`;

            // regalia: type + size
            const regalia = `${itemType}${sizeName}`.trim();

            return (
              <tr key={i}>
                <Td>{left}</Td>
                <Td className="imf-td-center">{regalia}</Td>
                <Td />
                <Td />
              </tr>
            );
          })}

          <tr>
            <Td colSpan={4} className="imf-paid-row">
              <div className="imf-paid-row-inner">
                <div>Paid</div>
                <div>Amount: ${Number(row.amountPaid || 0).toFixed(2)}</div>
                <div>GST Inclusive</div>
              </div>
            </Td>
          </tr>
        </tbody>
      </table>

      <div className="imf-note">
        <b>Note:</b>
        <div className="imf-hr" />
        <div className="imf-hr" />
      </div>

      <div className="imf-receipt-box">
        <div className="imf-receipt-row">
          <span>Payment made by : Website / Eftpos / Cash / PN</span>
          <span className="imf-fill-line" />
        </div>

        <div className="imf-receipt-row">
          <span>Date paid / invoiced:</span>
          <span className="imf-fill-line" />
          <span>Invoice number:</span>
          <span className="imf-fill-line" />
        </div>

        <div className="imf-receipt-block">Sending Courier Receipt:</div>

        <div className="imf-receipt-block imf-receipt-block-last">
          Return Courier Receipt:
          {row.type === "sales" && (
            <span style={{ marginLeft: 8, fontStyle: "italic" }}>
              not required for sales
            </span>
          )}
        </div>
      </div>

      <div className="imf-ack">
        I acknowledge I am responsible for the care and return of this regalia.
      </div>

      <div className="imf-sign">
        <span>Name:</span>
        <span className="imf-fill-line" />
        <span>Signature:</span>
        <span className="imf-fill-line" />
        <span>Date:</span>
        <span className="imf-fill-line" />
      </div>

      <div className="imf-footer">
        <div>
          Postal Address: Academic Dress Hire, P.O. Box 1713, Palmerston North
          444
          <br />
          Phone: 06 350-41 Email: info@masseygowns.org.nz www.masseygowns.org.nz
        </div>
      </div>
    </div>
  );
}

function RightKVRow({ label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
      <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{value || ""}</span>
    </div>
  );
}

function Th({ children, style }) {
  return (
    <th
      style={{
        border: "0.75px solid #000",
        padding: "8px 10px",
        textAlign: "center",
        fontWeight: 700,
        ...style,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, style, colSpan, className }) {
  return (
    <td
      colSpan={colSpan}
      className={className}
      style={{
        border: "0.75px solid #000",
        padding: "8px 10px",
        verticalAlign: "middle",
        ...style,
      }}
    >
      {children}
    </td>
  );
}
