export function toNullableDecimal(value) {
    if (value === undefined || value === null) return null;

    const str = String(value).trim();
    if (str === "") return null;

    // Reject anything that isn't a plain numeric literal
    if (!/^-?\d+(\.\d+)?$/.test(str)) {
        console.warn(`Non-numeric value found: "${value}"`);
        return null;
    }

    const num = Number(str);
    return Number.isFinite(num) ? num : null;
}