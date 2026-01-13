import React, {useEffect, useState} from 'react';
import axios from "axios";
import {Edit, Plus, Trash2} from 'lucide-react';
import AdminNavbar from "@/components/AdminNavbar.jsx";
import FullscreenSpinner from "@/components/FullscreenSpinner.jsx";

// const API_URL = import.meta.env.VITE_GOWN_API_BASE; // or hardcode "http://localhost:5144"
const API_URL = "http://localhost:5144" // or hardcode "http://localhost:5144"

const TAB_IDS = {
    bachelor: 4,
    master: 6,
    'bachelor set': 13,
    'master set': 14
};

export default function HoodQualificationsEditor() {
    const [activeTab, setActiveTab] = useState('bachelor');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newItem, setNewItem] = useState('');
    const [hoods, setHoods] = useState({
        bachelor: [],
        master: [],
        'bachelor set': [],
        'master set': []
    });
    // const []
    const currentList = hoods[activeTab];
    const setCurrentList = updater =>
        setHoods(prev => ({
            ...prev,
            [activeTab]:
                typeof updater === 'function'
                    ? updater(prev[activeTab])
                    : updater
        }));

    useEffect(() => {
        axios
            .get(`${API_URL}/admin/hoods/4`)
            .then((res) => {
                setHoods(prev => ({
                    ...prev,
                    bachelor: res.data
                }));
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });

        axios
            .get(`${API_URL}/admin/hoods/6`)
            .then((res) => {
                setHoods(prev => ({
                    ...prev,
                    master: res.data
                }));
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });

        axios
            .get(`${API_URL}/admin/hoods/14`)
            .then((res) => {
                setHoods(prev => ({
                    ...prev,
                    'master set': res.data
                }));
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });

        axios
            .get(`${API_URL}/admin/hoods/13`)
            .then((res) => {
                setHoods(prev => ({
                    ...prev,
                    'bachelor set': res.data
                }));
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    const addItem = async () => {
        if (newItem.trim()) {
            const addedItem = {name: newItem.trim(), itemId: TAB_IDS[activeTab]};
            const res = await axios
                .post(`${API_URL}/admin/hoods`, addedItem);
            setCurrentList(list => [...list, res.data].sort((a, b) => a.name.localeCompare(b.name)));
            setNewItem('');
        }
    };

    const editItem = (index) => {
        setCurrentList(list =>
            [...list].sort((a, b) => a.name.localeCompare(b.name))
        );
        const editedItem = currentList[index];
        axios
        .put(`${API_URL}/admin/hoods/${editedItem.id}`, editedItem);
    };

    const updateItem = (index, value) => {
        setCurrentList(list =>
            list.map(item =>
                item.id === index
                    ? { ...item, name: value }
                    : item
            )
        );
    };

    if (loading) return <FullscreenSpinner />;
    if (error) return <p className="text-red-600">Error: {error}</p>;

    return (
        <>
        <AdminNavbar />
        <div className="p-6 topform">
            <div className="max-w-3xl mx-auto p-6">
                <h1 className="text-2xl font-bold mb-6">Hood Qualifications Editor</h1>

                {/* Tabs */}
                <div className="flex border-b border-gray-300 mb-6">
                    <button
                        onClick={() => setActiveTab('bachelor')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'bachelor'
                                ? 'border-b-2 border-green-600 text-green-700'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        Bachelor Hoods
                    </button>
                    <button
                        onClick={() => setActiveTab('master')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'master'
                                ? 'border-b-2 border-green-600 text-green-700'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        Master Hoods
                    </button>
                    <button
                        onClick={() => setActiveTab('bachelor set')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'bachelor set'
                                ? 'border-b-2 border-green-600 text-green-700'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        Bachelor Set Hoods
                    </button>
                    <button
                        onClick={() => setActiveTab('master set')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'master set'
                                ? 'border-b-2 border-green-600 text-green-700'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        Master Set Hoods
                    </button>
                </div>

                {/* Add new item */}
                <div className="flex gap-2 mb-6">
                    <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addItem()}
                        placeholder={`Add new ${activeTab} qualification...`}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                    <button
                        onClick={addItem}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Add
                    </button>
                </div>

                {/* List of items */}
                <div className="space-y-2">
                    {currentList.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                            No qualifications added yet. Add one above to get started.
                        </p>
                    ) : (
                        currentList
                        .map((item) => (
                            <div
                                key={item.id}
                                className="flex gap-1 items-center p-0 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => updateItem(item.id, e.target.value)}
                                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={() => editItem(item.id)}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                                    title="Edit"
                                >
                                    <Edit size={20} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Summary */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                        <span className="font-medium">Total {activeTab} qualifications:</span> {currentList.length}
                    </p>
                </div>
            </div>
        </div>
        </>
    );
}