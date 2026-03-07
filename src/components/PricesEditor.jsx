import React, {useEffect, useState} from 'react';
import axios from "axios";
import {Edit, Plus, Trash2} from 'lucide-react';
import AdminNavbar from "@/components/AdminNavbar.jsx";
import FullscreenSpinner from "@/components/FullscreenSpinner.jsx";
import {list} from "postcss";

const API_URL = import.meta.env.VITE_GOWN_API_BASE; // or hardcode "http://localhost:5144"
// const API_URL = "http://localhost:5144" // or hardcode "http://localhost:5144"

export default function PricesEditor() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [prices, setPrices] = useState([]);
    const [newPrice, setNewPrice] = useState({});
    const [currentList, setCurrentList] = useState([]);
    // const []

    useEffect(() => {
        axios
            .get(`${API_URL}/admin/prices`)
            .then((res) => {
                setPrices(res.data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    const addItem = async () => {
        if (newPrice) {
            const res = await axios
                .post(`${API_URL}/admin/prices`, newPrice);
            setPrices(list => [...list, res.data].sort((a, b) => a.name.localeCompare(b.name)));
            setNewPrice({});
        }
    };

    const editItem = (id) => {
        try {
            const editedPrice = prices.find(p => p.id === id);
            if (!editedPrice) return;

            setPrices(list =>
                [...list].sort((a, b) => a.name.localeCompare(b.name))
            );
            axios
                .put(`${API_URL}/admin/prices/${editedPrice.id}`, editedPrice);
        } catch (error) {
            console.error("Failed to update price category", error);
        }
    };

    const updateItem = (index, field, value) => {
        setPrices(list =>
            list.map(price =>
                price.id === index
                    ? { ...price, [field]: value }
                    : price
            )
        );
    };

    const handleNewPriceChange = (field, value) => {
        setNewPrice(prev => ({ ...prev, [field]: value }));
    }

    if (loading) return <FullscreenSpinner />;
    if (error) return <p className="text-red-600">Error: {error}</p>;

    return (
        <>
        <AdminNavbar />
        <div className="p-6 topform">
            <div className="w-352 mx-auto p-6">
                <h1 className="text-2xl text-center font-bold mb-6">Price Editor</h1>
                {/* Add new item */}
                <div className="flex gap-2 mb-6">
                    <input
                        type="text"
                        value={newPrice.name}
                        onChange={(e) => handleNewPriceChange("name", e.target.value)}
                        placeholder={`Add new category...`}
                        className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                    <input
                        type="text"
                        value={newPrice.priceNote}
                        onChange={(e) => handleNewPriceChange("priceNote", e.target.value)}
                        placeholder={`Add new description...`}
                        className="w-128 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                    <input
                        type="text"
                        value={newPrice.priceCode}
                        onChange={(e) => handleNewPriceChange("priceCode", e.target.value)}
                        placeholder={`Code...`}
                        className="w-20 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                    <input
                        type="text"
                        value={newPrice.gown}
                        onChange={(e) => handleNewPriceChange("gown", e.target.value)}
                        placeholder={`Gown...`}
                        className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                    <input
                        type="text"
                        value={newPrice.hat}
                        onChange={(e) => handleNewPriceChange("hat", e.target.value)}
                        placeholder={`Hat...`}
                        className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                    <input
                        type="text"
                        value={newPrice.hood}
                        onChange={(e) => handleNewPriceChange("hood", e.target.value)}
                        placeholder={`Hood...`}
                        className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                    <input
                        type="text"
                        value={newPrice.xtraHood}
                        onChange={(e) => handleNewPriceChange("xtraHood", e.target.value)}
                        placeholder={`Xtra Hood...`}
                        className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                    <button
                        onClick={addItem}
                        className="w-16  px-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Add
                    </button>
                </div>
                <div className="flex gap-2 mb-2">
                    <span className="w-64 px-1 py-0 font-bold">
                        Category
                    </span>
                    <span className="w-128 px-1 py-0 font-bold">
                        Description
                    </span>
                    <span className="w-20 px-1 py-0 font-bold">
                        Code
                    </span>
                    <span className="w-24 px-1 py-0 font-bold">
                        Gown
                    </span>
                    <span className="w-24 px-1 py-0 font-bold">
                        Hat
                    </span>
                    <span className="w-24 px-1 py-0 font-bold">
                        Hood
                    </span>
                    <span className="w-24 px-1 py-0 font-bold">
                        Xtra Hood
                    </span>
                    <span className="w-16 px-1 py-0 font-bold">
                        Save
                    </span>
                </div>

                {/* List of items */}
                <div className="space-y-2">
                    {prices.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                            No price categories added yet. Add one above to get started.
                        </p>
                    ) : (
                        prices
                        .map((price) => (
                            <div
                                key={price.id}
                                className="flex gap-2 items-center p-0 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <input
                                    type="text"
                                    value={price.name}
                                    onChange={(e) => updateItem(price.id, "name", e.target.value)}
                                    className="w-64 px-3 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                    type="text"
                                    value={price.priceNote}
                                    onChange={(e) => updateItem(price.id, "priceNote", e.target.value)}
                                    className="w-128 px-3 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                    type="text"
                                    value={price.priceCode}
                                    onChange={(e) => updateItem(price.id, "priceCode", e.target.value)}
                                    className="w-20 px-3 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                    type="number"
                                    value={price.gown}
                                    onChange={(e) => updateItem(price.id, "gown", e.target.value)}
                                    className="w-24 px-3 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                    type="number"
                                    value={price.hat}
                                    onChange={(e) => updateItem(price.id, "hat", e.target.value)}
                                    className="w-24 px-3 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                    type="number"
                                    value={price.hood}
                                    onChange={(e) => updateItem(price.id, "hood", e.target.value)}
                                    className="w-24 px-3 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                    type="number"
                                    value={price.xtraHood}
                                    onChange={(e) => updateItem(price.id, "xtraHood", e.target.value)}
                                    className="w-24 px-3 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={() => editItem(price.id)}
                                    className="w-16 p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                                    title="Edit"
                                >
                                    <Edit size={20} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
        </>
    );
}