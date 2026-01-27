import jsPDF from "jspdf";
// import React, {useEffect} from "react";
import "./Spinner.css";

const API_URL = import.meta.env.VITE_GOWN_API_BASE;
const WIDTH = 64;
const HEIGHT = 24.3;

// import { useState } from "react";
// import axios from "axios";

// function PrintOrdersWrapper() {

//   async function PrintOrders() {
//     setLoading(true);
//     try {
//       let response = await fetch(`${API_URL}/orders`);
//       let orders = await response.json();
//       generateLabelsPDF(orders);
//       // console.log(data);
//     } finally {
//       setLoading(false);
//     }
//
//     return (
//       <div>
//         {/*<button onClick={loadData}>Fetch Backend</button>*/}
//         {loading && <div className="loader"></div>}
//       </div>
//     );
//   }
// }

export default async function PrintManifest (ceremony) {
  // const [loading, setLoading] = useState(true);
  // const [orders, setOrders] = useState([]);


  // useEffect(() => {
  //   axios
  try {
    const response = await fetch(`${API_URL}/admin/items/ceremony/${ceremony.id}`);
    const orders = await response.json();
    console.log("Response=", orders);
    generateManifestPDF(orders, ceremony);
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

function generateManifestPDF(orders, ceremony) {
  console.log("Orders=", orders);


  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Master List", 10, 20);
  doc.text(ceremony.name, 80, 20);
  doc.line(10, 22, 200, 22);

  var i = 0;
  let y = 30;
  orders.forEach((order) => {
    doc.setLineDash([1, 1])

    doc.setFontSize(10);
    doc.text(order.hoodName ?? '', 10, y);

    // doc.text(y.toString(), 10, y);
    // doc.text(i.toString(), 30, y);

    doc.text(order.lastName + " " + order.firstName, 30, y);
    doc.text(order.hoodName ?? '', 90, y);
    doc.text(order.gownSize ?? '', 110, y);
    doc.text(order.hatSize ?? '', 120, y);
    doc.line(10, y + 2, 200, y + 2);
    i++;
    if (i !== 0 && i % 24 === 0) {
      doc.addPage();
      y = 20;
    }
    y = y + 10;
    // y = (i % 24) + 1) * 10;
  });
  doc.setLineDash([]);
  doc.save("manifest.pdf");
}
