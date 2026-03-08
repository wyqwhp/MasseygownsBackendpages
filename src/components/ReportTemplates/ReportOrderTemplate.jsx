import React, { useState, useEffect, useRef } from "react";
import JoditEditor from "jodit-react";
import "./ReportOrderTemplate.css";
import {getCMSTemplate, saveCMSTemplate} from "../../api/TemplateApi.js";
import FullscreenSpinner from "@/components/FullscreenSpinner.jsx";

export default function ReportOrderTemplate(template) {
    const editor = useRef(null);
    const LOCAL_KEY = "template_order_report";

    const [html, setHtml] = useState("");
    const [previewHtml, setPreviewHtml] = useState("");
    const [loading, setLoading] = useState(true);
    const latestHtmlRef = useRef("");

    // ----------------------------
    // VARIABLE LIST
    // ----------------------------
    const variableList = [
        "idCode",
        "despatchDate",
        "Name",
        "ceremonyDate",
        "email",
        "organiser",
        "phone",
        "amountDue",
        "freight",
        "Notes",
        "gownsDespatched",
        "gownsReturned",
        "hoodsDespatched",
        "hoodsReturned",
        "hatsDespatched",
        "hatsReturned",
        "ucolDespatched",
        "ucolReturned",
        "returnDate"
    ];

    // ----------------------------
    // SAMPLE DATA FOR PREVIEW
    // ----------------------------
    const sampleData = {
        idCode: "WOOD24",
        Name: "Woodford House 2024",
        CourierAddress: "3 Iona Road",
        ceremonyDate: "2024-12-05",
        phone: "06 873 0700 Ext 885",
        organiser: "Robyn Walsh",
        email: "robyn.walsh@woodford.school.nz",
        despatchDate: "2024-12-05",
        amountDue: 3000,
        freight: 20,
        returnDate: "2024-12-08",
        gownsDespatched: 5,
        gownsReturned: 0,
        hatsDespatched: 3,
        hatsReturned: 0,
        hoodsDespatched: 4,
        hoodsReturned: 0,
        ucolDespatched: 1,
        ucolReturned: 0,
        city: "Albany",
        postcode: "0632",
        country: "NZ",
        invoiceNumber: "41782315",
        gstNumber: "41782315",
        total: "$0.00",
        Notes: "Xero INV-12572",
    };

    // ----------------------------
    // LOAD TEMPLATE ON MOUNT
    // ----------------------------
    useEffect(() => {
        let isMounted = true; // safety for unmounts
        async function loadTemplate() {
            try {
                setLoading(true);
                const template = await getCMSTemplate({ Name: "Order Report" });
                if (!isMounted) return;

                setHtml(template.bodyHtml);
                updatePreview(template.bodyHtml);
            } catch (err) {
                console.error("Failed to load template", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        loadTemplate();
        return () => {
            isMounted = false;
        };
    }, []);

    const openPreview = (e) => {
        e.preventDefault();
        e.stopPropagation();

        let output = latestHtmlRef.current || html;
        Object.keys(sampleData).forEach((key) => {
            output = output.replaceAll(`{{${key}}}`, sampleData[key]);
        });
        const previewWindow = window.open("", "_blank", "width=900,height=700");

        if (!previewWindow) {
            alert("Popup blocked. Please allow popups for this site.");
            return;
        }
            previewWindow.document.open();
            previewWindow.document.write(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>Preview</title>
                        <meta charset="UTF-8" />
                        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    </head>
                    <body>
                        ${output}
                    </body>
                </html>
            `);
            previewWindow.document.close();

    };

    // ----------------------------
    // PREVIEW UPDATE
    // ----------------------------
    const updatePreview = (value) => {
        let output = latestHtmlRef.current || html;
        Object.keys(sampleData).forEach((key) => {
            output = output.replaceAll(`{{${key}}}`, sampleData[key]);
        });
        setPreviewHtml(output);
    };

    // ----------------------------
    // INSERT VARIABLE
    // ----------------------------
    const insertVariable = (key) => {
        const j = editor.current?.editor;
        if (!j) return;

        j.selection.focus();
        j.execCommand("insertHTML", false, `{{${key}}}`);
    };

    // ----------------------------
    // JODIT CONFIG
    // ----------------------------
    const config = {
        height: 1000,
        enableDragAndDropFileToEditor: false,
        events: {
            drop: (event) => {
                event.preventDefault();
                const data = event.dataTransfer.getData("text/plain");
                const j = editor.current?.editor;
                if (j && data) {
                    j.execCommand("insertHTML", false, data);
                }
            },
            dragover: (event) => event.preventDefault(),
        },
    };

    // ----------------------------
    // SAVE TEMPLATE
    // ----------------------------
    const saveTemplate = async () => {
        const latestHtml = latestHtmlRef.current;
        localStorage.setItem(LOCAL_KEY, latestHtml);

        try {
            await saveCMSTemplate({
                id: template.template.id,
                SubjectTemplate: template.template.subjectTemplate,
                BodyHtml: latestHtml,
                TaxReceiptHtml: "",
            });
        } catch (err) {
            console.error("Template sending failed:", err);
        }
    };

    if (loading) return <FullscreenSpinner />;

    return (
        <div style={{ display: "flex", width: "100%" }}>
            <div style={{ flex: 1, padding: "30px" }}>
                {/* VARIABLE BUTTONS */}
                <div style={{ marginBottom: "15px" }}>
                    <strong>Variables (Drag or Drop):</strong>
                    <div style={{ marginTop: "8px" }}>
                        {variableList.map((key) => (
                            <button
                                key={key}
                                draggable
                                onDragStart={(e) =>
                                    e.dataTransfer.setData("text/plain", `{{${key}}}`)
                                }
                                onClick={() => insertVariable(key)}
                                style={{
                                    margin: "5px",
                                    padding: "6px 12px",
                                    borderRadius: "4px",
                                    border: "1px solid #ccc",
                                    background: "#fafafa",
                                    cursor: "grab",
                                    fontSize: "14px",
                                }}
                            >
                                {`{{${key}}}`}
                            </button>
                        ))}
                    </div>
                </div>

                {/* EDITOR */}
                <JoditEditor
                    value={html}      // initial value only
                    config={config}
                    onChange={(content) => {
                        latestHtmlRef.current = content;
                    }}
                    onBlur={(content) => {
                        latestHtmlRef.current = content;
                        localStorage.setItem(LOCAL_KEY, content);
                    }}
                />

                <div className="flex gap-12">
                    {/* PREVIEW */}
                    <button onClick={(e) => openPreview(e)} className="email-save-button">
                        Preview
                    </button>
                    {/* SAVE */}
                    <button onClick={saveTemplate} className="email-save-button">
                        Save Template
                    </button>
                </div>
            </div>
        </div>
    );
}
