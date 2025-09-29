const API_BASE = import.meta.env.VITE_GOWN_API_BASE;

// Get queries list
export async function fetchContact() {
  const controller = new AbortController();
  // Set time out
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${API_BASE}/contacts`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`API request failed: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    clearTimeout(timeout);
    console.error("Contact API error:", err);
    throw err;
  }
}
