import jsPDF from "jspdf";
import React from "react";
import "./Spinner.css";

const API_URL = import.meta.env.VITE_GOWN_API_BASE;
const WIDTH = 64;
const HEIGHT = 24.3;

import { useState } from "react";

function PrintOrdersWrapper() {
  const [loading, setLoading] = useState(false);
  async function PrintOrders() {
    setLoading(true);
    try {
      let response = await fetch(`${API_URL}/orders`);
      let orders = await response.json();
      generateLabelsPDF(orders);
      // console.log(data);
    } finally {
      setLoading(false);
    }

    return (
      <div>
        {/*<button onClick={loadData}>Fetch Backend</button>*/}
        {loading && <div className="loader"></div>}
      </div>
    );
  }
}

export function generateLabelsPDF(orders) {
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

export function generateManifestPDF(orders) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Master List", 10, 20);
  doc.text("Auckland Graduation 2025", 80, 20);
  doc.line(10, 22, 200, 22);

  var i = 0;
  orders.forEach((order) => {
    doc.setLineDash([1, 1]);
    const y = 20 + ((i % 25) + 1) * 10;
    doc.setFontSize(10);
    doc.text(order.lastName + " " + order.firstName, 10, y);
    doc.text("Graduation items", 80, y);
    doc.line(10, y + 2, 200, y + 2);
    if (i != 0 && i % 24 == 0) doc.addPage();
    i++;
  });
  doc.setLineDash([]);
  doc.save("manifest.pdf");
}
