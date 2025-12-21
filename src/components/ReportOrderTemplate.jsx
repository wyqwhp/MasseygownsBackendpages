import { useState, useEffect, useRef } from "react";
import JoditEditor from "jodit-react";
import "./ReportOrderTemplate.css";
import {saveCMSTemplate} from "../api/TemplateApi.js";

export default function PurchaseOrderEmailTemplate(template) {
    const editor = useRef(null);
    const LOCAL_KEY = "template_order_report";

    const [html, setHtml] = useState("");
    const [previewHtml, setPreviewHtml] = useState("");

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
    ];

    // ----------------------------
    // DEFAULT TEMPLATE
    // ----------------------------
    const defaultTemplate = `
<!DOCTYPE html>
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
    <div style="position:absolute; font-weight: bold; font-size: xx-large; top:40px; left:340px">
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

    // ----------------------------
    // SAMPLE DATA FOR PREVIEW
    // ----------------------------
    const sampleData = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        mobile: "021123456",
        phone: "0275050782",
        address: "9 The Avenue",
        city: "Albany",
        postcode: "0632",
        country: "NZ",
        invoiceNumber: "41782315",
        gstNumber: "41782315",
        total: "$0.00",
    };

    // ----------------------------
    // LOAD TEMPLATE ON MOUNT
    // ----------------------------
    useEffect(() => {
        const saved = localStorage.getItem(LOCAL_KEY);
        const initial = saved ?? defaultTemplate;
        setHtml(initial);
        updatePreview(initial);
    }, []);


    // ----------------------------
    // PREVIEW UPDATE
    // ----------------------------
    const updatePreview = (value) => {
        let output = value;
        Object.keys(sampleData).forEach((key) => {
            output = output.replaceAll(`{{${key}}}`, sampleData[key]);
        });
        setPreviewHtml(output);
    };

    // Helper: get the actual Jodit instance
    const getJodit = () => editor.current?.editor;

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
        localStorage.setItem(LOCAL_KEY, html);
        try {
            await saveCMSTemplate({
                id: template.template.id,
                SubjectTemplate: template.template.subjectTemplate,
                BodyHtml: html,
                TaxReceiptHtml: "",
            });
        } catch (err) {
            console.error("Template sending failed:", err);
        }
    };

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
                    ref={editor}
                    value={html}
                    config={config}
                    onBlur={(newContent) => {
                        setHtml(newContent);
                        localStorage.setItem(LOCAL_KEY, newContent);
                    }}
                />

                {/* SAVE */}
                <button onClick={saveTemplate} className="email-save-button">
                    Save Template
                </button>
            </div>
        </div>
    );
}
