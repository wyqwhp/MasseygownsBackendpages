import jsPDF from "jspdf";

export default function generatePDF() {
    const doc = new jsPDF();

    for (let i = 0; i < 11; i++) {
        let y = 20 + i * 24.3;
        for (let j = 0; j < 3; j++) {
            let x = 19 + j * 64;
            doc.setFontSize(10);
            doc.text("Invoice", x, y);
            doc.setFontSize(8);
            doc.text("Name: John Doe", x, y + 4);
            doc.text("Amount: $100", x, y + 8);
            doc.text("Date: 11-Oct-2025", x, y + 12);
        }
    }
    doc.save("invoice.pdf");
}

// export default function PdfButton() {
//     return <button onClick={generatePDF}>Download PDF</button>;
// }
