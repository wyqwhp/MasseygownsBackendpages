import jsPDF from "jspdf";

const API_URL = import.meta.env.VITE_GOWN_API_BASE;
const WIDTH = 300;

export default async function PrintManifest() {
    console.log("Printing manifest...");
    let response = await fetch(`${API_URL}/orders`)
    let orders = await response.json();
    generateManifestPDF(orders);
}

export async function PrintPDF() {
    console.log("Printing PDF...");
    const html = `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Order Report</title>
        </head>
        
        <body style="margin:0; padding:0; background:#f4f4f4; font-family:Arial, sans-serif;">
            <div style="position:absolute; font-weight: bold; font-size: xx-large; top:50px; left:40px">
                {{idCode}}
            </div>
            <div style="position:absolute; font-weight: bold; font-size: x-large; top:40px; left:340px">
                Despatch Date\t{{despatchDate}}
            </div>
            <div style="position:absolute; font-weight: bold; font-size: x-large; top:80px; left:340px">
                Date Sent:
            </div>
            <div style="position:absolute; font-weight: bold; font-size: xx-large; top:140px; left:40px">
                {{Name}}
            </div>
            <div style="position:absolute; font-size: x-large; top:220px; left:40px">
                Courier Address:\t434 Botanical Road Palmerston North 4412
            </div>
            <div style="position:absolute; font-size: x-large; top:280px; left:40px">
                CeremonyDate(s):\t{{ceremonyDate}}\tEmail: {{email}}
            </div>
            <div style="position:absolute; font-size: x-large; top:340px; left:40px">
                Organiser:\t{{organiser}}\tPhone {{phone}}
            </div>
            <div style="position:absolute; font-size: x-large; top:400px; left:40px">
                Order acknowledged:\tPurchase Order No:
            </div>
            <div style="position:absolute; font-size: x-large; top:460px; left:40px">
                Amount Due {{$3,040.00}} (Inc.Freight {{$0.00}})\tInvoice Number:
            </div>
            <div style="position:absolute; font-size: x-large; top:520px; left:40px">
                Data checked:
            </div>
            <div style="position:absolute; font-weight: bold; font-size: x-large; top:580px; left:40px">
                Notes:
            </div>
            <div style="position:absolute; font-size: large; top:610px; left:40px">
                {{Xero INV-12572}}
            </div>
        </body>
        </html>
        `;

    const generatePdf = async () => {
        // await fetch('http://reportpdf.ajeravd8gbgkhkdf.newzealandnorth.azurecontainer.io:8080/api/pdf/print', {
        const response = await fetch('http://reportpdf.ajeravd8gbgkhkdf.newzealandnorth.azurecontainer.io:8080', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/pdf'
            },
            body: JSON.stringify({
                html: '<html><body><h1>Test</h1></body></html>'
                // html
            })
        });

        console.log('Response:', {
            status: response.status,
            contentType: response.headers.get('Content-Type')
        });

        console.log('Response:', {
            status: response.status,
            statusText: response.statusText,
            contentType: response.headers.get('Content-Type'),
            headers: Object.fromEntries(response.headers.entries())
        });
        // console.log('Response headers:', [...response.headers.entries()]);

        // Clone response so we can read it multiple times
        const clonedResponse = response.clone();

        // Try to read as text first to see what we got
        const text = await clonedResponse.text();
        console.log('Response body (first 200 chars):', text.substring(0, 200));

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${text}`);
        }

        // If it's a PDF, convert to blob
        if (response.headers.get('Content-Type')?.includes('application/pdf')) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'report.pdf';
            a.click();
            window.URL.revokeObjectURL(url);
            console.log('PDF downloaded successfully');
        } else {
            console.error('Expected PDF but got:', response.headers.get('Content-Type'));
            console.error('Body:', text);
        }
    };

    await generatePdf();
}

function generateManifestPDF(orders) {
    const doc = new jsPDF();

    let i = 0;
    let j = 0;
    let x = 1;
    let y = 1;
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
