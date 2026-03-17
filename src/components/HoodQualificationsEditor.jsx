import React, {useEffect, useState} from 'react';
import axios from "axios";
import {Edit, Plus, Trash2} from 'lucide-react';
import AdminNavbar from "@/components/AdminNavbar.jsx";
import FullscreenSpinner from "@/components/FullscreenSpinner.jsx";

const API_URL = import.meta.env.VITE_GOWN_API_BASE; // or hardcode "http://localhost:5144"
// const API_URL = "http://localhost:5144" // or hardcode "http://localhost:5144"

const TAB_IDS = {
    bachelor: 4,
    master: 6,
    phd: 9,
    doctoral: 6,
    'UCOL bachelor': 33,
    'UCOL master': 34,
    'UCOL postgrad': 35,
    'UCOL grad': 36,
    'bachelor set': 13,
    'master set': 14
};

export default function HoodQualificationsEditor() {
    const [activeTab, setActiveTab] = useState('bachelor');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newItem, setNewItem] = useState('');
    const [newShortName, setNewShortName] = useState('');
    const [newBin, setNewBin] = useState(0);
    const [newNote, setNewNote] = useState('');
    const [hoods, setHoods] = useState({
        bachelor: [],
        master: [],
        phd: [],
        doctoral: [],
        'bachelor set': [],
        'master set': [],
        ucolbachelor: [],
        ucolmaster: [],
        ucolpostgrad: [],
        ucolgrad: []
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
                    master: res.data.filter(x => !x.doctoral)
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
                    'doctoral': res.data.filter(x => x.doctoral)
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

        axios
            .get(`${API_URL}/admin/hoods/9`)
            .then((res) => {
                setHoods(prev => ({
                    ...prev,
                    'phd': res.data
                }));
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });

        axios
            .get(`${API_URL}/admin/hoods/33`)
            .then((res) => {
                setHoods(prev => ({
                    ...prev,
                    'UCOL bachelor': res.data
                }));
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });

        axios
            .get(`${API_URL}/admin/hoods/34`)
            .then((res) => {
                setHoods(prev => ({
                    ...prev,
                    'UCOL master': res.data
                }));
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });

        axios
            .get(`${API_URL}/admin/hoods/35`)
            .then((res) => {
                setHoods(prev => ({
                    ...prev,
                    'UCOL postgrad': res.data
                }));
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });

        axios
            .get(`${API_URL}/admin/hoods/36`)
            .then((res) => {
                setHoods(prev => ({
                    ...prev,
                    'UCOL grad': res.data
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
            var addedItem;
            switch (activeTab) {
                case 'master':
                    addedItem = {name: newItem.trim(), shortName: newShortName.trim(), bin: newBin, note: newNote.trim(),
                        itemId: TAB_IDS[activeTab], doctoral: false};
                    break;
                case 'doctoral':
                    addedItem = {name: newItem.trim(), shortName: newShortName.trim(), bin: newBin, note: newNote.trim(),
                        itemId: TAB_IDS[activeTab], doctoral: true};
                    break;
                default:
                    addedItem = {name: newItem.trim(), shortName: newShortName.trim(), bin: newBin, note: newNote.trim(),
                        itemId: TAB_IDS[activeTab]};
            }
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
        const editedItem = currentList.find(x => x.id === index);
        axios
        .put(`${API_URL}/admin/hoods/${editedItem.id}`, editedItem);
    };

    const updateItem = (index, name, value) => {
        setCurrentList(list =>
            list.map(item =>
                item.id === index
                    ? { ...item, [name]: value }
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
            <div className="max-w-7xl mx-auto p-6">
                <h1 className="text-2xl text-center font-bold mb-6">Hood Qualifications Editor</h1>

                {/* Tabs */}
                <div className="flex justify-around border-b border-gray-300 mb-6">
                    <button
                        onClick={() => setActiveTab('bachelor')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'bachelor'
                                ? 'border-b-2 border-green-600 text-green-700'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        Bachelor
                    </button>

                    <button
                        onClick={() => setActiveTab('master')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'master'
                                ? 'border-b-2 border-green-600 text-green-700'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        Master
                    </button>

                    <button
                        onClick={() => setActiveTab('phd')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'phd'
                                ? 'border-b-2 border-green-600 text-green-700'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        Phd
                    </button>
                    <button
                        onClick={() => setActiveTab('bachelor set')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'bachelor set'
                                ? 'border-b-2 border-green-600 text-green-700'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        Bachelor Set
                    </button>

                    <button
                        onClick={() => setActiveTab('master set')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'master set'
                                ? 'border-b-2 border-green-600 text-green-700'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        Master Set
                    </button>

                    <button
                        onClick={() => setActiveTab('doctoral')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'doctoral'
                                ? 'border-b-2 border-green-600 text-green-700'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        Doctoral
                    </button>

                    <button
                        onClick={() => setActiveTab('UCOL bachelor')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'UCOL bachelor'
                                ? 'border-b-2 border-green-600 text-green-700'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        UCOL Bachelor
                    </button>

                    <button
                        onClick={() => setActiveTab('UCOL grad')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'UCOL grad'
                                ? 'border-b-2 border-green-600 text-green-700'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        UCOL Grad
                    </button>

                    <button
                        onClick={() => setActiveTab('UCOL postgrad')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'UCOL postgrad'
                                ? 'border-b-2 border-green-600 text-green-700'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        UCOL Postgrad
                    </button>

                    <button
                        onClick={() => setActiveTab('UCOL master')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'UCOL master'
                                ? 'border-b-2 border-green-600 text-green-700'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        UCOL Master
                    </button>
                </div>

                {/* Add new item */}
                <div className="flex gap-2 mb-6">
                    <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        placeholder={`Add new ${activeTab} qualification...`}
                        className="w-112 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                    <input
                        type="text"
                        value={newShortName}
                        onChange={(e) => setNewShortName(e.target.value)}
                        placeholder={`Add new ${activeTab} description...`}
                        className="w-128 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                    <input
                        type="text"
                        value={newShortName}
                        onChange={(e) => setNewShortName(e.target.value)}
                        placeholder={`Short name...`}
                        className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                    <input
                        type="text"
                        value={newBin}
                        onChange={(e) => setNewBin(e.target.value)}
                        className="w-16 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
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
                    <span className="w-112 px-1 py-0 font-bold">
                        Full Name
                    </span>
                    <span className="w-128 px-1 py-0 font-bold">
                        Description
                    </span>
                    <span className="w-32 px-1 py-0 font-bold">
                        Short Name
                    </span>
                    <span className="w-16 px-1 py-0 font-bold">
                        Bin
                    </span>
                    <span className="w-16 px-1 py-0 font-bold">
                        Save
                    </span>
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
                                    name="name"
                                    value={item.name}
                                    onChange={(e) => updateItem(item.id, e.target.name, e.target.value)}
                                    className="w-112 px-3 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                    type="text"
                                    name="hoodNote"
                                    value={item.hoodNote}
                                    onChange={(e) => updateItem(item.id, e.target.name, e.target.value)}
                                    className="w-128 px-3 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                    type="text"
                                    name="shortName"
                                    value={item.shortName}
                                    onChange={(e) => updateItem(item.id, e.target.value)}
                                    className="w-32 px-3 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                    type="text"
                                    name="hoodBin"
                                    value={item.hoodBin}
                                    onChange={(e) => updateItem(item.id, e.target.name, e.target.value)}
                                    className="w-16 px-3 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={() => editItem(item.id)}
                                    className="w-16 p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
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