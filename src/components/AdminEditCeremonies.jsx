import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_GOWN_API_BASE; // or hardcode "http://localhost:5144"

export default function CeremonyEditor() {
    const [ceremonies, setCeremonies] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ name: "", dueDate: "", visible: ""});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch ceremonies on mount
    useEffect(() => {
        axios
            .get(`${API_URL}/ceremonies?all=true`)
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
            dueDate: ceremony.dueDate,
            visible: ceremony.visible,
        });
    };

    // Cancel editing
    const handleCancel = () => {
        setEditingId(null);
        setForm({ name: "", dueDate: "", visible: ""});
    };

    // Save update
    const handleSave = async () => {
        try {
            console.log(form)
            const res = await axios.put(`${API_URL}/ceremonies/${editingId}`, form);
            setCeremonies(
                ceremonies.map((c) => (c.id === editingId ? res.data : c))
            );
            handleCancel();
        } catch (err) {
            setError("Update failed: " + err.message);
        }
    };

    if (loading) return <p>Loading ceremonies...</p>;
    if (error) return <p className="text-red-600">Error: {error}</p>;

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold mb-4 text-black">Edit Ceremonies</h1>
            <table className="min-w-full border !border-gray-300 bg-white rounded">
                <thead>
                <tr className="bg-gray-200 text-left">
                    <th className="p-2 border">Name</th>
                    <th className="p-2 border">Due date</th>
                    <th className="p-2 border text-center">Visible</th>
                    <th className="p-2 border">Actions</th>
                </tr>
                </thead>
                <tbody>
                {ceremonies.map((ceremony) => (
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
                                        name="dueDate"
                                        value={form.dueDate}
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
                                        className="border rounded p-1 w-full"
                                    />
                                </td>
                                <td className="p-2 border">
                                    <button
                                        onClick={handleSave}
                                        className="!bg-green-600 text-white px-3 py-1 rounded mr-2 hover:!bg-green-700"
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
                                <td className="p-2 border">{ceremony.dueDate}</td>
                                <td className="p-2 border">
                                    <input
                                        type="checkbox"
                                        name="visible"
                                        checked={ceremony.visible}
                                        className="border rounded p-1 w-full"
                                    />
                                </td>
                                <td className="p-2 border">
                                    <button
                                        onClick={() => handleEdit(ceremony)}
                                        className="!bg-blue-600 text-white px-3 py-1 rounded hover:!bg-blue-700"
                                    >
                                        Edit
                                    </button>
                                </td>
                            </>
                        )}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
