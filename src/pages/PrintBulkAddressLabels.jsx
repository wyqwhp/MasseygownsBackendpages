import React, { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./PrintAddressLabels.css";

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

function getPreset(paper) {
  return PAPER_PRESETS[paper] || PAPER_PRESETS.A4;
}

export default function PrintBulkAddressLabels({ceremony, paper, onDone}) {
  const [loading, setLoading] = useState(false);

  // Filters
  const [type] = useState("institution");
  // const [paper, setPaper] = useState("A4"); // "A4" | "A5" | "120x90"

  // Hidden printable pages container
  const pagesRef = useRef(null);

  const label = useMemo(() => {
    if (!ceremony) return null;

    return {
      toName: (ceremony.name || "").trim(),
      attn: (ceremony.organiser || "").trim(),
      phone: (ceremony.phone || "").trim(),
      address1: (ceremony.postalAddress || "").trim(),
      city: (ceremony.city || "").trim(),
    };
  }, [ceremony]);

  useEffect(() => {
    if (!ceremony) return;
    let cancelled = false;

    const id = requestAnimationFrame(async () => {
      if (cancelled) return;

      await exportPdf();
      if (!cancelled) {
        onDone?.();
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [ceremony, paper, onDone]);

  const labelsPerPage = paper === "A4" ? 8 : paper === "A5" ? 6 : 1;

  const filledLabels = useMemo(() => {
    if (!label) return [];

    return Array.from({ length: labelsPerPage }, (_, i) => ({
      ...label,
      __dupId: i, // stable key
    }));
  }, [label, labelsPerPage]);

  const exportPdf = async () => {
    try {
      setLoading(true);

      const preset = getPreset(paper);
      const is120 = paper === "120x90";
      const isA5 = paper === "A5";

      const pdf = new jsPDF(preset.jsPdf);

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const pageEls = pagesRef.current.querySelectorAll(".pdf-page");

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
        <div className="print-dom-hidden" aria-hidden="true">
          <div className="pdf-pages" ref={pagesRef}>
            {filledLabels.length > 0 && (
              <div className="pdf-page">
                <div
                    className={`labels-grid ${
                        paper === "A4"
                            ? "grid-a4"
                            : paper === "A5"
                                ? "grid-a5"
                                : "grid-120"
                    }`}
                >
                  {filledLabels.map((l) => (
                      <AddressLabelCard
                          key={l.__dupId}
                          label={l}
                          paper={paper}
                      />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
    </>
  );
}

function AddressLabelCard({ label }) {
  const toName = label.toName || "";
  const address1 = label.address1 || "";
  // const address2 = label.address2 || "";
  const city = label.city || "";
  // const postcode = label.postcode || "";
  const attn = label.attn || "";
  const phone = label.phone || "";

  // const cityPost = [city, postcode].filter(Boolean).join(" ").toUpperCase();

  return (
    <div className="label-card label-card-big">
      <div className="label-top">
        <div className="to-name">{toName}</div>

        <div className="addr-line addr1">{address1}</div>
        {/*{address2 ? <div className="addr-line addr2">{address2}</div> : null}*/}

        <div className="addr-line citypost">{city}</div>

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
