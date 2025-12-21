import axios from "axios";
const API_BASE = import.meta.env.VITE_GOWN_API_BASE;

export async function sendOrderCompleteTemplate(payload) {
  const res = await fetch(`${API_BASE}/api/CmsContent/save-text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function saveCMSTemplate(payload) {
  await fetch(`${API_BASE}/api/EmailTemplates/${payload.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}


// export const getEmailTemplatesByKey = async (key) => {
//   try {
//     const response = await axios.get(
//       `${API_URL}/api/CmsContent/get-text`,
//       { params: { key } }
//     );
//     return response.data;
//   } catch (err) {
//     console.error("Error fetching email template:", err);
//     return null;
//   }
// };

