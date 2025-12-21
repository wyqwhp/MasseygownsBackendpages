const API_BASE = import.meta.env.VITE_GOWN_API_BASE;

export async function updateEmailTemplate(apiBase, templateId, payload) {
  const res = await fetch(`${apiBase}/api/emailtemplates/${templateId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Save failed: ${res.status} ${txt}`);
  }

  return res.json();
}
