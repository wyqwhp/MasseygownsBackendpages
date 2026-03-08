// HireRegalia.jsx
// Updated: add refund flow (refundStatusCode 0..4 + refundLastEm), localStorage fallback, refresh, request/approve.
// Keep: Hire order filters: orderType === 1, paid OR PN+digits (purchase order)
// Note: fully use refundStatusCode; no refundStatus string; text uses refundLastEm.

import React, { useEffect, useMemo, useState } from "react";
import "./HireRegalia.css";
import { Search, Filter, Eye, X, Clock, Package, Truck } from "lucide-react";
import {
  getOrders,
  updateOrderStatus,
  getItems,
  syncRefundStatus,
  refundRequest,
  refundApprove,
} from "../services/RegaliaService";
import AdminNavbar from "@/components/AdminNavbar";
import {
  ORDER_STATUS,
  normalizeStatus,
  statusToClass,
} from "../constants/status";

function HireRegalia() {
  const [csvData, setCsvData] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState(ORDER_STATUS.ALL);
  const [filterPaid, setFilterPaid] = useState(true);
  const [filterUnpaid, setFilterUnpaid] = useState(true);
  const [filterItemType, setFilterItemType] = useState("all");
  const [filterOrderType, setFilterOrderType] = useState("all");

  // Date filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [items, setItemsLocal] = useState([]);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [bulkStatusUpdate, setBulkStatusUpdate] = useState(0);

  // default: sort by latest order id first
  const [sortConfig, setSortConfig] = useState({
    key: "id",
    direction: "desc",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // ----------------------------
  // Role (manager vs normal user)
  // ----------------------------
  const role = localStorage.getItem("role") || "";
  const isManager = role.toLowerCase() === "manager";

  // ----------------------------
  // Refund UI states
  // ----------------------------
  const [refundAmount, setRefundAmount] = useState("");
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundSyncing, setRefundSyncing] = useState(false);
  const [refundSyncError, setRefundSyncError] = useState("");

  // refund status display
  const [refundStatusText, setRefundStatusText] = useState("");
  const [refundStatusType, setRefundStatusType] = useState("idle"); // idle | submitting | in_progress | completed | failed | requested

  // IMPORTANT: separate storage key for hire
  const REFUND_STATUS_STORAGE_KEY = "hire_refund_status_map_v1";

  // ----------------------------
  // RefundStatusCode enum values (server)
  // None = 0, InProgress = 1, Completed = 2, Failed = 3, Requested = 4
  // ----------------------------
  const REFUND_CODE = {
    NONE: 0,
    IN_PROGRESS: 1,
    COMPLETED: 2,
    FAILED: 3,
    REQUESTED: 4,
  };

  const toRefundType = (code) => {
    const n = Number(code);
    if (n === REFUND_CODE.IN_PROGRESS) return "in_progress";
    if (n === REFUND_CODE.COMPLETED) return "completed";
    if (n === REFUND_CODE.FAILED) return "failed";
    if (n === REFUND_CODE.REQUESTED) return "requested";
    return "idle";
  };

  // Extract refundStatusCode from various possible shapes (robust)
  const getRefundCode = (o) => {
    if (!o) return REFUND_CODE.NONE;
    const candidates = [
      o.refundStatusCode,
      o.refund_status_code,
      o.refundStatus, // if backend accidentally still returns numeric in refundStatus
      o.refund_status,
    ];
    for (const v of candidates) {
      if (v === null || v === undefined) continue;
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
    return REFUND_CODE.NONE;
  };

  // Extract refundLastEm (text) from various shapes (robust)
  const getRefundText = (o) => {
    if (!o) return "";
    const candidates = [
      o.refundLastEm,
      o.refund_last_em,
      o.refundLastMessage,
      o.refund_last_message,
    ];
    for (const v of candidates) {
      if (v === null || v === undefined) continue;
      const s = String(v).trim();
      if (s) return s;
    }
    return "";
  };

  // ----------------------------
  // Helpers: date parsing/filtering
  // ----------------------------
  const toStartOfDay = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };

  const toEndOfDay = (d) => {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  };

  // Handles: ISO strings, "YYYY-MM-DD", and "dd/mm/yyyy"
  const parseOrderDate = (value) => {
    if (!value) return null;

    const direct = new Date(value);
    if (!isNaN(direct.getTime())) return direct;

    const m = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
      const [, dd, mm, yyyy] = m;
      const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  };

  // ----------------------------
  // Refund localStorage helpers
  // ----------------------------
  const readRefundStatusMap = () => {
    try {
      const raw = localStorage.getItem(REFUND_STATUS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const writeRefundStatusMap = (map) => {
    localStorage.setItem(REFUND_STATUS_STORAGE_KEY, JSON.stringify(map));
  };

  const clearRefundStatusPersisted = (orderId) => {
    if (!orderId) return;
    const map = readRefundStatusMap();
    if (map[String(orderId)]) {
      delete map[String(orderId)];
      writeRefundStatusMap(map);
    }
  };

  const setRefundStatusPersisted = (orderId, type, text, amount) => {
    setRefundStatusType(type);
    setRefundStatusText(text);

    if (!orderId) return;
    const map = readRefundStatusMap();
    map[String(orderId)] = {
      type,
      text,
      amount: amount ?? map[String(orderId)]?.amount ?? null,
      updatedAt: new Date().toISOString(),
    };
    writeRefundStatusMap(map);
  };

  // ----------------------------
  // Refund amount helper
  // ----------------------------
  const pickRefundAmountFromOrder = (o) => {
    if (!o) return null;

    const candidates = [
      o.refundedAmount,
      o.refundRequestedAmount,
      o.requestedRefundAmount,
      o.refundRequestAmount,
      o.refundAmount,
      o.refund_amount,
      o.refund_requested_amount,
      o.requested_refund_amount,
    ];

    for (const v of candidates) {
      if (v === null || v === undefined) continue;
      const n = Number(v);
      if (!Number.isNaN(n) && n > 0) return n;
    }
    return null;
  };

  const pickRefundAmountFromStorage = (orderId) => {
    if (!orderId) return null;
    const map = readRefundStatusMap();
    const saved = map[String(orderId)];
    const n = Number(saved?.amount);
    if (!Number.isNaN(n) && n > 0) return n;
    return null;
  };

  // ----------------------------
  // Fetch orders (hire logic)
  // - only orderType === 1
  // - keep paid OR PN+digits purchase order
  // ----------------------------
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        const cachedOrders = localStorage.getItem("regaliaOrders_hire");
        if (cachedOrders) setOrders(JSON.parse(cachedOrders));

        const data = await getOrders();

        const processedData = Array.isArray(data)
          ? data
              .map((order) => {
                // 1) keep only orders where orderType = 1 (regular hire)
                if (parseInt(order.orderType) !== 1) return null;

                // 2) Purchase order (paymentMethod === 3)
                const paymentMethod = Number(order.paymentMethod);
                const isPurchaseOrder = paymentMethod === 3;

                // 3) Remove unpaid NORMAL orders
                // keep if paid OR isPurchaseOrder
                const keepOrder = order.paid === true || isPurchaseOrder;
                if (!keepOrder) return null;

                return {
                  ...order,
                  status: normalizeStatus(order.status),
                  isPurchaseOrder,
                };
              })
              .filter(Boolean)
          : [];

        setOrders(processedData);
        localStorage.setItem(
          "regaliaOrders_hire",
          JSON.stringify(processedData),
        );
      } catch (err) {
        setError(err.message || "Failed to fetch orders");
        const cachedOrders = localStorage.getItem("regaliaOrders_hire");
        if (cachedOrders) setOrders(JSON.parse(cachedOrders));
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // ----------------------------
  // Refund status text & type update when selectedOrder changes
  // backend: refundLastEm first, fallback localStorage
  // ----------------------------
  useEffect(() => {
    if (!selectedOrder?.id) return;

    const code = getRefundCode(selectedOrder);
    const backendText = getRefundText(selectedOrder);

    setRefundStatusType(toRefundType(code));

    if (backendText) {
      setRefundStatusText(backendText);
      if (code === REFUND_CODE.COMPLETED || code === REFUND_CODE.FAILED) {
        clearRefundStatusPersisted(selectedOrder.id);
      }
      return;
    }

    const map = readRefundStatusMap();
    const saved = map[String(selectedOrder.id)];
    if (saved?.text) {
      setRefundStatusType(saved.type || toRefundType(code) || "idle");
      setRefundStatusText(saved.text || "");
    } else {
      setRefundStatusText("");
    }

    if (code === REFUND_CODE.COMPLETED || code === REFUND_CODE.FAILED) {
      clearRefundStatusPersisted(selectedOrder.id);
    }
  }, [selectedOrder]);

  // Keep refundAmount in sync (selected order updates)
  useEffect(() => {
    if (!selectedOrder?.id) return;

    const backendAmt = pickRefundAmountFromOrder(selectedOrder);
    const storageAmt = pickRefundAmountFromStorage(selectedOrder.id);
    const amt = backendAmt ?? storageAmt;

    if (amt !== null && amt !== undefined && amt > 0) {
      setRefundAmount(String(amt));
    } else {
      if (!refundAmount) setRefundAmount("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedOrder?.id,
    selectedOrder?.refundedAmount,
    selectedOrder?.refundRequestedAmount,
    selectedOrder?.requestedRefundAmount,
    selectedOrder?.refundRequestAmount,
  ]);

  const statusConfig = {
    [ORDER_STATUS.PENDING]: { label: "Pending", icon: Clock },
    [ORDER_STATUS.PROCESSING]: { label: "Processing", icon: Package },
    [ORDER_STATUS.DELIVERED]: { label: "Delivered", icon: Truck },
    [ORDER_STATUS.CANCELLED]: { label: "Cancelled", icon: X },
  };

  const getItemTypes = () => {
    const types = new Set();

    // Use fetched single items
    (items || []).forEach((it) => {
      const name =
        it?.itemName || it?.name || it?.title || it?.displayName || "";
      if (name) types.add(String(name).trim());
    });

    return Array.from(types).sort((a, b) => a.localeCompare(b));
  };

  // fetch items
  useEffect(() => {
    const fetchItems = async () => {
      const data = await getItems();
      setItemsLocal(Array.isArray(data) ? data : []);
    };
    fetchItems();
  }, []);

  const updateStatus = (orderId, newStatus) => {
    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, status: newStatus } : order,
    );

    updateOrderStatus(orderId, newStatus); // fire-and-forget

    setOrders(updatedOrders);
    localStorage.setItem("regaliaOrders_hire", JSON.stringify(updatedOrders));
    setSelectedOrder(null);
  };

  const handleBulkStatusUpdate = async () => {
    if (
      bulkStatusUpdate === 0 ||
      bulkStatusUpdate === ORDER_STATUS.ALL ||
      selectedOrders.length === 0
    ) {
      alert("Please select orders and a status to update");
      return;
    }

    const newStatus = bulkStatusUpdate;

    const updatedOrders = orders.map((order) =>
      selectedOrders.includes(order.id)
        ? { ...order, status: newStatus }
        : order,
    );

    setOrders(updatedOrders);
    localStorage.setItem("regaliaOrders_hire", JSON.stringify(updatedOrders));

    try {
      for (const orderId of selectedOrders) {
        await updateOrderStatus(orderId, newStatus);
      }

      alert(
        `Updated ${selectedOrders.length} order(s) to ${
          statusConfig[newStatus]?.label || newStatus
        }`,
      );

      setSelectedOrders([]);
      setBulkStatusUpdate(0);
    } catch (err) {
      console.error("Bulk status update failed:", err.response?.data || err);
      alert(
        "Some updates failed on the server. UI updated locally. Please refresh to verify.",
      );
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (columnKey) => {
    if (sortConfig.key !== columnKey) return "↑↓";
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  };

  const toggleOrderSelection = (orderId) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId],
    );
  };

  // ----------------------------
  // Filter + Sort
  // ----------------------------
  const filteredOrders = React.useMemo(() => {
    const filtered = orders.filter((order) => {
      const fullName = `${order.firstName || ""} ${
        order.lastName || ""
      }`.toLowerCase();

      const q = searchTerm.toLowerCase();

      const matchesSearch =
        fullName.includes(q) ||
        (order.referenceNo?.toString().toLowerCase() || "").includes(q) ||
        (order.purchaseOrder?.toString().toLowerCase() || "").includes(q) ||
        (order.id?.toString().toLowerCase() || "").includes(q) ||
        (order.studentId?.toString().toLowerCase() || "").includes(q) ||
        (order.email?.toLowerCase() || "").includes(q);

      const matchesFilter =
        filterStatus === ORDER_STATUS.ALL || order.status === filterStatus;

      const matchesPayment =
        (filterPaid && filterUnpaid) ||
        (filterPaid && order.paid) ||
        (filterUnpaid && !order.paid);

      const matchesItemType =
        filterItemType === "all" ||
        order.items?.some((item) => item.itemName === filterItemType);

      const isPurchaseOrder = order.isPurchaseOrder === true;
      const isNormalOrder = !isPurchaseOrder;

      const matchesOrderType =
        filterOrderType === "all" ||
        (filterOrderType === "normal" && isNormalOrder) ||
        (filterOrderType === "purchase" && isPurchaseOrder);

      // Date match
      const orderDateObj = parseOrderDate(order.orderDate);
      const matchesDate =
        (!dateFrom && !dateTo) ||
        (orderDateObj &&
          (!dateFrom || orderDateObj >= toStartOfDay(dateFrom)) &&
          (!dateTo || orderDateObj <= toEndOfDay(dateTo)));

      return (
        matchesSearch &&
        matchesFilter &&
        matchesPayment &&
        matchesItemType &&
        matchesDate &&
        matchesOrderType
      );
    });

    if (!sortConfig.key) return filtered;

    return [...filtered].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case "id":
          aValue = Number(a.id) || 0;
          bValue = Number(b.id) || 0;
          break;
        case "name":
          aValue = `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase();
          bValue = `${b.firstName || ""} ${b.lastName || ""}`.toLowerCase();
          break;
        case "date":
          aValue = a.orderDate ? new Date(a.orderDate).getTime() : 0;
          bValue = b.orderDate ? new Date(b.orderDate).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [
    orders,
    searchTerm,
    filterStatus,
    filterPaid,
    filterUnpaid,
    filterItemType,
    filterOrderType,
    sortConfig,
    dateFrom,
    dateTo,
  ]);

  // ----------------------------
  // Pagination
  // ----------------------------
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
    if (currentPage < 1) setCurrentPage(1);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    filterStatus,
    filterPaid,
    filterUnpaid,
    filterItemType,
    filterOrderType,
    sortConfig,
    dateFrom,
    dateTo,
  ]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const toggleAllOrders = () => {
    const visibleIds = paginatedOrders.map((order) => order.id);
    const allVisibleSelected = visibleIds.every((id) =>
      selectedOrders.includes(id),
    );

    if (allVisibleSelected) {
      setSelectedOrders((prev) =>
        prev.filter((id) => !visibleIds.includes(id)),
      );
    } else {
      setSelectedOrders((prev) =>
        Array.from(new Set([...prev, ...visibleIds])),
      );
    }
  };

  const getStatusCount = (status) =>
    orders.filter((o) => o.status === status).length;

  const generateCSV = () => {
    if (filteredOrders.length === 0) {
      alert("No orders match the selected filters");
      return;
    }

    const headers = [
      "Reference Number",
      "First Name",
      "Last Name",
      "Student ID",
      "Email",
      "Item Name",
      "Quantity",
      "Order Date",
      "Status",
      "Payment Status",
    ];

    const rows = filteredOrders.flatMap((order) =>
      order.items?.length
        ? order.items.map((item) => [
            order.referenceNo,
            order.firstName,
            order.lastName,
            order.studentId,
            order.email,
            item.itemName,
            item.quantity,
            order.orderDate,
            order.status,
            order.paid ? "Paid" : "Unpaid",
          ])
        : [
            [
              order.referenceNo,
              order.firstName,
              order.lastName,
              order.studentId,
              order.email,
              "",
              "",
              order.orderDate,
              order.status,
              order.paid ? "Paid" : "Unpaid",
            ],
          ],
    );

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((v) => `"${v ?? ""}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Hire_Orders_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const itemTypes = getItemTypes();

  const getRefundStatusStyle = () => {
    switch (refundStatusType) {
      case "completed":
        return { color: "#047857", fontWeight: 600 };
      case "in_progress":
        return { color: "#1d4ed8", fontWeight: 600 };
      case "submitting":
        return { color: "#6b7280", fontWeight: 600 };
      case "failed":
        return { color: "#b91c1c", fontWeight: 600 };
      case "requested":
        return { color: "#b45309", fontWeight: 600 };
      default:
        return { color: "#6b7280" };
    }
  };

  // Refresh refund status from backend
  const handleRefreshRefundStatus = async () => {
    if (!selectedOrder?.id) return;

    setRefundSyncError("");
    setRefundSyncing(true);

    try {
      const data = await syncRefundStatus(selectedOrder.id);
      const r = data?.refund || {};

      setSelectedOrder((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          refundStatusCode: r.refundStatusCode ?? prev.refundStatusCode,
          refundLastEm: r.refundLastEm ?? prev.refundLastEm,

          refundedAmount: r.refundedAmount ?? prev.refundedAmount,
          refundedAt: r.refundedAt ?? prev.refundedAt,
          refundLastEc: r.refundLastEc ?? prev.refundLastEc,
          refundTxnId: r.refundTxnId ?? prev.refundTxnId,

          refundRequestedAmount:
            r.refundRequestedAmount ?? prev.refundRequestedAmount,
          requestedRefundAmount:
            r.requestedRefundAmount ?? prev.requestedRefundAmount,
        };
      });

      setOrders((prev) => {
        const updated = prev.map((o) => {
          if (o.id !== selectedOrder.id) return o;
          return {
            ...o,
            refundStatusCode: r.refundStatusCode ?? o.refundStatusCode,
            refundLastEm: r.refundLastEm ?? o.refundLastEm,

            refundedAmount: r.refundedAmount ?? o.refundedAmount,
            refundedAt: r.refundedAt ?? o.refundedAt,
            refundLastEc: r.refundLastEc ?? o.refundLastEc,
            refundTxnId: r.refundTxnId ?? o.refundTxnId,

            refundRequestedAmount:
              r.refundRequestedAmount ?? o.refundRequestedAmount,
            requestedRefundAmount:
              r.requestedRefundAmount ?? o.requestedRefundAmount,
          };
        });

        localStorage.setItem("regaliaOrders_hire", JSON.stringify(updated));
        return updated;
      });

      const merged = {
        ...selectedOrder,
        refundedAmount: r.refundedAmount ?? selectedOrder?.refundedAmount,
        refundRequestedAmount:
          r.refundRequestedAmount ?? selectedOrder?.refundRequestedAmount,
        requestedRefundAmount:
          r.requestedRefundAmount ?? selectedOrder?.requestedRefundAmount,
      };

      const amt = pickRefundAmountFromOrder(merged);
      if (amt && amt > 0) setRefundAmount(String(amt));

      const code = Number(r?.refundStatusCode);
      if (code === REFUND_CODE.COMPLETED || code === REFUND_CODE.FAILED) {
        clearRefundStatusPersisted(selectedOrder.id);
      }
    } catch (e) {
      console.error(e);
      setRefundSyncError(e?.message || "Failed to refresh refund status.");
    } finally {
      setRefundSyncing(false);
    }
  };

  // ----------------------------
  // Refund UI derived values
  // ----------------------------
  const backendRefundCode = getRefundCode(selectedOrder);
  const backendAmt = pickRefundAmountFromOrder(selectedOrder);
  const storageAmt = pickRefundAmountFromStorage(selectedOrder?.id);
  const displayAmt = backendAmt ?? storageAmt;

  const isRefundInProgress = backendRefundCode === REFUND_CODE.IN_PROGRESS;
  const isRefundCompleted = backendRefundCode === REFUND_CODE.COMPLETED;
  const isRefundRequested = backendRefundCode === REFUND_CODE.REQUESTED;

  // lock input in these cases (same logic as buy)
  const lockRefundAmountInput =
    isRefundInProgress ||
    isRefundCompleted ||
    (!isManager && isRefundRequested) ||
    (isManager && isRefundRequested);

  const refundAmountLabel = isRefundInProgress
    ? "Refunding amount (NZD):"
    : isRefundCompleted
      ? "Refunded amount (NZD):"
      : isRefundRequested
        ? "Requested refund amount (NZD):"
        : "Refund amount (NZD):";

  const refundAmountInputValue = lockRefundAmountInput
    ? displayAmt !== null && displayAmt !== undefined
      ? String(displayAmt)
      : String(refundAmount || "")
    : refundAmount;

  const refundAmountInputDisabled =
    lockRefundAmountInput || refundSubmitting || refundSyncing;

  const effectiveRefundAmountNum = Number(refundAmountInputValue);
  const hasValidRefundAmount =
    !Number.isNaN(effectiveRefundAmountNum) && effectiveRefundAmountNum > 0;

  const disableApplyRefundForUser =
    refundSubmitting ||
    refundSyncing ||
    !hasValidRefundAmount ||
    isRefundRequested ||
    isRefundInProgress ||
    isRefundCompleted;

  return (
    <>
      <div className="nav-bar">
        <AdminNavbar />
      </div>

      <div className="hire-regalia-container">
        <div className="hire-regalia-wrapper">
          <div className="hire-regalia-header">
            <p className="hire-regalia-subtitle">
              Manage and track graduation regalia purchases
            </p>
          </div>

          <div className="stats-grid">
            <div className="stat-card yellow">
              <div className="stat-card-content">
                <div className="stat-card-info">
                  <p>Pending</p>
                  <p>{getStatusCount(ORDER_STATUS.PENDING)}</p>
                </div>
                <Clock className="stat-icon yellow" />
              </div>
            </div>
            <div className="stat-card blue">
              <div className="stat-card-content">
                <div className="stat-card-info">
                  <p>Processing</p>
                  <p>{getStatusCount(ORDER_STATUS.PROCESSING)}</p>
                </div>
                <Package className="stat-icon blue" />
              </div>
            </div>
            <div className="stat-card green">
              <div className="stat-card-content">
                <div className="stat-card-info">
                  <p>Delivered</p>
                  <p>{getStatusCount(ORDER_STATUS.DELIVERED)}</p>
                </div>
                <Truck className="stat-icon green" />
              </div>
            </div>
            <div className="stat-card red">
              <div className="stat-card-content">
                <div className="stat-card-info">
                  <p>Cancelled</p>
                  <p>{getStatusCount(ORDER_STATUS.CANCELLED)}</p>
                </div>
                <X className="stat-icon red" />
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="search-filter-container">
            <div className="search-filter-wrapper">
              <div className="filter-wrapper search-wrapper">
                <Search className="search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Search by reference number, customer name, or student ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input with-icon"
                />
              </div>

              <div className="filter-wrapper">
                {/* <Filter className="filter-icon" /> */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(Number(e.target.value))}
                  className="filter-select"
                >
                  <option value={ORDER_STATUS.ALL}>All Status</option>
                  <option value={ORDER_STATUS.PENDING}>Pending</option>
                  <option value={ORDER_STATUS.PROCESSING}>Processing</option>
                  <option value={ORDER_STATUS.DELIVERED}>Delivered</option>
                  <option value={ORDER_STATUS.CANCELLED}>Cancelled</option>
                </select>
              </div>

              <div className="filter-wrapper">
                <select
                  value={filterItemType}
                  onChange={(e) => setFilterItemType(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Items</option>
                  {itemTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* DATE FILTERS */}
              <div className="filter-wrapper">
                <div>From</div>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="filter-select"
                  title="From date"
                />
              </div>

              <div className="filter-wrapper">
                <div>To</div>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="filter-select"
                  title="To date"
                />
              </div>

              <button
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
                className="ml-2 bg-gray-200 text-gray-800 px-3 py-1.5 rounded hover:bg-gray-300"
                type="button"
              >
                Clear dates
              </button>

              <div className="filter-wrapper">
                <select
                  value={filterOrderType}
                  onChange={(e) => setFilterOrderType(e.target.value)}
                  className="filter-select"
                  title="Order type"
                >
                  <option value="all">All Orders</option>
                  <option value="normal">Normal Orders</option>
                  <option value="purchase">Purchase Orders</option>
                </select>
              </div>

              <button
                onClick={generateCSV}
                disabled={filteredOrders.length === 0}
                className="ml-3 bg-green-700 text-white px-3 py-1.5 rounded hover:bg-green-800 disabled:bg-gray-400"
                type="button"
              >
                Export CSV
              </button>
            </div>
          </div>

          <div className="filtered-count">
            Filtered Items: <span>{filteredOrders.length}</span>
          </div>

          {/* Bulk Actions */}
          {selectedOrders.length > 0 && (
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#f3f4f6",
                borderRadius: "8px",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontWeight: "600" }}>
                {selectedOrders.length} order(s) selected
              </span>

              <select
                value={bulkStatusUpdate}
                onChange={(e) => setBulkStatusUpdate(Number(e.target.value))}
                style={{
                  padding: "0.5rem",
                  borderRadius: "4px",
                  border: "1px solid #d1d5db",
                }}
              >
                <option value={0}>Select new status...</option>
                <option value={ORDER_STATUS.PENDING}>Pending</option>
                <option value={ORDER_STATUS.PROCESSING}>Processing</option>
                <option value={ORDER_STATUS.DELIVERED}>Delivered</option>
                <option value={ORDER_STATUS.CANCELLED}>Cancelled</option>
              </select>

              <button
                onClick={handleBulkStatusUpdate}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
                type="button"
              >
                Update Status
              </button>

              <button
                onClick={() => setSelectedOrders([])}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#ef4444",
                  color: "white",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
                type="button"
              >
                Clear Selection
              </button>
            </div>
          )}

          {/* Orders Table */}
          <div className="table-container">
            <div className="table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={
                          paginatedOrders.length > 0 &&
                          paginatedOrders.every((o) =>
                            selectedOrders.includes(o.id),
                          )
                        }
                        onChange={toggleAllOrders}
                        style={{ cursor: "pointer" }}
                      />
                    </th>

                    <th
                      onClick={() => handleSort("id")}
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      Reference Number{getSortIndicator("id")}
                    </th>

                    <th
                      onClick={() => handleSort("name")}
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      Customer{getSortIndicator("name")}
                    </th>

                    <th>Items</th>
                    <th>Quantity</th>

                    <th
                      onClick={() => handleSort("date")}
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      Order Date{getSortIndicator("date")}
                    </th>

                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedOrders.map((order) => {
                    const status = normalizeStatus(order.status);
                    const config =
                      statusConfig[status] ||
                      statusConfig[ORDER_STATUS.PENDING];
                    const StatusIcon = config.icon || Clock;

                    return (
                      <tr
                        key={order.id}
                        style={{
                          backgroundColor: selectedOrders.includes(order.id)
                            ? "#dbeafe"
                            : "transparent",
                        }}
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order.id)}
                            onChange={() => toggleOrderSelection(order.id)}
                            style={{ cursor: "pointer" }}
                          />
                        </td>

                        <td className="table-cell-nowrap">
                          <div className="order-id">{order.referenceNo}</div>
                        </td>

                        <td className="table-cell-nowrap">
                          <div className="student-name">
                            {order.firstName} {order.lastName}
                          </div>
                          <div className="student-id">{order.studentId}</div>
                        </td>

                        <td>
                          {order.items?.map((item, index) => (
                            <div key={index} className="item-row">
                              <div className="item-name">{item.itemName}</div>
                            </div>
                          )) || <span className="no-items-text">No items</span>}
                        </td>

                        <td className="table-cell-nowrap">
                          <div className="item-quantity">
                            {order.items?.length || 0}
                          </div>
                        </td>

                        <td className="table-cell-nowrap">
                          <div className="order-date">{order.orderDate}</div>
                        </td>

                        <td className="table-cell-nowrap">
                          <span
                            className={`status-badge ${statusToClass(status)}`}
                          >
                            <StatusIcon className="status-icon" />
                            {config.label}
                          </span>
                        </td>

                        <td className="table-cell-nowrap">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="action-button"
                            type="button"
                          >
                            <Eye className="action-icon" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
              marginTop: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: "0.9rem", color: "#374151" }}>
              Showing <b>{filteredOrders.length === 0 ? 0 : startIndex + 1}</b>–
              <b>{Math.min(endIndex, filteredOrders.length)}</b> of{" "}
              <b>{filteredOrders.length}</b> orders
            </div>

            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  background: currentPage === 1 ? "#f3f4f6" : "white",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                }}
                type="button"
              >
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (totalPages <= 7) return true;
                  return (
                    p === 1 ||
                    p === totalPages ||
                    (p >= currentPage - 2 && p <= currentPage + 2)
                  );
                })
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showDots = prev && p - prev > 1;

                  return (
                    <React.Fragment key={p}>
                      {showDots && (
                        <span style={{ padding: "0 0.25rem" }}>…</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(p)}
                        style={{
                          padding: "0.5rem 0.75rem",
                          borderRadius: "6px",
                          border: "1px solid #d1d5db",
                          background: p === currentPage ? "#2563eb" : "white",
                          color: p === currentPage ? "white" : "#111827",
                          cursor: "pointer",
                          fontWeight: p === currentPage ? "700" : "500",
                        }}
                        type="button"
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  background: currentPage === totalPages ? "#f3f4f6" : "white",
                  cursor:
                    currentPage === totalPages ? "not-allowed" : "pointer",
                }}
                type="button"
              >
                Next
              </button>
            </div>
          </div>

          {/* Order Detail Modal */}
          {selectedOrder && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-inner">
                  <div className="modal-header">
                    <div>
                      <h2 className="modal-title">Order Details</h2>
                      <p className="modal-order-id">
                        {selectedOrder.referenceNo}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="modal-close-button"
                      type="button"
                    >
                      <X className="modal-close-icon" />
                    </button>
                  </div>

                  <div className="modal-sections">
                    {/* Customer Info */}
                    <div>
                      <h3 className="modal-section-title">
                        Customer Information
                      </h3>
                      <div className="info-card">
                        <div className="info-row">
                          <span className="info-label">Name:</span>
                          <span className="info-value">
                            {selectedOrder.firstName} {selectedOrder.lastName}
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Student ID:</span>
                          <span className="info-value">
                            {selectedOrder.studentId}
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Email:</span>
                          <span className="info-value">
                            {selectedOrder.email}
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Phone:</span>
                          <span className="info-value">
                            {selectedOrder.phone || selectedOrder.mobile}
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Address:</span>
                          <span className="info-value">
                            {selectedOrder.address}, {selectedOrder.city},{" "}
                            {selectedOrder.postcode}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div>
                      <h3 className="modal-section-title">Order Items</h3>
                      <div className="info-card">
                        {selectedOrder.items?.map((item, index) => (
                          <div key={index}>
                            <div className="info-row">
                              <span className="info-label">Item:</span>
                              <span className="info-value">
                                {item.itemName}
                              </span>
                            </div>
                            <div className="info-row">
                              <span className="info-label">Size:</span>
                              <span className="info-value">
                                {item.sizeName || "N/A"}
                              </span>
                            </div>
                            <div className="info-row">
                              <span className="info-label">Fit:</span>
                              <span className="info-value">
                                {item.fitName || "N/A"}
                              </span>
                            </div>
                            {item.hoodName && (
                              <div className="info-row">
                                <span className="info-label">Hood:</span>
                                <span className="info-value">
                                  {item.hoodName || "N/A"}
                                </span>
                              </div>
                            )}
                            <div className="info-row">
                              <span className="info-label">Type:</span>
                              <span className="info-value">
                                {item.hire ? "Hire" : "Buy"}
                              </span>
                            </div>
                            <div className="info-row">
                              <span className="info-label">Quantity:</span>
                              <span className="info-value">
                                {item.quantity}
                              </span>
                            </div>
                            <div className="info-row">
                              <span className="info-label">Price:</span>
                              <span className="info-value">${item.cost}</span>
                            </div>
                            {index < selectedOrder.items.length - 1 && (
                              <hr
                                style={{
                                  margin: "0.75rem 0",
                                  border: "1px solid #e5e7eb",
                                }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Info */}
                    <div>
                      <h3 className="modal-section-title">Order Information</h3>
                      <div className="info-card">
                        <div className="info-row">
                          <span className="info-label">Ceremony:</span>
                          <span className="info-value">
                            {selectedOrder.ceremony}
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Order Date:</span>
                          <span className="info-value">
                            {selectedOrder.orderDate}
                          </span>
                        </div>

                        <div className="info-row">
                          <span className="info-label">Total amount:</span>
                          <span className="info-value">
                            ${selectedOrder.amount}
                          </span>
                        </div>
                        {/* <div className="info-row">
                          <span className="info-label">Payment Status:</span>
                          <span
                            className={`info-value ${selectedOrder.paid ? "success" : ""}`}
                          >
                            {selectedOrder.paid ? "Paid" : "Unpaid"}
                          </span>
                        </div> */}
                        {selectedOrder.paymentMethod && (
                          <div className="info-row">
                            <span className="info-label">Payment Method:</span>
                            <span className="info-value">
                              {selectedOrder.paymentMethod === 1
                                ? "Card payment"
                                : selectedOrder.paymentMethod === 2
                                  ? "A2A"
                                  : "Purchased order"}
                            </span>
                          </div>
                        )}

                        {selectedOrder.purchaseOrder && (
                          <div className="info-row">
                            <span className="info-label">Purchase Order:</span>
                            <span className="info-value">
                              {selectedOrder.purchaseOrder === "PN"
                                ? "N/A"
                                : selectedOrder.purchaseOrder}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Message */}
                    {selectedOrder.message && (
                      <div>
                        <h3 className="modal-section-title">Message</h3>
                        <div className="info-card">
                          <p className="notes-text">{selectedOrder.message}</p>
                        </div>
                      </div>
                    )}

                    {/* Update Status */}
                    <div>
                      <h3 className="modal-section-title">Update Status</h3>
                      <div className="status-update-grid">
                        {Object.entries(statusConfig).map(
                          ([statusKey, config]) => {
                            const numericStatus = Number(statusKey);
                            const StatusIcon = config.icon;

                            return (
                              <button
                                key={numericStatus}
                                onClick={() =>
                                  updateStatus(selectedOrder.id, numericStatus)
                                }
                                className={`status-update-button ${
                                  normalizeStatus(selectedOrder.status) ===
                                  numericStatus
                                    ? "active"
                                    : "inactive"
                                }`}
                                type="button"
                              >
                                <StatusIcon className="status-update-icon" />
                                <span className="status-update-label">
                                  {config.label}
                                </span>
                              </button>
                            );
                          },
                        )}
                      </div>
                    </div>

                    {/* Refund */}
                    <div>
                      <h3 className="modal-section-title">Refund Order</h3>

                      <div
                        className="info-card"
                        style={{ display: "grid", gap: "0.75rem" }}
                      >
                        <div
                          className="info-row"
                          style={{ gap: "0.5rem", alignItems: "center" }}
                        >
                          <span className="info-label">Refund status:</span>

                          <span
                            className="info-value"
                            style={getRefundStatusStyle()}
                          >
                            {refundSubmitting
                              ? "Submitting..."
                              : refundStatusText
                                ? refundStatusText
                                : "—"}
                          </span>

                          <button
                            type="button"
                            onClick={handleRefreshRefundStatus}
                            disabled={refundSyncing || refundSubmitting}
                            style={{
                              marginLeft: "auto",
                              padding: "0.35rem 0.6rem",
                              borderRadius: "6px",
                              border: "1px solid #d1d5db",
                              backgroundColor: refundSyncing
                                ? "#f3f4f6"
                                : "white",
                              cursor:
                                refundSyncing || refundSubmitting
                                  ? "not-allowed"
                                  : "pointer",
                              fontWeight: 600,
                              fontSize: "0.85rem",
                            }}
                            title="Refresh refund status"
                          >
                            {refundSyncing ? "Refreshing..." : "Refresh"}
                          </button>
                        </div>

                        {refundSyncError && (
                          <div
                            style={{ color: "#b91c1c", fontSize: "0.85rem" }}
                          >
                            {refundSyncError}
                          </div>
                        )}

                        <div
                          className="info-row"
                          style={{ alignItems: "center" }}
                        >
                          <span className="info-label">
                            {refundAmountLabel}
                          </span>

                          <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            placeholder="e.g. 49.00"
                            value={refundAmountInputValue}
                            disabled={refundAmountInputDisabled}
                            onChange={(e) => {
                              if (refundAmountInputDisabled) return;
                              setRefundAmount(e.target.value);
                            }}
                            style={{
                              width: "180px",
                              padding: "0.5rem 0.75rem",
                              borderRadius: "6px",
                              border: "1px solid #d1d5db",
                              backgroundColor: refundAmountInputDisabled
                                ? "#f3f4f6"
                                : "white",
                              cursor: refundAmountInputDisabled
                                ? "not-allowed"
                                : "text",
                            }}
                          />
                        </div>

                        {/* user: Apply Refund */}
                        {!isManager && (
                          <button
                            type="button"
                            disabled={disableApplyRefundForUser}
                            onClick={async () => {
                              if (!selectedOrder) return;

                              const amountNum = Number(refundAmount);
                              if (!amountNum || amountNum <= 0) {
                                alert("Please enter a valid refund amount.");
                                return;
                              }

                              const ok = window.confirm(
                                `Apply refund?\nAmount: $${amountNum}`,
                              );
                              if (!ok) return;

                              try {
                                setRefundSubmitting(true);
                                setRefundStatusPersisted(
                                  selectedOrder.id,
                                  "submitting",
                                  "Submitting refund request...",
                                  amountNum,
                                );

                                const resp = await refundRequest(
                                  selectedOrder.id,
                                  amountNum,
                                );

                                if (
                                  resp.status === 200 ||
                                  resp.status === 202
                                ) {
                                  const data = resp.data || {};
                                  const newCode =
                                    Number(
                                      data.refundStatusCode ??
                                        data.statusCode ??
                                        data.code,
                                    ) ||
                                    (resp.status === 200
                                      ? REFUND_CODE.REQUESTED
                                      : REFUND_CODE.IN_PROGRESS);

                                  const newAmt =
                                    data.amount ??
                                    data.refundedAmount ??
                                    data.refundRequestedAmount ??
                                    amountNum;

                                  const newText = String(
                                    data.refundLastEm ??
                                      data.em ??
                                      data.message ??
                                      "",
                                  ).trim();

                                  setSelectedOrder((prev) => ({
                                    ...prev,
                                    refundStatusCode: newCode,
                                    refundLastEm: newText || prev?.refundLastEm,
                                    refundedAmount: newAmt,
                                  }));

                                  setOrders((prev) => {
                                    const updated = prev.map((o) =>
                                      o.id === selectedOrder.id
                                        ? {
                                            ...o,
                                            refundStatusCode: newCode,
                                            refundLastEm:
                                              newText || o.refundLastEm,
                                            refundedAmount: newAmt,
                                          }
                                        : o,
                                    );
                                    localStorage.setItem(
                                      "regaliaOrders_hire",
                                      JSON.stringify(updated),
                                    );
                                    return updated;
                                  });

                                  setRefundAmount(String(newAmt));

                                  setRefundStatusPersisted(
                                    selectedOrder.id,
                                    toRefundType(newCode),
                                    newText ||
                                      (newCode === REFUND_CODE.REQUESTED
                                        ? "Refund requested."
                                        : "Refund in progress."),
                                    newAmt,
                                  );

                                  if (
                                    newCode === REFUND_CODE.COMPLETED ||
                                    newCode === REFUND_CODE.FAILED
                                  ) {
                                    clearRefundStatusPersisted(
                                      selectedOrder.id,
                                    );
                                  }

                                  alert(
                                    resp.status === 200
                                      ? `Refund requested.\nOrderId: ${selectedOrder.id}`
                                      : `Refund submitted.\n${newText || ""}`,
                                  );
                                  return;
                                }

                                if (resp.status === 409) {
                                  const msg =
                                    (typeof resp.data === "string" &&
                                      resp.data) ||
                                    resp.data?.em ||
                                    resp.data?.message ||
                                    "Refund already requested / already refunded.";
                                  setRefundStatusPersisted(
                                    selectedOrder.id,
                                    "failed",
                                    msg,
                                    amountNum,
                                  );
                                  alert(msg);
                                  return;
                                }

                                const msg =
                                  (resp.data &&
                                    (resp.data.em ||
                                      resp.data.status ||
                                      resp.data.message)) ||
                                  (typeof resp.data === "string"
                                    ? resp.data
                                    : null) ||
                                  `Refund failed. HTTP ${resp.status}`;

                                setRefundStatusPersisted(
                                  selectedOrder.id,
                                  "failed",
                                  msg,
                                  amountNum,
                                );
                                alert(msg);
                              } catch (e) {
                                console.error(e);
                                setRefundStatusPersisted(
                                  selectedOrder.id,
                                  "failed",
                                  "Refund request failed. Please check backend logs.",
                                  Number(refundAmount) || null,
                                );
                                alert(
                                  "Refund request failed. Please check backend logs.",
                                );
                              } finally {
                                setRefundSubmitting(false);
                              }
                            }}
                            style={{
                              padding: "0.6rem 1rem",
                              backgroundColor: "#f59e0b",
                              color: "white",
                              borderRadius: "6px",
                              border: "none",
                              cursor: disableApplyRefundForUser
                                ? "not-allowed"
                                : "pointer",
                              fontWeight: "600",
                              width: "fit-content",
                              opacity: disableApplyRefundForUser ? 0.7 : 1,
                            }}
                          >
                            {refundSubmitting
                              ? "Submitting..."
                              : "Apply Refund"}
                          </button>
                        )}

                        {/* manager: Confirm Refund */}
                        {isManager && (
                          <button
                            type="button"
                            disabled={
                              refundSubmitting ||
                              refundSyncing ||
                              !hasValidRefundAmount
                            }
                            onClick={async () => {
                              if (!selectedOrder) return;

                              const amountNum = Number(refundAmountInputValue);
                              if (!amountNum || amountNum <= 0) {
                                alert(
                                  "No valid requested refund amount found. Please refresh or check backend.",
                                );
                                return;
                              }

                              const ok = window.confirm(
                                `Confirm refund?\nAmount: $${amountNum}`,
                              );
                              if (!ok) return;

                              try {
                                setRefundSubmitting(true);
                                setRefundStatusPersisted(
                                  selectedOrder.id,
                                  "submitting",
                                  "Submitting refund approval...",
                                  amountNum,
                                );

                                const resp = await refundApprove(
                                  selectedOrder.id,
                                  amountNum,
                                );

                                if (
                                  resp.status === 200 ||
                                  resp.status === 202
                                ) {
                                  const data = resp.data || {};
                                  const newCode =
                                    Number(
                                      data.refundStatusCode ??
                                        data.statusCode ??
                                        data.code,
                                    ) ||
                                    (resp.status === 200
                                      ? REFUND_CODE.COMPLETED
                                      : REFUND_CODE.IN_PROGRESS);

                                  const newAmt =
                                    data.amount ??
                                    data.refundedAmount ??
                                    amountNum;
                                  const newText = String(
                                    data.refundLastEm ??
                                      data.em ??
                                      data.message ??
                                      "",
                                  ).trim();

                                  setSelectedOrder((prev) => ({
                                    ...prev,
                                    refundStatusCode: newCode,
                                    refundLastEm: newText || prev?.refundLastEm,
                                    refundedAmount: newAmt,
                                    refundTxnId:
                                      data.refundTxnId ?? prev?.refundTxnId,
                                  }));

                                  setOrders((prev) => {
                                    const updated = prev.map((o) =>
                                      o.id === selectedOrder.id
                                        ? {
                                            ...o,
                                            refundStatusCode: newCode,
                                            refundLastEm:
                                              newText || o.refundLastEm,
                                            refundedAmount: newAmt,
                                            refundTxnId:
                                              data.refundTxnId ?? o.refundTxnId,
                                          }
                                        : o,
                                    );
                                    localStorage.setItem(
                                      "regaliaOrders_hire",
                                      JSON.stringify(updated),
                                    );
                                    return updated;
                                  });

                                  if (
                                    newCode === REFUND_CODE.COMPLETED ||
                                    newCode === REFUND_CODE.FAILED
                                  ) {
                                    clearRefundStatusPersisted(
                                      selectedOrder.id,
                                    );
                                  } else {
                                    setRefundStatusPersisted(
                                      selectedOrder.id,
                                      toRefundType(newCode),
                                      newText || "Refund in progress.",
                                      newAmt,
                                    );
                                  }

                                  alert(
                                    resp.status === 200
                                      ? `Refund approved.\nOrderId: ${selectedOrder.id}`
                                      : `Refund is in progress.\n${newText || ""}`,
                                  );
                                  return;
                                }

                                if (resp.status === 409) {
                                  const msg =
                                    (typeof resp.data === "string" &&
                                      resp.data) ||
                                    resp.data?.em ||
                                    resp.data?.message ||
                                    "Refund conflict.";
                                  setRefundStatusPersisted(
                                    selectedOrder.id,
                                    "failed",
                                    msg,
                                    amountNum,
                                  );
                                  alert(msg);
                                  return;
                                }

                                const msg =
                                  (resp.data &&
                                    (resp.data.em ||
                                      resp.data.status ||
                                      resp.data.message)) ||
                                  (typeof resp.data === "string"
                                    ? resp.data
                                    : null) ||
                                  `Refund failed. HTTP ${resp.status}`;

                                setRefundStatusPersisted(
                                  selectedOrder.id,
                                  "failed",
                                  msg,
                                  amountNum,
                                );
                                alert(msg);
                              } catch (e) {
                                console.error(e);
                                setRefundStatusPersisted(
                                  selectedOrder.id,
                                  "failed",
                                  "Refund approve failed. Please check backend logs.",
                                  Number(refundAmountInputValue) || null,
                                );
                                alert(
                                  "Refund approve failed. Please check backend logs.",
                                );
                              } finally {
                                setRefundSubmitting(false);
                              }
                            }}
                            style={{
                              padding: "0.6rem 1rem",
                              backgroundColor: "#ef4444",
                              color: "white",
                              borderRadius: "6px",
                              border: "none",
                              cursor:
                                refundSubmitting ||
                                refundSyncing ||
                                !hasValidRefundAmount
                                  ? "not-allowed"
                                  : "pointer",
                              fontWeight: "600",
                              width: "fit-content",
                              opacity:
                                refundSubmitting ||
                                refundSyncing ||
                                !hasValidRefundAmount
                                  ? 0.7
                                  : 1,
                            }}
                          >
                            {refundSubmitting
                              ? "Submitting..."
                              : "Confirm Refund"}
                          </button>
                        )}

                        <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                          {!isManager
                            ? isRefundRequested
                              ? "Refund request submitted. Waiting for manager approval."
                              : "This will submit a refund request for manager review."
                            : "This will notify the payment provider to process the refund."}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="close-button"
                      type="button"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Optional: show loading/error */}
          {/* {loading && <div style={{ padding: 12 }}>Loading...</div>} */}
          {/* {error && <div style={{ padding: 12, color: "red" }}>{error}</div>} */}
        </div>
      </div>
    </>
  );
}

export default HireRegalia;
