import axios from "axios";

const API_URL = import.meta.env.VITE_GOWN_API_BASE;

export const getOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders`);
      return response.data;
    } catch (err) {
      console.error("Error fetching ceremonies:", err);
      return [];
    }
  };

export async function updateOrderStatus(id, payload) {
  try {
    const res = await fetch(`${API_URL}/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  } catch (err) {
    console.error("Error updating status:", err);
  }
}
