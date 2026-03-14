import React, { useEffect, useRef, useState } from "react";
import axios, {Cancel} from "axios";
import FullscreenSpinner from "@/components/FullscreenSpinner.jsx";
import AdminNavbar from "./AdminNavbar.jsx";
import "./AdminEditCeremonies.css";
import {Printer, X, Download} from "lucide-react";
import {Button} from "@/components/ui/button.jsx";
import {PrintGraduatedNotHiredPDF, PrintHiredNotGraduatedPDF} from "@/components/PrintManifest.js";
import AdminImportCeremony from "@/components/AdminImportCeremony.jsx";

const API_URL = import.meta.env.VITE_GOWN_API_BASE; // or hardcode "http://localhost:5144"
// const API_URL = "http://localhost:5144"

export default function AdminDataCheck() {
  const [ceremonies, setCeremonies] = useState([]);
  const [hired, setHired] = useState([]);
  const [buttonType, setButtonType] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [importData, setImportData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch ceremonies on mount
  useEffect(() => {
    axios
      .get(`${API_URL}/admin/ceremonies`)
      .then((res) => {
        setCeremonies(res.data.filter(p => p.institutionName === 'Massey'));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Start editing
  const handleNotGraduated = (ceremony) => {
    setEditingId(ceremony.id);
    axios
        .get(`${API_URL}/admin/hirednotgraduated/${ceremony.id}`)
        .then((res) => {
          setHired(res.data);
          setEditingId(ceremony.id)
          setLoading(false);
          setButtonType(1);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
  };

    const handleNotHired = (ceremony) => {
        setEditingId(ceremony.id);
        axios
            .get(`${API_URL}/admin/graduatednothired/${ceremony.id}`)
            .then((res) => {
                setHired(res.data);
                setEditingId(ceremony.id)
                console.log('Hired not graduated=', res.data);
                setLoading(false);
                setButtonType(2);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    };

  const handleImportData = () => {
        setImportData(true);
  }

  const exportToCSV = (hired, filename = "HiredNotGraduated.csv") => {
        if (!hired || hired.length === 0) return;

        // Get headers
        const headers = Object.keys(hired[0]);

        // Convert rows
        const rows = hired.map(obj =>
            headers.map(h => `"${(obj[h] ?? "").toString().replace(/"/g, '""')}"`).join(",")
        );

        // Combine headers and rows
        const csv = [headers.join(","), ...rows].join("\n");

        // Create download
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(url);
  }

  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (importData) return <AdminImportCeremony onClose={() => setImportData(false)}/>;

  return (
    <>
      <AdminNavbar />
      <div className="p-6 topform">
        <div className="flex justify-between pl-2 pr-16 pb-4">
          <h1 className="text-xl font-bold mb-4 text-black">Massey Data Wash</h1>
          <Button className="bg-green-700 hover:bg-green-800 text-base"
            onClick={() => handleImportData()}
          >
              Import Graduation Data
          </Button>
        </div>
        <table className="min-w-full border !border-gray-300 bg-white rounded w-full text-gray-700">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2 border">Name</th>
              <th className="p-2 border text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ceremonies.map((ceremony) => (
              <React.Fragment key={ceremony.id}>
                <tr className="border">
                    <>
                      <td className="p-2 border font-bold">{ceremony.name}</td>
                      <td className="flex p-2 gap-8 justify-around">
                        <div className="flex gap-4">
                            <Button
                              onClick={() => handleNotGraduated(ceremony)}
                              className="!bg-green-700 text-white px-3 py-1 text-base rounded hover:!bg-green-800"
                            >
                              Hired Not Graduated
                            </Button>

                            <Button className="bg-green-700 px-3 py-1 hover:bg-green-800"
                              onClick={() => PrintHiredNotGraduatedPDF(hired)}
                              disabled={!hired.length || ceremony.id !== editingId || buttonType !== 1}
                            >
                                <Printer/>
                            </Button>

                            <Button className="bg-green-700 px-3 py-1 hover:bg-green-800"
                                    onClick={() => exportToCSV(hired, 'HiredNotGraduated.csv')}
                                    disabled={!hired.length || ceremony.id !== editingId || buttonType !== 1}
                            >
                                <Download/>.CSV
                            </Button>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                className="!bg-green-700 text-white px-3 py-1 text-base rounded hover:!bg-green-800"
                                onClick={() => handleNotHired(ceremony)}
                            >
                              Graduated Not Hired
                            </Button>

                            <Button className="bg-green-700 px-3 py-1 hover:bg-green-800"
                              onClick={() => PrintGraduatedNotHiredPDF(hired)}
                              disabled={!hired.length || ceremony.id !== editingId || buttonType !== 2}
                            >
                                <Printer/>
                            </Button>

                            <Button className="bg-green-700 px-3 py-1 hover:bg-green-800"
                                    onClick={() => exportToCSV(hired, 'GraduatedNotHired.csv')}
                                    disabled={!hired.length || ceremony.id !== editingId || buttonType !== 2}
                            >
                                <Download/>.CSV
                            </Button>
                        </div>
                      </td>
                    </>
                </tr>
                {editingId === ceremony.id && (
                <tr>
                  <td colSpan={2}>
                    <table width="100%" className="border ">
                      <thead>
                        <tr>
                          <th className="p-2 border bg-green-200">Student Id</th>
                          <th className="p-2 border bg-green-200">Surname</th>
                          <th className="p-2 border bg-green-200">Forename</th>
                          <th className="p-2 border bg-green-200">Degree</th>
                          <th className="p-2 border bg-green-200">Ceremony</th>
                          <th className="p-2 border bg-green-200">Note</th>
                          <th className="p-2 border bg-green-200">A/C</th>
                          <th className="p-2 border bg-green-200">Mobile</th>
                          <th className="p-2 border bg-green-200">
                            <Button className="bg-green-200 shadow-none text-red-700 hover:bg-green-300"
                              onClick={() => {
                                  setEditingId(null)
                                  setButtonType(0)
                             }}>
                              <X />
                            </Button>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                          {hired.map((student) => (
                           <>
                            <tr>
                              <td className="p-2 border">{student.studentId}</td>
                              <td className="p-2 border">{student.firstName}</td>
                              <td className="p-2 border">{student.lastName}</td>
                              <td className="p-2 border">{student.degree}</td>
                              <td className="p-2 border">{student.ceremonyName}</td>
                              <td className="p-2 border">{student.hoodName}</td>
                              <td className="p-2 border">{student.referenceNo}</td>
                              <td className="p-2 border">{student.mobile}</td>
                              <td className="p-2 border"></td>
                            </tr>
                           </>
                          ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {loading && <FullscreenSpinner />}
      </div>
    </>
  );
}
