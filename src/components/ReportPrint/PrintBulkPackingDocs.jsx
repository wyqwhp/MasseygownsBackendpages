import {getCMSTemplate} from "../../api/TemplateApi.js";
import React, {useEffect, useRef, useState} from "react";
import FullscreenSpinner from "@/components/FullscreenSpinner.jsx";
import axios from "axios";
import {LOGO} from "@/logo.js";
import {formatNZDate} from "@/services/DateServices.js";
import {printHtmlToPdf} from "@/services/PdfServices.js";

const API_URL = import.meta.env.VITE_GOWN_API_BASE;
// const API_URL = "http://localhost:5144";

export default function PrintBulkPackingDocs({ceremony, onDone}) {
    // ----------------------------
    // SAMPLE DATA FOR PREVIEW
    // ----------------------------
    let sampleData = {};

    console.log("Inside Print=", ceremony);

    const fillData = (countItem) => {
        sampleData = {
            idCode: ceremony.idCode,
            Name: ceremony.name,
            CourierAddress: ceremony.courierAddress,
            ceremonyDate: formatNZDate(ceremony.ceremonyDate),
            phone: ceremony.phone,
            organiser: ceremony.organiser,
            email: ceremony.email,
            despatchDate: formatNZDate(ceremony.despatchDate),
            // amountDue: 3000,
            freight: ceremony.freight ?? 0,
            returnDate: formatNZDate(ceremony.returnDate),
            gownsDespatched: countItem.gown_count,
            gownsReturned: 0,
            hatsDespatched: countItem.hat_count,
            hatsReturned: 0,
            hoodsDespatched: countItem.hood_count,
            hoodsReturned: 0,
            ucolDespatched: countItem.ucol_count,
            ucolReturned: 0,
            city: ceremony.city,
            gown_count: ceremony.gown_count,
            hat_count: ceremony.hat_count,
            hood_count: ceremony.hood_count,
            ucol_count: ceremony.ucol_count,
            gown: ceremony.gown ?? 0,
            hat: ceremony.hat ?? 0,
            hood: ceremony.hood ?? 0,
            ucol: ceremony.ucol ?? 0,
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
                updateTemplateWithData();
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });

        printedRef.current = true;
        onDone?.();
    }, []);

    const updateTemplateWithData = async () => {
        try {
            const template = await getCMSTemplate({Name: "Bulk Packing Docs"});
            let output = template.bodyHtml;
            Object.keys(sampleData).forEach((key) => {
                output = output.replaceAll(`{{${key}}}`, sampleData[key]);
            });
            output = output.replace("logo.jpg", `${LOGO}`);

            await printHtmlToPdf(output, "BulkPackingDocs.pdf");
        } catch (err) {
            console.error("Failed to load template", err);
        } finally {
            setLoading(false);
        }
    }
    if (loading) return <FullscreenSpinner />;
}
