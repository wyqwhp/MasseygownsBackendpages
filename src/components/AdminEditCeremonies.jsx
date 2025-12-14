import React, { useEffect, useState } from "react";
import axios from "axios";
import FullscreenSpinner from "@/components/FullscreenSpinner.jsx";
import AdminNavbar from "@/pages/AdminNavbar.jsx";
import "./AdminEditCeremonies.css";
import DegreesInCeremony from "@/components/DegreesInCeremony.jsx";

const API_URL = import.meta.env.VITE_GOWN_API_BASE; // or hardcode "http://localhost:5144"
// const API_URL = "http://localhost:5144"

export default function CeremonyEditor() {
    const [ceremonies, setCeremonies] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ name: "", dueDate: "", ceremonyDate: "", visible: false,
                                                      collectionTime: ""});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [degrees, setDegrees] = useState([]);

    const handleDegreesUpdated = (updatedDegrees) => {
        setDegrees(updatedDegrees);
    };

    // Fetch ceremonies on mount
    useEffect(() => {
        axios
            .get(`${API_URL}/admin/ceremonies`)
            .then((res) => {
                setCeremonies(res.data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    // Handle field change
    const handleChange = (e) => {
        console.log(e.target.name);
        console.log(e.target.value);
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // Handle field change
    const handleToggle = (e) => {
        setForm({ ...form, [e.target.name]: e.target.checked });
    };

    // Start editing
    const handleEdit = (ceremony) => {
        setEditingId(ceremony.id);
        setForm({
            id: ceremony.id,
            name: ceremony.name,
            ceremonyDate: ceremony.ceremonyDate,
            dueDate: ceremony.dueDate,
            visible: ceremony.visible,
            collectionTime: ceremony.collectionTime,
        });
    };

    // Cancel editing
    const handleCancel = () => {
        if (editingId && typeof editingId === 'string' && editingId.startsWith("temp-")) {
            setCeremonies(ceremonies.filter(d => d.id !== editingId));
        }
        setEditingId(null);
        setForm({ name: "", dueDate: "", ceremonyDate: "", visible: false, collectionTime: "" });
    };

    // Save update
    const handleSave = async () => {
        setLoading(true);
        try {
            let res;
            if (editingId && typeof editingId === 'string' && editingId.startsWith("temp-")) {
                res = await axios.post(`${API_URL}/admin/ceremonies`, form);
                await axios.post(`${API_URL}/admin/ceremonies/${res.data.id}/degrees`, degrees);
            } else {
                res = await axios.put(`${API_URL}/admin/ceremonies/${editingId}`, form);
                await axios.post(`${API_URL}/admin/ceremonies/${editingId}/degrees`, degrees);
            }
            setCeremonies(
                ceremonies.map((c) => (c.id === editingId ? res.data : c))
            );
            setEditingId(null);
            setForm({ name: "", dueDate: "", ceremonyDate: "", visible: false, collectionTime: "", });
        } catch (err) {
            setError("Update failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const addCeremony = () => {
        const tempId = "temp-" + crypto.randomUUID();
        setCeremonies([...ceremonies, { id: tempId, name: "", dueDate: "", ceremonyDate: "", visible: false,
            collectionTime: "", }]);
        setEditingId(tempId);
        setForm({
            name: "", dueDate: null, ceremonyDate: null, visible: false, collectionTime: "",
        });
    };

    if (loading) return <FullscreenSpinner />;
    if (error) return <p className="text-red-600">Error: {error}</p>;

    return (
        <>
        <AdminNavbar />
        <div className="p-6 topform">
            <h1 className="text-xl font-bold mb-4 text-black">Edit Ceremonies</h1>
            <table className="min-w-full border !border-gray-300 bg-white rounded w-full text-gray-700">
                <thead>
                <tr className="bg-gray-200 text-left">
                    <th className="p-2 border">Name</th>
                    <th className="p-2 border">Ceremony date</th>
                    <th className="p-2 border">Due date</th>
                    <th className="p-2 border text-center">Active</th>
                    <th className="p-2 border">Actions</th>
                </tr>
                </thead>
                <tbody>
                {ceremonies.map((ceremony) => (
                    <>
                    <tr key={ceremony.id} className="border">
                        {editingId === ceremony.id ? (
                            <>
                                <td className="p-2 border">
                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        className="border rounded p-1 w-full"
                                    />
                                </td>
                                <td className="p-2 border">
                                    <input
                                        type="date"
                                        name="ceremonyDate"
                                        value={form.ceremonyDate ?? ''}
                                        onChange={handleChange}
                                        className="border rounded p-1 w-full"
                                    />
                                </td>
                                <td className="p-2 border">
                                    <input
                                        type="date"
                                        name="dueDate"
                                        value={form.dueDate ?? ''}
                                        onChange={handleChange}
                                        className="border rounded p-1 w-full"
                                    />
                                </td>
                                <td className="p-2 border">
                                    <input
                                        type="checkbox"
                                        name="visible"
                                        checked={form.visible}
                                        onChange={handleToggle}
                                        className="border rounded p-1 w-full accent-green-700"
                                    />
                                </td>
                                <td className="p-2 border">
                                    <button
                                        onClick={handleSave}
                                        className="!bg-green-700 text-white px-3 py-1 rounded mr-2 hover:!bg-green-800"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="!bg-gray-400 text-white px-3 py-1 rounded hover:!bg-gray-500"
                                    >
                                        Cancel
                                    </button>
                                </td>
                            </>
                        ) : (
                            <>
                                <td className="p-2 border">{ceremony.name}</td>
                                <td className="p-2 border">{ceremony.ceremonyDate}</td>
                                <td className="p-2 border">{ceremony.dueDate}</td>
                                <td className="p-2 border">
                                    <input
                                        type="checkbox"
                                        name="visible"
                                        checked={ceremony.visible}
                                        readOnly
                                        className="border rounded p-1 w-full accent-green-700"
                                    />
                                </td>
                                <td className="p-2 border">
                                    <button
                                        onClick={() => handleEdit(ceremony)}
                                        className="!bg-green-700 text-white px-3 py-1 rounded hover:!bg-green-800"
                                    >
                                        Edit
                                    </button>
                                </td>
                            </>
                        )}
                    </tr>
                        {editingId === ceremony.id && (
                           <tr className="bg-gray-50">
                               <td colSpan={5}>
                                    <div className="flex flex-col items-center gap-4 p-2">
                                        <label
                                            htmlFor="collectionTime"
                                            className="tracking-wide  font-medium mb-1 text-gray-700"
                                        >
                                            Collection time
                                        </label>
                                        <textarea
                                            id="collectionTime"
                                            type="text"
                                            name="collectionTime"
                                            value={form.collectionTime}
                                            onChange={handleChange}
                                            rows={4}
                                            className="border rounded p-2 w-full resize-y"
                                            placeholder="Enter collection details..."
                                        />
                                        <DegreesInCeremony ceremonyId={ceremony.id}
                                                           onDegreesUpdated={handleDegreesUpdated}
                                        />
                                   </div>
                               </td>
                            </tr>
                        )}
                    </>
                ))}
                </tbody>
            </table>
            <button
                onClick={() => addCeremony()}
                className="!bg-green-700 text-white px-3 py-2 rounded hover:!bg-green-800 button_new"
            >
                New Ceremony
            </button>
        </div>
    </>
    );
}
