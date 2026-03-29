import React, { useEffect, useState, useMemo } from "react";
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
import {CheckIcon, CheckSquare, ChevronsLeft, ChevronsRight, Printer} from "lucide-react";
import AdminNavbar from "./AdminNavbar.jsx";
import axios from "axios";
import FullscreenSpinner from "@/components/FullscreenSpinner.jsx";
import "./AdminIndOrder.css";
import { SelectViewport } from "@radix-ui/react-select";
import PrintIndBuyWorksheet from "@/components/ReportPrint/PrintIndBuyWorksheet.jsx";
import PrintIndCasualWorksheet from "@/components/ReportPrint/PrintIndCasualWorksheet.jsx";
import PrintIndAddressLabels from "@/components/ReportPrint/PrintIndAddressLabels.jsx";
import PrintIndReceipt from "@/components/ReportPrint/PrintIndReceipt.jsx";

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
    gownType: "",
    hatType: "",
    height: "",
    headSize: "",
    items: [],
    orderType: "",
    hoodType: "",
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
  const [items, setItems] = useState([]);
  const [sizes, setSizes] = useState([]);
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

  useEffect(() => {
    if (filteredOrders.length > 0) {
      if (!saved) {
        console.log('Filtered Orders=', filteredOrders);
        updateForm(filteredOrders[0]);
        setCurrentIndex(0);
      } else {
        setSaved(false);
      }
    }
  }, [filteredOrders]);

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
        hoodType: "",
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
    console.log('Order=', order);

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

      // gownType: order.items?.[0]?.itemName ?? ""
    });
    console.log("Freight=", order.freight);
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

  // Fetch orders on mount
  useEffect(() => {
    const cached = localStorage.getItem("orders");

    if (cached) {
      const orders = JSON.parse(cached);
      setOrders(orders);
      // updateForm(orders[0]);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Order submitted:", formData);
    setChanged(false);
    setOrders((prevOrders) =>
        prevOrders.map((c) =>
            c.id === editingId ? { ...c, ...formData } : c
        ));

    setEditingId(null);
    setSaved(true);
    // TODO
    setLoading(true);
    axios
        .put(`${API_URL}/orders/${formData.id}`, formData)
        .then((res) => {})
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
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <>
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

              {/*<div>*/}
              {/*  <Label htmlFor="ceremonyId">Ceremony Id</Label>*/}
              {/*  <Input*/}
              {/*    id="ceremonyId"*/}
              {/*    name="ceremonyId"*/}
              {/*    value={formData.ceremonyId}*/}
              {/*    onChange={handleChange}*/}
              {/*    required*/}
              {/*  />*/}
              {/*</div>*/}

              {/*<hr className="col-span-full border-t border-gray-300 my-4" />*/}

              {/*<div className="row-start-4">*/}
              {/*  <Label htmlFor="gowntype">Gown Type</Label>*/}
              {/*  <Select*/}
              {/*    value={String(gownId)}*/}
              {/*    onValueChange={(id) => {*/}
              {/*      const gown = items.find((g) => g.id === Number(id));*/}
              {/*      console.log("GownId ext=", gownId);*/}
              {/*      console.log("GownId=", typeof id);*/}
              {/*      console.log("Gown=", gown);*/}
              {/*      console.log("Items=", items);*/}
              {/*      if (gown) {*/}
              {/*        console.log("GownId Inside=", gown.id);*/}
              {/*        setGownId(Number(gown.id));*/}
              {/*        setFormData((prev) => ({*/}
              {/*          ...prev,*/}
              {/*          gownType: getLabel(gown.name),*/}
              {/*          gownSize: "",*/}
              {/*        }));*/}
              {/*      }*/}
              {/*    }}*/}
              {/*  >*/}
              {/*    <SelectTrigger className="!bg-white w-36">*/}
              {/*      <SelectValue placeholder="Select a gown type" />*/}
              {/*    </SelectTrigger>*/}

              {/*    <SelectContent>*/}
              {/*      {items*/}
              {/*        .filter((g) => g.category === "Academic Gown" || g.category === "Set")*/}
              {/*        .map((g) => (*/}
              {/*          <SelectItem key={g.id} value={String(g.id)}>*/}
              {/*            {getLabel(g.name)}*/}
              {/*          </SelectItem>*/}
              {/*        ))}*/}
              {/*    </SelectContent>*/}
              {/*  </Select>*/}
              {/*</div>*/}

              {/*<div className="row-start-4">*/}
              {/*  <Label htmlFor="gownsize">Gown</Label>*/}
              {/*  <Select*/}
              {/*    defaultValue={formData.gownSize}*/}
              {/*    onValueChange={(value) => {*/}
              {/*      updateItem(formData.id, gownId, value);*/}
              {/*      // setFormData((prev) => ({...prev, gownSize: value}))*/}
              {/*      setChanged(true);*/}
              {/*      console.log('Gown Size=', value);*/}
              {/*    }*/}
              {/*    }*/}
              {/*  >*/}
              {/*    <SelectTrigger className="!bg-white w-36">*/}
              {/*      <SelectValue placeholder="Select a gown size" />*/}
              {/*    </SelectTrigger>*/}

              {/*    <SelectContent>*/}
              {/*      {sizes*/}
              {/*        .filter((g) => g.itemId === gownId && g.fitId === 1)*/}
              {/*        .map((g) => (*/}
              {/*          <SelectItem key={g.id} value={String(g.id)}>*/}
              {/*            {g.labelsize}*/}
              {/*          </SelectItem>*/}
              {/*        ))}*/}
              {/*    </SelectContent>*/}
              {/*  </Select>*/}
              {/*</div>*/}

              {/*<div className="row-start-4">*/}
              {/*  <Label htmlFor="hattype">Hat</Label>*/}
              {/*  <Select*/}
              {/*      value={formData.hatId}*/}
              {/*      onValueChange={(value) => {*/}
              {/*          setFormData((prev) => ({...prev, hatId: value}))*/}
              {/*          console.log("Selected hatSize:", value, typeof value);*/}
              {/*        }*/}
              {/*      }*/}
              {/*  >*/}
              {/*    <SelectTrigger className="!bg-white w-36">*/}
              {/*      <SelectValue placeholder="Select a hat size" />*/}
              {/*    </SelectTrigger>*/}

              {/*    <SelectContent className="max-h-[40vh] overflow-y-auto">*/}
              {/*      {sizes*/}
              {/*          .filter((g) => g.itemId === 3 || g.itemId === 8)*/}
              {/*          .map((g) => (*/}
              {/*              <SelectItem key={g.id} value={String(g.id)}>*/}
              {/*                {g.labelsize}*/}
              {/*              </SelectItem>*/}
              {/*          ))}*/}
              {/*    </SelectContent>*/}
              {/*  </Select>*/}
              {/*</div>*/}

              {/*<div className="row-start-4">*/}
              {/*  <Label htmlFor="hoodType">Hood</Label>*/}
              {/*  <Select*/}
              {/*    value={formData.hoodType}*/}
              {/*    onValueChange={(value) =>*/}
              {/*      setFormData((prev) => ({ ...prev, hoodType: value }))*/}
              {/*    }*/}
              {/*  >*/}
              {/*    <SelectTrigger className="!bg-white w-36">*/}
              {/*      <SelectValue placeholder="Select a hood type" />*/}
              {/*    </SelectTrigger>*/}

              {/*    <SelectContent className="max-h-[40vh] overflow-y-auto">*/}
              {/*      {hoods*/}
              {/*        .map((g) =>*/}
              {/*            (*/}
              {/*          <SelectItem key={g.id} value={String(g.id)}>*/}
              {/*            {g.shortName}*/}
              {/*          </SelectItem>*/}
              {/*        ))}*/}
              {/*    </SelectContent>*/}
              {/*  </Select>*/}
              {/*</div>*/}

              {/*<div className="row-start-5">*/}
              {/*  <Label htmlFor="qualification">Qualification</Label>*/}
              {/*  <Select*/}
              {/*    value={formData.qualification}*/}
              {/*    onValueChange={(value) =>*/}
              {/*      setFormData((prev) => ({ ...prev, qualification: value }))*/}
              {/*    }*/}
              {/*  >*/}
              {/*    <SelectTrigger className="!bg-white">*/}
              {/*      <SelectValue placeholder="Select a qualification" />*/}
              {/*    </SelectTrigger>*/}

              {/*    <SelectContent>*/}
              {/*      <SelectViewport className="max-h-64">*/}
              {/*        {hoods*/}
              {/*          .filter((g) => g.itemId === Number(4))*/}
              {/*          .map((g) => (*/}
              {/*            <SelectItem key={g.id} value={g.name}>*/}
              {/*              {g.name}*/}
              {/*            </SelectItem>*/}
              {/*          ))}*/}
              {/*      </SelectViewport>*/}
              {/*    </SelectContent>*/}
              {/*  </Select>*/}
              {/*</div>*/}

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
                    {/*<SelectItem value="refund">Refund</SelectItem>*/}
                    {/*<SelectItem value="hire">Hire</SelectItem>*/}
                    {/*<SelectItem value="sale">Sale</SelectItem>*/}
                    {/*<SelectItem value="sundry">Sundry</SelectItem>*/}
                    {/*<SelectItem value="sundry_costs">Sundry Costs</SelectItem>*/}
                    {/*<SelectItem value="cancel">Cancel</SelectItem>*/}
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

              <div>
                <Label htmlFor="packNote">Pack Note</Label>
                <Input
                  id="packNote"
                  name="packNote"
                  value={formData.packNote}
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

              <div className="col-span-4 gap-4 grid grid-cols-[300px_80px_120px_80px_240px_60px_60px]">
                <Label htmlFor="itemName" className="text-base underline">Item Name:</Label>
                <Label htmlFor="itemName" className="text-base underline">Item Size:</Label>
                <Label htmlFor="itemName" className="text-base underline">Item Fit:</Label>
                <Label htmlFor="itemName" className="text-base underline">Hat Size:</Label>
                <Label htmlFor="itemName" className="text-base underline">Hood Name:</Label>
                <Label htmlFor="itemName" className="text-base underline">Cost:</Label>
                <Label htmlFor="itemName" className="text-base underline">Hire:</Label>
              </div>

              <div className="col-span-4 gap-2">

                {formData.items.map((item) =>
                  <div className="grid grid-cols-[300px_80px_120px_80px_240px_60px_60px] gap-4">
                    <Label className="text-blue-800 text-base">{item.itemName} </Label>
                    <Label className="text-blue-800 text-base">{item.labelsize ?? ""} </Label>
                    <Label className="text-blue-800 text-base">{item.fitName ?? ""} </Label>
                    <Label className="text-blue-800 text-base">{item.hatSize ?? ""} </Label>
                    <Label className="text-blue-800 text-base">{item.hoodName ?? ""} </Label>
                    <Label className="text-blue-800 text-base">${item.cost ?? ""} </Label>
                    {item.hire && <CheckSquare className="text-blue-800"/>}
                  </div>
                )}
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
                onClick={handleSubmit}
                hidden={!changed}
              >
                Save
              </Button>

              {/*<Button className="mt-4 row-start-12 col-start-4 bg-green-700 hover:bg-green-800">*/}
              {/*  New*/}
              {/*</Button>*/}
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
