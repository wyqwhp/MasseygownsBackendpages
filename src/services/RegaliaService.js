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

export async function updateOrderStatus(id, status) {
  try {
    const payload = { Status: status };

    const response = await axios.patch(`${API_URL}/orders/${id}`, payload, {
      headers: { "Content-Type": "application/json" },
    });

    return response.data;
  } catch (err) {
    console.error("Error updating order status:", err.response?.data || err);
    throw err;
  }
}

export const getDelivery = async () => {
  try {
    const response = await axios.get(`${API_URL}/delivery`);
    return response.data;
  } catch (err) {
    console.error("Error fetching delivery data:", err);
    return [];
  }
};

export async function updateDelivery(form, updatedDelivery) {
  try {
    const response = await axios.put(`${API_URL}/delivery/${form.id}`,
      updatedDelivery,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Error updating delivery:", err);
    throw err;
  }
}

export const updateDeliveryCost = async (payload) => {
  if (!payload?.Id) {
    throw new Error("updateDeliveryCost called without Id");
  }

  return axios.put(
    `${API_URL}/delivery/cost/${payload.Id}`,
    payload
  );
};

