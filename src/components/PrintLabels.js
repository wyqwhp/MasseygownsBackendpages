import jsPDF from "jspdf";
import "./Spinner.css";
import "@/fonts/NotoSans-Regular-normal.js";
import "@/fonts/NotoSans-BoldItalic-bolditalic.js";
import {formatNZDateSlash} from "@/services/DateServices.js";
// import axios from "axios";

const API_URL = import.meta.env.VITE_GOWN_API_BASE;
// const API_URL = "http://localhost:5144"

const WIDTH = 70;
const HEIGHT = 25.5;
const LEFT_MARGIN = 5;
const TOP_MARGIN = 12;

// Print Manifest Button
export default async function PrintManifest (ceremony, printData) {
  try {
    const response = await fetch(`${API_URL}/admin/items/bulkceremony/${ceremony.id}`);
    const bulkOrders = await response.json();
    generateManifestPDF(bulkOrders, ceremony, printData);
  } catch(err) {
    console.error(err);
  }
}

function generateLabelsPDF(orders) {
  const doc = new jsPDF();

  let i = 0;
  let j = 0;
  orders.forEach((order) => {
    let y = 20 + i * HEIGHT;
    let x = 19 + j * WIDTH;

    doc.setFontSize(10);
    doc.text(order.lastName + ", " + order.firstName, x, y);
    doc.text(
      String(order.ceremonyId) == "null" ? "" : String(order.ceremonyId),
      x + WIDTH - 20,
      y
    );
    let itemsLine = ["No Hood", "", "No Hat"];
    order.items.forEach((item) => {
      if (item.itemName.startsWith("Gown")) {
        itemsLine[1] = item.labeldegree + item.labelsize;
      }
      if (item.itemName.startsWith("Trencher")) {
        itemsLine[1] = "T" + item.labelsize;
      }
      if (item.itemName.startsWith("Tudor")) {
        itemsLine[1] = "B" + item.labelsize;
      }
    });

    doc.text(
      itemsLine[0] + "   " + itemsLine[1] + "   " + itemsLine[2],
      x,
      y + 6
    );
    doc.text(String(order.id), x, y + 12);

    if (++j == 3) {
      j = 0;
      i++;
    }
    if (i % 11 == 0 && i > 0) {
      i = 0;
      doc.addPage();
    }
  });
  doc.save("invoice.pdf");
}

function generateManifestPDF(orders, ceremony, printData) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setFont('NotoSans-BoldItalic', 'bolditalic');
  doc.text("OutwardList", 10, 20);
  doc.text(ceremony.name, 80, 20);
  doc.line(10, 22, 200, 22);
  doc.setFont('NotoSans-Regular', 'normal');

  var i = 0;
  let y = 30.0;
  orders.forEach((order) => {
    doc.setLineDash([1, 1]);

    doc.setFontSize(10);
    doc.text(order.hoodCode ?? '', 8, y);
    doc.text((order.hoodName ?? "").substring(0, 35) ?? '', 30, y);
    doc.text(order.lastName.toUpperCase() + (order.firstName ? ", " : "") + (order.firstName.substring(0, 10) ?? ''), 90, y);
    // doc.text(order.hoodName ?? '', 90, y);
    doc.text(order.gownSize ?? '', 130, y);
    doc.text(order.hatSize ?? '', 145, y);
    doc.text(order.sashName ?? '', 170, y);
    doc.text(order.gownSize?.startsWith('W') ? 'Wide Gown' : '', 180, y);
    doc.line(10, y + 2, 200, y + 2);
    i++;
    if (i !== 0 && i % 24 === 0) {
      doc.addPage();
      y = 20;
    }
    y = y + 10;
  });
  doc.setLineDash([]);

  doc.addPage();

  // print hat summary table
  doc.setFontSize(16);
  doc.setFont('NotoSans-BoldItalic', 'bolditalic');
  doc.text("Hats: " + ceremony.name, 10, 20);
  doc.setFontSize(12);
  doc.setFont('NotoSans-Regular', 'normal');
  doc.text(formatNZDateSlash(new Date().toLocaleDateString("en-NZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })), 90, 10);
  doc.text('T = Trencher, F = Bonnet with black cords', 10, 30);
  doc.text('Hat Size', 10, 40);
  doc.text('Count', 60, 40);
  doc.setLineWidth(1);
  doc.line(10, 42, 100, 42);

  console.log('PrintData=', printData);
  // print sizes of ordered hats, summary table
  i = 0;
  y = 50;
  doc.setLineDash([1, 1])
  doc.setLineWidth(0.1);
  doc.setFontSize(10);

  printData['headwear']?.forEach((hatSize) => {
    doc.text(hatSize.itemSize ?? '', 20, y);
    doc.text(hatSize.itemCount.toString(), 60, y);
    doc.line(10, y + 2, 100, y + 2);
    i++;
    if (i !== 0 && i % 24 === 0) {
      doc.addPage();
      y = 20;
    }
    y = y + 10;
  })
  doc.addPage();

  // print hood summary table
  doc.setFontSize(16);
  doc.setFont('NotoSans-BoldItalic', 'bolditalic');
  doc.text("Hoods: " + ceremony.name, 10, 20);
  doc.setFontSize(12);
  doc.setFont('NotoSans-Regular', 'normal');
  doc.text(formatNZDateSlash(new Date().toLocaleDateString("en-NZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })), 90, 10);
  doc.text('Hood / Stole', 20, 30);
  doc.text('Count', 100, 30);
  doc.setLineWidth(1);
  doc.line(10, 32, 150, 32);

  i = 0;
  y = 40;
  doc.setLineDash([1, 1])
  doc.setLineWidth(0.1);
  doc.setFontSize(10);
  printData['hood']?.forEach((hoodType) => {
    // doc.text(hoodType.itemSize ?? '', 20, y);
    doc.text(hoodType.itemSize ?? '', 20, y);
    doc.text(hoodType.itemCount.toString(), 100, y);
    doc.line(10, y + 2, 150, y + 2);
    i++;
    if (i !== 0 && i % 24 === 0) {
      doc.addPage();
      y = 20;
    }
    y = y + 10;
  })

  doc.addPage();
  // print gown summary table
  doc.setFontSize(16);
  doc.setFont('NotoSans-BoldItalic', 'bolditalic');
  doc.text("Gowns List: " + ceremony.name, 10, 20);
  doc.setFontSize(12);
  doc.setFont('NotoSans-Regular', 'normal');
  doc.text(formatNZDateSlash(new Date().toLocaleDateString("en-NZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })), 90, 10);
  doc.text('B = Bachelor, M = Master, WB = Wide Bachelor, WM = Wide Master,', 10, 30)
  doc.text('D = Doctor (red stripe), S = Scarlet Gown (or other special gown), BL = Blue Gown', 10, 40)
  doc.text('Hood / Stole', 20, 50);
  doc.text('Count', 100, 50);
  doc.setLineWidth(1);
  doc.line(10, 52, 150, 52);

  i = 0;
  y = 60;
  doc.setLineDash([1, 1])
  doc.setLineWidth(0.1);
  doc.setFontSize(10);
  printData['gown']?.forEach((hatSize) => {
    doc.text(hatSize.itemSize ?? '', 20, y);
    doc.text(hatSize.itemCount.toString(), 100, y);
    doc.line(10, y + 2, 150, y + 2);
    i++;
    if (i !== 0 && i % 24 === 0) {
      doc.addPage();
      y = 20;
    }
    y = y + 10;
  })

  doc.save("manifest.pdf");
}

// Print Labels Button
export function printBulkLabels(bulkCeremonyId) {
  console.log("BulkCeremonyId=", bulkCeremonyId);
  const doc = new jsPDF();

  const getLabels = function (bulkCeremony) {
    let i= 0, j = 0;
    let x = LEFT_MARGIN, y = TOP_MARGIN;

    console.log("BulkCeremony=", bulkCeremony);

    bulkCeremony.forEach((label) => {
      doc.setFontSize(11);

      // console.log("HoodType=", label.hoodType);

      const firstName = (label.firstName ?? "").trim();
      const fullName = firstName ? `${label.lastName ?? ""}, ${firstName[0]} ` : (label.lastName ?? "");
      const code = label.idCode == null ? "" : String(label.idCode);
      const codeText = code ? "    " + code : "";
      // Shorten the name until name + idCode fits the label width (small margin so text doesn't touch the next label)
      const maxWidth = WIDTH - 2;
      let name = fullName;
      while (name && doc.getTextWidth(name + codeText) > maxWidth) {
        name = name.slice(0, -1);
      }
      doc.text(name.trimEnd() + codeText, x, y);
      // doc.text(String(label.idCode) == 'null'?"":String(label.idCode), x + 30, y);
      const gown = `${label.gownType ?? ""}${label.height ?? ""}`;
      const hat = `${label.hatType ?? ""}${label.headSize ?? ""}`;
      doc.text([(label.hoodCode ?? ""), (label.hoodType ?? "").substring(0, 10), gown, hat].filter(Boolean).join("  "), x, y + 6);
      // doc.text(label.hoodType ?? "", x, y + 6);

      if (++j == 3) {
        j = 0; i++; x = LEFT_MARGIN;
      } else {
        x = (j) * WIDTH + LEFT_MARGIN;
      }

      if (i % 11 == 0 && i > 0) {
        i = 0;
        doc.addPage();
        y = TOP_MARGIN;
      } else {
        y = (i) * HEIGHT + TOP_MARGIN;
      }
    });
    doc.save("BulkLabels.pdf");
  }

  fetch(`${API_URL}/admin/bulkorders/${bulkCeremonyId}`)
      .then(res => res.json())
      .then(data => {
        getLabels(data);
      })
      .catch(err => {
        console.error(err);
      })
}
