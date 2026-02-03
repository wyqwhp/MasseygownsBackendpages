import React, {useEffect, useState} from "react";
import AdminNavbar from "@/components/AdminNavbar.jsx";
import axios from "axios";
import FullscreenSpinner from "@/components/FullscreenSpinner.jsx";

const API_URL = import.meta.env.VITE_GOWN_API_BASE; // or hardcode "http://localhost:5144"
// const API_URL = "http://localhost:5144" // or hardcode "http://localhost:5144"

export default function AdminEditSku({ onChange }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [skus, setSkus] = useState([]);

    useEffect(() => {
        axios
            .get(`${API_URL}/admin/sku`)
            .then((res) => {
                setSkus(res.data);
            })
            .catch((err) => {
                setError(err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const updateSku = (id, field, value) => {
        const updated = skus.map(sku =>
            sku.id === id ? { ...sku, [field]: value } : sku
        );
        setSkus(updated);
        onChange?.(updated);
    };

    const addSku = () => {
        const newSku = {
            id: crypto.randomUUID(),
            name: "",
            size: "",
            hoodType: "",
            quantity: 0,
        };
        const updated = [...skus, newSku];
        setSkus(updated);
        onChange?.(updated);
    };

    return (
        <>
        <AdminNavbar />
        <div className="space-y-2 ml-8 mr-8 topform">
            {/* Header */}
            <div className="grid grid-cols-[6fr_1fr_6fr_80px_6fr_80px] gap-2">
                <div className="contents font-bold">
                    <span>Name</span>
                    <span>Size</span>
                    <span>Fit Type</span>
                    <span>Code</span>
                    <span>Hood Type</span>
                    <span>Qty</span>
                </div>

            {/* Rows */}
            <div className="contents font-normal">
            {skus.map((sku) => (
                <>
                    <input
                        className="border px-2 py-1"
                        value={sku.name}
                        readOnly
                        onChange={(e) => updateSku(sku.id, "name", e.target.value)}
                    />

                    <input
                        className="border px-2 py-1"
                        value={sku.size}
                        readOnly
                        onChange={(e) => updateSku(sku.id, "size", e.target.value)}
                    />

                    <input
                        className="border px-2 py-1"
                        value={sku.fitType}
                        readOnly
                        onChange={(e) => updateSku(sku.id, "hoodType", e.target.value)}
                    />

                    <input
                        className="border px-2 py-1"
                        value={sku.labelsize}
                        readOnly
                        onChange={(e) => updateSku(sku.id, "hoodType", e.target.value)}
                    />

                    <input
                        className="border px-2 py-1"
                        value={sku.hood}
                        readOnly
                        onChange={(e) => updateSku(sku.id, "hoodType", e.target.value)}
                    />

                    <input
                        type="text"
                        className="border px-2 py-1"
                        value={sku.count}
                        min={0}
                        onChange={(e) =>
                             updateSku(sku.id, "quantity", Number(e.target.value))
                        }
                    />
                </>

            ))}
            </div>
            </div>

            {/* Actions */}
            <button
                onClick={addSku}
                className="mt-2 mb-4 px-3 py-1 border rounded-lg text-white bg-green-600 hover:bg-green-700"
            >
                + Add SKU
            </button>
        </div>
            {loading && <FullscreenSpinner />}
        </>
    );
}
