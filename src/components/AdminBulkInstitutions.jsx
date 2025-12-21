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

const API_URL = import.meta.env.VITE_GOWN_API_BASE; // or hardcode "http://localhost:5144"
// const API_URL = "http://localhost:5144"

export default function AdminBulkOrder() {
  const [formData, setFormData] = useState({
    id: undefined,
    name: "",
    idCode: "",
    orderNumber: "",
    institutionName: "",
    courierAddress: "",
    postalAddress: "",
    city: "",
    ceremonyDate: "",
    dueDate: "",
    despatchDate: "",
    dateSent: "",
    returnDate: "",
    dateReturned: "",
    organiser: "",
    phone: "",
    email: "",
    invoiceEmail: "",
    priceCode: "",
    freight: "",
  });
  const [ceremonies, setCeremonies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState();
  const [error, setError] = useState(null);
  const [changed, setChanged] = useState(false);

  const updateForm = (ceremony) => {
    console.log("Updating form");
    setFormData({
      id: ceremony.id,
      visible: ceremony.visible,
      name: ceremony.name,
      idCode: ceremony.idCode,
      orderNumber: ceremony.orderNumber || "",
      institutionName: ceremony.institutionName || "",
      courierAddress: ceremony.courierAddress || "",
      postalAddress: ceremony.postalAddress || "",
      city: ceremony.city || "",
      ceremonyDate: ceremony.ceremonyDate || null,
      dueDate: ceremony.dueDate || null,
      despatchDate: ceremony.despatchDate || null,
      dateSent: ceremony.dateSent || null,
      returnDate: ceremony.returnDate || null,
      dateReturned: ceremony.dateReturned || null,
      organiser: ceremony.organiser || "",
      phone: ceremony.phone || "",
      email: ceremony.email || "",
      invoiceEmail: ceremony.invoiceEmail || "",
      priceCode: ceremony.priceCode || null,
      freight: ceremony.freight,
    });
  };

  // Fetch orders on mount
  useEffect(() => {
    const cached = localStorage.getItem("ceremonies");

    if (cached) {
      const ceremonies = JSON.parse(cached);
      setCeremonies(ceremonies);
      updateForm(ceremonies[0]);
    } else {
      setLoading(true);
    }

    axios
      .get(`${API_URL}/admin/ceremonies`)
      .then((res) => {
        setCeremonies(res.data);
        localStorage.setItem("ceremonies", JSON.stringify(res.data));
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
    console.log(name, value);
    setFormData((prev) => ({ ...prev, [name]: value }));
    setChanged(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Order submitted:", formData);
    // Replace with API call
    // setLoading(true);
    try {
      //     let res;
      //     if (editingId && typeof editingId === 'string' && editingId.startsWith("temp-")) {
      //         res = await axios.post(`${API_URL}/admin/ceremonies`, form);
      //         await axios.post(`${API_URL}/admin/ceremonies/${res.data.id}/degrees`, degrees);
      //     } else {
      await axios.put(`${API_URL}/admin/ceremonies/${formData.id}`, formData);
      setChanged(false);
      //     }
      setCeremonies((prevCeremonies) =>
        prevCeremonies.map((c) =>
          c.id === formData.id ? { ...c, ...formData } : c
        )
      );
      //     setCeremonies(
      //         ceremonies.map((c) => (c.id === editingId ? res.data : c))
      //     );
      //     setEditingId(null);
      //     setForm({ name: "", dueDate: "", ceremonyDate: "", visible: false});
    } catch (err) {
      setError("Update failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const goPrev = () => {
    setCurrentIndex((prev) => {
      const newIndex = Math.max(prev - 1, 0);
      updateForm(ceremonies[newIndex]);
      setChanged(false);
      return newIndex;
    });
  };

  const goNext = () => {
    setCurrentIndex((prev) => {
      const newIndex = Math.min(prev + 1, ceremonies.length - 1);
      updateForm(ceremonies[newIndex]);
      setChanged(false);
      return newIndex;
    });
  };

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
              className="grid grid-cols-4 md:grid-cols-4 gap-3 w-275 text-xs"
            >
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="idcode">Id Code</Label>
                <Input
                  id="idcode"
                  name="idCode"
                  value={formData.idCode}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label htmlFor="institutionName">Institution name</Label>
                <Input
                  id="institutionName"
                  name="institutionName"
                  value={formData.institutionName}
                  onChange={handleChange}
                />
              </div>

              <div className="row-start-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="row-start-2">
                <Label htmlFor="courieraddress">Courier Address</Label>
                <Input
                  id="courieraddress"
                  name="courierAddress"
                  value={formData.courierAddress}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="row-start-2">
                <Label htmlFor="postaladdress">Postal Address</Label>
                <Input
                  id="postaladdress"
                  name="postalAddress"
                  value={formData.postalAddress}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="row-start-3">
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

              <div className="row-start-3">
                <Label htmlFor="invoiceemail">Invoice Email</Label>
                <Input
                  id="invoiceemail"
                  name="invoiceEmail"
                  type="invoiceemail"
                  value={formData.invoiceEmail}
                  onChange={handleChange}
                  onBlur={(e) => e.target.reportValidity()}
                  required
                />
              </div>

              <div className="row-start-3">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <hr className="row-start-4 col-span-full border-t border-gray-300 my-4" />

              <div className="row-start-5">
                <Label htmlFor="ceremonydate">Ceremony Date</Label>
                <Input
                  id="ceremonydate"
                  name="ceremonyDate"
                  type="date"
                  value={formData.ceremonyDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="row-start-5">
                <Label htmlFor="duedate">Due Date</Label>
                <Input
                  id="duedate"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="row-start-5">
                <Label htmlFor="despatchdate">Despatch Date</Label>
                <Input
                  id="despatchdate"
                  name="despatchDate"
                  type="date"
                  value={formData.despatchDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="row-start-5">
                <Label htmlFor="datesent">Date Sent</Label>
                <Input
                  id="datesent"
                  name="dateSent"
                  type="date"
                  value={formData.dateSent}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="row-start-6">
                <Label htmlFor="despatchdate">Return Date</Label>
                <Input
                  id="returndate"
                  name="returnDate"
                  type="date"
                  value={formData.returnDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="row-start-6">
                <Label htmlFor="datereturned">Date Returned</Label>
                <Input
                  id="datereturned"
                  name="dateReturned"
                  type="date"
                  value={formData.dateReturned}
                  onChange={handleChange}
                  required
                />
              </div>

              <hr className="row-start-7 col-span-full border-t border-gray-300 my-4" />

              <div className="row-start-8">
                <Label htmlFor="organiser">Organiser</Label>
                <Input
                  id="organiser"
                  name="organiser"
                  value={formData.organiser}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="row-start-8">
                <Label htmlFor="pricecode">Price Code</Label>
                <Input
                  id="pricecode"
                  name="priceCode"
                  value={formData.priceCode}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="row-start-8">
                <Label htmlFor="freight">Freight</Label>
                <Input
                  id="freight"
                  name="freight"
                  value={formData.freight}
                  onChange={handleChange}
                  required
                />
              </div>

              <hr className="row-start-9 col-span-full border-t border-gray-300 my-4" />

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
                disabled={currentIndex === ceremonies.length - 1}
              >
                <ChevronsRight />
              </Button>

              <Button
                type="submit"
                className="mt-4 row-start-11 col-start-3 bg-green-700 hover:bg-green-800"
                hidden={!changed}
                onClick={handleSubmit}
              >
                Save
              </Button>

              <Button className="mt-4 row-start-11 col-start-4 bg-green-700 hover:bg-green-800">
                New
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
