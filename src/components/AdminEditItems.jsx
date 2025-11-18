import React, { useEffect, useState } from "react";
import axios from "axios";
import FullscreenSpinner from "@/components/FullscreenSpinner.jsx";
import UpdatePic from "@/components/UpdatePic.jsx";

const API_URL = import.meta.env.VITE_GOWN_API_BASE; // or hardcode "http://localhost:5144"
// const API_URL = "http://localhost:5144"

export default function ItemsEditor() {
    const [items, setItems] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ name: "", dueDate: ""});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const PlaceholderImage = () => (
        <div className="w-24 h-24 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center mx-auto">
            <svg
                className="block w-12 h-12"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="gray"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M22 7L12 3 2 7l10 4 10-4z" />
                <path d="M6 10v6c4 2.5 8 2.5 12 0v-6" />
                <path d="M12 12v8" />
            </svg>
        </div>
    );

    // Fetch ceremonies on mount
    useEffect(() => {
        axios
            .get(`${API_URL}/admin/items`)
            .then((res) => {
                setItems(res.data);
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
    const handleEdit = (item) => {
        setEditingId(item.id);
        setForm({
            id: item.id,
            name: item.name
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
            const res = await axios.put(`${API_URL}/admin/items/${editingId}`, form);
            setItems(
                items.map((c) => (c.id === editingId ? res.data : c))
            );
            handleCancel();
        } catch (err) {
            setError("Update failed: " + err.message);
        }
    };

    if (loading) return <FullscreenSpinner />;
    if (error) return <p className="text-red-600">Error: {error}</p>;

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold mb-4 text-black">Edit Items</h1>
            <table className="min-w-full border !border-gray-300 bg-white rounded">
                <thead>
                <tr className="bg-gray-200 text-left">
                    <th className="p-2 border">Name</th>
                    <th className="p-2 border">Image</th>
                    <th className="p-2 border">Category</th>
                    <th className="p-2 border">Description</th>
                    <th className="p-2 border">Hire Price</th>
                    <th className="p-2 border">Buy Price</th>
                    <th className="p-2 border">For Hire</th>
                    <th className="p-2 border">Actions</th>
                </tr>
                </thead>
                <tbody>
                {items.map((item) => (
                    <tr key={item.id} className="border">
                        {editingId === item.id ? (
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
                                    <UpdatePic image = {item.pictureBase64} />
                                </td>
                                <td className="p-2 border">
                                    <input
                                        type="text"
                                        name="category"
                                        value={item.category}
                                        onChange={handleChange}
                                        className="border rounded p-1 w-full"
                                    />
                                </td>
                                <td className="p-2 border">
                                    <input
                                        type="text"
                                        name="description"
                                        value={item.description}
                                        onChange={handleChange}
                                        className="border rounded p-1 w-full"
                                    />
                                </td>
                                <td className="p-2 border">
                                    <input
                                        type="text"
                                        name="hire_price"
                                        value={item.hirePrice}
                                        onChange={handleChange}
                                        className="border rounded p-1 w-full"
                                    />
                                </td>
                                <td className="p-2 border">
                                    <input
                                        type="text"
                                        name="buy_price"
                                        value={item.buyPrice}
                                        onChange={handleChange}
                                        className="border rounded p-1 w-full"
                                    />
                                </td>
                                <td className="p-2 border">
                                    <input
                                        type="checkbox"
                                        name="for_hire"
                                        value={item.isHiring}
                                        onChange={handleChange}
                                        className="border rounded p-1 w-full"
                                    />
                                </td>
                                <td className="p-2 border">
                                    <div className="flex items-center p-2 justify-center">
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
                                    </div>
                                </td>
                            </>
                        ) : (
                            <>
                                <td className="p-2 border">{item.name}</td>
                                <td className="p-2 border">
                                    {item.pictureBase64 ? (
                                        <img
                                            src={`data:image/jpeg;base64,${item.pictureBase64}`}
                                            alt="Item"
                                            className="w-16 h-auto rounded-lg mx-auto"
                                        />
                                    ) : (
                                        <PlaceholderImage />
                                    )}
                                </td>
                                <td className="p-2 border">{item.category}</td>
                                <td className="p-2 border">{item.description}</td>
                                <td className="p-2 border">{item.hirePrice}</td>
                                <td className="p-2 border">{item.buyPrice}</td>
                                <td className="p-2 border">
                                    <input
                                        type="checkbox"
                                        name="visible"
                                        checked={item.isHiring}
                                        readOnly='True'
                                        className="border rounded p-1 w-full"
                                    />
                                </td>
                                <td className="p-2 border">
                                    <button
                                        onClick={() => handleEdit(item)}
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
