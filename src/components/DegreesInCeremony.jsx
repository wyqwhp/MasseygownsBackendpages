import React, { useEffect, useState } from "react";
import axios from "axios";
import FullscreenSpinner from "@/components/FullscreenSpinner.jsx";
import "./AdminEditDegrees.css";
import {Switch} from "@/components/ui/switch.jsx";

const API_URL = import.meta.env.VITE_GOWN_API_BASE; // or hardcode "http://localhost:5144"
// const API_URL = "http://localhost:5144" // or hardcode "http://localhost:5144"
const ORIGIN_DEGREES = 2;

export default function DegreesEditor({ceremonyId, onDegreesUpdated}) {
    const [degrees, setDegrees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch ceremonies on mount
    useEffect(() => {
        let localCeremonyId;
        if (ceremonyId && typeof ceremonyId === 'string' && ceremonyId.startsWith("temp-")) {
            localCeremonyId = ORIGIN_DEGREES;
        } else {
            localCeremonyId = ceremonyId;
        }
        axios
            .get(`${API_URL}/admin/degreesbyceremony/${localCeremonyId}`)
            .then((res) => {
                if (ceremonyId && typeof ceremonyId === 'string' && ceremonyId.startsWith("temp-")) {
                    const updated = res.data.map(d => ({ ...d, active: true }));
                    setDegrees(updated);
                } else {
                    setDegrees(res.data);
                }
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
        setDegrees(prev =>
            prev.map(d => ({ ...d, active: true }))
        );
    }, []);

    const toggleDegreeActive = (id, newValue) => {
        const updated = degrees.map((u) =>
            u.id === id ? { ...u, active: newValue } : u
        )
        setDegrees(updated);
        onDegreesUpdated(updated);
    }

    if (loading) return <FullscreenSpinner />;
    if (error) return <p className="text-red-600">Error: {error}</p>;

    return (
    <>
        <div className="p-6 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <table className="min-w-full border !border-gray-300 bg-white rounded w-full text-left border-collapse">
                <thead>
                <tr className="bg-gray-200 text-left">
                    <th className="p-2 border">Name</th>
                    <th className="p-2 border">Active</th>
                </tr>
                </thead>
                <tbody>
                {degrees.map((degree) => (
                    <tr key={degree.id} className="border hover:bg-gray-100">
                        <>
                            <td className="p-2 border">{degree.degreeName}</td>
                            <td className="p-2 border">
                                <Switch checked={degree.active} onCheckedChange={(checked) => toggleDegreeActive(degree.id, checked)}
                                        className="
                                          data-[state=checked]:bg-green-700
                                          data-[state=unchecked]:bg-gray-400"/>
                            </td>
                        </>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    </>
    );
}
