import AdminNavbar from "./AdminNavbar.jsx";
import React, { useState } from "react";
import * as XLSX from "xlsx";
import "./AdminImportBulk.css";
import axios from "axios";
import { toNullableDecimal } from "../services/DecimalServices.js";

const API_URL = import.meta.env.VITE_GOWN_API_BASE;
// const API_URL = "http://localhost:5144";

// A token is treated as an upper-case surname if it has 2+ letters, all upper case
function isUpperCaseWord(word) {
  const letters = word.replace(/[^\p{L}]/gu, "");
  return letters.length > 1 && letters === letters.toUpperCase() && letters !== letters.toLowerCase();
}

// Splits a raw name into first and last name. Supported formats:
//   "SMITH, John"        -> last: SMITH, first: John
//   "John Smith"         -> last: Smith, first: John
//   "SMITH John"         -> last: SMITH, first: John (upper-case word is the surname)
//   "John VAN DER BERG"  -> last: VAN DER BERG, first: John
// Comments in brackets, e.g. "(VIP)" or "[late]", are stripped out.
function parseName(rawName) {
  const name = String(rawName ?? "")
    .replace(/\([^)]*\)|\[[^\]]*\]|\{[^}]*\}/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!name) return { firstName: null, lastName: null };

  // "LAST, First"
  if (name.includes(",")) {
    const [lastName, ...firstParts] = name.split(",");
    return {
      lastName: lastName.trim() || null,
      firstName: firstParts.join(" ").replace(/\s+/g, " ").trim() || null,
    };
  }

  const words = name.split(" ");
  if (words.length === 1) return { firstName: null, lastName: words[0] };

  // Mixed case: upper-case words are the surname, e.g. "SMITH John" or "John SMITH"
  const upperWords = words.filter(isUpperCaseWord);
  if (upperWords.length > 0 && upperWords.length < words.length) {
    return {
      lastName: upperWords.join(" "),
      firstName: words.filter((w) => !isUpperCaseWord(w)).join(" "),
    };
  }

  // "First [Middle] Last"
  return {
    lastName: words[words.length - 1],
    firstName: words.slice(0, -1).join(" "),
  };
}

export default function AdminImportBulk() {
  const [editFile, setEditFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState("");

  // File upload handler (CSV / Excel)
  async function handleUploadFile() {
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
        const workbook = await XLSX.read(data, { type: "binary" });

        // Take the first worksheet
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];

        // Convert to JSON (array of objects)
        let jsonData = XLSX.utils.sheet_to_json(worksheet, {
          defval: null, // fills empty cells with empty string
        });
        console.log("Parsed data:", jsonData);

        if (jsonData.length === 0) throw new Error("Empty file received");

        // Height -> itemSize matching table
        const { data: importSizes } = await axios.get(`${API_URL}/admin/importsize`);
        const sizeByHeight = new Map(
          importSizes.map((s) => [Number(s.importHeight), s.itemSize])
        );

        // Hood shortName -> name lookup
        const { data: hoods } = await axios.get(`${API_URL}/admin/allhoods`);
        const hoodNameByShortName = new Map(
          hoods.map((h) => [h.shortName, h.name])
        );

        console.log("Hoods=", hoodNameByShortName);

        // console.log("Size By Height=", importSizes);

        // console.log("ImportSize=", sizeByHeight.values());
        // console.table(Object.fromEntries(sizeByHeight));

        jsonData.forEach((row) => {
          // console.log("Height1=", row.Height);

          row.Height = toNullableDecimal(row.Height);
          row.Headsize = toNullableDecimal(row.Headsize);

          const { firstName, lastName } = parseName(row.Name);
          row.LastName = lastName;
          row.FirstName = firstName;

          // console.log("Height2=", row.Height);

          row.Height = row.Height == null ? null : sizeByHeight.get(Number(row.Height)) ?? null;

          // Hood code -> hood name (keep the original value if the code is unknown)
          if (row.Hood != null) {
            row.Hood = hoodNameByShortName.get(String(row.Hood).trim()) ?? row.Hood;
          }

          console.log(`Name: `, row.Name, ` Height: `, row.Height);
        });

        await axios.post(`${API_URL}/admin/bulkorders`, jsonData);

        setStatusMessage("File imported: " + jsonData.length + " records");
      } catch (err) {
        console.log("Error=", err);
        setStatusError(
          err instanceof Error
            ? "Failed to upload file. " + err.response.data.title
            : "Failed to upload file."
        );
      } finally {
        setIsSaving(false);
      }
    };
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

          <p className="acm-detail-help">Allowed formats: CSV, XLS, XLSX</p>

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
  );
}
