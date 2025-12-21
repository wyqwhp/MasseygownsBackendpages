import React, { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { fetchAddressLabels } from "../api/LabelApi";
import "./PrintAddressLabels.css";
import AdminNavbar from "@/components/AdminNavbar";

const FROM = {
  title: "Academic Dress Hire",
  line1:
    "3 Refectory Rd, Massey University, Palmerston North 4472, 06 350-4166",
  logoSrc: "/logo.jpg",
};

function chunkArray(arr, size) {
  if (!Array.isArray(arr) || size <= 0) return [];
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function formatDateForTable(value) {
  if (!value) return "";
  try {
    const d = typeof value === "number" ? new Date(value) : new Date(value);
    if (!Number.isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
  } catch {
    // ignore
  }
  return String(value);
}

export default function PrintAddressLabels() {
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [type, setType] = useState("individual"); // individual | institution
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [name, setName] = useState("");

  // Export option (must choose before exporting)
  const [paper, setPaper] = useState(""); // "A4" | "A5" | ""

  // Table pagination
  const [tablePage, setTablePage] = useState(1);
  const pageSize = 10;

  // Hidden printable pages container (not visible on screen)
  const pagesRef = useRef(null);

  const dateLabel = type === "individual" ? "Order date" : "Despatch date";

  // Prevent overlapping requests: only last request updates UI
  const requestSeqRef = useRef(0);

  const loadLabels = async (opts) => {
    const payload = opts || { type, dateFrom, dateTo, name };

    const mySeq = ++requestSeqRef.current;
    setLoading(true);

    try {
      const data = await fetchAddressLabels(payload);
      if (mySeq !== requestSeqRef.current) return; // ignore stale responses
      setLabels(Array.isArray(data) ? data : []);
      setTablePage(1);
    } catch (err) {
      if (mySeq !== requestSeqRef.current) return;
      console.error(err);
      alert("Failed to load labels");
    } finally {
      if (mySeq === requestSeqRef.current) setLoading(false);
    }
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setName("");
  };

  // Initial load
  useEffect(() => {
    loadLabels({ type, dateFrom, dateTo, name });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto search when typing name OR switching type (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      loadLabels({ type, dateFrom, dateTo, name });
    }, 350);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, type]);

  // If date filters change, auto search too (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      loadLabels({ type, dateFrom, dateTo, name });
    }, 350);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  const displayLabels = useMemo(() => {
    return (labels || []).map((l) => ({
      ...l,
      toName: (l.toName || "").trim(),
      attn: (l.attn || "").trim(),
      phone: (l.phone || "").trim(),
      address1: (l.address1 || "").trim(),
      address2: (l.address2 || "").trim(),
      city: (l.city || "").trim(),
      postcode: (l.postcode || "").trim(),
    }));
  }, [labels]);

  // Field mappers (backend now returns orderDate/orderNumber/orderType; orderNumber uses id for now)
  const getOrderDate = (l) => l.orderDate || l.order_date || "";
  const getOrderNumber = (l) =>
    l.orderNumber || l.order_number || l.sourceId || "";
  // OrderType column removed from table, but labelType still used for keys

  // Table (client-side pagination)
  const totalRows = displayLabels.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const tableRows = useMemo(() => {
    const start = (tablePage - 1) * pageSize;
    return displayLabels.slice(start, start + pageSize);
  }, [displayLabels, tablePage]);

  // Printable pages for export only
  const labelsPerPage = paper === "A4" ? 9 : 6;
  const labelPages = useMemo(() => {
    if (!paper) return [];
    return chunkArray(displayLabels, labelsPerPage);
  }, [displayLabels, labelsPerPage, paper]);

  const exportPdf = async () => {
    if (!paper) {
      alert("Please select A4 or A5 before exporting PDF.");
      return;
    }

    try {
      if (!pagesRef.current) return;

      setLoading(true);

      const isA4 = paper === "A4";
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: isA4 ? "a4" : "a5",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const pageEls = pagesRef.current.querySelectorAll(".pdf-page");
      if (!pageEls.length) {
        alert("No labels to export.");
        return;
      }

      const sandbox = document.createElement("div");
      sandbox.setAttribute("id", "pdf-export-sandbox");
      sandbox.style.position = "fixed";
      sandbox.style.left = "-99999px";
      sandbox.style.top = "0";
      sandbox.style.width = isA4 ? "210mm" : "148mm";
      sandbox.style.background = "#fff";
      sandbox.style.zIndex = "-1";
      document.body.appendChild(sandbox);

      const style = document.createElement("style");
      style.innerHTML = `
        #pdf-export-sandbox, #pdf-export-sandbox * {
          all: initial;
          box-sizing: border-box;
          font-family: Arial, Helvetica, sans-serif;
          color: #000 !important;
          background: #fff !important;
        }

        #pdf-export-sandbox .pdf-page {
          width: ${isA4 ? "210mm" : "148mm"};
          min-height: ${isA4 ? "297mm" : "210mm"};
          padding: 8mm;
          background: #fff;
        }

        #pdf-export-sandbox .labels-grid {
          display: grid;
          grid-template-columns: ${isA4 ? "repeat(3, 1fr)" : "repeat(2, 1fr)"};
          gap: 6mm;
        }

        #pdf-export-sandbox .label-card {
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 4.5mm;
          background: #fff;
        }

        #pdf-export-sandbox .label-card-big {
          min-height: 62mm;
          display: flex;
          flex-direction: column;
        }

        #pdf-export-sandbox .to-name {
          font-weight: 800;
          font-size: 16pt;
          line-height: 1.1;
          margin-bottom: 2.5mm;
        }

        #pdf-export-sandbox .addr-line { line-height: 1.1; }
        #pdf-export-sandbox .addr1 {
          font-weight: 800;
          font-size: 18pt;
          margin-bottom: 1.5mm;
        }
        #pdf-export-sandbox .addr2 {
          font-weight: 700;
          font-size: 14pt;
          margin-bottom: 1.5mm;
        }
        #pdf-export-sandbox .citypost {
          font-weight: 900;
          font-size: 22pt;
          letter-spacing: 0.5px;
          margin: 1mm 0 3mm;
        }

        #pdf-export-sandbox .attn-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 6mm;
          margin-bottom: 2.5mm;
        }
        #pdf-export-sandbox .attn-text { font-weight: 700; font-size: 12pt; }
        #pdf-export-sandbox .phone-text { font-size: 10pt; opacity: 0.9; }

        #pdf-export-sandbox .from-sep {
          margin-top: auto;
          border-top: 2px solid #111;
          margin-bottom: 2.5mm;
        }

        #pdf-export-sandbox .from-area {
          display: flex;
          flex-direction: column;
          gap: 2mm;
        }
        #pdf-export-sandbox .from-label { font-weight: 700; font-size: 10pt; }
        #pdf-export-sandbox .from-logo-big {
          width: 55mm;
          height: auto;
          object-fit: contain;
        }
        #pdf-export-sandbox .from-footer {
          font-size: 9.5pt;
          line-height: 1.2;
          font-weight: 600;
        }
      `;
      sandbox.appendChild(style);

      for (let i = 0; i < pageEls.length; i++) {
        sandbox.querySelectorAll(".pdf-page").forEach((n) => n.remove());

        const clone = pageEls[i].cloneNode(true);
        sandbox.appendChild(clone);

        const imgs = Array.from(sandbox.querySelectorAll("img"));
        await Promise.all(
          imgs.map(
            (img) =>
              new Promise((resolve) => {
                if (img.complete && img.naturalWidth > 0) return resolve();
                img.onload = () => resolve();
                img.onerror = () => resolve();
              })
          )
        );

        const canvas = await html2canvas(clone, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          onclone: (clonedDoc) => {
            clonedDoc.documentElement.style.background = "#fff";
            clonedDoc.body.style.background = "#fff";
            clonedDoc.body.style.color = "#000";

            const sandboxEl = clonedDoc.getElementById("pdf-export-sandbox");
            const keep = new Set();
            if (sandboxEl) {
              sandboxEl.querySelectorAll("style").forEach((s) => keep.add(s));
            }

            clonedDoc
              .querySelectorAll('link[rel="stylesheet"], style')
              .forEach((node) => {
                if (!keep.has(node)) node.remove();
              });

            const s = clonedDoc.createElement("style");
            s.innerHTML = `
              html, body { background:#fff !important; color:#000 !important; }
              * { background:#fff !important; color:#000 !important; border-color:#ddd !important; }
            `;
            clonedDoc.head.appendChild(s);
          },
        });

        const imgData = canvas.toDataURL("image/png");
        if (!imgData || !imgData.startsWith("data:image/png")) {
          throw new Error("Invalid image data from canvas");
        }

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

      pdf.save(`address-labels-${type}-${paper}.pdf`);
      sandbox.remove();
    } catch (e) {
      console.error(e);
      alert("PDF export failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AdminNavbar />
      <div className="labels-admin-page">
        <div className="labels-toolbar">
          <div className="labels-toolbar-left">
            <input
              className="search-input"
              placeholder="Search queries..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="date-group">
              <span className="date-label">From:</span>
              <input
                type="date"
                className="date-input"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                aria-label={`${dateLabel} from`}
              />
            </div>

            <div className="date-group">
              <span className="date-label">To:</span>
              <input
                type="date"
                className="date-input"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                aria-label={`${dateLabel} to`}
              />
            </div>

            <button
              className="btn btn-outline"
              onClick={() => {
                clearFilters();
                // Auto-search will run via the effects
              }}
              disabled={loading}
            >
              Clear Filters
            </button>

            <div className="paper-choice" aria-label="Paper size choice">
              <span className="paper-choice-label">Paper:</span>
              <label className={`paper-pill ${paper === "A4" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="paper"
                  value="A4"
                  checked={paper === "A4"}
                  onChange={() => setPaper("A4")}
                />
                A4
              </label>
              <label className={`paper-pill ${paper === "A5" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="paper"
                  value="A5"
                  checked={paper === "A5"}
                  onChange={() => setPaper("A5")}
                />
                A5
              </label>
            </div>

            <button
              className="btn btn-success"
              onClick={exportPdf}
              disabled={loading || !paper}
              title={!paper ? "Select A4 or A5 first" : "Export labels to PDF"}
            >
              Export PDF
            </button>
          </div>

          <div className="labels-toolbar-right">
            <div className="toolbar-meta">Total: {totalRows} records</div>

            <div className="tiny-filters">
              <div className="tiny-filter">
                <span>Type</span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="tiny-select"
                >
                  <option value="individual">Individual</option>
                  <option value="institution">Institution</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table className="labels-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th style={{ width: 130 }}>Order Date</th>
                <th style={{ width: 150 }}>Order Number</th>
                <th>To Name</th>
                <th>Address</th>
                <th style={{ width: 150 }}>City</th>
                <th style={{ width: 120 }}>Postcode</th>
                <th style={{ width: 180 }}>Attn</th>
                <th style={{ width: 160 }}>Phone</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="table-empty">
                    Loading…
                  </td>
                </tr>
              ) : tableRows.length ? (
                tableRows.map((l, idx) => (
                  <tr key={`${l.labelType}-${l.sourceId}`}>
                    <td>{(tablePage - 1) * pageSize + idx + 1}</td>
                    <td>{formatDateForTable(getOrderDate(l)) || "-"}</td>
                    <td className="td-mono">
                      {String(getOrderNumber(l) || "-")}
                    </td>
                    <td className="td-strong">{l.toName || "-"}</td>
                    <td>
                      <div className="addr-cell">
                        <div>{l.address1 || "-"}</div>
                        {l.address2 ? (
                          <div className="muted">{l.address2}</div>
                        ) : null}
                      </div>
                    </td>
                    <td>{l.city || "-"}</td>
                    <td>{l.postcode || "-"}</td>
                    <td>{l.attn || "-"}</td>
                    <td>{l.phone || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="table-empty">
                    No results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="table-pagination">
            <button
              className="btn btn-outline"
              disabled={tablePage <= 1 || loading}
              onClick={() => setTablePage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>

            <div className="page-indicator">
              Page {tablePage} of {totalPages}
            </div>

            <button
              className="btn btn-outline"
              disabled={tablePage >= totalPages || loading}
              onClick={() => setTablePage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>

        <div className="print-dom-hidden" aria-hidden="true">
          <div className="pdf-pages" ref={pagesRef}>
            {labelPages.map((pageLabels, pageIndex) => (
              <div className="pdf-page" key={`page-${pageIndex}`}>
                <div
                  className={`labels-grid ${
                    paper === "A5" ? "grid-a5" : "grid-a4"
                  }`}
                >
                  {pageLabels.map((l) => (
                    <AddressLabelCard
                      key={`${l.labelType}-${l.sourceId}`}
                      label={l}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function AddressLabelCard({ label }) {
  const toName = label.toName || "";
  const address1 = label.address1 || "";
  const address2 = label.address2 || "";
  const city = label.city || "";
  const postcode = label.postcode || "";
  const attn = label.attn || "";
  const phone = label.phone || "";

  const cityPost = [city, postcode].filter(Boolean).join(" ").toUpperCase();

  return (
    <div className="label-card label-card-big">
      <div className="to-name">{toName}</div>

      <div className="addr-line addr1">{address1}</div>
      {address2 ? <div className="addr-line addr2">{address2}</div> : null}

      <div className="addr-line citypost">{cityPost}</div>

      {(attn || phone) && (
        <div className="attn-row">
          <div className="attn-text">{attn ? `Attn: ${attn}` : ""}</div>
          <div className="phone-text">{phone || ""}</div>
        </div>
      )}

      <div className="from-sep" />

      <div className="from-area">
        <div className="from-label">From:</div>
        <img className="from-logo-big" src={FROM.logoSrc} alt={FROM.title} />
        <div className="from-footer">{FROM.line1}</div>
      </div>
    </div>
  );
}
