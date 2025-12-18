import React, { useEffect, useState } from "react";
import axios from "axios";
import FullscreenSpinner from "@/components/FullscreenSpinner.jsx";
import UpdatePic from "@/components/UpdatePic.jsx";
import { PlaceholderImage } from "@/components/UpdatePic.jsx";
import AdminNavbar from "./AdminNavbar.jsx";
import "./AdminEditItems.css";

const API_URL = import.meta.env.VITE_GOWN_API_BASE; // or hardcode "http://localhost:5144"
// const API_URL = "http://localhost:5144"

export default function ItemsEditor() {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    hirePrice: 0,
    buyPrice: 0,
    isHiring: false,
    pictureBase64: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch ceremonies on mount
  useEffect(() => {
    axios
      .get(`${API_URL}/admin/items`)
      .then((res) => {
        setItems(res.data);
        // console.log("Response=", res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Handle field change
  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    console.log(e.target.name);
    console.log(e.target.value);
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  // Start editing
  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      id: item.id,
      name: item.name,
      category: item.category,
      description: item.description,
      hirePrice: item.hirePrice,
      buyPrice: item.buyPrice,
      isHiring: item.isHiring,
      pictureBase64: item.pictureBase64,
    });
  };

  // Cancel editing
  const handleCancel = () => {
    if (
      editingId &&
      typeof editingId === "string" &&
      editingId.startsWith("temp-")
    ) {
      setItems(items.filter((d) => d.id !== editingId));
    }
    setEditingId(null);
    setForm({
      name: "",
      category: "",
      description: "",
      hirePrice: 0,
      buyPrice: 0,
      isHiring: false,
      pictureBase64: null,
    });
  };

  // Save update
  const handleSave = async () => {
    try {
      setLoading(true);

      let res;
      const isNew =
        editingId &&
        typeof editingId === "string" &&
        editingId.startsWith("temp-");
      if (isNew) {
        res = await axios.post(`${API_URL}/admin/items`, form);
      } else {
        res = await axios.put(`${API_URL}/admin/items/${editingId}`, form);
      }

      setItems((prev) => {
        if (isNew) {
          return [
            ...prev.filter((c) => c.id !== editingId), // remove temp item
            res.data, // add real item
          ];
        } else {
          return prev.map((c) => (c.id === editingId ? res.data : c));
        }
      });

      setEditingId(null);
      setForm({
        name: "",
        category: "",
        description: "",
        hirePrice: 0,
        buyPrice: 0,
        isHiring: false,
        pictureBase64: null,
      });
    } catch (err) {
      console.error("Save error:", err);
      setError("Update failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    const tempId = "temp-" + crypto.randomUUID();
    setItems([
      ...items,
      {
        id: tempId,
        name: "",
        category: "",
        description: "",
        hirePrice: 0,
        buyPrice: 0,
        isHiring: false,
        pictureBase64: null,
      },
    ]);
    setEditingId(tempId);
    setForm({
      name: "",
      category: "",
      description: "",
      hirePrice: 0,
      buyPrice: 0,
      isHiring: false,
      pictureBase64: null,
    });
  };

  if (loading) return <FullscreenSpinner />;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <>
      <AdminNavbar />
      <div className="p-6 topform">
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
                      <UpdatePic
                        image={form.pictureBase64}
                        onChange={(base64) => {
                          setForm({ ...form, pictureBase64: base64 });
                          // console.log("Base64 = ", base64);
                          setItems(
                            items.map((c) =>
                              c.id === editingId
                                ? { ...c, pictureBase64: base64 }
                                : c
                            )
                          );
                        }}
                      />
                    </td>
                    <td className="p-2 border">
                      <input
                        type="text"
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        className="border rounded p-1 w-full"
                      />
                    </td>
                    <td className="p-2 border">
                      <input
                        type="text"
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        className="border rounded p-1 w-full"
                      />
                    </td>
                    <td className="p-2 border">
                      <input
                        type="text"
                        name="hirePrice"
                        value={form.hirePrice}
                        onChange={handleChange}
                        className="border rounded p-1 w-full"
                      />
                    </td>
                    <td className="p-2 border">
                      <input
                        type="text"
                        name="buyPrice"
                        value={form.buyPrice}
                        onChange={handleChange}
                        className="border rounded p-1 w-full"
                      />
                    </td>
                    <td className="p-2 border">
                      <input
                        type="checkbox"
                        name="isHiring"
                        checked={form.isHiring}
                        onChange={handleChange}
                        className="border rounded p-1 w-full accent-green-700"
                      />
                    </td>
                    <td className="p-2 border">
                      <div className="flex items-center p-2 justify-center">
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
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-2 border">{item.name}</td>
                    <td className="p-2 border">
                      {item.pictureBase64 ? (
                        <img
                          src={
                            item.pictureBase64.startsWith("data:")
                              ? item.pictureBase64
                              : `data:image/jpeg;base64,${item.pictureBase64}`
                          }
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
                        readOnly="True"
                        className="border rounded p-1 w-full accent-green-700"
                      />
                    </td>
                    <td className="p-2 border">
                      <button
                        onClick={() => handleEdit(item)}
                        className="!bg-green-700 text-white px-3 py-1 rounded hover:!bg-green-800"
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
        <button
          onClick={() => addItem()}
          className="!bg-green-700 text-white px-3 py-2 rounded hover:!bg-green-800 button_new"
        >
          New Item
        </button>
      </div>
    </>
  );
}
