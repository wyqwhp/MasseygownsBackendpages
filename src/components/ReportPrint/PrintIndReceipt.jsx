import {getCMSTemplate} from "../../api/TemplateApi.js";
import React, {useEffect, useRef, useState} from "react";
import FullscreenSpinner from "@/components/FullscreenSpinner.jsx";
import {LOGO} from "@/logo.js";

const PRINT_API_URL = import.meta.env.VITE_PRINT_PDF;
const API_URL = import.meta.env.VITE_GOWN_API_BASE;
// const API_URL = "http://localhost:5144";

function formatNZDate(dateStr) {
    const [year, month, day] = dateStr.split("-");

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    return `${day}-${months[month - 1]}-${year}`;
}

const money = new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
});

export default function PrintIndReceipt({order, onDone}) {
    // ----------------------------
    // SAMPLE DATA FOR PREVIEW
    // ----------------------------
    let sampleData = {};

    console.log("Inside Print=", order);

    const fillData = () => {
        sampleData = {
            OrderAccess: order.id,
            idCode: order.idCode,
            foreName: order.foreName,
            surname: order.surname.toUpperCase(),
            address: order.address,
            city: order.city,
            phone: order.phone,
            organiser: order.organiser,
            email: order.email,
            orderDate: formatNZDate(order.orderDate),
            OrderNo: order.referenceNo,
            ceremony: order.ceremony,
            // ceremonyDate: formatNZDate(order.ceremonyDate),
            // despatchDate: formatNZDate(order.despatchDate),
            // amountDue: 3000,
            freight: money.format(order.freight ?? 0),
            donation: money.format(order.donation ?? 0),
            hatLabel: order.hatLabel ?? "",
            gownLabel: order.gownLabel ?? "",
            hoodLabel: order.hoodLabel ?? "",
            // returnDate: formatNZDate(order.returnDate),

            // postcode: "0632",
            // country: "NZ",
            // invoiceNumber: "41782315",
            // gstNumber: "41782315",
            // total: "$0.00",
            // Notes: "Xero INV-12572",
        }
    };
    console.log("Freight2=", order.freight);

    const printedRef = useRef(false);
    const [loading, setLoading] = useState(true);
    const [countItems, setCountItems] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (printedRef.current) return;

        printedRef.current = true;   // 👈 move it here immediately

        const run = async () => {
            try {
                setLoading(true);

                fillData();
                await updateTemplateWithData();

                onDone?.();
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        run();
    }, []);

    function PrintPDF(doc) {
        console.log("Printing PDF...");
        const generatePdf = async () => {
            const html = `<!DOCTYPE html>
            <html>
                <head>
                    <title>Preview</title>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                </head>
                <body>
                     ${doc}
                </body>
            </html>`;

            const response = await fetch(`${PRINT_API_URL}/api/pdf/print`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/pdf'
                },
                body: JSON.stringify({
                    html
                })
            });

            // Clone response so we can read it multiple times
            const clonedResponse = response.clone();

            // Try to read as text first to see what we got
            const text = await clonedResponse.text();

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${text}`);
            }

            // If it's a PDF, convert to blob
            if (response.headers.get('Content-Type')?.includes('application/pdf')) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'IndividualReceipt.pdf';
                a.click();
                window.URL.revokeObjectURL(url);
                console.log('PDF downloaded successfully');
            } else {
                console.error('Expected PDF but got:', response.headers.get('Content-Type'));
                console.error('Body:', text);
            }
        };

        generatePdf();
    }

    const updateTemplateWithData = async () => {
        try {
            const template = await getCMSTemplate({Name: "Individual Receipt"});
            let output = template.bodyHtml;
            Object.keys(sampleData).forEach((key) => {
                output = output.replaceAll(`{{${key}}}`, sampleData[key]);
            });
            // console.log("Logo1=", output);
            output = output.replace("logo.jpg", `${LOGO}`);
            // console.log("Logo2=", output);

            PrintPDF(output);
        } catch (err) {
            console.error("Failed to load template", err);
        } finally {
            setLoading(false);
        }
    }
    if (loading) return <FullscreenSpinner />;
}
