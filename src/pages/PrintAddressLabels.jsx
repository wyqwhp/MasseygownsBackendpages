import React, { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { fetchAddressLabels } from "../api/LabelApi";
import "./PrintAddressLabels.css";

const FROM = {
  title: "Academic Dress Hire",
  line1:
    "3 Refectory Rd, Massey University, Palmerston North 4472, 06 350-4166",
  logoSrc: "/logo.jpg", // public/logo.jpg
};

function chunkArray(arr, size) {
  if (!Array.isArray(arr) || size <= 0) return [];
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function PrintAddressLabels() {
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(false);

  // filters
  const [type, setType] = useState("individual");
  const [paper, setPaper] = useState("A4"); // A4 | A5
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [name, setName] = useState("");

  const pagesRef = useRef(null);

  const dateLabel = type === "individual" ? "Order date" : "Despatch date";
  const namePlaceholder =
    type === "individual"
      ? "Search name (first / last)"
      : "Search institution name";

  const labelsPerPage = paper === "A4" ? 9 : 6;

  const loadLabels = async () => {
    setLoading(true);
    try {
      const data = await fetchAddressLabels({ type, dateFrom, dateTo, name });
      setLabels(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      alert("Failed to load labels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLabels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const labelPages = useMemo(() => {
    return chunkArray(displayLabels, labelsPerPage);
  }, [displayLabels, labelsPerPage]);

  const handlePrint = () => window.print();

  const exportPdf = async () => {
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
        /* reset everything inside sandbox */
        #pdf-export-sandbox, #pdf-export-sandbox * {
          all: initial;
          box-sizing: border-box;
          font-family: Arial, Helvetica, sans-serif;
          color: #000 !important;
          background: #fff !important;
        }

        /* re-apply ONLY what we need for layout */
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
          border-radius: 4px;
          padding: 4mm;
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

            const sandbox = clonedDoc.getElementById("pdf-export-sandbox");
            const keep = new Set();
            if (sandbox) {
              sandbox.querySelectorAll("style").forEach((s) => keep.add(s));
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
    <div className={`print-labels-page paper-${paper.toLowerCase()}`}>
      {/* ===== Toolbar ===== */}
      <div className="print-toolbar">
        <div className="filters-inline">
          <div className="filter-group">
            <label className="filter-label">Type</label>
            <div className="radio-group">
              <label className="radio">
                <input
                  type="radio"
                  value="individual"
                  checked={type === "individual"}
                  onChange={() => setType("individual")}
                />
                Individual
              </label>
              <label className="radio">
                <input
                  type="radio"
                  value="institution"
                  checked={type === "institution"}
                  onChange={() => setType("institution")}
                />
                Institution
              </label>
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">{dateLabel} from</label>
            <input
              type="date"
              className="input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">{dateLabel} to</label>
            <input
              type="date"
              className="input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Name</label>
            <input
              type="text"
              className="input input-wide"
              placeholder={namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Paper</label>
            <div className="radio-group">
              <label className="radio">
                <input
                  type="radio"
                  value="A4"
                  checked={paper === "A4"}
                  onChange={() => setPaper("A4")}
                />
                A4
              </label>
              <label className="radio">
                <input
                  type="radio"
                  value="A5"
                  checked={paper === "A5"}
                  onChange={() => setPaper("A5")}
                />
                A5
              </label>
            </div>
          </div>

          <button
            className="btn btn-secondary"
            onClick={loadLabels}
            disabled={loading}
          >
            {loading ? "Loading..." : "Search"}
          </button>
        </div>

        <button className="btn" onClick={handlePrint} disabled={loading}>
          Print
        </button>

        <button className="btn" onClick={exportPdf} disabled={loading}>
          Export PDF
        </button>

        <div className="hint">
          Tip: Use Chrome. Print setting: A4/A5, Margins = Default, Scale =
          100%.
        </div>
      </div>

      <div className="labels-sheet">
        {loading ? (
          <div>Loading…</div>
        ) : (
          <div className="pdf-pages" ref={pagesRef}>
            {labelPages.map((pageLabels, pageIndex) => (
              <div className="pdf-page" key={`page-${pageIndex}`}>
                <div className={`labels-grid big-layout`}>
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
        )}
      </div>
    </div>
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
