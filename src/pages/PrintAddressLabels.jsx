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

/**
 * Each paper size is configured independently
 */
const PAPER_PRESETS = {
  A4: {
    jsPdf: { orientation: "portrait", unit: "mm", format: "a4" },
    page: { widthMm: "210mm", minHeightMm: "297mm", paddingMm: "3mm" },
    grid: { templateColumns: "repeat(2, 1fr)", gapMm: "3mm" },
    label: {
      heightMm: 66,
      border: "1px solid #ddd",
      radiusMm: "6px",
      paddingMm: "3.5mm",
      paddingTopMm: "1mm",
    },
    font: {
      toNamePt: 11.66,
      addrPt: 15,
      cityPostPt: 20,
      attnPt: 10,
      phonePt: 5,
      fromLabelPt: 5,
      fromFooterPt: 5,
      logoWidthMm: 52,
      logoMaxHeightMm: 12,
      cityPostLetterSpacingPx: 0.4,

      toNamePaddingTopMm: 0.1,
      addr1PaddingTopMm: 2.5,
      addr2PaddingTopMm: 0.1,
      addrMarginBottomMm: 2,
      cityPostMarginTopMm: 0.1,
      cityPostMarginBottomMm: 2.4,
      fromAreaGapMm: 1.6,
      fromLabelMarginBottomMm: 0.1,
      fromFooterMarginTopMm: 0.2,
      labelTopLineHeight: 1.3,
      addrLineLineHeight: 0.85,
    },
    clamp: { enable: true, toNameLines: 2, addrLines: 2 },
    special120: { enable: false },
  },

  A5: {
    jsPdf: { orientation: "portrait", unit: "mm", format: "a5" },
    page: { widthMm: "148mm", minHeightMm: "210mm", paddingMm: "3mm" },

    // A5
    grid: { templateColumns: "repeat(2, 1fr)", gapMm: "3mm" },

    label: {
      heightMm: 51,
      border: "1px solid #ddd",
      radiusMm: "3px",
      paddingMm: "3mm",
      paddingTopMm: "1mm",
    },
    font: {
      toNamePt: 7.5,
      addrPt: 11.66,
      cityPostPt: 15,
      attnPt: 6.6,
      phonePt: 3.75,
      fromLabelPt: 4.583,
      fromFooterPt: 3.75,
      logoWidthMm: 30,
      logoMaxHeightMm: 8,
      cityPostLetterSpacingPx: 0.4,

      toNamePaddingTopMm: 0.1,
      addr1PaddingTopMm: 0.1,
      addr2PaddingTopMm: 0.1,
      addrMarginBottomMm: 2,
      cityPostMarginTopMm: 0.1,
      cityPostMarginBottomMm: 2.4,
      fromAreaGapMm: 1.6,
      fromLabelMarginBottomMm: 0.1,
      fromFooterMarginTopMm: 0.2,
      labelTopLineHeight: 1.3,
      addrLineLineHeight: 1,
    },
    clamp: { enable: true, toNameLines: 2, addrLines: 2 },
    special120: { enable: false },
  },

  "120x90": {
    jsPdf: { orientation: "landscape", unit: "mm", format: [120, 90] },
    page: { widthMm: "120mm", minHeightMm: "90mm", paddingMm: "0mm" },
    grid: { templateColumns: "1fr", gapMm: "0mm" },
    label: {
      heightMm: 90,
      border: "0",
      radiusMm: "0",
      paddingMm: "3.5mm",
      paddingTopMm: "1mm",
    },
    font: {
      toNamePt: 20,
      addrPt: 20,
      cityPostPt: 23.32,
      attnPt: 13.2,
      phonePt: 7,
      fromLabelPt: 10,
      fromFooterPt: 7.5,
      logoWidthMm: 52,
      logoMaxHeightMm: 12,
      cityPostLetterSpacingPx: 0.4,

      toNamePaddingTopMm: 0.1,
      addr1PaddingTopMm: 0.6,
      addr2PaddingTopMm: 0.1,
      addrMarginBottomMm: 0.1,
      cityPostMarginTopMm: 0.1,
      cityPostMarginBottomMm: 0.1,
      fromAreaGapMm: 1.6,
      fromLabelMarginBottomMm: 0.1,
      fromFooterMarginTopMm: 0.2,

      labelTopLineHeight: 0.1,
      addrLineLineHeight: 0.1,
    },
    clamp: { enable: false, toNameLines: 0, addrLines: 0 },
    special120: {
      enable: true,
      forceLineHeight: 1.7,
      unclamp: true,
    },
  },
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

function getPreset(paper) {
  return PAPER_PRESETS[paper] || PAPER_PRESETS.A4;
}

export default function PrintAddressLabels() {
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [type, setType] = useState("individual");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [name, setName] = useState("");

  const [paper, setPaper] = useState("A4"); // "A4" | "A5" | "120x90"

  // Table pagination
  const [tablePage, setTablePage] = useState(1);
  const pageSize = 10;

  // Hidden printable pages container
  const pagesRef = useRef(null);

  const dateLabel = type === "individual" ? "Order date" : "Despatch date";

  const requestSeqRef = useRef(0);

  const loadLabels = async (opts) => {
    const payload = opts || { type, dateFrom, dateTo, name };

    const mySeq = ++requestSeqRef.current;
    setLoading(true);

    try {
      const data = await fetchAddressLabels(payload);
      if (mySeq !== requestSeqRef.current) return;
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

  useEffect(() => {
    loadLabels({ type, dateFrom, dateTo, name });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadLabels({ type, dateFrom, dateTo, name });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, type]);

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

  const getOrderDate = (l) => l.orderDate || l.order_date || "";
  const getOrderNumber = (l) =>
    l.orderNumber || l.order_number || l.sourceId || "";

  const getRowKey = (l) => `${l.labelType}-${l.sourceId}`;

  const [selectedKeys, setSelectedKeys] = useState(new Set());

  const toggleRow = (key) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const clearSelection = () => setSelectedKeys(new Set());

  useEffect(() => {
    setSelectedKeys((prev) => {
      if (!prev.size) return prev;
      const valid = new Set(displayLabels.map(getRowKey));
      const next = new Set();
      prev.forEach((k) => {
        if (valid.has(k)) next.add(k);
      });
      return next;
    });
  }, [displayLabels]);

  const allKeys = useMemo(() => displayLabels.map(getRowKey), [displayLabels]);
  const allSelected =
    allKeys.length > 0 && selectedKeys.size === allKeys.length;
  const someSelected =
    selectedKeys.size > 0 && selectedKeys.size < allKeys.length;
  const headerCheckboxRef = useRef(null);
  useEffect(() => {
    if (headerCheckboxRef.current)
      headerCheckboxRef.current.indeterminate = someSelected;
  }, [someSelected]);

  const toggleSelectAll = () => {
    setSelectedKeys(() => {
      if (allSelected) return new Set();
      return new Set(allKeys);
    });
  };

  //  table
  const totalRows = displayLabels.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const tableRows = useMemo(() => {
    const start = (tablePage - 1) * pageSize;
    return displayLabels.slice(start, start + pageSize);
  }, [displayLabels, tablePage]);

  const selectedLabels = useMemo(() => {
    if (!selectedKeys.size) return [];
    return displayLabels.filter((l) => selectedKeys.has(getRowKey(l)));
  }, [displayLabels, selectedKeys]);

  const labelsPerPage = paper === "A4" ? 8 : paper === "A5" ? 6 : 1;

  const labelPages = useMemo(() => {
    return chunkArray(selectedLabels, labelsPerPage);
  }, [selectedLabels, labelsPerPage]);

  const exportPdf = async () => {
    try {
      if (!pagesRef.current) return;

      if (!selectedKeys.size) {
        alert("Please select at least one record to export.");
        return;
      }

      setLoading(true);

      const preset = getPreset(paper);
      const is120 = paper === "120x90";
      const isA5 = paper === "A5";

      const pdf = new jsPDF(preset.jsPdf);

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
      sandbox.style.width = preset.page.widthMm;
      sandbox.style.background = "#fff";
      sandbox.style.zIndex = "-1";
      document.body.appendChild(sandbox);

      const f = preset.font;
      const clamp = preset.clamp;

      const style = document.createElement("style");
      style.innerHTML = `
  #pdf-export-sandbox {
    box-sizing: border-box;
    font-family: Arial, Helvetica, sans-serif;
    color: #000 !important;
    background: #fff !important;
  }
  #pdf-export-sandbox * {
    box-sizing: border-box;
    font-family: inherit;
    color: #000 !important;
    background: transparent;
  }

  #pdf-export-sandbox .pdf-page {
    display: block;
    width: ${preset.page.widthMm};
    min-height: ${preset.page.minHeightMm};
    padding: ${preset.page.paddingMm};
    background: #fff !important;
  }

  #pdf-export-sandbox .labels-grid {
    display: grid;
    grid-template-columns: ${preset.grid.templateColumns};
    gap: ${preset.grid.gapMm};
    align-content: start;
  }

  #pdf-export-sandbox .label-card {
    display: block;
    border: ${preset.label.border};
    border-radius: ${preset.label.radiusMm};
    padding: ${
      preset.label.paddingTopMm
        ? `${preset.label.paddingTopMm} ${preset.label.paddingMm} ${preset.label.paddingMm} ${preset.label.paddingMm}`
        : `${preset.label.paddingMm}`
    };
    background: #fff !important;
  }

  #pdf-export-sandbox .label-card-big {
    height: ${preset.label.heightMm}mm;
    display: flex;
    flex-direction: column;
    ${is120 ? "width: 120mm;" : ""}
  }

  #pdf-export-sandbox .label-top {
    line-height: ${f.labelTopLineHeight};
  }

  #pdf-export-sandbox .addr-line {
    line-height: ${f.addrLineLineHeight};
  }

  #pdf-export-sandbox .to-name {
    font-weight: 800;
    font-size: ${f.toNamePt}pt;
    padding-top: ${f.toNamePaddingTopMm}mm;
    ${
      clamp.enable
        ? `
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: ${clamp.toNameLines};
    `
        : `
    display: block;
    `
    }
  }

  #pdf-export-sandbox .addr1 {
    font-weight: 700;
    font-size: ${f.addrPt}pt;
    margin-bottom: ${f.addrMarginBottomMm}mm;
    padding-top: ${f.addr1PaddingTopMm}mm;
    ${
      clamp.enable
        ? `
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: ${clamp.addrLines};
    `
        : `
    display: block;
    `
    }
  }

  #pdf-export-sandbox .addr2 {
    font-weight: 700;
    font-size: ${f.addrPt}pt;
    margin-bottom: ${f.addrMarginBottomMm}mm;
    padding-top: ${f.addr2PaddingTopMm}mm;
    ${
      clamp.enable
        ? `
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: ${clamp.addrLines};
    `
        : `
    display: block;
    `
    }
  }

  #pdf-export-sandbox .citypost {
    font-weight: 700;
    font-size: ${f.cityPostPt}pt;
    letter-spacing: ${f.cityPostLetterSpacingPx}px;
    margin: ${f.cityPostMarginTopMm}mm 0 ${f.cityPostMarginBottomMm}mm;
    text-overflow: ellipsis;
  }

  
  #pdf-export-sandbox .from-sep {
    border-top: 2px solid #111111;
    margin: 0.1mm 0 0.5mm;
    width: ${isA5 ? "90%" : is120 ? "100%" : "245px"};
  }

  #pdf-export-sandbox .attn-block {
    display: flex;
    align-items: flex-end;
  }

  #pdf-export-sandbox .attn-text {
    font-weight: 700;
    font-size: ${f.attnPt}pt;
  }

  #pdf-export-sandbox .phone-text {
    font-size: ${f.phonePt}pt;
    padding-left: 1mm;
  }

  #pdf-export-sandbox .from-area {
    display: flex;
    flex-direction: column;
    gap: ${f.fromAreaGapMm}mm;
  }

  #pdf-export-sandbox .from-label {
    font-weight: 700;
    font-size: ${f.fromLabelPt}pt;
    margin-bottom: ${f.fromLabelMarginBottomMm}mm;
  }

  #pdf-export-sandbox .from-logo-big {
    width: ${f.logoWidthMm}mm;
    max-height: ${f.logoMaxHeightMm}mm;
    height: auto;
    object-fit: contain;
  }

  #pdf-export-sandbox .from-footer {
    font-size: ${f.fromFooterPt}pt;
    line-height: 1.15;
    font-weight: 600;
    margin-top: ${f.fromFooterMarginTopMm}mm;
  }

  ${
    preset.special120.enable
      ? `
  
  #pdf-export-sandbox .to-name,
  #pdf-export-sandbox .addr1,
  #pdf-export-sandbox .addr2,
  #pdf-export-sandbox .citypost,
  #pdf-export-sandbox .attn-text,
  #pdf-export-sandbox .phone-text {
    line-height: ${preset.special120.forceLineHeight} !important;
    padding-top: 0.6mm !important;
  }

  #pdf-export-sandbox .to-name,
  #pdf-export-sandbox .addr1,
  #pdf-export-sandbox .addr2,
  #pdf-export-sandbox .attn-text {
    display: block !important;
    -webkit-line-clamp: unset !important;
    -webkit-box-orient: unset !important;
  }
`
      : ""
  }
`;
      sandbox.appendChild(style);

      for (let i = 0; i < pageEls.length; i++) {
        sandbox.querySelectorAll(".pdf-page").forEach((n) => n.remove());

        const clone = pageEls[i].cloneNode(true);
        sandbox.appendChild(clone);

        clone
          .querySelectorAll('style, link[rel="stylesheet"]')
          .forEach((n) => n.remove());

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
                border-color: #ddd !important;
                box-shadow: none !important;
                filter: none !important;
              }
            `;
            clonedDoc.head.appendChild(safe);
          },
        });

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
              onClick={clearFilters}
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

              <label
                className={`paper-pill ${paper === "120x90" ? "active" : ""}`}
              >
                <input
                  type="radio"
                  name="paper"
                  value="120x90"
                  checked={paper === "120x90"}
                  onChange={() => setPaper("120x90")}
                />
                Small
              </label>
            </div>

            <button
              className="btn btn-success"
              onClick={exportPdf}
              disabled={loading}
              title="Export labels to PDF"
            >
              Export PDF
            </button>
          </div>

          <div className="labels-toolbar-right">
            <div className="toolbar-meta">
              Total: {totalRows} records | Selected: {selectedKeys.size}
            </div>
            <div className="tiny-filters">
              <div className="tiny-filter">
                <span>Type</span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="tiny-select"
                >
                  <option value="individual">Individual Orders</option>
                  <option value="institution">Bulk Orders</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table className="labels-table">
            <thead>
              <tr>
                <th style={{ width: 44 }}>
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all"
                    title="Select all"
                  />
                </th>

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
                  <td colSpan={10} className="table-empty">
                    Loading…
                  </td>
                </tr>
              ) : tableRows.length ? (
                tableRows.map((l, idx) => {
                  const k = getRowKey(l);
                  return (
                    <tr key={`${l.labelType}-${l.sourceId}`}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedKeys.has(k)}
                          onChange={() => toggleRow(k)}
                          aria-label="Select row"
                        />
                      </td>

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
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="table-empty">
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

          {selectedKeys.size > 0 ? (
            <div style={{ marginTop: 10 }}>
              <button className="btn btn-outline" onClick={clearSelection}>
                Clear Selection
              </button>
            </div>
          ) : null}
        </div>

        <div className="print-dom-hidden" aria-hidden="true">
          <div className="pdf-pages" ref={pagesRef}>
            {labelPages.map((pageLabels, pageIndex) => (
              <div className="pdf-page" key={`page-${pageIndex}`}>
                <div
                  className={`labels-grid ${
                    paper === "A4"
                      ? "grid-a4"
                      : paper === "A5"
                      ? "grid-a5"
                      : "grid-120"
                  }`}
                >
                  {pageLabels.map((l) => (
                    <AddressLabelCard
                      key={`${l.labelType}-${l.sourceId}`}
                      label={l}
                      paper={paper}
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
      <div className="label-top">
        <div className="to-name">{toName}</div>

        <div className="addr-line addr1">{address1}</div>
        {address2 ? <div className="addr-line addr2">{address2}</div> : null}

        <div className="addr-line citypost">{cityPost}</div>

        <div className="attn-block">
          <div className="attn-text">Attn: {attn}</div>
          <div className="phone-text"> {phone}</div>
        </div>
      </div>

      <div className="from-sep" />

      <div className="from-area">
        <div className="from-label">From:</div>
        <img className="from-logo-big" src={FROM.logoSrc} alt={FROM.title} />
        <div className="from-footer">{FROM.line1}</div>
      </div>
    </div>
  );
}
