import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// A4 page with a 10mm margin on every side
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_MM = 10;
const PRINTABLE_WIDTH_MM = A4_WIDTH_MM - 2 * MARGIN_MM;
const PRINTABLE_HEIGHT_MM = A4_HEIGHT_MM - 2 * MARGIN_MM;
// Printable area at 96 DPI
const PX_PER_MM = 96 / 25.4;
const PRINTABLE_WIDTH_PX = Math.round(PRINTABLE_WIDTH_MM * PX_PER_MM);
const PRINTABLE_HEIGHT_PX = Math.round(PRINTABLE_HEIGHT_MM * PX_PER_MM);
const SCALE = 2;
// html2canvas draws text a few px lower than the browser lays it out, so the
// last line overflows the measured content height; capture some extra space.
const BOTTOM_PADDING_PX = 20;

// Renders the HTML in an isolated hidden iframe (so app/Tailwind styles don't
// leak in), rasterises it with html2canvas, paginates it onto A4 pages inside
// a 10mm margin and downloads the result as fileName.
export async function printHtmlToPdf(doc, fileName) {
    console.log("Printing PDF...");
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-99999px";
    iframe.style.top = "0";
    iframe.style.width = `${PRINTABLE_WIDTH_PX}px`;
    iframe.style.height = `${PRINTABLE_HEIGHT_PX}px`;
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    try {
        const iframeDoc = iframe.contentDocument;
        iframeDoc.open();
        iframeDoc.write(`<!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8" />
                    <style>body { margin: 0; background: #fff; font-family: Arial, Helvetica, sans-serif; }</style>
                </head>
                <body>
                     ${doc}
                </body>
            </html>`);
        iframeDoc.close();

        // Wait for fonts and images inside the template to finish loading
        await iframeDoc.fonts?.ready;
        await Promise.all(
            Array.from(iframeDoc.images).map((img) =>
                img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; })
            )
        );

        // body.scrollHeight can be 0 when the template uses floats/absolute
        // positioning, so take the largest measurement available. Collapse the
        // iframe first: root.scrollHeight never reports less than the viewport,
        // which would otherwise pad the content past one A4 page.
        const root = iframeDoc.documentElement;
        iframe.style.height = "0px";
        const contentHeight = Math.max(
            1,
            Math.ceil(root.getBoundingClientRect().height),
            Math.ceil(iframeDoc.body.getBoundingClientRect().height),
            root.scrollHeight,
            root.offsetHeight,
            iframeDoc.body.scrollHeight,
            iframeDoc.body.offsetHeight
        ) + BOTTOM_PADDING_PX;
        // Templates with a fixed width wider than the printable area are captured
        // in full and scaled down to fit between the margins.
        const contentWidth = Math.max(PRINTABLE_WIDTH_PX, root.scrollWidth, iframeDoc.body.scrollWidth);
        iframe.style.width = `${contentWidth}px`;
        iframe.style.height = `${contentHeight}px`;

        const canvas = await html2canvas(root, {
            scale: SCALE,
            useCORS: true,
            backgroundColor: "#ffffff",
            width: contentWidth,
            height: contentHeight,
            windowWidth: contentWidth,
            windowHeight: contentHeight,
        });
        if (!canvas.width || !canvas.height) {
            throw new Error("html2canvas produced an empty canvas");
        }

        const pdf = new jsPDF({orientation: "portrait", unit: "mm", format: "a4"});

        // Slice the tall canvas into canvases proportioned to the printable area
        const pageHeightPx = Math.floor((canvas.width * PRINTABLE_HEIGHT_MM) / PRINTABLE_WIDTH_MM);
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        const ctx = pageCanvas.getContext("2d");

        // Ignore a trailing sliver left over from sub-pixel rounding so it
        // doesn't produce a blank extra page, but only when it is actually
        // blank: it may hold the bottom half of a line split across pages.
        const minSliceHeight = 10 * SCALE;
        const isBlank = (y, height) => {
            const {data} = canvas.getContext("2d").getImageData(0, y, canvas.width, height);
            for (let i = 0; i < data.length; i += 4) {
                if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) return false;
            }
            return true;
        };
        for (let y = 0, page = 0; y < canvas.height; y += pageHeightPx, page++) {
            const remaining = canvas.height - y;
            if (page > 0 && remaining <= minSliceHeight && isBlank(y, remaining)) break;
            const sliceHeight = Math.min(pageHeightPx, canvas.height - y);
            pageCanvas.height = sliceHeight;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, pageCanvas.width, sliceHeight);
            ctx.drawImage(canvas, 0, y, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

            const imgData = pageCanvas.toDataURL("image/jpeg", 0.95);
            if (imgData === "data:,") {
                throw new Error(`Failed to encode page ${page + 1} image`);
            }

            if (page > 0) pdf.addPage();
            pdf.addImage(imgData, "JPEG", MARGIN_MM, MARGIN_MM, PRINTABLE_WIDTH_MM, (sliceHeight * PRINTABLE_WIDTH_MM) / canvas.width);
        }

        pdf.save(fileName);
        console.log("PDF downloaded successfully");
    } finally {
        iframe.remove();
    }
}
