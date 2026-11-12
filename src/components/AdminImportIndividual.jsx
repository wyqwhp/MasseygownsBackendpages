import AdminNavbar from "./AdminNavbar.jsx";
import React, { useState } from "react";
import * as XLSX from "xlsx";
import "./AdminImportBulk.css";
import axios from "axios";
import { toNullableDecimal } from "../services/DecimalServices.js";
import { parseName } from "../services/NameServices.js";
import FullscreenSpinner from "@/components/FullscreenSpinner.jsx";

const API_URL = import.meta.env.VITE_GOWN_API_BASE;
// const API_URL = "http://localhost:5144";

export default function AdminImportIndividual() {
  const [editFile, setEditFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState();
  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState("");

  // File upload handler (CSV / Excel)
  async function handleUploadFile() {
    if (!editFile) return;

    setIsSaving(true);
    setStatusMessage("");
    setStatusError("");

    const reader = new FileReader();

    reader.readAsArrayBuffer(editFile);

    reader.onload = async (e) => {
      try {
        const data = e.target.result;

        // Parse workbook and take the first worksheet
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        // Convert to JSON (array of objects), empty cells become null
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          defval: null,
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

        // Build the payload sent to backend: one new object per parsed row
        const importData = jsonData.map((row) => {
          // Same fields as the source row for now; conversion rules go here
          const newRow = {};

          newRow.Address1 = row.Address1 == null ? null : String(row.Address1);
          newRow.Address2 = row.Address2 == null ? null : String(row.Address2);
          newRow.AmountOwing = row["Amount Owing"];
          newRow.AmountPaid = row["Amount Paid"];
          newRow.Bond = row.Bond;
          newRow.Bonnet = row.Bonnet;
          newRow.City = row.City;
          newRow.Comments = row.Comments;
          newRow.Company = row.Company;
          newRow.Country = row.Country
          newRow.Donation = row.Donation;
          newRow.Email = row.Email;
          newRow.FirstName = row["First Name"];
          newRow.GarmentBag = row["Garment Bag"];

          const stripTrailingOne = (value) =>
            value?.replace(/\s*\(1\)\s*$/, "").trim() || null;

          // Gown format: one or more "gown type, size, Hire|Buy, fit type" separated by "/"
          // Set format: "set type, size, hat size, hood" (hat size and hood in either order)
          newRow.Gown = (row.Gown ?? "")
            .toString()
            .split("/")
            .filter((gown) => gown.trim())
            .map((gown) => {
              const [gownType, gownSize, gownHireOrBuy, gownFitType] = gown
                .split(",")
                .map((part) => part.trim() || null);
              // Drop the word "Gown" and any dash, e.g. "Gown - Bachelor" -> "Bachelor"
              const type =
                gownType
                  ?.replace(/\bgown\b/gi, "")
                  .replace(/[-–—]/g, "")
                  .replace(/\s+/g, " ")
                  .trim() || null;

              if (/\bset\b/i.test(gownType ?? "")) {
                const setFields = [gownHireOrBuy, gownFitType].map(stripTrailingOne);
                // Hat size is the field with a cm measurement, e.g. "56cm" or "56 cm"
                const hatSizeIndex = setFields.findIndex((field) =>
                  /\d\s*cm\b/i.test(field ?? "")
                );
                return {
                  Type: type,
                  Size: gownSize ?? null,
                  SetHatSize: setFields[hatSizeIndex] ?? null,
                  SetHood: setFields[hatSizeIndex === 0 ? 1 : 0] ?? null,
                };
              }

              return {
                Type: type,
                Size: gownSize ?? null,
                HireOrBuy: gownHireOrBuy ?? null,
                // Drop trailing "(1)", e.g. "Standard Fit (1)" -> "Standard Fit"
                FitType: gownFitType?.replace(/\s*\(1\)\s*$/, "").trim() || null,
              };
            });

          // Hood format: "hood type, hood name, Hire|Buy" or "hood name, hood size"
          // Normalise the prefix spacing, e.g. "Massey-Bachelor" -> "Massey - Bachelor"
          const formatHoodName = (name) =>
            name?.replace(/^Massey-\s*/, "Massey - ") ?? null;
          // Name without the prefix, e.g. "Massey-Bachelor" -> "Bachelor"
          const getHoodShortName = (name) =>
            name?.replace(/^Massey\s*-\s*/, "").trim() || null;
          // Drop the word "Degree", e.g. "Massey-Bachelor Degree" -> "Massey-Bachelor"
          const removeDegree = (name) =>
            name?.replace(/\bdegree\b/gi, "").replace(/\s+/g, " ").trim() || null;
          const hoodParts = (row.Hood ?? "")
            .toString()
            .split(",")
            .map((part) => part.trim() || null);
          if (hoodParts.length === 2) {
            const [rawHoodName, hoodSize] = hoodParts;
            const hoodName = removeDegree(rawHoodName);
            newRow.Hood = {
              Type: hoodName?.includes("Massey University PhD Hood") ? "PhD Hood" : hoodName,
              Name: stripTrailingOne(hoodSize),
              ShortName: getHoodShortName(stripTrailingOne(hoodSize)),
              HireOrBuy: null,
              Size: formatHoodName(stripTrailingOne(hoodSize)),
            };
          } else {
            const [hoodType, rawHoodName, hoodHireOrBuy] = hoodParts;
            const hoodName = removeDegree(rawHoodName);
            newRow.Hood = {
              // Drop the "Hire Hood -" prefix, e.g. "Hire Hood - Bachelor" -> "Bachelor"
              Type: hoodType?.replace(/Hire/i, "").trim() || null,
              Name: hoodName,
              ShortName: getHoodShortName(hoodName),
              HireOrBuy: stripTrailingOne(hoodHireOrBuy),
              Size: null,
            };
          }

          newRow.HoodPin = row["Hood Pin"];
          newRow.Keyring = row.Keyring;
          newRow.Korowai = row.Korowai;
          newRow.LastName = row["Last Name"];
          newRow.Mortarboard = row.Mortarboard;
          newRow.OrderNumber = row["Order Number"];
          newRow.PaymentMethod = row["Payment Method"];
          newRow.PaymentRefernce = row["Payment Refernce"];
          newRow.Phone = row.Phone == null ? null : String(row.Phone);
          newRow.Photography = row.Photography;
          newRow.PrepaidReturn = row.Prepaid_Return;
          newRow.Qualification = row.Qualification;

          const [stoleName, stoleSize, stoleHire] = (row.Scarf ?? "")
              .toString()
              .split(",")
              .map((part) => part.trim() || null);
          newRow.Stole = {
            Name: stoleName ?? null,
            Size: stoleSize ?? null,
            HireOrBuy: stoleHire ?? null,
          }

          newRow.State = row.State;
          newRow.Status = row.Status;
          newRow.StudentId = row["Student Id"] == null ? null : String(row["Student Id"]);
          newRow.Supplier = row.Supplier;
          newRow.Tiepin = row.Tiepin;
          newRow.TotalCost = row["Total Cost"];

          // Trencher format: "hat name, Hire|Buy, hat size"
          const [trencherName, trencherHireOrBuy, trencherSize] = (row.Trencher ?? "")
            .toString()
            .split(",")
            .map((part) => part.trim() || null);
          newRow.Trencher = {
            Name: trencherName ?? null,
            HireOrBuy: trencherHireOrBuy ?? null,
            Size: trencherSize ?? null,
          };
          newRow.University = row.University;
          newRow.Zip = row.Zip == null ? null : String(row.Zip);

          const importRow = { ...newRow };
          return importRow;
        });
        console.log("Import data:", importData);

        setLoading(true);
        const res = await axios.post(`${API_URL}/admin/indorder`, importData);

        setStatusMessage(
          "File imported: " + (res.data?.imported ?? importData.length) + " records"
        );
      } catch (err) {
        console.log("Error=", err);
        const detail = err.response?.data?.title || err.response?.data?.message || err.message;
        setStatusError("Failed to upload file." + (detail ? " " + detail : ""));
      } finally {
        setIsSaving(false);
        setLoading(false);
      }
    };
  }

  return (
    <>
      <AdminNavbar />
      <div className="parent">
        <div className="acm-detail-body">
          <label className="acm-detail-label">Upload individual orders import file</label>
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
      {loading && <FullscreenSpinner/>}
    </>
  );
}
