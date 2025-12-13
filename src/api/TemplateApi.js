const API_BASE = import.meta.env.VITE_GOWN_API_BASE;

export async function sendOrderCompleteTemplate(payload) {
  const res = await fetch(`${API_BASE}/api/CmsContent/save-text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

//   let data;
//   const text = await res.text();

//   try {
//     data = JSON.parse(text);
//   } catch {
//     data = { success: false, message: text };
//   }

//   if (!res.ok || data.success === false) {
//     const err = new Error(data.message || "Failed to send email");
//     err.response = data;
//     throw err;
//   }
//   return data;
}