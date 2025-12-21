import React, { useEffect, useState } from "react";
import axios from "axios";
import FullscreenSpinner from "@/components/FullscreenSpinner.jsx";
import UpdatePic from "@/components/UpdatePic.jsx";
import { PlaceholderImage } from "@/components/UpdatePic.jsx";
import AdminNavbar from "./AdminNavbar.jsx";
import "./AdminEditItems.css";
import { Switch } from "@/components/ui/switch.jsx";

const API_URL = import.meta.env.VITE_GOWN_API_BASE; // or hardcode "http://localhost:5144"
// const API_URL = "http://localhost:5144"

export default function ItemsEditor({ degreeId, onItemsUpdated }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const ORIGIN_DEGREES = 2;

  // Fetch ceremonies on mount
  useEffect(() => {
    let localDegreeId;
    if (
      degreeId &&
      typeof degreeId === "string" &&
      degreeId.startsWith("temp-")
    ) {
      localDegreeId = ORIGIN_DEGREES;
    } else {
      localDegreeId = degreeId;
    }
    axios
      .get(`${API_URL}/admin/itemsbydegree/${localDegreeId}`)
      .then((res) => {
        if (
          degreeId &&
          typeof degreeId === "string" &&
          degreeId.startsWith("temp-")
        ) {
          const updated = res.data.map((d) => ({ ...d, active: false }));
          setItems(updated);
        } else {
          setItems(res.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const toggleItemActive = (id, newValue) => {
    const updated = items.map((u) =>
      u.id === id ? { ...u, active: newValue } : u
    );
    setItems(updated);
    onItemsUpdated(updated);
  };

  if (loading) return <FullscreenSpinner />;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <>
      <div className="p-6 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full border !border-gray-300 bg-white rounded w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Image</th>
              <th className="p-2 border">Category</th>
              <th className="p-2 border">Description</th>
              <th className="p-2 border">Hire Price</th>
              <th className="p-2 border">Buy Price</th>
              <th className="p-2 border">For Hire</th>
              <th className="p-2 border">Active</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border hover:bg-gray-100">
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
                    <Switch
                      checked={item.active}
                      onCheckedChange={(checked) =>
                        toggleItemActive(item.id, checked)
                      }
                      className="
                                          data-[state=checked]:bg-green-700
                                          data-[state=unchecked]:bg-gray-400"
                    />
                  </td>
                </>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
