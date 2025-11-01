import jsPDF from "jspdf";

const API_URL = import.meta.env.VITE_GOWN_API_BASE;

export default async function PrintManifest() {
    let response = await fetch(`${API_URL}/orders`)
    let orders = await response.json();
    generateManifestPDF(orders);
}

function generateManifestPDF(orders) {
    const doc = new jsPDF();

    let i = 0;
    let j = 0;
    orders.forEach((order) => {
        doc.setFontSize(10);
        doc.text(order.lastName + ", " + order.firstName, x, y);
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
