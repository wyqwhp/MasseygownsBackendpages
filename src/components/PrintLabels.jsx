import jsPDF from "jspdf";

const API_URL = import.meta.env.VITE_GOWN_API_BASE;
const WIDTH = 64;
const HEIGHT = 24.3

export default async function PrintOrders() {
    let response = await fetch(`${API_URL}/orders`)
    let orders = await response.json();
    console.log(orders);
    generatePDF(orders);
}

function generatePDF(orders) {
    const doc = new jsPDF();

    // let vertY = 0;
    let i = 0;
    let j = 0;
    orders.forEach((order) => {
        let y = 20 + i * HEIGHT;
        let x = 19 + j * WIDTH;

        doc.setFontSize(10);
        doc.text(order.lastName + ", " + order.firstName, x, y);
        // doc.setFontSize(8);
        // doc.text("Name: John Doe", x, y + 4);
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

// export default function PdfButton() {
//     return <button onClick={generatePDF}>Download PDF</button>;
// }
