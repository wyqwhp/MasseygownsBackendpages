const API_BASE = import.meta.env.VITE_GOWN_API_BASE;

/**
 * Build query string safely (skip empty values)
 */
function buildQuery(params) {
  const sp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    const s = String(v).trim();
    if (!s) return;
    sp.set(k, s);
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Fetch address labels
 * @param {Object} args
 * @param {"individual"|"institution"} args.type
 * @param {string} [args.dateFrom] - yyyy-MM-dd (from <input type="date">)
 * @param {string} [args.dateTo] - yyyy-MM-dd
 * @param {string} [args.name] - name / institution name
 */
export async function fetchAddressLabels({ type, dateFrom, dateTo, name }) {
  if (type !== "individual" && type !== "institution") {
    throw new Error("type must be 'individual' or 'institution'");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const query = buildQuery({ type, dateFrom, dateTo, name });
    const url = `${API_BASE}/api/cms/address-labels${query}`;

    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!res.ok) {
      // Try read backend message (if any)
      const text = await res.text().catch(() => "");
      throw new Error(
        `API request failed: ${res.status}. ${text || ""}`.trim()
      );
    }

    return await res.json();
  } catch (err) {
    console.error("Label API error:", err);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
