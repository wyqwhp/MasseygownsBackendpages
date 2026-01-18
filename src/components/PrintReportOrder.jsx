import {getCMSTemplate} from "../api/TemplateApi.js";
import React, {useEffect, useRef, useState} from "react";
import FullscreenSpinner from "@/components/FullscreenSpinner.jsx";
import axios from "axios";

const PRINT_API_URL = import.meta.env.VITE_PRINT_PDF;
// const API_URL = import.meta.env.VITE_GOWN_API_BASE;
const API_URL = "http://localhost:5144";

export default function PrintReportOrder({ceremony}) {
    // ----------------------------
    // SAMPLE DATA FOR PREVIEW
    // ----------------------------
    let sampleData = {};

    const fillData = (countItem) => {
        sampleData = {
            idCode: ceremony.idCode,
            Name: ceremony.name,
            CourierAddress: ceremony.courierAddress,
            ceremonyDate: ceremony.ceremonyDate,
            phone: ceremony.phone,
            organiser: ceremony.organiser,
            email: ceremony.email,
            despatchDate: ceremony.despatchDate,
            // amountDue: 3000,
            freight: ceremony.freight ?? 0,
            returnDate: ceremony.returnDate,
            gownsDespatched: countItem.gown_count,
            gownsReturned: 0,
            hatsDespatched: countItem.hat_count,
            hatsReturned: 0,
            hoodsDespatched: countItem.hood_count,
            hoodsReturned: 0,
            ucolDespatched: countItem.ucol_count,
            ucolReturned: 0,
            city: ceremony.city,
            // postcode: "0632",
            // country: "NZ",
            // invoiceNumber: "41782315",
            // gstNumber: "41782315",
            // total: "$0.00",
            // Notes: "Xero INV-12572",
        }
    };

    const printedRef = useRef(false);
    const [loading, setLoading] = useState(true);
    const [countItems, setCountItems] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (printedRef.current) return;

        axios
            .get(`${API_URL}/admin/ceremonies/bulk/${ceremony.id}`)
            .then((res) => {
                setCountItems(res.data);

                console.log("Count Item=",res.data);
                setLoading(false);
                fillData(res.data);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });

        printedRef.current = true;
        updateTemplateWithData();
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

            // console.log("HTML=", html);

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
                a.download = 'report.pdf';
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
            const template = await getCMSTemplate({Name: "Order Report"});
            let output = template.bodyHtml;
            Object.keys(sampleData).forEach((key) => {
                output = output.replaceAll(`{{${key}}}`, sampleData[key]);
            });

            // console.log("Output=", output);

            PrintPDF(output);
        } catch (err) {
            console.error("Failed to load template", err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <FullscreenSpinner />;

    // return (
        // {loading && <FullscreenSpinner/>
    // );
}
