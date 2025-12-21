import AdminNavbar from "@/pages/AdminNavbar.jsx";
import React, {useState} from "react";
import * as XLSX from "xlsx";
import "./AdminImportBulk.css"
import axios from "axios";
import {convertToHtml} from "@/api/ConvertAPI.js";

const API_URL = import.meta.env.VITE_GOWN_API_BASE;
// const API_URL = "http://localhost:5144";

export default function AdminImportBulk() {
    const [editFile, setEditFile] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [statusError, setStatusError] = useState("");

    // File upload handler (CSV / Excel)
    async function handleUploadFile() {
        // console.log("Upload File=", editFile);
        if (!editFile) return;

        setIsSaving(true);
        setStatusMessage("");
        setStatusError("");

        const reader = new FileReader();

        // Read as binary string
        reader.readAsArrayBuffer(editFile);

        reader.onload = async (e) => {
            try {
                const data = e.target.result;

                // Parse workbook
                const workbook = await XLSX.read(data, {type: "binary"});

                // Take the first worksheet
                const worksheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[worksheetName];

                // Convert to JSON (array of objects)
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    defval: "", // fills empty cells with empty string
                });
                console.log("Parsed data:", jsonData);

                if (jsonData.length === 0) throw new Error("Empty file received");

                jsonData.forEach((row) => {
                    console.log(`Name: `, row.Name, ` Height: `, row.Height);
                })

                await axios.post(`${API_URL}/admin/bulkorders`, jsonData);

                setStatusMessage("File imported: " + jsonData.length + " records");
            } catch (err) {
                console.log("Error=", err);
                setStatusError(
                    err instanceof Error ? "Failed to upload file. " + err.response.data : "Failed to upload file."
                );
            } finally {
                setIsSaving(false);
            }
        }
    }

    return (
    <>
        <AdminNavbar />
        <div className="parent">
            <div className="acm-detail-body">
                <label className="acm-detail-label">Upload bulk import file</label>
                <div className="acm-file-row">
                    <input
                        id={"fileInputId"}
                        type="file"
                        accept=".csv,.xls,.xlsx"
                        className="acm-hidden-file-input"
                        onChange={(e) => {
                            const file =
                                e.target.files && e.target.files[0]
                                    ? e.target.files[0]
                                    : null;
                            setEditFile(file);
                            setStatusMessage("");
                            setStatusError("");
                        }}
                    />
                    <label htmlFor={"fileInputId"} className="acm-file-button">
                        Choose file
                    </label>
                    <span className="acm-file-name">
                  {editFile ? editFile.name : "No file chosen"}
                </span>
                </div>

                <p className="acm-detail-help">
                    Allowed formats: CSV, XLS, XLSX
                </p>

                <div className="acm-detail-actions">
                    <button
                        type="button"
                        className="acm-button primary"
                        disabled={isSaving || !editFile}
                        onClick={handleUploadFile}
                    >
                        {isSaving ? "Uploading..." : "Upload"}
                    </button>
                </div>
                {(statusMessage || statusError) && (
                    <div
                        className={
                            statusError
                                ? "acm-status-message error"
                                : "acm-status-message success"
                        }
                    >
                        {statusError || statusMessage}
                    </div>
                )}
            </div>
        </div>
        );
    </>
);}
