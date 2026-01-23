import React, { useState, useEffect } from "react";
import "./HireRegalia.css";
import { Search, Filter, Eye, X, Clock, Package, Truck } from "lucide-react";
import { getOrders, updateOrderStatus } from "../services/RegaliaService";
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

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load cached data first (if exists)
        const cachedOrders = localStorage.getItem("regaliaOrders_hire");
        if (cachedOrders) {
          setOrders(JSON.parse(cachedOrders));
        }

        // ALWAYS fetch fresh data from API
        const data = await getOrders();

        const processedData = Array.isArray(data)
          ? data
              .map((order) => {
                // Keep ONLY hire items
                const hireItems =
                  order.items?.filter((item) => Boolean(item.hire)) || [];

                // If no hire items → exclude entire order
                if (hireItems.length === 0) return null;

                return {
                  ...order,
                  items: hireItems,
                  status: normalizeStatus(order.status), // numeric
                };
              })
              .filter(Boolean)
          : [];

        // Update state + cache
        setOrders(processedData);
        localStorage.setItem(
          "regaliaOrders_hire",
          JSON.stringify(processedData)
        );
      } catch (err) {
        setError(err.message || "Failed to fetch orders");

        // fallback to cache if API fails
        const cachedOrders = localStorage.getItem("regaliaOrders_hire");
        if (cachedOrders) {
          setOrders(JSON.parse(cachedOrders));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const statusConfig = {
    [ORDER_STATUS.PENDING]: { label: "Pending", icon: Clock },
    [ORDER_STATUS.PROCESSING]: { label: "Processing", icon: Package },
    [ORDER_STATUS.DELIVERED]: { label: "Delivered", icon: Truck },
    [ORDER_STATUS.CANCELLED]: { label: "Cancelled", icon: X },
  };

  // Get unique item types from all orders
  const getItemTypes = () => {
    const types = new Set();
    orders.forEach((order) => {
      order.items?.forEach((item) => {
        if (item.itemName) types.add(item.itemName);
      });
    });
    return Array.from(types).sort();
  };

  const updateStatus = (orderId, newStatus) => {
    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );

    // fire-and-forget (same as your BuyRegalia)
    updateOrderStatus(orderId, newStatus);

    setOrders(updatedOrders);
    localStorage.setItem("regaliaOrders_hire", JSON.stringify(updatedOrders));
    setSelectedOrder(null);
  };

  // Bulk status update (numeric)
  const handleBulkStatusUpdate = async () => {
    if (
      bulkStatusUpdate === 0 ||
      bulkStatusUpdate === ORDER_STATUS.ALL ||
      selectedOrders.length === 0
    ) {
      alert("Please select orders and a status to update");
      return;
    }

    const newStatus = bulkStatusUpdate; // already numeric

    // Optimistic UI update
    const updatedOrders = orders.map((order) =>
      selectedOrders.includes(order.id) ? { ...order, status: newStatus } : order
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
        }`
      );

      setSelectedOrders([]);
      setBulkStatusUpdate(0);
    } catch (err) {
      console.error("Bulk status update failed:", err.response?.data || err);
      alert(
        "Some updates failed on the server. UI updated locally. Please refresh to verify."
      );
    }
  };

  // Sorting function
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Get sort indicator
  const getSortIndicator = (columnKey) => {
    if (sortConfig.key !== columnKey) return "↑↓";
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  };

  // Toggle individual order selection
  const toggleOrderSelection = (orderId) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Toggle all visible (current page) orders
  const toggleAllOrders = () => {
    const visibleIds = paginatedOrders.map((order) => order.id);

    const allVisibleSelected = visibleIds.every((id) =>
      selectedOrders.includes(id)
    );

    if (allVisibleSelected) {
      setSelectedOrders((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedOrders((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const filteredOrders = React.useMemo(() => {
    const filtered = orders.filter((order) => {
      const fullName = `${order.firstName || ""} ${
        order.lastName || ""
      }`.toLowerCase();

      const q = searchTerm.toLowerCase();

      const matchesSearch =
        fullName.includes(q) ||
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

      return (
        matchesSearch && matchesFilter && matchesPayment && matchesItemType
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
    sortConfig,
  ]);

  // ----------------------------
  // PAGINATION
  // ----------------------------
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
    if (currentPage < 1) setCurrentPage(1);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterPaid, filterUnpaid, filterItemType, sortConfig]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const getStatusCount = (status) => {
    // status should be numeric now
    return orders.filter((o) => o.status === status).length;
  };

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
      "Item Name",
      "Quantity",
      "Order Date",
      "Status",
      "Payment Status",
    ];

    const rows = filteredOrders.flatMap((order) =>
      order.items?.length
        ? order.items.map((item) => [
            order.id,
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
              order.id,
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
          ]
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

  return (
    <>
      <div className="nav-bar">
        <AdminNavbar />
      </div>

      <div className="hire-regalia-container">
        <div className="hire-regalia-wrapper">
          <div className="hire-regalia-header">
            <h1 className="hire-regalia-title">Hire Regalia Orders</h1>
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
                  placeholder="Search by order ID, customer name, or student ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input with-icon"
                />
              </div>

              <div className="filter-wrapper">
                <Filter className="filter-icon" />
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

              <div className="payment-filter-wrapper">
                <label>
                  <input
                    type="checkbox"
                    checked={filterPaid}
                    onChange={(e) => setFilterPaid(e.target.checked)}
                  />
                  Paid
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={filterUnpaid}
                    onChange={(e) => setFilterUnpaid(e.target.checked)}
                  />
                  Unpaid
                </label>
              </div>

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
                            selectedOrders.includes(o.id)
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
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedOrders.map((order) => {
                    const status = normalizeStatus(order.status);
                    const config =
                      statusConfig[status] || statusConfig[ORDER_STATUS.PENDING];
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
                      {showDots && <span style={{ padding: "0 0.25rem" }}>…</span>}
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
                      <p className="modal-order-id">{selectedOrder.id}</p>
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
                    <div>
                      <h3 className="modal-section-title">Customer Information</h3>
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
                          <span className="info-value">{selectedOrder.email}</span>
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
                              <span className="info-value">{item.itemName}</span>
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
                              <span className="info-value">Hire</span>
                            </div>
                            <div className="info-row">
                              <span className="info-label">Quantity:</span>
                              <span className="info-value">{item.quantity}</span>
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
                          <span className="info-label">Order Date:</span>
                          <span className="info-value">{selectedOrder.orderDate}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Payment Status:</span>
                          <span
                            className={`info-value ${
                              selectedOrder.paid ? "success" : ""
                            }`}
                          >
                            {selectedOrder.paid ? "Paid" : "Unpaid"}
                          </span>
                        </div>
                        {selectedOrder.paymentMethod && (
                          <div className="info-row">
                            <span className="info-label">Payment Method:</span>
                            <span className="info-value">
                              {selectedOrder.paymentMethod
                                ? "Card payment or A2A"
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

                    {selectedOrder.message && (
                      <div>
                        <h3 className="modal-section-title">Message</h3>
                        <div className="info-card">
                          <p className="notes-text">{selectedOrder.message}</p>
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="modal-section-title">Update Status</h3>
                      <div className="status-update-grid">
                        {Object.entries(statusConfig).map(([statusKey, config]) => {
                          const numericStatus = Number(statusKey);
                          const StatusIcon = config.icon;

                          return (
                            <button
                              key={numericStatus}
                              onClick={() =>
                                updateStatus(selectedOrder.id, numericStatus)
                              }
                              className={`status-update-button ${
                                normalizeStatus(selectedOrder.status) === numericStatus
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
                        })}
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

          {/* Optional: show loading/error (if you want) */}
          {/* {loading && <div style={{ padding: 12 }}>Loading...</div>} */}
          {/* {error && <div style={{ padding: 12, color: "red" }}>{error}</div>} */}
        </div>
      </div>
    </>
  );
}

export default HireRegalia;
