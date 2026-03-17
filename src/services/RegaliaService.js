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
    const response = await axios.put(
      `${API_URL}/delivery/${form.id}`,
      updatedDelivery,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
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

  return axios.put(`${API_URL}/delivery/cost/${payload.Id}`, payload);
};

export async function syncRefundStatus(orderId) {
  const resp = await fetch(
    `${API_URL}/api/admin/orders/${orderId}/refund/sync`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
  );

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || `Sync refund status failed (${resp.status})`);
  }

  return await resp.json();
}

export async function refundRequest(orderId, amount) {
  const url = `${API_URL}/api/orders/${orderId}/refund-request`;
  const payload = { refundAmount: Number(amount) };

  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const resp = await axios.post(url, payload, {
    headers,
    validateStatus: () => true,
  });

  return resp;
}

export async function refundApprove(orderId, amount) {
  const url = `${API_URL}/api/orders/${orderId}/refund-approve`;
  const payload = { RefundAmount: Number(amount) };
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const resp = await axios.post(url, payload, {
    headers,
    validateStatus: () => true,
  });

  return resp;
}
export const getItems = async () => {
  try {
    const response = await axios.get(`${API_URL}/items`);
    return response.data;
  } catch (err) {
    console.error("Error fetching items:", err);
    return [];
  }
};

export const getItemSets = async () => {
  try {
    const response = await axios.get(`${API_URL}/itemsets`);
    return response.data;
  } catch (err) {
    console.error("Error fetching item sets:", err);
    return [];
  }
};
