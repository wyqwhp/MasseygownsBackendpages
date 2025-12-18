import React, { useEffect, useState } from "react";
import axios from "axios";
import FullscreenSpinner from "@/components/FullscreenSpinner.jsx";
import AdminNavbar from "./AdminNavbar.jsx";
import "./AdminEditDegrees.css";
import ItemsInDegrees from "@/components/ItemsInDegrees.jsx";

const API_URL = import.meta.env.VITE_GOWN_API_BASE; // or hardcode "http://localhost:5144"
// const API_URL = "http://localhost:5144" // or hardcode "http://localhost:5144"

export default function DegreesEditor() {
  const [degrees, setDegrees] = useState([]);
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleItemsUpdated = (updatedItems) => {
    setItems(updatedItems);
  };

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
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Start editing
  const handleEdit = (degree) => {
    setEditingId(degree.id);
    setForm({
      id: degree.id,
      name: degree.name,
    });
  };

  // Cancel editing
  const handleCancel = () => {
    if (
      editingId &&
      typeof editingId === "string" &&
      editingId.startsWith("temp-")
    ) {
      setDegrees(degrees.filter((d) => d.id !== editingId));
    }
    setEditingId(null);
    setForm({ name: "" });
  };

  // Save update
  const handleSave = async () => {
    setLoading(true);
    try {
      let res;
      if (
        editingId &&
        typeof editingId === "string" &&
        editingId.startsWith("temp-")
      ) {
        res = await axios.post(`${API_URL}/admin/degrees`, form);
        await axios.post(
          `${API_URL}/admin/degrees/${res.data.id}/items`,
          items
        );
      } else {
        res = await axios.put(`${API_URL}/admin/degrees/${editingId}`, form);
        console.log("Items=", items);
        await axios.post(`${API_URL}/admin/degrees/${editingId}/items`, items);
      }
      setDegrees((prev) =>
        prev.map((c) => (c.id === editingId ? res.data : c))
      );
      setEditingId(null);
      setForm({ name: "" });
    } catch (err) {
      setError("Update or Add degree failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addDegree = () => {
    const tempId = "temp-" + crypto.randomUUID();
    setDegrees([...degrees, { id: tempId, name: "" }]);
    setEditingId(tempId);
    setForm({
      name: "",
    });
  };

  if (loading) return <FullscreenSpinner />;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <>
      <AdminNavbar />
      <div className="p-6 topform">
        <h1 className="text-xl font-bold mb-4 text-black">Edit Degrees</h1>
        <table className="min-w-full border !border-gray-300 bg-white rounded">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {degrees.map((degree) => (
              <>
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
                      <td className="p-2 border">{degree.name}</td>
                      <td className="p-2 border">
                        <button
                          onClick={() => handleEdit(degree)}
                          className="!bg-green-700 text-white px-3 py-1 rounded hover:!bg-green-800"
                        >
                          Edit
                        </button>
                      </td>
                    </>
                  )}
                </tr>
                {editingId === degree.id && (
                  <tr className="bg-gray-50">
                    <td colSpan={5}>
                      <div className="flex justify-center items-center">
                        <ItemsInDegrees
                          degreeId={degree.id}
                          onItemsUpdated={handleItemsUpdated}
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
          onClick={() => addDegree()}
          className="!bg-green-700 text-white px-3 py-2 rounded hover:!bg-green-800 button_new"
        >
          New Degree
        </button>
      </div>
    </>
  );
}
