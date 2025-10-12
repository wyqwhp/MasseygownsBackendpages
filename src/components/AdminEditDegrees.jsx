import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_GOWN_API_BASE; // or hardcode "http://localhost:5144"

export default function DegreesEditor() {
    const [degrees, setDegrees] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ name: "", dueDate: ""});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch ceremonies on mount
    useEffect(() => {
        axios
            .get(`${API_URL}/degrees`)
            .then((res) => {
                setDegrees(res.data);
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

    // Start editing
    const handleEdit = (degree) => {
        setEditingId(degree.id);
        setForm({
            id: degree.id,
            name: degree.name
        });
    };

    // Cancel editing
    const handleCancel = () => {
        setEditingId(null);
        setForm({ name: "", dueDate: ""});
    };

    // Save update
    const handleSave = async () => {
        try {
            const res = await axios.put(`${API_URL}/degrees/${editingId}`, form);
            setDegrees(
                degrees.map((c) => (c.id === editingId ? res.data : c))
            );
            handleCancel();
        } catch (err) {
            setError("Update failed: " + err.message);
        }
    };

    if (loading) return <p>Loading degrees...</p>;
    if (error) return <p className="text-red-600">Error: {error}</p>;

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold mb-4 text-black">Edit Degrees</h1>
            <table className="min-w-full border !border-gray-300 bg-white rounded">
                <thead>
                <tr className="bg-gray-200 text-left">
                    <th className="p-2 border">Name</th>
                    {/*<th className="p-2 border">Due date</th>*/}
                    {/*<th className="p-2 border">Location</th>*/}
                    <th className="p-2 border">Actions</th>
                </tr>
                </thead>
                <tbody>
                {degrees.map((degree) => (
                    <tr key={degree.id} className="border">
                        {editingId === degree.id ? (
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
                                {/*<td className="p-2 border">*/}
                                {/*    <input*/}
                                {/*        type="date"*/}
                                {/*        name="dueDate"*/}
                                {/*        value={form.dueDate}*/}
                                {/*        onChange={handleChange}*/}
                                {/*        className="border rounded p-1 w-full"*/}
                                {/*    />*/}
                                {/*</td>*/}
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
                                <td className="p-2 border">{degree.name}</td>
                                <td className="p-2 border">
                                    <button
                                        onClick={() => handleEdit(degree)}
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
