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