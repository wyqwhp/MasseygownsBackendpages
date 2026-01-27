export const ORDER_STATUS = {
  ALL: 0,
  PENDING: 1,
  PROCESSING: 2,
  DELIVERED: 3,
  CANCELLED: 4,
};

// number -> css/class string (keeps your colors)
export const statusToClass = (status) => {
  switch (Number(status)) {
    case ORDER_STATUS.ALL:
      return "Al Status";
    case ORDER_STATUS.PENDING:
      return "pending";
    case ORDER_STATUS.PROCESSING:
      return "processing";
    case ORDER_STATUS.DELIVERED:
      return "delivered";
    case ORDER_STATUS.CANCELLED:
      return "cancelled";
    default:
      return "pending";
  }
};

// string/number -> number (handles backend sending strings or numbers)
export const normalizeStatus = (status) => {
  if (status === null || status === undefined || status === "")
    return ORDER_STATUS.PENDING;

  const n = Number(status);
  if ([1, 2, 3, 4].includes(n)) return n;

  const s = String(status).toLowerCase().trim();
  switch (s) {
    case "pending":
      return ORDER_STATUS.PENDING;
    case "processing":
      return ORDER_STATUS.PROCESSING;
    case "delivered":
      return ORDER_STATUS.DELIVERED;
    case "cancelled":
    case "canceled":
      return ORDER_STATUS.CANCELLED;
    default:
      return ORDER_STATUS.PENDING;
  }
};
