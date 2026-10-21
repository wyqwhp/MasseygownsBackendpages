import {getCMSTemplate} from "../../api/TemplateApi.js";
import React, {useEffect, useRef, useState} from "react";
import FullscreenSpinner from "@/components/FullscreenSpinner.jsx";
import axios from "axios";
import {formatNZDate} from "@/services/DateServices.js";
import {printHtmlToPdf} from "@/services/PdfServices.js";

const API_URL = import.meta.env.VITE_GOWN_API_BASE;
// const API_URL = "http://localhost:5144";

export default function PrintReportOrder({ceremony}) {
    // ----------------------------
    // SAMPLE DATA FOR PREVIEW
    // ----------------------------
    let sampleData = {};

    const fillData = (countItem) => {
        console.log("Ceremony=", ceremony);

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
            amountDue: (ceremony.gown || 0) * (ceremony.gown_count || 0) + (ceremony.hat || 0) * (ceremony.hat_count || 0) +
                (ceremony.hood || 0) * (ceremony.hood_count || 0) + (ceremony.ucol_sash || 0) * (ceremony.ucol_count || 0),
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
                updateTemplateWithData();
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });

        printedRef.current = true;
    }, []);

    const updateTemplateWithData = async () => {
        try {
            const template = await getCMSTemplate({Name: "Order Report"});
            let output = template.bodyHtml;
            Object.keys(sampleData).forEach((key) => {
                output = output.replaceAll(`{{${key}}}`, sampleData[key]);
            });

            // console.log("Output: ", output);

            await printHtmlToPdf(output, "BulkWorksheet.pdf");
        } catch (err) {
            console.error("Failed to load template", err);
        } finally {
            setLoading(false);
        }
    }
    if (loading) return <FullscreenSpinner />;
}
