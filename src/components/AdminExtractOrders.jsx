import React, { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_GOWN_API_BASE;

export default function OrdersToCSV() {
    const [csvData, setCsvData] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [jsonData, setJsonData] = useState([]); // raw JSON from /orders

    const jsonToCSV = (data) => {
        if (!data.length) return "";
        const headers = Object.keys(data[0]).join(",");
        const rows = data.map((row) =>
            Object.values(row).map((val) => `"${val}"`).join(",")
        );
        return [headers, ...rows].join("\n");
    };

    useEffect(() => {
        fetch(`${API_URL}/orders`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Network response was not ok");
                }
                return res.json();
            })
            .then((data) => {
                setJsonData(data);         // store raw JSON
                // setCsvData(jsonToCSV(data));
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-red-600">Error: {error}</p>;

    // Convert JSON → CSV
    const convertToCSV = (data) => {
        let rows = [];
        data.forEach((item) => {
            const flatItems = item.items.map(obj =>
                Object.entries(obj)
                    .map(([k, v]) => `${k}:${v === null ? "null" : v}`)
                    .join(", ")
            );
            const csvSafe = flatItems.map(flat => `${flat}`).join(",");

            rows.push({
                OrderId: item.id,
                FirstName: item.firstName,
                LastName: item.lastName,
                Email: item.email,
                Address: item.address,
                City: item.city,
                PostCode: item.postcode,
                Country: item.country,
                Phone: item.phone,
                Mobile: item.mobile,
                StudentId: item.studentId,
                Message: item.message,
                Paid: item.paid,
                PaymentMethod: item.paymentMethod,
                PurchaseOrder: item.purchaseOrder,
                OrderDate: item.orderDate,
                Items: csvSafe
            });
        });

        const headers = Object.keys(rows[0]).join(",");
        const values = rows.map((row) => Object.values(row).join(","));
        return [headers, ...values].join("\n");
    };

    // Trigger CSV download
    const downloadCSV = () => {
        if (!csvData) return;
        const blob = new Blob([csvData], { type: "text/csv" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "orders.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    const extractOrders = () => {
        const csv = convertToCSV(jsonData);
        setCsvData(csv);
    };

    return (
        <div className="p-6">
            <h1 className="!text-3xl font-bold mb-4 text-black">Orders Export:</h1>
            <button
                onClick={extractOrders}
                className="!bg-green-700 text-white px-4 py-2 rounded hover:!bg-green-800 mr-8">
                Extract Orders
            </button>
            <button
                disabled={!csvData}
                onClick={downloadCSV}
                className="!bg-green-700 text-white px-4 py-2 rounded hover:!bg-green-800 disabled:!bg-gray-400 disabled:!cursor-not-allowed">
                Export to CSV
            </button>
            {csvData && (
                <pre className="mt-4 bg-gray-100 p-2 rounded overflow-x-auto"> {csvData} </pre>
            )}
        </div>
    );
}
