const API_BASE = import.meta.env.VITE_GOWN_API_BASE;

export async function sendOrderCompleteTemplate(payload) {
    await fetch(`${API_BASE}/api/CmsContent/save-text`, {
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

export async function getCMSTemplate(payload) {
    try {
        const response = await fetch(`${API_BASE}/api/EmailTemplates/by-name/${payload.Name}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }
        });
        return response.json();
    } catch(err) {
        console.error("Error fetching a template:", err);
        return [];
    }
}

export async function updateEmailTemplate(apiBase, templateId, payload) {
    const res = await fetch(`${apiBase}/api/emailtemplates/${templateId}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Save failed: ${res.status} ${txt}`);
    }
}

