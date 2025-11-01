import jsPDF from "jspdf";
import React from "react";
import "../pages/Spinner.css"

const API_URL = import.meta.env.VITE_GOWN_API_BASE;
const WIDTH = 64;
const HEIGHT = 24.3

import { useState } from "react";

function PrintOrdersWrapper() {
    const [loading, setLoading] = useState(false);
    async function PrintOrders() {
        setLoading(true);
        try {
            let response = await fetch(`${API_URL}/orders`)
            let orders = await response.json();
            generatePDF(orders);
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

export default function generatePDF(orders) {
    const doc = new jsPDF();

    let i = 0;
    let j = 0;
    orders.forEach((order) => {
        let y = 20 + i * HEIGHT;
        let x = 19 + j * WIDTH;

        doc.setFontSize(10);
        doc.text(order.lastName + ", " + order.firstName, x, y);
        // console.log(order.ceremonyId);
        doc.text(String(order.ceremonyId) == 'null'?"":String(order.ceremonyId), x + WIDTH - 20, y);
        // doc.setFontSize(8);
        let itemsLine = ['No Hood', '', 'No Hat'];
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

        doc.text(itemsLine[0] + "   " + itemsLine[1] + "   " + itemsLine[2], x, y + 6);
        doc.text(String(order.id), x, y + 12);
        // doc.text("Amount: $100", x, y + 8);
        // doc.text("Date: 11-Oct-2025", x, y + 12);

        if (++j == 3) {
            j = 0; i++;
        }
        if (i % 11 == 0 && i > 0) {
            i = 0;
            doc.addPage();
        }
    });
    doc.save("invoice.pdf");
}
