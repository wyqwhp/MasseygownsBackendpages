import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import AdminNavbar from "@/components/AdminNavbar.jsx";

export default function HoodQualificationsEditor() {
    const [activeTab, setActiveTab] = useState('bachelor');
    const [bachelorHoods, setBachelorHoods] = useState([
        'Bachelor of Arts',
        'Bachelor of Science',
        'Bachelor of Engineering'
    ]);
    const [masterHoods, setMasterHoods] = useState([
        'Master of Arts',
        'Master of Science',
        'Master of Business Administration'
    ]);
    const [newItem, setNewItem] = useState('');

    const currentList = activeTab === 'bachelor' ? bachelorHoods : masterHoods;
    const setCurrentList = activeTab === 'bachelor' ? setBachelorHoods : setMasterHoods;

    const addItem = () => {
        if (newItem.trim()) {
            setCurrentList([...currentList, newItem.trim()]);
            setNewItem('');
        }
    };

    const removeItem = (index) => {
        setCurrentList(currentList.filter((_, i) => i !== index));
    };

    const updateItem = (index, value) => {
        const updated = [...currentList];
        updated[index] = value;
        setCurrentList(updated);
    };

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
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        Bachelor Hoods
                    </button>
                    <button
                        onClick={() => setActiveTab('master')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'master'
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        Master Hoods
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
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={addItem}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
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
                        currentList.map((item, index) => (
                            <div
                                key={index}
                                className="flex gap-2 items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => updateItem(index, e.target.value)}
                                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={() => removeItem(index)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                                    title="Remove"
                                >
                                    <Trash2 size={20} />
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