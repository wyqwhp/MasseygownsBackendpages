import React, { useEffect, useState } from "react";
import "./AdminEditDelivery.css";
import AdminNavbar from "../components/AdminNavbar";
import {
  getDelivery,
  updateDelivery,
  updateDeliveryCost,
} from "../services/RegaliaService";

function AdminEditDelivery() {
  const [delivery, setDelivery] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // FETCH DELIVERY
  useEffect(() => {
    const fetchDelivery = async () => {
      try {
        const data = await getDelivery();
        setDelivery(Array.isArray(data) ? data : []);
      } catch {
        setError("Failed to load delivery data");
      } finally {
        setLoading(false);
      }
    };
    fetchDelivery();
  }, []);

  const updateChoiceField = (optIndex, choiceIndex, field, value) => {
    const updated = [...form.options];
    updated[optIndex].choices[choiceIndex][field] =
      field === "price" ? Number(value) : value;
    setForm({ ...form, options: updated });
  };

  // EDIT HANDLERS
  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm(JSON.parse(JSON.stringify(item))); // deep clone
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggle = (e) => {
    setForm((prev) => ({ ...prev, visible: e.target.checked }));
  };

  const hasDeliveryChanged = (original, updated) => {
    return (
      original.name !== updated.name || original.visible !== updated.visible
    );
  };

  const hasChoiceChanged = (original, updated) => {
    return (
      original.value !== updated.value ||
      Number(original.price) !== Number(updated.price)
    );
  };

  const handleSave = async () => {
    try {
      if (!form.name?.trim()) {
        alert("Delivery name is required");
        return;
      }

      const original = delivery.find((d) => d.id === form.id);

      if (!original) {
        alert("Original delivery not found");
        return;
      }

      const updateRequests = [];

      // DELIVERY UPDATE
      if (hasDeliveryChanged(original, form)) {
        const deliveryPayload = {
          Id: form.id,
          Name: form.name,
          Cost: 0,
        };

        updateRequests.push(updateDelivery(form, deliveryPayload));
      }

      // OPTION / COST UPDATES
      for (
        let optIndex = 0;
        optIndex < (form.options || []).length;
        optIndex++
      ) {
        const updatedOpt = form.options[optIndex];
        const originalOpt = original.options?.[optIndex];

        if (!originalOpt) continue;

        for (
          let choiceIndex = 0;
          choiceIndex < (updatedOpt.choices || []).length;
          choiceIndex++
        ) {
          const updatedChoice = updatedOpt.choices[choiceIndex];
          const originalChoice = originalOpt.choices?.[choiceIndex];

          // Must exist in backend
          if (!updatedChoice?.id || !originalChoice) continue;

          // Only call API if changed
          if (hasChoiceChanged(originalChoice, updatedChoice)) {
            const payload = {
              Id: updatedChoice.id,
              Name: updatedChoice.value,
              Cost: Number(updatedChoice.price),
            };

            updateRequests.push(updateDeliveryCost(payload));
          }
        }
      }

      // CALL APIS
      if (updateRequests.length === 0) {
        console.log("No changes detected, skipping API calls");
        setEditingId(null);
        setForm(null);
        return;
      }

      await Promise.all(updateRequests);

      // UPDATE UI STATE
      setDelivery((prev) =>
        prev.map((d) =>
          d.id === form.id
            ? {
                ...d,
                name: form.name,
                visible: form.visible,
                options: form.options,
              }
            : d
        )
      );
      setEditingId(null);
      setForm(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save delivery changes");
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <>
      <AdminNavbar />

      <div className="p-6 topform">
        <h1 className="text-xl font-bold mb-4">Edit Delivery</h1>

        <table className="min-w-full border bg-white">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Name</th>
              <th className="p-2 border text-center">Active</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>

          <tbody>
            {delivery.map((item) => {
              const isEditing = editingId === item.id;
              const data = isEditing ? form : item;

              return (
                <React.Fragment key={item.id}>
                  {/* MAIN ROW */}
                  <tr className="border">
                    <td className="p-2 border">
                      {isEditing ? (
                        <input
                          name="name"
                          value={data.name}
                          onChange={handleChange}
                          className="border p-1 w-full"
                        />
                      ) : (
                        data.name
                      )}
                    </td>

                    <td className="p-2 border text-center">
                      {isEditing ? (
                        <input
                          type="checkbox"
                          checked={data.visible}
                          onChange={handleToggle}
                          className="accent-green-700"
                        />
                      ) : (
                        <input
                          type="checkbox"
                          checked={data.visible}
                          readOnly
                          className="accent-green-700"
                        />
                      )}
                    </td>

                    <td className="p-2 border text-center">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleSave}
                            className="bg-green-700 text-white px-3 py-1 rounded mr-2"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancel}
                            className="bg-gray-400 text-white px-3 py-1 rounded"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleEdit(item)}
                          className="bg-green-700 text-white px-3 py-1 rounded"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* ALWAYS VISIBLE OPTIONS */}
                  {data.options && (
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-semibold">Delivery Options</h3>
                        </div>

                        {data.options.map((opt, optIndex) => (
                          <div
                            key={optIndex}
                            className="border rounded p-3 mb-4 bg-white"
                          >
                            {/* OPTION HEADER */}
                            <div className="flex justify-between items-center mb-2">
                              <label className="font-medium">
                                Option Label
                              </label>
                            </div>
                            <div className="mb-3">{opt.label}</div>

                            {/* CHOICES */}
                            <label className="block font-medium mb-2">
                              Choices
                            </label>

                            {opt.choices.map((choice, choiceIndex) => (
                              <div
                                key={choice.id}
                                className="flex gap-2 items-center mb-2"
                              >
                                {isEditing ? (
                                  <>
                                    <input
                                      placeholder="Value"
                                      value={choice.value}
                                      onChange={(e) =>
                                        updateChoiceField(
                                          optIndex,
                                          choiceIndex,
                                          "value",
                                          e.target.value
                                        )
                                      }
                                      className="border p-1 flex-1"
                                    />

                                    <input
                                      type="number"
                                      placeholder="Price"
                                      value={choice.price}
                                      onChange={(e) =>
                                        updateChoiceField(
                                          optIndex,
                                          choiceIndex,
                                          "price",
                                          e.target.value
                                        )
                                      }
                                      className="border p-1 w-24"
                                    />
                                  </>
                                ) : (
                                  <div>
                                    {choice.value} (${choice.price})
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ))}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default AdminEditDelivery;
