import React, { useEffect, useMemo, useState } from "react";
import "./AbandonedOrders.css";
import { Search, Filter, Eye, X} from "lucide-react";
import { getOrders, updateOrderStatus } from "../services/RegaliaService";
import AdminNavbar from "@/components/AdminNavbar";
import {
  ORDER_STATUS,
  normalizeStatus,
  statusToClass,
} from "../constants/status";

function AbandonedOrders() {
  const [csvData, setCsvData] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  // const [filterStatus, setFilterStatus] = useState(0);
  const [filterPaid, setFilterPaid] = useState(true);
  const [filterUnpaid, setFilterUnpaid] = useState(true);
  const [filterItemType, setFilterItemType] = useState("all");

  // Date filters (YYYY-MM-DD from <input type="date" />)
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bulkStatusUpdate, setBulkStatusUpdate] = useState(0);
  const [sortConfig, setSortConfig] = useState({
    key: "id",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

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
  // Fetch orders
  // ----------------------------
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        const cachedOrders = localStorage.getItem("regaliaOrders");
        if (cachedOrders) {
          setOrders(JSON.parse(cachedOrders));
        }

        const data = await getOrders();

        const processedData = Array.isArray(data)
          ? data
              .filter((order) => {
                const paymentMethod = Number(order.paymentMethod);

                // keep ONLY unpaid normal orders
                return paymentMethod !== 3 && order.paid === false;
              })
              .map((order) => ({
                ...order,
                status: normalizeStatus(order.status),
              }))
          : [];

        setOrders(processedData);
        localStorage.setItem("regaliaOrders", JSON.stringify(processedData));
      } catch (err) {
        setError(err.message || "Failed to fetch orders");
        const cachedOrders = localStorage.getItem("regaliaOrders");
        if (cachedOrders) {
          setOrders(JSON.parse(cachedOrders));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getItemTypes = () => {
    const types = new Set();
    orders.forEach((order) => {
      order.items?.forEach((item) => {
        if (item.itemName) types.add(item.itemName);
      });
    });
    return Array.from(types).sort();
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
  const filteredOrders = useMemo(() => {
    const filtered = orders.filter((order) => {
      const fullName = `${order.firstName || ""} ${
        order.lastName || ""
      }`.toLowerCase();

      const q = searchTerm.toLowerCase();

      const matchesSearch =
        fullName.includes(q) ||
        (order.id?.toString().toLowerCase() || "").includes(q) ||
        (order.purchaseOrder?.toString().toLowerCase() || "").includes(q) ||
        (order.id?.toString().toLowerCase() || "").includes(q) ||
        (order.studentId?.toString().toLowerCase() || "").includes(q) ||
        (order.email?.toLowerCase() || "").includes(q);

      const matchesPayment =
        (filterPaid && filterUnpaid) ||
        (filterPaid && order.paid) ||
        (filterUnpaid && !order.paid);

      const matchesItemType =
        filterItemType === "all" ||
        order.items?.some((item) => item.itemName === filterItemType);

      // Date match
      const orderDateObj = parseOrderDate(order.orderDate);
      const matchesDate =
        (!dateFrom && !dateTo) ||
        (orderDateObj &&
          (!dateFrom || orderDateObj >= toStartOfDay(dateFrom)) &&
          (!dateTo || orderDateObj <= toEndOfDay(dateTo)));

      return (
        matchesSearch &&
        // matchesFilter &&
        matchesPayment &&
        matchesItemType &&
        matchesDate
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
          aValue = a.orderDate
            ? parseOrderDate(a.orderDate)?.getTime() || 0
            : 0;
          bValue = b.orderDate
            ? parseOrderDate(b.orderDate)?.getTime() || 0
            : 0;
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
    // filterStatus,
    filterPaid,
    filterUnpaid,
    filterItemType,
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
    // filterStatus,
    filterPaid,
    filterUnpaid,
    filterItemType,
    sortConfig,
    dateFrom,
    dateTo,
  ]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const generateCSV = () => {
    if (filteredOrders.length === 0) {
      alert("No orders match the selected filters");
      return;
    }

    const headers = [
      "Order ID",
      "First Name",
      "Last Name",
      "Student ID",
      "Email",
      "Phone",
      "Address",
      "Item Name",
      "Quantity",
      "Full height:",
      "Head Size",
      "Gown size:",
      "Hood Type:",
      "Type",
      "Ceremony",
      "Order Date",
      "Event date",
      "Total amount",
      "Payment Method",
      "Payment Status",
      "Message",
    ];

    const rows = filteredOrders.flatMap((order) =>
      order.items?.length
        ? order.items.map((item) => [
            order.id,
            order.firstName,
            order.lastName,
            order.studentId,
            order.email,
            order.mobile,
            order.address + order.city + order.postcode,
            item.itemName,
            item.quantity,
            item.sizeName || "N/A",
            item.hatName || "N/A",
            item.fitName || "N/A",
            item.hoodName || "N/A",
            item.hire ? "Hire" : "Buy",
            order.ceremony || "N/A",
            order.orderDate,
            order.note || "N/A",
            order.amount,
            order.paymentMethod === 1
              ? "Card payment"
              : order.paymentMethod === 2
                ? "A2A"
                : "Purchased order",
            order.paid ? "Paid" : "Unpaid",
            order.message,
          ])
        : [
            [
              order.id,
              order.firstName,
              order.lastName,
              order.studentId,
              order.email,
              order.mobile,
              order.address + order.city + order.postcode,
              "",
              "",
              order.ceremony,
              order.orderDate,
              order.note,
              order.amount,
              order.paymentMethod === 1
                ? "Card payment"
                : order.paymentMethod === 2
                  ? "A2A"
                  : "Purchased order",
              order.status,
              order.paid ? "Paid" : "Unpaid",
              order.message,
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
    a.download = `Abandoned_Orders_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const itemTypes = getItemTypes();

  return (
    <>
      <div className="nav-bar">
        <AdminNavbar />
      </div>

      <div className="buy-regalia-container">
        <div className="buy-regalia-wrapper">
          <div className="buy-regalia-header">
            <p className="buy-regalia-subtitle">
              Manage and track graduation regalia abandoned purchases
            </p>
          </div>

          {/* Search and Filter */}
          <div className="search-filter-container">
            <div className="search-filter-wrapper">
              <div className="filter-wrapper search-wrapper">
                <Search className="search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Search by order id, customer name, student ID or Purchased order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input with-icon"
                />
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

              <button
                onClick={generateCSV}
                disabled={filteredOrders.length === 0}
                className="ml-3 bg-green-700 text-white px-3 py-1.5 rounded hover:bg-green-800 disabled:bg-gray-400"
              >
                Export CSV
              </button>
            </div>
          </div>

          <div className="filtered-count">
            Filtered Items: <span>{filteredOrders.length}</span>
          </div>

          {/* Orders Table */}
          <div className="table-container">
            <div className="table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th
                      onClick={() => handleSort("id")}
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      Order ID{getSortIndicator("id")}
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

                    {/* <th>Status</th> */}
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedOrders.map((order) => {
                    return (
                      <tr
                        key={order.id}
                        style={{
                          backgroundColor: selectedOrders.includes(order.id)
                            ? "#dbeafe"
                            : "transparent",
                        }}
                      >
                        <td className="table-cell-nowrap">
                          <div className="order-id">{order.id}</div>
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
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="action-button"
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
                      <p className="modal-order-id">{selectedOrder.id}</p>
                    </div>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="modal-close-button"
                    >
                      <X className="modal-close-icon" />
                    </button>
                  </div>

                  <div className="modal-sections">
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
                            {selectedOrder.studentId || "N/A"}
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
                              <span className="info-label">Full height:</span>
                              <span className="info-value">
                                {item.sizeName || "N/A"}
                              </span>
                            </div>
                            <div className="info-row">
                              <span className="info-label">Head size:</span>
                              <span className="info-value">
                                {item.hatName || "N/A"}
                              </span>
                            </div>
                            <div className="info-row">
                              <span className="info-label">Gown size:</span>
                              <span className="info-value">
                                {item.fitName || "N/A"}
                              </span>
                            </div>
                            {item.hoodName && (
                              <div className="info-row">
                                <span className="info-label">Hood Type:</span>
                                <span className="info-value">
                                  {item.hoodName || "N/A"}
                                </span>
                              </div>
                            )}
                            <div className="info-row">
                              <span className="info-label">Type:</span>
                              <span className="info-value">
                                {item.hire === true ? "Hire" : "Buy"}
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

                    <div>
                      <h3 className="modal-section-title">Order Information</h3>
                      <div className="info-card">
                        <div className="info-row">
                          <span className="info-label">Order Type:</span>
                          <span className="info-value">
                            {selectedOrder.orderType == 1
                              ? "Hire Regalia"
                              : selectedOrder.orderType == 2
                                ? "Buy Regalia"
                                : "Casual Hire for Photos"}
                          </span>
                        </div>
                        {selectedOrder.orderType == 1 && (
                          <div className="info-row">
                            <span className="info-label">Ceremony:</span>
                            <span className="info-value">
                              {selectedOrder.ceremony || "N/A"}
                            </span>
                          </div>
                        )}
                        <div className="info-row">
                          <span className="info-label">Order Date:</span>
                          <span className="info-value">
                            {selectedOrder.orderDate}
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Event Date:</span>
                          <span className="info-value">
                            {selectedOrder.note || "N/A"}
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Total amount:</span>
                          <span className="info-value">
                            ${selectedOrder.orderAmount}
                          </span>
                        </div>
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
                      </div>
                    </div>

                    {selectedOrder.message && (
                      <div>
                        <h3 className="modal-section-title">Message</h3>
                        <div className="info-card">
                          <p className="notes-text">{selectedOrder.message}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="modal-footer">
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="close-button"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default AbandonedOrders;
