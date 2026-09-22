import React, { useEffect, useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {CheckIcon, CheckSquare, ChevronsLeft, ChevronsRight, Printer, PlusCircle, Trash2} from "lucide-react";
import AdminNavbar from "./AdminNavbar.jsx";
import axios from "axios";
import FullscreenSpinner from "@/components/FullscreenSpinner.jsx";
import "./AdminIndOrder.css";
import { SelectViewport } from "@radix-ui/react-select";
import PrintIndBuyWorksheet from "@/components/ReportPrint/PrintIndBuyWorksheet.jsx";
import PrintIndCasualWorksheet from "@/components/ReportPrint/PrintIndCasualWorksheet.jsx";
import PrintIndAddressLabels from "@/components/ReportPrint/PrintIndAddressLabels.jsx";
import PrintIndReceipt from "@/components/ReportPrint/PrintIndReceipt.jsx";
import {Textarea} from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const API_URL = import.meta.env.VITE_GOWN_API_BASE; // or hardcode "http://localhost:5144"
// const API_URL = "http://localhost:5144"

export default function AdminIndOrder() {
  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    orderNumber: "",
    itemSize: "",
    amountPaid: "",
    address: "",
    packNote: "",
    email: "",
    phone: "",
    clientId: "",
    ceremonyId: "",
    ceremony: "",
    gownSize: "",
    hatSize: "",
    hatLabel: "",
    gownType: "",
    hatType: "",
    height: "",
    headSize: "",
    items: [],
    orderType: "",
    hoodName: "",
    note: "",
    changes: "",
    donation: "",
    freight: "",
    amountOwing: "",
    refund: "",
    adminChgs: "",
    pOrder: "",
    payBy: "",
    referenceNo: "",
    qualification: "",
  });
  const [orders, setOrders] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState();
  const [error, setError] = useState(null);
  const [changed, setChanged] = useState(false);
  const [changedItems, setChangedItems] = useState([]);
  const [deletedItemIds, setDeletedItemIds] = useState([]);
  const [items, setItems] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [hats, setHats] = useState([]);
  const [hoods, setHoods] = useState([]);
  const [gownId, setGownId] = useState("");
  const [hatId, setHatId] = useState("");
  const [showCasualHirePrint, setShowCasualHirePrint] = useState(false);
  const [showBuyPrint, setShowBuyPrint] = useState(false);
  const [showPrintIndAddressLabels, setShowPrintIndAddressLabels] = useState(false);
  const [showReceiptPrint, setShowReceiptPrint] = useState(false);
  const [paper, setPaper] = useState("A4");
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(false);

  const getLabel = (name) => name.split("-")[1]?.trim() || name;

  const filteredOrders = useMemo (() => {
    return orders.filter(order =>
        Object.values(order).join(" ").toLowerCase().includes(search.toLowerCase()))
  }, [orders, search]);

  const ordersInitialized = useRef(false);
  const prevSearchRef = useRef(search);

  useEffect(() => {
    if (filteredOrders.length === 0) return;

    const searchChanged = prevSearchRef.current !== search;
    prevSearchRef.current = search;

    if (!ordersInitialized.current) {
      // First time we have data (from cache or from the server) - show the first order.
      ordersInitialized.current = true;
      console.log('Filtered Orders=', filteredOrders);
      updateForm(filteredOrders[0]);
      setCurrentIndex(0);
      return;
    }

    if (saved) {
      // Skip the reset right after a save - the orders array changed but the user is still on it.
      setSaved(false);
      return;
    }

    if (searchChanged) {
      console.log('Filtered Orders=', filteredOrders);
      updateForm(filteredOrders[0]);
      setCurrentIndex(0);
      return;
    }

    // Otherwise this is a background refresh (e.g. cached orders replaced by the live fetch).
    // Don't jump the user away from whatever order they're currently working on, but if they
    // haven't started editing yet, quietly sync the displayed order with the fresh data so
    // stale cached values don't get saved back over newer DB changes.
    if (!changed && formData.id != null) {
      const freshIndex = filteredOrders.findIndex((o) => o.id === formData.id);
      if (freshIndex !== -1) {
        updateForm(filteredOrders[freshIndex]);
        setCurrentIndex(freshIndex);
      }
    }
  }, [filteredOrders, search]);

  const retrieveItems = (order) => {
    if (order.items.length === 0) {
      setHatId("");
      setGownId("");
      setFormData((prev) => ({
        ...prev,
        gownType: "",
        gownSize: "",
        hatType: "",
        hatSize: undefined,
        hoodName: "",
        qualification: "",
      }));
      console.log("HatId=", hatId);
      console.log("GownId=", gownId);
      return [];
    }

    let gownType = "";
    let gownSize = "";
    let hatType = "";
    let hatSize = undefined;
    let hoodType = "";
    let qualification = "";
    setHatId("");
    setGownId("");

    for (let i of order.items) {
      if (i.itemName?.startsWith("Gown") || i.itemName?.includes('Set')) {
        gownType = i.itemName;
        setGownId(i.itemId);
        console.log("Degree=", i.itemName);
        gownSize = i.sizeName;
        console.log("Size=", i.sizeName);
        setFormData((prev) => ({
          ...prev,
          gownLabel: i.labelsize,
        }));
      }

      if (
        i.itemName?.startsWith("Trencher") ||
        i.itemName?.startsWith("Tudor")
      ) {
        hatType = i.itemName;

        setHatId(i.sizeId);
        // setHatId(3);
        console.log("HatType=", i.sizeId);
        hatSize = i.sizeName;

        setFormData((prev) => ({
          ...prev,
          hatType,
          hatSize,
          hatId: i.sizeId,
          hatLabel: i.labelsize,
        }));
      }

      if (i.itemName?.startsWith("Hood")) {
        hoodType = i.hoodName;
        console.log("Hood short=", i.hoodShort);
        setFormData((prev) => ({
          ...prev,
          hoodLabel: i.hoodShort,
        }));
      }
    }

    setFormData((prev) => ({
      ...prev,
      gownType,
      gownSize,
      hoodType,
    }));
  };

  const updateForm = (order) => {
    setFormData({
      id: order.id,
      lastName: order.lastName,
      firstName: order.firstName,
      orderNumber: order.id,
      orderDate: order.orderDate,
      email: order.email,
      phone: order.phone,
      address: order.address,
      city: order.city,
      country: order.country,
      postcode: order.postcode,
      packNote: order.packNote ?? '',
      studentId: order.studentId,
      ceremonyId: order.ceremonyId,
      ceremony: order.ceremony,
      referenceNo: order.referenceNo,
      note: order.note,
      height: order.height,
      headSize: order.headSize,
      freight: order.freight ?? 0,
      amount: order.amount ?? 0,
      items: order.items,
      orderType: order.orderType,
      changes: order.changes ?? '',
      amountPaid: order.amountPaid ?? 0,
      amountOwing: order.amountOwing ?? 0,
      donation: order.donation ?? 0,
      payBy: order.payBy || null,
      adminCharges: order.adminCharges ?? 0,
      refund: order.refund ?? 0,
      purchaseOrder: order.purchaseOrder,
      paymentMethod: order.paymentMethod,
    });
    retrieveItems(order);
  };

  useEffect(() => {
    axios.get(`${API_URL}/itemsonly`).then((res) => {
      setItems(res.data);
    });
  }, []);

  useEffect(() => {
    axios.get(`${API_URL}/sizesonly`).then((res) => {
      setSizes(res.data);
    });
  }, []);

  useEffect(() => {
    axios.get(`${API_URL}/hoodsonly`).then((res) => {
      setHoods(res.data);
    });
  }, []);

  useEffect(() => {
    axios.get(`${API_URL}/hatsonly`).then((res) => {
      setHats(res.data);
    });
  }, []);

  // Fetch orders on mount
  useEffect(() => {
    const cached = localStorage.getItem("orders");

    if (cached) {
      const orders = JSON.parse(cached);
      setOrders(orders);
    } else {
      setLoading(true);
    }

    axios
      .get(`${API_URL}/orders?numbers=true`)
      .then((res) => {
        setOrders(res.data);
        localStorage.setItem("orders", JSON.stringify(res.data));
        // if (!cached) updateForm(res.data[0]);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setChanged(true);
    setEditingId(formData.id);
  };

  const getSizesForItemName = (itemName) => {
    const selectedItem = items.find((g) => g.name === itemName && (g.category === "Academic Gown" || g.category === "Set"));
    if (!selectedItem) return [];
    const map = new Map();
    sizes
      .filter((g) => g.itemId === selectedItem.id && g.labelsize)
      .forEach((g) => {
        if (!map.has(g.labelsize)) map.set(g.labelsize, g);
      });
    return Array.from(map.values()).sort((a, b) =>
      a.labelsize.localeCompare(b.labelsize, undefined, { numeric: true })
    );
  };

  const getFitsForItemName = (itemName) => {
    const selectedItem = items.find((g) => g.name === itemName);
    if (!selectedItem) return [];
    const map = new Map();
    sizes
      .filter((g) => g.itemId === selectedItem.id && g.fitName)
      .forEach((g) => {
        if (!map.has(g.fitName)) map.set(g.fitName, g);
      });
    return Array.from(map.values());
  };

  const getHatsForItemName = (itemName) => {
    const selectedItem = items.find((g) => (g.name === itemName && (g.category === "Headwear" || g.category === "Set")));
    if (!selectedItem) return [];
    const map = new Map();
    hats
        .filter((g) => g.itemId === selectedItem.id && g.labelsize)
        .forEach((g) => {
          if (!map.has(g.labelsize)) map.set(g.labelsize, g);
        });
    return Array.from(map.values());
  };

  const getHoodsForItemName = (itemName) => {
    const selectedItem = items.find((g) => (g.name === itemName && g.category === "Hood"));
    if (!selectedItem) return [];
    const map = new Map();
    hoods
        .filter((g) => g.itemId === selectedItem.id && g.name)
        .forEach((g) => {
          if (!map.has(g.name)) map.set(g.name, g);
        });
    return Array.from(map.values());
  };

  const handleItemChange = (index, field, value, cost = 0) => {
    console.log(index, field, value);

    const updatedItem = { ...formData.items[index], [field]: value };
    if (field === "itemName") {
      const selectedCatalogItem = items.find((g) => g.name === value);
      updatedItem.itemId = selectedCatalogItem?.id;
      updatedItem.labelsize = undefined;
      updatedItem.fitName = "";
      updatedItem.hatLabel = "";
      updatedItem.hoodName = "";
      updatedItem.cost = cost;
    }

    if (field === "labelsize") {
      const sizeOption = getSizesForItemName(updatedItem.itemName).find((g) => g.labelsize === value);
      updatedItem.sizeId = sizeOption?.id;
    }

    if (field === "fitName") {
      const fitOption = getFitsForItemName(updatedItem.itemName).find((g) => g.fitName === value);
      updatedItem.fitId = fitOption?.fitId;
    }

    if (field === "hoodName") {
      const hoodOption = getHoodsForItemName(updatedItem.itemName).find((g) => g.name === value);
      updatedItem.hoodId = hoodOption?.id;
    }

    if (field === "hatSize") {
      const hatOption = getHatsForItemName(updatedItem.itemName).find((g) => g.labelsize === value);
      updatedItem.hatId = hatOption?.id;

      console.log("hatSize=", hatOption, value);
    }

    setFormData((prev) => {
      const items = [...prev.items];
      items[index] = updatedItem;
      return { ...prev, items };
    });

    if (updatedItem.id) {
      setChangedItems((prev) => [
        ...prev.filter((i) => i.id !== updatedItem.id),
        updatedItem,
      ]);
    }

    setChanged(true);
    setEditingId(formData.id);
  };

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { tempId: crypto.randomUUID(), itemName: "", cost: 0 }],
    }));
    setChanged(true);
    setEditingId(formData.id);
  };

  const handleDeleteItem = (index) => {
    const item = formData.items[index];

    if (item.id) {
      setDeletedItemIds((prev) => [...prev, item.id]);
      setChangedItems((prev) => prev.filter((i) => i.id !== item.id));
    }

    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
    setChanged(true);
    setEditingId(formData.id);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const missingItemName = formData.items.some((item) => !item.itemName);

    if (missingItemName) {
      setError("Please select an item for every row before saving.");
      return;
    }

    const missingSize = formData.items.some(
        (item) => getSizesForItemName(item.itemName).length > 0 && !item.labelsize
    );

    if (missingSize) {
      setError("Please select a size for every item before saving.");
      return;
    }

    const missingHatSize = formData.items.some(
        (item) => getHatsForItemName(item.itemName).length > 0 && !item.hatSize
    );

    if (missingHatSize) {
      setError("Please select a hat size for every item before saving.");
      return;
    }

    const missingHoodName = formData.items.some(
        (item) => getHoodsForItemName(item.itemName).length > 0 && !item.hoodName
    );

    if (missingHoodName) {
      setError("Please select a hood name for every item before saving.");
      return;
    }

    console.log("Order submitted:", formData);
    setChanged(false);
    setOrders((prevOrders) => {
      const updated = prevOrders.map((c) =>
          c.id === editingId ? { ...c, ...formData } : c
      );
      localStorage.setItem("orders", JSON.stringify(updated));
      return updated;
    });

    setEditingId(null);
    setSaved(true);
    setLoading(true);

    const orderUpdate = axios.put(`${API_URL}/orders/${formData.id}`, formData);

    console.log("Changed Items=", changedItems);

    const itemUpdates = changedItems.map((item) =>
        axios.patch(`${API_URL}/orders/${formData.id}/items/${item.id}`, item)
            .then((res) => {
              const newId = res.data?.id;

              console.log("New Item Id=", newId);

              if (newId) {
                setFormData((prev) => ({
                  ...prev,
                  items: prev.items.map((i) =>
                      i.id === item.id ? { ...i, id: newId } : i
                  ),
                }));

                setOrders((prevOrders) => {
                  const updated = prevOrders.map((o) =>
                      o.id === formData.id
                          ? {
                            ...o,
                            items: o.items.map((i) =>
                                i.id === item.id ? { ...i, id: newId } : i
                            ),
                          }
                          : o
                  );
                  localStorage.setItem("orders", JSON.stringify(updated));
                  console.log("Updated=", updated);
                  return updated;
                });
              }
            })
    );

    const itemCreates = formData.items
        .filter((item) => !item.id)
        .map((item) => {
          const { tempId, ...payload } = item;

          return axios.post(`${API_URL}/orders/${formData.id}/items`, payload)
              .then((res) => {
                const newId = res.data?.id;

                console.log("Created Item Id=", newId);

                if (newId) {
                  setFormData((prev) => ({
                    ...prev,
                    items: prev.items.map((i) =>
                        i.tempId && i.tempId === tempId ? { ...i, id: newId } : i
                    ),
                  }));

                  setOrders((prevOrders) => {
                    const updated = prevOrders.map((o) =>
                        o.id === formData.id
                            ? {
                              ...o,
                              items: o.items.map((i) =>
                                  i.tempId && i.tempId === tempId ? { ...i, id: newId } : i
                              ),
                            }
                            : o
                    );
                    localStorage.setItem("orders", JSON.stringify(updated));
                    return updated;
                  });
                }
              });
        });

    const itemDeletes = deletedItemIds.map((id) =>
        axios.delete(`${API_URL}/orders/${formData.id}/items/${id}`)
    );

    setChangedItems([]);
    setDeletedItemIds([]);

    Promise.all([orderUpdate, ...itemUpdates, ...itemCreates, ...itemDeletes])
        .catch((err) => {
          setError(err.message);
        })
        .finally(() =>
          setLoading(false)
        );
  };

  const goPrev = () => {
    setCurrentIndex((prev) => {
      const newIndex = Math.max(prev - 1, 0);
      updateForm(filteredOrders[newIndex]);
      setChanged(false);
      return newIndex;
    });
  };

  const goNext = () => {
    setCurrentIndex((prev) => {
      const newIndex = Math.min(prev + 1, filteredOrders.length - 1);
      updateForm(filteredOrders[newIndex]);
      setChanged(false);
      console.log('Filtered order: ', filteredOrders[newIndex]);
      return newIndex;
    });
  };

  const handlePrintBuy = () => {
    setShowBuyPrint(false);
    setTimeout(() => setShowBuyPrint(true), 0);
  };

  const handlePrintCasualHire = () => {
    setShowCasualHirePrint(false);
    setTimeout(() => setShowCasualHirePrint(true), 0);
  }

  const handlePrintAddress = () => {
    setShowPrintIndAddressLabels(false);
    setTimeout(() => setShowPrintIndAddressLabels(true), 0);
  }

  const handlePrintReceipt = () => {
    setShowReceiptPrint(false);
    setTimeout(() => setShowReceiptPrint(true), 0);
  }

  if (items.length === 0 || sizes.length === 0 || hoods.length === 0)
    return <FullscreenSpinner />;
  // if (loading) return <FullscreenSpinner />;

  return (
    <>
      <Dialog open={!!error} onOpenChange={(open) => !open && setError(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Error</DialogTitle>
          </DialogHeader>
          <p>{error}</p>
        </DialogContent>
      </Dialog>
      <AdminNavbar />
      <div className="max-w-6xl mx-auto pt-24 shadow-lg">
        <Input
            className="w-60 mb-6"
            type="text"
            placeholder="Search for..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />

        <Card className="bg-green-50 pt-4">
          <CardContent>
            <form
              onSubmit={handleSubmit}
            >
              <div className="w-full text-center pb-2 font-bold text-3xl inline-block px-3 py-1
                text-white bg-green-700 border border-gray-300 rounded-md shadow-sm mb-3">
                {formData.ceremony ?? '\u00A0'}
              </div>
              <div className="grid grid-cols-4 md:grid-cols-4 gap-2 w-275 text-xs">
              <div>
                <Label htmlFor="surname">Surname</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="firstName">Forename</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="orderNumber">Order Number</Label>
                <Input
                  id="orderNumber"
                  name="orderNumber"
                  value={formData.referenceNo}
                  onChange={handleChange}
                  readOnly
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={(e) => e.target.reportValidity()}
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-36"
                />
              </div>

              <div>
                <Label htmlFor="clientId">Client Id</Label>
                <Input
                  id="studentId"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  required
                  className="w-36"
                />
              </div>

              <div className="row-start-2 row-span-3 col-4">
                <Label htmlFor="packNote">Pack Note</Label>
                <Textarea
                    className="mt-1"
                    id="packNote"
                    name="packNote"
                    value={formData.packNote}
                    onChange={handleChange}
                />
              </div>

              <div className="row-start-3">
                <Label htmlFor="height">Height</Label>
                <Input
                  className="w-24"
                  id="height"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                />
              </div>

              <div className="row-start-3">
                <Label htmlFor="headSize">Head Size</Label>
                <Input
                  className="w-24"
                  id="headSize"
                  name="headSize"
                  value={formData.headSize}
                  onChange={handleChange}
                />
              </div>

              {/*<hr className="col-span-full border-t border-gray-300 my-4" />*/}

              <div className="row-start-4">
                <Label htmlFor="orderType">Order Type</Label>
                <Select
                  // id="orderType"
                  // name="orderType"
                  value={formData.orderType}
                  onValueChange={(value) => {
                      setFormData(prev => ({
                        ...prev,
                        orderType: value
                      }));
                      setEditingId(formData.id);
                      setChanged(true);
                    }
                  }
                >

                  <SelectTrigger className="!bg-white">
                    <SelectValue placeholder="Select order type" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem key="1" value="1">Hire</SelectItem>
                    <SelectItem key="2" value="2">Sale</SelectItem>
                    <SelectItem key="3" value="3">Casual Hire</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="row-start-4">
                <Label htmlFor="note">Note</Label>
                <Input
                  id="note"
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                />
              </div>

              <div className="row-start-4">
                <Label htmlFor="changes">Changes</Label>
                <Input
                  id="changes"
                  name="changes"
                  value={formData.changes}
                  onChange={handleChange}
                />
              </div>

              <div className="row-start-5">
                <Label htmlFor="amountPaid">Amount Paid</Label>
                <Input
                  id="amountPaid"
                  name="amountPaid"
                  type="number"
                  value={formData.amountPaid}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="row-start-5">
                <Label htmlFor="amountOwing">Amount Owing</Label>
                <Input
                  id="amountOwing"
                  name="amountOwing"
                  value={formData.amountOwing}
                  onChange={handleChange}
                />
              </div>

              <div className="row-start-5">
                <Label htmlFor="donation">Donation</Label>
                <Input
                  id="donation"
                  name="donation"
                  value={formData.donation}
                  onChange={handleChange}
                />
              </div>

              <div className="row-start-5">
                <Label htmlFor="freight">Freight</Label>
                <Input
                  id="freight"
                  name="freight"
                  value={formData.freight}
                  onChange={handleChange}
                />
              </div>

              <div className="row-start-6">
                <Label htmlFor="payBy">Pay By</Label>
                <Input
                    type="date"
                    id="payBy"
                    name="payBy"
                    value={formData.payBy ?? ''}
                    onChange={handleChange}
                />
              </div>

              <div className="row-start-6">
                <Label htmlFor="adminCharges">Admin Charges</Label>
                <Input
                  id="adminCharges"
                  name="adminCharges"
                  value={formData.adminCharges}
                  onChange={handleChange}
                />
              </div>

              <div className="row-start-6">
                <Label htmlFor="purchaseOrder">Purchase Order #</Label>
                <Input
                  id="purchaseOrder"
                  name="purchaseOrder"
                  value={formData.purchaseOrder}
                  onChange={handleChange}
                />
              </div>

              <div className="row-start-6">
                <Label htmlFor="refund">Refund</Label>
                <Input
                    id="refund"
                    name="refund"
                    value={formData.refund}
                    onChange={handleChange}
                />
              </div>

              <div className="col-span-4 gap-4 grid grid-cols-[300px_100px_100px_320px_60px_60px_40px]">
                <Label htmlFor="itemName" className="text-base underline">Item Name:</Label>
                <Label htmlFor="itemName" className="text-base underline">Item Size:</Label>
                <Label htmlFor="itemName" className="text-base underline">Hat Size:</Label>
                <Label htmlFor="itemName" className="text-base underline">Hood Name:</Label>
                <Label htmlFor="itemName" className="text-base underline">Cost:</Label>
                <Label htmlFor="itemName" className="text-base underline">Hire:</Label>
                <span />
              </div>

              <div className="col-span-4 gap-2">

                {formData.items.map((item, index) =>
                  <div key={item.id ?? item.tempId ?? index} className="grid grid-cols-[300px_100px_100px_320px_60px_60px_40px] gap-4 mb-1 items-center">
                    <Select
                      value={item.itemName ?? ""}
                      onValueChange={(value) => {
                        const selectedCatalogItem = items.find((g) => g.name === value);
                        handleItemChange(index, "itemName", value, selectedCatalogItem?.hirePrice);
                      }}
                    >
                      <SelectTrigger className="!bg-white text-blue-800 text-base h-8">
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[40vh] overflow-y-auto">
                        {items.map((g) => (
                          <SelectItem key={g.id} value={g.name}>
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="relative">
                      <Select
                        value={item.labelsize || undefined}
                        onValueChange={(value) => handleItemChange(index, "labelsize", value)}
                      >
                        <SelectTrigger
                          className={`!bg-white text-blue-800 text-base h-8 ${
                            getSizesForItemName(item.itemName).length > 0 ? "" : "invisible"
                          }`}
                        >
                          <SelectValue placeholder="Size" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[40vh] overflow-y-auto">
                          {getSizesForItemName(item.itemName).map((g) => (
                            <SelectItem key={g.id} value={g.labelsize}>
                              {g.labelsize}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/*Hat Size for Trenchers and Tudor Bonnets*/}
                    <Select
                      value={item.hatLabel ?? ""}
                      onValueChange={(value) => handleItemChange(index, "hatLabel", value)}
                    >
                      <SelectTrigger
                        className={`!bg-white text-blue-800 text-base h-8 ${
                          getHatsForItemName(item.itemName).length > 0 ? "" : "invisible"
                        }`}
                      >
                        <SelectValue placeholder="Size" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[40vh] overflow-y-auto">
                        {getHatsForItemName(item.itemName).map((g) => (
                            <SelectItem key={g.id} value={g.labelsize}>
                              {g.labelsize}
                            </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={item.hoodName ?? ""}
                      onValueChange={(value) => handleItemChange(index, "hoodName", value)}
                    >
                      <SelectTrigger
                          className={`!bg-white text-blue-800 text-base h-8 ${
                        getHoodsForItemName(item.itemName).length > 0 ? "" : "invisible"
                      }`} >
                        <SelectValue placeholder="Select hood" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[40vh] overflow-y-auto">
                        {getHoodsForItemName(item.itemName).map((g) => (
                            <SelectItem key={g.id} value={g.name}>
                              {g.name}
                            </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Label className="text-blue-800 text-base">${item.cost ?? ""} </Label>
                    <CheckSquare className={`text-blue-800 ${item.hire ? "" : "invisible"}`}/>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                      onClick={() => handleDeleteItem(index)}
                      aria-label="Delete item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  className="mt-2"
                  onClick={handleAddItem}
                >
                  <PlusCircle className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>

              <div className="row-start-11 col-start-1 flex justify-around gap-0 mt-4" aria-label="Paper size choice">
                <div className="paper-choice flex gap-3 mt-0 items-center w-36">
                  <label className={`flex ${paper === "A4" ? "active" : ""}`}>
                    <input
                        type="radio"
                        name="paper"
                        value="A4"
                        checked={paper === "A4"}
                        onChange={() => setPaper("A4")}
                    />
                    A4
                  </label>

                  <label className={`flex ${paper === "A5" ? "active" : ""}`}>
                    <input
                        type="radio"
                        name="paper"
                        value="A5"
                        checked={paper === "A5"}
                        onChange={() => setPaper("A5")}
                    />
                    A5
                  </label>

                  <label className={`flex ${paper === "120x90" ? "active" : ""}`}>
                    <input
                        type="radio"
                        name="paper"
                        value="120x90"
                        checked={paper === "120x90"}
                        onChange={() => setPaper("120x90")}
                    />
                    Small
                  </label>
                </div>

                <Button
                    className="bg-green-700 hover:bg-green-800"
                    onClick={handlePrintAddress}
                    type="button"
                    disabled={false}
                >
                  <Printer /> Address
                </Button>
               </div>

              <Button
                  className="mt-4 bg-green-700 hover:bg-green-800 row-start-11 col-start-2"
                  onClick={handlePrintBuy}
              >
                <Printer /> Buy
              </Button>

                <Button
                    className="mt-4 bg-green-700 hover:bg-green-800 row-start-11 col-start-3"
                    onClick={handlePrintCasualHire}
                >
                  <Printer /> Casual Hire
                </Button>

                <Button
                    className="mt-4 row-start-11 col-start-4 bg-green-700 hover:bg-green-800"
                    onClick={handlePrintReceipt}
                    type="button"
                    disabled={false}
                >
                  <Printer /> Receipt
                </Button>

                <Button
                    className="mt-4 row-start-11 col-start-4 bg-green-700 hover:bg-green-800"
                    onClick={goPrev}
                    type="button"
                    disabled="true"
                    hidden={true}
                >
                  <Printer /> Xero invoice
                </Button>

                <Button
                className="mt-4 row-start-12 col-start-1 bg-green-700 hover:bg-green-800"
                onClick={goPrev}
                type="button"
                disabled={currentIndex === 0}
              >
                <ChevronsLeft />
              </Button>

              <Button
                className="mt-4 row-start-12 col-start-2 bg-green-700 hover:bg-green-800"
                onClick={goNext}
                type="button"
                disabled={currentIndex === filteredOrders.length - 1}
              >
                <ChevronsRight />
              </Button>

              <Button
                type="submit"
                className="mt-4 row-start-12 col-start-3 bg-green-700 hover:bg-green-800"
                hidden={!changed}
              >
                Save
              </Button>

              <Button className="mt-4 row-start-12 col-start-4 bg-green-700 hover:bg-green-800">
                New
              </Button>

              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      {loading && <FullscreenSpinner/>}
      {showBuyPrint && <PrintIndBuyWorksheet order={formData} onDone={() => setShowBuyPrint(false)} />}
      {showCasualHirePrint && <PrintIndCasualWorksheet order={formData} onDone={() => setShowCasualHirePrint(true)} />}
      {showPrintIndAddressLabels && <PrintIndAddressLabels order={formData} paper={paper}
                                                             onDone={() => setShowPrintIndAddressLabels(false)}/>}
      {showReceiptPrint && <PrintIndReceipt order={formData} paper={paper}
                                                             onDone={() => setShowReceiptPrint(false)}/>}
    </>
  );
}
