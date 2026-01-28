import React, { useEffect, useState } from "react";
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
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import AdminNavbar from "./AdminNavbar.jsx";
import axios from "axios";
import FullscreenSpinner from "@/components/FullscreenSpinner.jsx";
import "./AdminIndOrder.css";
import { SelectViewport } from "@radix-ui/react-select";

<<<<<<< HEAD
const API_URL = import.meta.env.VITE_GOWN_API_BASE; // or hardcode "http://localhost:5144"
// const API_URL =  "http://localhost:5144"
=======
// const API_URL = import.meta.env.VITE_GOWN_API_BASE; // or hardcode "http://localhost:5144"
const API_URL = "http://localhost:5144"
>>>>>>> 1d2b522105d7cc0c790a62197bdeecba4128cb46

export default function AdminIndOrder() {
  const [formData, setFormData] = useState({
    surname: "",
    foreName: "",
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
  });
  const [orders, setOrders] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState();
  const [error, setError] = useState(null);
  const [changed, setChanged] = useState(false);
  const [items, setItems] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [hoods, setHoods] = useState([]);
  const [gownId, setGownId] = useState("");
  const [hatId, setHatId] = useState("");

  const getLabel = (name) => name.split("-")[1]?.trim() || name;

  const retrieveItems = (order) => {
    if (order.items.length === 0) {
      setHatId("");
      setGownId("");
      setFormData((prev) => ({
        ...prev,
        gownType: "",
        gownSize: "",
        hatType: "",
        hatSize: "",
        hoodType: "",
      }));
      console.log("HatId=", hatId);
      console.log("GownId=", gownId);
      return [];
    }

    let gownType = "";
    let gownSize = "";
    let hatType = "";
    let hatSize = "";
    let hoodType = "";
    setHatId("");
    setGownId("");

    for (let i of order.items) {
      if (i.itemName?.startsWith("Gown")) {
        gownType = i.itemName;
        setGownId(i.itemId);
        console.log("Degree=", i.itemName);
        gownSize = i.sizeName;
        console.log("Size=", i.sizeName);
      }

      if (
        i.itemName?.startsWith("Trencher") ||
        i.itemName?.startsWith("Tudor")
      ) {
        hatType = i.itemName;

        setHatId(i.itemId);
        // setHatId(3);
        console.log("HatType=", i.itemId);
        hatSize = i.sizeName;
      }

      if (i.itemName?.startsWith("Hood")) {
        hoodType = i.hoodName;
      }
    }

    setFormData((prev) => ({
      ...prev,
      gownType,
      gownSize,
      hatType,
      hatSize,
      hoodType,
    }));
  };

  const updateForm = (order) => {
    setFormData({
      surname: order.lastName,
      foreName: order.firstName,
      orderNumber: order.id,
      email: order.email,
      phone: order.phone,
      address: order.address,
      packNote: order.message,
      clientId: order.studentId,
      ceremonyId: order.ceremonyId,
      ceremony: order.ceremony,
      referenceNo: order.referenceNo,
      // gownType: order.items?.[0]?.itemName ?? ""
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

  // Fetch orders on mount
  useEffect(() => {
    const cached = localStorage.getItem("orders");

    if (cached) {
      const orders = JSON.parse(cached);
      setOrders(orders);
      updateForm(orders[0]);
    } else {
      setLoading(true);
    }

    axios
      .get(`${API_URL}/orders?numbers=true`)
      .then((res) => {
        setOrders(res.data);
        localStorage.setItem("orders", JSON.stringify(res.data));
        if (!cached) updateForm(res.data[0]);
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
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Order submitted:", formData);
    // Replace with API call
  };

  const goPrev = () => {
    setCurrentIndex((prev) => {
      const newIndex = Math.max(prev - 1, 0);
      updateForm(orders[newIndex]);
      setChanged(false);
      return newIndex;
    });
  };

  const goNext = () => {
    setCurrentIndex((prev) => {
      const newIndex = Math.min(prev + 1, orders.length - 1);
      updateForm(orders[newIndex]);
      setChanged(false);
      return newIndex;
    });
  };

  if (items.length === 0 || sizes.length === 0 || hoods.length === 0)
    return <FullscreenSpinner />;
  if (loading) return <FullscreenSpinner />;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <>
      <AdminNavbar />
      <div className="max-w-6xl mx-auto pt-24 shadow-lg">
        <Card className="bg-green-50 pt-4">
          <CardContent>
            <form
              onSubmit={handleSubmit}

            >
              <div className="pb-2 font-bold text-3xl inline-block px-3 py-1
                text-white bg-green-700 border border-gray-300 rounded-md shadow-sm mb-3">
                {formData.ceremony}
              </div>
              <div className="grid grid-cols-4 md:grid-cols-4 gap-2 w-275 text-xs">
              <div>
                <Label htmlFor="surname">Surname</Label>
                <Input
                  id="surname"
                  name="surname"
                  value={formData.surname}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="firstName">Forename</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.foreName}
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
                />
              </div>

              <div>
                <Label htmlFor="clientId">Client Id</Label>
                <Input
                  id="clientId"
                  name="clientId"
                  value={formData.clientId}
                  onChange={handleChange}
                  required
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

              <hr className="col-span-full border-t border-gray-300 my-4" />

              <div className="row-start-4">
                <Label htmlFor="gowntype">Gown Type</Label>
                <Select
                  value={String(gownId)}
                  onValueChange={(id) => {
                    const gown = items.find((g) => g.id === Number(id));
                    console.log("GownId ext=", gownId);
                    console.log("GownId=", typeof id);
                    console.log("Gown=", gown);
                    console.log("Items=", items);
                    if (gown) {
                      console.log("GownId Inside=", gown.id);
                      setGownId(Number(gown.id));
                      setFormData((prev) => ({
                        ...prev,
                        gownType: getLabel(gown.name),
                        gownSize: "",
                      }));
                    }
                  }}
                >
                  <SelectTrigger className="!bg-white">
                    <SelectValue placeholder="Select a gown type" />
                  </SelectTrigger>

                  <SelectContent>
                    {items
                      .filter((g) => g.category === "Academic Gown")
                      .map((g) => (
                        <SelectItem key={g.id} value={String(g.id)}>
                          {getLabel(g.name)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="row-start-4">
                <Label htmlFor="gownsize">Gown Size</Label>
                <Select
                  value={formData.gownSize}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, gownSize: value }))
                  }
                >
                  <SelectTrigger className="!bg-white">
                    <SelectValue placeholder="Select a gown size" />
                  </SelectTrigger>

                  <SelectContent>
                    {sizes
                      .filter((g) => g.itemId === gownId && g.fitId === 1)
                      .map((g) => (
                        <SelectItem key={g.id} value={g.size}>
                          {g.size}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="row-start-4">
                <Label htmlFor="hattype">Hat Type</Label>
                <Select
                  // value={formData.hatType}
                  value={String(hatId)}
                  onValueChange={(id) => {
                    const hat = items.find((g) => g.id === Number(id));
                    console.log("Hat=", hat);
                    console.log("Id=", id);
                    if (hat) {
                      setHatId(hat.id);
                      setFormData((prev) => ({
                        ...prev,
                        hatType: hat.name,
                        hatSize: "",
                      }));
                    }
                  }}
                >
                  <SelectTrigger className="!bg-white">
                    <SelectValue placeholder="Select a hat type" />
                  </SelectTrigger>

                  <SelectContent>
                    {items
                      .filter((g) => g.category === "Headwear")
                      .map((g) => (
                        <SelectItem key={g.id} value={String(g.id)}>
                          {g.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="row-start-4">
                <Label htmlFor="hatsize">Hat Size</Label>
                <Select
                  value={formData.hatSize}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, hatSize: value }))
                  }
                >
                  <SelectTrigger className="!bg-white">
                    <SelectValue placeholder="Select a hat size" />
                  </SelectTrigger>

                  <SelectContent>
                    {sizes
                      .filter((g) => g.itemId === hatId)
                      .map((g) => (
                        <SelectItem key={g.id} value={g.size}>
                          {g.size}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="row-start-5">
                <Label htmlFor="hoodtype">Hood Type</Label>
                <Select
                  value={formData.hoodType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, hoodType: value }))
                  }
                >
                  <SelectTrigger className="!bg-white">
                    <SelectValue placeholder="Select a hood type" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectViewport className="max-h-64">
                      {hoods
                        .filter((g) => g.itemId === Number(4))
                        .map((g) => (
                          <SelectItem key={g.id} value={g.name}>
                            {g.name}
                          </SelectItem>
                        ))}
                    </SelectViewport>
                  </SelectContent>
                </Select>
              </div>

              <div className="row-start-5">
                <Label htmlFor="height">Height</Label>
                <Input
                  id="height"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                />
              </div>

              <div className="row-start-5">
                <Label htmlFor="headSize">Head Size</Label>
                <Input
                  id="headSize"
                  name="headSize"
                  value={formData.headSize}
                  onChange={handleChange}
                />
              </div>

              <hr className="col-span-full border-t border-gray-300 my-4" />

              <div className="row-start-7">
                <Label htmlFor="orderType">Order Type</Label>
                <Input
                  id="orderType"
                  name="orderType"
                  value={formData.orderType}
                  onChange={handleChange}
                />
              </div>

              <div className="row-start-7">
                <Label htmlFor="note">Note</Label>
                <Input
                  id="note"
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                />
              </div>

              <div className="row-start-7">
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

              <div className="row-start-8">
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

              <div className="row-start-8">
                <Label htmlFor="amountOwing">Amount Owing</Label>
                <Input
                  id="amountOwing"
                  name="amountOwing"
                  value={formData.amountOwing}
                  onChange={handleChange}
                />
              </div>

              <div className="row-start-8">
                <Label htmlFor="donation">Donation</Label>
                <Input
                  id="donation"
                  name="donation"
                  value={formData.donation}
                  onChange={handleChange}
                />
              </div>

              <div className="row-start-8">
                <Label htmlFor="freight">Freight</Label>
                <Input
                  id="freight"
                  name="freight"
                  value={formData.freight}
                  onChange={handleChange}
                />
              </div>

              <div className="row-start-9">
                <Label htmlFor="refund">Refund</Label>
                <Input
                  id="refund"
                  name="refund"
                  value={formData.refund}
                  onChange={handleChange}
                />
              </div>

              <div className="row-start-9">
                <Label htmlFor="adminChgs">Admin Charges</Label>
                <Input
                  id="adminChgs"
                  name="adminChgs"
                  value={formData.adminChgs}
                  onChange={handleChange}
                />
              </div>

              <div className="row-start-9">
                <Label htmlFor="pOrder">Purchase Order #</Label>
                <Input
                  id="pOrder"
                  name="pOrder"
                  value={formData.pOrder}
                  onChange={handleChange}
                />
              </div>

              <div className="row-start-9">
                <Label htmlFor="payBy">Pay By</Label>
                <Input
                  id="payBy"
                  name="payBy"
                  value={formData.payBy}
                  onChange={handleChange}
                />
              </div>
              <Button
                className="mt-4 row-start-11 col-start-1 bg-green-700 hover:bg-green-800"
                onClick={goPrev}
                disabled={currentIndex === 0}
              >
                <ChevronsLeft />
              </Button>

              <Button
                className="mt-4 row-start-11 col-start-2 bg-green-700 hover:bg-green-800"
                onClick={goNext}
                disabled={currentIndex === orders.length - 1}
              >
                <ChevronsRight />
              </Button>

              <Button
                type="submit"
                className="mt-4 row-start-11 col-start-3 bg-green-700 hover:bg-green-800"
                hidden={!changed}
              >
                Save
              </Button>

              <Button className="mt-4 row-start-11 col-start-4 bg-green-700 hover:bg-green-800">
                New
              </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
