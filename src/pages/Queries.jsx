import React, { useEffect, useState } from "react";
import { fetchContact } from "../api/ContactApi";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { ChevronRight, ChevronDown } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function QueriesPage() {
  const [queries, setQueries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [expandedRow, setExpandedRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchContact();
        setQueries(data);
      } catch (err) {
        console.error("Failed to fetch contact queries:", err);
      }
    }
    loadData();
  }, []);

  const filteredQueries = queries.filter((q) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      q.firstName?.toLowerCase().includes(term) ||
      q.lastName?.toLowerCase().includes(term) ||
      q.email?.toLowerCase().includes(term) ||
      q.subject?.toLowerCase().includes(term) ||
      q.query?.toLowerCase().includes(term);

    const createdAt = new Date(q.createdAt);

    let matchesDate = true;
    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      if (createdAt < from) matchesDate = false;
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      if (createdAt > to) matchesDate = false;
    }

    return matchesSearch && matchesDate;
  });

  const sortedQueries = [...filteredQueries].sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  const totalPages = Math.ceil(sortedQueries.length / itemsPerPage);
  const paginatedQueries = sortedQueries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const clearFilters = () => {
    setSearchTerm("");
    setFromDate("");
    setToDate("");
  };

  const exportToExcel = () => {
    if (sortedQueries.length === 0) {
      alert("No data to export!");
      return;
    }

    const exportData = sortedQueries.map((q, idx) => ({
      "#": idx + 1,
      "Submitted At": q.createdAt
        ? new Date(q.createdAt).toLocaleString([], {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "N/A",
      "First Name": q.firstName || "",
      "Last Name": q.lastName || "",
      Subject: q.subject || "",
      Email: q.email || "",
      Query: q.query || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Queries");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      "queries.xlsx"
    );
  };

  const chartData = Object.values(
    sortedQueries.reduce((acc, q) => {
      const d = new Date(q.createdAt);
      const dateKey = d.toLocaleDateString("en-NZ");
      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateKey, count: 0 };
      }
      acc[dateKey].count += 1;
      return acc;
    }, {})
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <span role="img" aria-label="queries">
          📋
        </span>
        Submitted Queries
      </h1>

      <div className="w-full h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            onClick={(e) => {
              if (e && e.activeLabel) {
                setFromDate(e.activeLabel);
                setToDate(e.activeLabel);
                setCurrentPage(1);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Search queries..."
          className="border px-3 py-2 rounded w-full md:w-1/3"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <label>From:</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border px-2 py-1 rounded"
          />
          <label>To:</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border px-2 py-1 rounded"
          />
          <button
            onClick={clearFilters}
            className="ml-2 bg-gray-200 hover:bg-gray-300 text-sm px-3 py-1 rounded"
          >
            Clear Filters
          </button>
          <button
            onClick={exportToExcel}
            className="ml-2 bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1 rounded"
          >
            Export Excel
          </button>
        </div>
        <div className="ml-auto text-gray-600 text-sm">
          Total: {sortedQueries.length} queries
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border bg-white shadow">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">#</th>
              <th
                className="px-4 py-2 border cursor-pointer select-none"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
              >
                Submitted At {sortOrder === "asc" ? "▲" : "▼"}
              </th>
              <th className="px-4 py-2 border">First Name</th>
              <th className="px-4 py-2 border">Last Name</th>
              <th className="px-4 py-2 border">Subject</th>
              <th className="px-4 py-2 border">Email</th>
            </tr>
          </thead>
          <tbody>
            {paginatedQueries.map((q, idx) => {
              const isOpen = expandedRow === q.id;
              return (
                <React.Fragment key={q.id || idx}>
                  <tr
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedRow(isOpen ? null : q.id)}
                  >
                    <td className="px-4 py-2 border flex items-center gap-2">
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-gray-700" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-700" />
                      )}
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="px-4 py-2 border">
                      {q.createdAt
                        ? new Date(q.createdAt).toLocaleString([], {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "N/A"}
                    </td>
                    <td className="px-4 py-2 border">{q.firstName}</td>
                    <td className="px-4 py-2 border">{q.lastName}</td>
                    <td className="px-4 py-2 border">{q.subject}</td>
                    <td className="px-4 py-2 border text-blue-600 underline">
                      <a href={`mailto:${q.email}`}>{q.email}</a>
                    </td>
                  </tr>

                  {isOpen && (
                    <tr>
                      <td colSpan="6" className="px-4 py-3 border bg-gray-50">
                        <p>
                          <strong>Submitted At:</strong>{" "}
                          {new Date(q.createdAt).toLocaleString([], {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="mt-2">
                          <strong>Full Message:</strong> {q.query}
                        </p>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center items-center gap-2 mt-4">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
