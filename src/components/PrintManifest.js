import jsPDF from "jspdf";
import "@/fonts/NotoSans-Regular-normal.js";
import "@/fonts/NotoSans-BoldItalic-bolditalic.js";

const API_URL = import.meta.env.VITE_GOWN_API_BASE;
const WIDTH = 300;

export default async function PrintManifest(ceremony) {
    console.log("Printing manifest...");
    let response = await fetch(`${API_URL}/admin/items/ceremony/${ceremony.id}`)
    let orders = await response.json();
    generateManifestPDF(orders);
}

function generateManifestPDF(orders) {
    const doc = new jsPDF();

    let i = 0;
    let j = 0;
    let x = 1;
    let y = 1;
    orders.forEach((order) => {
        doc.setFontSize(10);
        doc.text(order.lastName.toUpperCase() + ", " + order.firstName, x, y);
        // console.log(order.ceremonyId);
        doc.text(String(order.ceremonyId) == 'null'?"":String(order.ceremonyId), x + WIDTH - 20, y);
        // doc.setFontSize(8);
        let itemsLine = ['No Hood', '', 'No Hat'];
        order.items.forEach((item) => {
            if (item.itemName.startsWith("Gown")) {
                itemsLine[1] = "B50"
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

const PrintHeaderHired = (doc) => {
    doc.setFontSize(11);
    doc.setFont('NotoSans-BoldItalic', 'bolditalic');
    doc.text("Client ID", 10, 20);
    doc.text("Surname", 35, 20);
    doc.text("Forenames", 70, 20);
    doc.text("Qual", 95, 20);
    doc.text("Cerem", 120, 20);
    doc.text("Note", 135, 20);
    doc.text("A/C", 150, 20);
    doc.text("MobileNo", 170, 20);
    doc.setLineWidth(1);
    doc.line(10, 23, 190, 23);
    doc.setFontSize(8);
    doc.setFont('NotoSans-Regular', 'normal');
}

const PrintHeaderGraduated = (doc) => {
    doc.setFontSize(11);
    doc.setFont('NotoSans-BoldItalic', 'bolditalic');
    doc.text("Client ID", 10, 20);
    doc.text("Surname", 35, 20);
    doc.text("Forenames", 70, 20);
    doc.text("Qual", 95, 20);
    doc.text("Cerem", 120, 20);
    doc.text("Note", 135, 20);
    doc.text("MobileNo", 170, 20);
    doc.setLineWidth(1);
    doc.line(10, 23, 190, 23);
    doc.setFontSize(8);
    doc.setFont('NotoSans-Regular', 'normal');
}

export function PrintHiredNotGraduatedPDF(orders) {
    const doc = new jsPDF();

    let i = 0;
    let x = 1;
    PrintHeaderHired(doc);

    orders.forEach((order) => {
        doc.text(String(order.studentId), x + 10, i * 7 + 30);
        doc.text(order.lastName, x + 35, i * 7 + 30);
        doc.text(order.firstName, x + 70, i * 7 + 30);
        doc.text(order.degree !== null ? order.degree.substring(0,15) : '', x + 95, i * 7 + 30);
        doc.text(order.ceremonyName, x + 120, i * 7 + 30);
        doc.text(order.hoodName !== null ? order.hoodName.substring(0,15) : '', x + 130, i * 7 + 30);
        doc.text(order.referenceNo ?? '', x + 150, i * 7 + 30);
        doc.text(order.mobile ?? '', x + 170, i * 7 + 30);

        doc.setLineWidth(0.1);
        doc.setLineDash([1, 1]);
        doc.line(x + 10, i * 7 + 32, 190, i * 7 + 32);


        if (i % 31 == 0 && i > 0) {
            i = 0;
            doc.addPage();
            PrintHeaderHired(doc);
        } else {
            ++i;
        }
    });
    doc.save("HiredNotGraduated.pdf");
}

export function PrintGraduatedNotHiredPDF(orders) {
    const doc = new jsPDF();

    let i = 0;
    let x = 1;
    PrintHeaderGraduated(doc);

    orders.forEach((order) => {
        doc.text(String(order.studentId), x + 10, i * 7 + 30);
        doc.text(order.lastName.toUpperCase(), x + 35, i * 7 + 30);
        doc.text(order.firstName, x + 70, i * 7 + 30);
        doc.text(order.degree !== null ? order.degree.substring(0,15) : '', x + 95, i * 7 + 30);
        doc.text(order.ceremonyName, x + 120, i * 7 + 30);
        doc.text(order.hoodName !== null ? order.hoodName.substring(0,25) : '', x + 130, i * 7 + 30);
        doc.text(order.mobile ?? '', x + 170, i * 7 + 30);

        doc.setLineWidth(0.1);
        doc.setLineDash([1, 1]);
        doc.line(x + 10, i * 7 + 32, 190, i * 7 + 32);


        if (i % 31 == 0 && i > 0) {
            i = 0;
            doc.addPage();
            PrintHeaderGraduated(doc);
        } else {
            ++i;
        }
    });
    doc.save("GraduatedNotHired.pdf");
}
