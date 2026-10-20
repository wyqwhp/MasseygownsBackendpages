export function formatNZDate(dateStr) {
    if (dateStr === null) {
        return "";
    }
    const [year, month, day] = dateStr.split("-");

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    return `${day}-${months[month - 1]}-${year}`;
}

export function formatNZDateSlash(dateStr) {
    if (dateStr === null) {
        return "";
    }
    const [day, month, year] = dateStr.split("/");

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    return `${day}-${months[month - 1]}-${year}`;
}