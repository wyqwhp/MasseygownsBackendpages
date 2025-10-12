import React, { useState, useEffect } from "react";
import "./BuyRegalia.css";
import {
  Search,
  Filter,
  Eye,
  X,
  Clock,
  Package,
  Truck,
  CheckCircle,
} from "lucide-react";
import { getOrders } from "../services/RegaliaService";

function BuyRegalia() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("1");
  const [filterPaid, setFilterPaid] = useState(true);
  const [filterUnpaid, setFilterUnpaid] = useState(true);
  const [filterItemType, setFilterItemType] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bulkStatusUpdate, setBulkStatusUpdate] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    const cachedOrders = localStorage.getItem("regaliaOrders");
    if (cachedOrders) {
      setOrders(JSON.parse(cachedOrders));
    }
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
  
        const cachedOrders = localStorage.getItem("regaliaOrders");
  
        if (cachedOrders) {
          const parsedOrders = JSON.parse(cachedOrders);
          setOrders(parsedOrders);
          setLoading(false);
          return;
        }
        
        const data = await getOrders();
        
        const processedData = Array.isArray(data) 
          ? data.map(order => ({
              ...order,
              status: order.status || "pending"
            }))
          : [];
  
        setOrders(processedData);
        localStorage.setItem("regaliaOrders", JSON.stringify(processedData));
      } catch (err) {
        setError(err.message);
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

  const statusConfig = {
    pending: { label: "Pending", icon: Clock },
    processing: { label: "Processing", icon: Package },
    delivered: { label: "Delivered", icon: Truck },
    cancelled: { label: "Cancelled", icon: X },
  };

  // Get unique item types from all orders
  const getItemTypes = () => {
    const types = new Set();
    orders.forEach(order => {
      order.items?.forEach(item => {
        if (item.itemName) {
          // Extract category/type from item name or use full name
          types.add(item.itemName);
        }
      });
    });
    return Array.from(types).sort();
  };

  const updateOrderStatus = (orderId, newStatus) => {
    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    setOrders(updatedOrders);
    localStorage.setItem("regaliaOrders", JSON.stringify(updatedOrders));
    setSelectedOrder(null);
  };

  // Bulk status update
  const handleBulkStatusUpdate = () => {
    if (!bulkStatusUpdate || selectedOrders.length === 0) {
      alert("Please select orders and a status to update");
      return;
    }

    const updatedOrders = orders.map((order) =>
      selectedOrders.includes(order.id)
        ? { ...order, status: bulkStatusUpdate }
        : order
    );
    
    setOrders(updatedOrders);
    localStorage.setItem("regaliaOrders", JSON.stringify(updatedOrders));
    setSelectedOrders([]);
    setBulkStatusUpdate("");
    alert(`Updated ${selectedOrders.length} order(s) to ${statusConfig[bulkStatusUpdate].label}`);
  };

  // Sorting function
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sort indicator
  const getSortIndicator = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return '↑↓';
    }
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  // Toggle individual order selection
  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Toggle all visible orders
  const toggleAllOrders = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(order => order.id));
    }
  };

  const filteredOrders = React.useMemo(() => {
    // First filter the orders
    const filtered = orders.filter((order) => {
      const fullName = `${order.firstName || ""} ${
        order.lastName || ""
      }`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchTerm.toLowerCase()) ||
        (order.id?.toString().toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        (order.studentId?.toString().toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        (order.email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      
      const statusMap = {
        "1": null,
        "2": "pending",
        "3": "processing",
        "4": "delivered",
        "5": "cancelled"
      };
      
      const selectedStatus = statusMap[filterStatus];
      const matchesFilter = selectedStatus === null || order.status === selectedStatus;
      
      const matchesPayment =
        (filterPaid && filterUnpaid) ||
        (filterPaid && order.paid) ||
        (filterUnpaid && !order.paid);

      // Filter by item type
      const matchesItemType = filterItemType === "all" || 
        order.items?.some(item => item.itemName === filterItemType);
    
      return matchesSearch && matchesFilter && matchesPayment && matchesItemType;
    });

    // Then sort the filtered results
    if (!sortConfig.key) return filtered;

    return [...filtered].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'id':
          aValue = Number(a.id) || 0;
          bValue = Number(b.id) || 0;
          break;
        case 'name':
          aValue = `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase();
          bValue = `${b.firstName || ""} ${b.lastName || ""}`.toLowerCase();
          break;
        case 'date':
          aValue = a.orderDate ? new Date(a.orderDate).getTime() : 0;
          bValue = b.orderDate ? new Date(b.orderDate).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [orders, searchTerm, filterStatus, filterPaid, filterUnpaid, filterItemType, sortConfig]);

  const getStatusCount = (status) => {
    return orders.filter((o) => o.status === status).length;
  };

  const itemTypes = getItemTypes();

  return (
    <div className="buy-regalia-container">
      <div className="buy-regalia-wrapper">
        <div className="buy-regalia-header">
          <h1 className="buy-regalia-title">Buy Regalia Orders</h1>
          <p className="buy-regalia-subtitle">
            Manage and track graduation regalia purchases
          </p>
        </div>

        <div className="stats-grid">
          <div className="stat-card yellow">
            <div className="stat-card-content">
              <div className="stat-card-info">
                <p>Pending</p>
                <p>{getStatusCount("pending")}</p>
              </div>
              <Clock className="stat-icon yellow" />
            </div>
          </div>
          <div className="stat-card blue">
            <div className="stat-card-content">
              <div className="stat-card-info">
                <p>Processing</p>
                <p>{getStatusCount("processing")}</p>
              </div>
              <Package className="stat-icon blue" />
            </div>
          </div>          
          <div className="stat-card green">
            <div className="stat-card-content">
              <div className="stat-card-info">
                <p>Delivered</p>
                <p>{getStatusCount("delivered")}</p>
              </div>
              <Truck className="stat-icon green" />
            </div>
          </div>
          <div className="stat-card red">
            <div className="stat-card-content">
              <div className="stat-card-info">
                <p>Cancelled</p>
                <p>{getStatusCount("cancelled")}</p>
              </div>
              <X className="stat-icon red" />
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="search-filter-container">
          <div className="search-filter-wrapper">
            <div className="search-input-wrapper">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search by order ID, student name, or student ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-wrapper">
              <Filter className="filter-icon" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="1">All Status</option>
                <option value="2">Pending</option>
                <option value="3">Processing</option>
                <option value="4">Delivered</option>
                <option value="5">Cancelled</option>
              </select>
            </div>
            <div className="filter-wrapper">
              <Filter className="filter-icon" />
              <select
                value={filterItemType}
                onChange={(e) => setFilterItemType(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Items</option>
                {itemTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
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
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedOrders.length > 0 && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#f3f4f6',
            borderRadius: '8px',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontWeight: '600' }}>
              {selectedOrders.length} order(s) selected
            </span>
            <select
              value={bulkStatusUpdate}
              onChange={(e) => setBulkStatusUpdate(e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #d1d5db'
              }}
            >
              <option value="">Select new status...</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button
              onClick={handleBulkStatusUpdate}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Update Status
            </button>
            <button
              onClick={() => setSelectedOrders([])}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#ef4444',
                color: 'white',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500'
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
                      checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                      onChange={toggleAllOrders}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <th 
                    onClick={() => handleSort('id')} 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Order ID{getSortIndicator('id')}
                  </th>
                  <th 
                    onClick={() => handleSort('name')} 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Student{getSortIndicator('name')}
                  </th>
                  <th>Items</th>
                  <th>Quantity</th>
                  <th 
                    onClick={() => handleSort('date')} 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Order Date{getSortIndicator('date')}
                  </th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const status = order.status || "pending";
                  const config = statusConfig[status];
                  const StatusIcon = config.icon;

                  return (
                    <tr key={order.id} style={{
                      backgroundColor: selectedOrders.includes(order.id) ? '#dbeafe' : 'transparent'
                    }}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => toggleOrderSelection(order.id)}
                          style={{ cursor: 'pointer' }}
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
                        <span className={`status-badge ${status}`}>
                          <StatusIcon className="status-icon" />
                          {config.label}
                        </span>
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

        {/* Order Detail Modal - keeping your existing modal code */}
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
                    <h3 className="modal-section-title">Student Information</h3>
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
                            <span className="info-value">{item.sizeName}</span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">Fit:</span>
                            <span className="info-value">{item.fitName}</span>
                          </div>
                          {item.hoodName && (
                            <div className="info-row">
                              <span className="info-label">Hood:</span>
                              <span className="info-value">
                                {item.hoodName}
                              </span>
                            </div>
                          )}
                          <div className="info-row">
                            <span className="info-label">Type:</span>
                            <span className="info-value">Buy</span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">Quantity:</span>
                            <span className="info-value">{item.quantity}</span>
                          </div>
                          {index < selectedOrder.items.length - 1 && (
                            <hr style={{ margin: "0.75rem 0", border: "1px solid #e5e7eb" }} />
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
                        <span className="info-value">
                          {selectedOrder.orderDate}
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Payment Status:</span>
                        <span className={`info-value ${selectedOrder.paid ? "success" : ""}`}>
                          {selectedOrder.paid ? "Paid" : "Unpaid"}
                        </span>
                      </div>
                      {selectedOrder.paymentMethod && (
                        <div className="info-row">
                          <span className="info-label">Payment Method:</span>
                          <span className="info-value">
                            {selectedOrder.paymentMethod}
                          </span>
                        </div>
                      )}
                      {selectedOrder.purchaseOrder && (
                        <div className="info-row">
                          <span className="info-label">Purchase Order:</span>
                          <span className="info-value">
                            {selectedOrder.purchaseOrder}
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
                      {Object.entries(statusConfig).map(([status, config]) => {
                        const StatusIcon = config.icon;
                        return (
                          <button
                            key={status}
                            onClick={() => updateOrderStatus(selectedOrder.id, status)}
                            className={`status-update-button ${
                              selectedOrder.status === status ? "active" : "inactive"
                            }`}
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
  );
}

export default BuyRegalia;