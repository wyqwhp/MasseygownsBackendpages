import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent} from "@/components/ui/card";
import { ChevronsLeft, ChevronsRight, Copy, PlusCircle, Save, Printer, FileDown } from "lucide-react";
import AdminNavbar from "./AdminNavbar.jsx";
import axios from "axios";
import FullscreenSpinner from "@/components/FullscreenSpinner.jsx";
import "./AdminIndOrder.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PrintReportOrder from "@/components/ReportPrint/PrintReportOrder.jsx";
import PrintBulkInvoice from "@/components/ReportPrint/PrintBulkInvoice.jsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.jsx";
import PrintBulkAddressLabels from "@/components/ReportPrint/PrintBulkAddressLabels.jsx";
import {printBulkLabels} from "@/components/PrintLabels.js";
import {exportToCSV} from "@/components/ExportToXero.js";
import PrintBulkPackingDocs from "@/components/ReportPrint/PrintBulkPackingDocs.jsx";

const API_URL = import.meta.env.VITE_GOWN_API_BASE; // or hardcode "http://localhost:5144"
// const API_URL = "http://localhost:5144"

export default function AdminBulkOrder() {
  const emptyFormRecord = {
    name: "",
    idCode: "",
    orderNumber: "",
    institutionName: "",
    courierAddress: "",
    postalAddress: "",
    city: "",
    ceremonyDate: null,
    dueDate: null,
    despatchDate: null,
    dateSent: null,
    returnDate: null,
    dateReturned: null,
    organiser: "",
    phone: "",
    email: "",
    invoiceEmail: "",
    priceCode: "",
    freight: 0,
    gown_count: 0,
    hat_count: 0,
    hood_count: 0,
    ucol_count: 0,
  };
  const [formData, setFormData] = useState({ emptyFormRecord });
  const [ceremonies, setCeremonies] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [loading, setLoading] = useState();
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);
  const [changed, setChanged] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showPrint, setShowPrint] = useState(false);
  const [showPrintInvoice, setShowPrintInvoice] = useState(false);
  const [showPrintBulkAddressLabels, setShowPrintBulkAddressLabels] = useState(false);
  const [showPrintPackingDocs, setShowPrintPackingDocs] = useState(false);
  // const hasPrintedRef = useRef(false);
  const navButtonClass =
      "bg-green-700 hover:bg-green-800 w-20 h-10 p-0 flex items-center justify-center";

  const sortedCeremonies = useMemo(() => {
    return [...ceremonies].sort((a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "", undefined, { sensitivity: "base" })
    );
  }, [ceremonies]);

  const [paper, setPaper] = useState("A4");

  const currentIndex = sortedCeremonies.findIndex(
      c => c.id === currentId
  );

  const updateForm = (ceremony) => {
    console.log("Updating form");
    setFormData({
      id: ceremony.id,
      visible: ceremony.visible,
      name: ceremony.name || "",
      idCode: ceremony.idCode || "",
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
      gown_count: ceremony.gown_count || 0,
      hat_count: ceremony.hat_count || 0,
      hood_count: ceremony.hood_count || 0,
      ucol_count: ceremony.ucol_count || 0,
      gown: ceremony.gown || 0,
      hat: ceremony.hat || 0,
      hood: ceremony.hood || 0,
      ucol: ceremony.ucol_sash || 0,
    });
    console.log("Ceremony=", ceremony);
  };

  useEffect(() => {
    if (!sortedCeremonies.some(c => c.id === currentId)) {
      setCurrentId(sortedCeremonies[0]?.id ?? null);
    }
  }, [sortedCeremonies, currentId]);

  // Fetch orders on mount
  useEffect(() => {
    // if (hasPrintedRef.current) return;
    // hasPrintedRef.current = true;

    const cached = localStorage.getItem("ceremonies");
    // const cached = null;

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
        console.log("From API=", res.data[0]);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setChanged(true);
    if (editingId === null) {
      setEditingId(ceremonies[currentIndex].id);
      setFormData((prev) => ({ ...prev, id: ceremonies[currentIndex].id, [name]: value }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCopy = () => {
    setEditingId("temp-" + crypto.randomUUID());
    const duplicated = { ...formData, name: `${formData.name} - Copy`, idCode: `${formData.idCode} - Copy` };
    setFormData(duplicated);
    setChanged(true);
  }

  const handleNew = () => {
    const tempId = "temp-" + crypto.randomUUID();
    setEditingId(tempId);
    setCeremonies([...ceremonies, {id: tempId}]);
    setFormData(emptyFormRecord);
    setChanged(true);
  }

  const handlePrint = () => {
    setShowPrint(false);
    setTimeout(() => setShowPrint(true), 0);
  }

  const handlePrintInvoice = () => {
    setShowPrintInvoice(false);
    setTimeout(() => setShowPrintInvoice(true), 0);
  }

  const handlePrintPackingDocs = () => {
    setShowPrintPackingDocs(false);
    setTimeout(() => setShowPrintPackingDocs(true), 0);
  }

  const handlePrintBulkAddressLabels = () => {
    setShowPrintBulkAddressLabels(false);
    setTimeout(() => setShowPrintBulkAddressLabels(true), 0);
  }

  const handlePrintLabels = () => {
    printBulkLabels(formData.id);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        if (editingId && typeof editingId === 'string' && editingId.startsWith("temp-")) {
          await axios.post(`${API_URL}/admin/ceremonies`, formData);
          // formData.id = res.id;
        } else {
          await axios.put(`${API_URL}/admin/ceremonies/${editingId}`, formData);
        }
        setCeremonies((prevCeremonies) =>
          prevCeremonies.map((c) =>
            c.id === editingId ? { ...c, ...formData } : c
          )
      );
      setEditingId(null);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 409) {
          setError(err.response.data?.message || "ID code already exists");
          setShowError(true);
          return;
        }
      }
      setError("Update failed: " + err.message);
      setShowError(true);

    } finally {
      setLoading(false);
      setChanged(false);
    }
  };

  const goNext = () => {
    console.log("Ceremonies=", sortedCeremonies);
    if (
        editingId &&
        typeof editingId === "string" &&
        editingId.startsWith("temp-")
    ) {
      setCeremonies(ceremonies.filter((d) => d.id !== editingId));
      const idx = sortedCeremonies.findIndex(c => c.id === currentId);
      updateForm(sortedCeremonies[idx]);
    } else {
      const idx = sortedCeremonies.findIndex(c => c.id === currentId);
      if (idx >= 0 && idx < sortedCeremonies.length - 1) {
        setCurrentId(sortedCeremonies[idx + 1].id);
        updateForm(sortedCeremonies[idx + 1]);
      }
    }
    setChanged(false);
    setEditingId(null);
  };

  const goPrev = () => {
    if (
        editingId &&
        typeof editingId === "string" &&
        editingId.startsWith("temp-")
    ) {
      setCeremonies(ceremonies.filter((d) => d.id !== editingId));
      const idx = sortedCeremonies.findIndex(c => c.id === currentId);
      updateForm(sortedCeremonies[idx]);
    } else {
      const idx = sortedCeremonies.findIndex(c => c.id === currentId);
      if (idx > 0) {
        setCurrentId(sortedCeremonies[idx - 1].id);
        updateForm(sortedCeremonies[idx - 1]);
      }
    }
    setChanged(false);
    setEditingId(null);
  };

  if (loading) return <FullscreenSpinner />;

  return (
    <>
      <Dialog open={showError} onOpenChange={setShowError}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">
              Error
            </DialogTitle>
          </DialogHeader>
          <p>{error}</p>
        </DialogContent>
      </Dialog>;
      <AdminNavbar />
      <div className="max-w-6xl mx-auto pt-24 shadow-lg">
        <Card className="bg-green-50 pt-4">
          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-4 md:grid-cols-4 gap-3 w-275 text-xs"
            >
              <div>
                <Label htmlFor="name">Ceremony</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label htmlFor="idcode">Id Code</Label>
                <Input
                  id="idcode"
                  name="idCode"
                  value={formData.idCode}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="institutionName">Institution name</Label>
                <Input
                  id="institutionName"
                  name="institutionName"
                  value={formData.institutionName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="organiser">Organiser</Label>
                <Input
                    id="organiser"
                    name="organiser"
                    value={formData.organiser}
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
                />
              </div>

              <div className="row-start-2">
                <Label htmlFor="postaladdress">Postal Address</Label>
                <Input
                  id="postaladdress"
                  name="postalAddress"
                  value={formData.postalAddress}
                  onChange={handleChange}
                />
              </div>

              <div className="row-start-2">
                <Label htmlFor="postaladdress2">Postal Address 2</Label>
                <Input
                    id="postaladdress2"
                    name="postalAddress2"
                    value={formData.postalAddress2}
                    onChange={handleChange}
                />
              </div>

              <div className="row-start-2">
                <Label htmlFor="postaladdress3">Postal Address 3</Label>
                <Input
                    id="postaladdress3"
                    name="postalAddress3"
                    value={formData.postalAddress3}
                    onChange={handleChange}
                />
              </div>

              <div className="row-start-3">
                <Label htmlFor="courieraddress">Courier Address</Label>
                <Input
                    id="courieraddress"
                    name="courierAddress"
                    value={formData.courierAddress}
                    onChange={handleChange}
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
                />
              </div>

              <div className="row-start-3">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <hr className="row-start-4 col-span-full border-t border-gray-300 my-4" />

              <div className="row-start-5">
                <Label htmlFor="ceremonyNo">Ceremony No</Label>
                <Input
                    id="ceremonyNo"
                    name="ceremonyNo"
                    type="text"
                    value={formData.ceremonyNo}
                    onChange={handleChange}
                />
              </div>

              <div className="row-start-5">
                <Label htmlFor="ceremonydate">Ceremony Date</Label>
                <Input
                  id="ceremonydate"
                  name="ceremonyDate"
                  type="date"
                  value={formData.ceremonyDate}
                  onChange={handleChange}
                />
              </div>

              <div className="row-start-5">
                <Label htmlFor="ceremonydate2">Ceremony Date 2</Label>
                <Input
                  id="ceremonydate2"
                  name="ceremonydate2"
                  type="date"
                  value={formData.ceremonyDate2}
                  onChange={handleChange}
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
                />
              </div>

              <div className="row-start-6">
                <Label htmlFor="datesent">Date Sent</Label>
                <Input
                  id="datesent"
                  name="dateSent"
                  type="date"
                  value={formData.dateSent}
                  onChange={handleChange}
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
                />
              </div>

              {/*<hr className="row-start-7 col-span-full border-t border-gray-300 my-4" />*/}
              <div className="row-start-7">
                <Label htmlFor="gowns">Gowns</Label>
                <Input
                    id="gowns"
                    name="gowns"
                    type="number"
                    value={formData.gown_count}
                    onChange={handleChange}
                />
              </div>

              <div className="row-start-7">
                <Label htmlFor="hoods">Hoods</Label>
                <Input
                    id="hoods"
                    name="hoods"
                    type="number"
                    value={formData.hood_count}
                    onChange={handleChange}
                />
              </div>

              <div className="row-start-7">
                <Label htmlFor="hats">Hats</Label>
                <Input
                    id="hats"
                    name="hats"
                    type="number"
                    value={formData.hat_count}
                    onChange={handleChange}
                />
              </div>

              <div className="row-start-7">
                <Label htmlFor="ucols">Sashes</Label>
                <Input
                    id="ucols"
                    name="ucols"
                    type="number"
                    value={formData.ucol_count}
                    onChange={handleChange}
                />
              </div>

              <div className="row-start-8">
                <Label htmlFor="pricecode">Price Code</Label>
                <Select
                  id="pricecode"
                  name="priceCode"
                  value={formData.priceCode}
                  onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, priceCode: value }))
                  }
                >
                  <SelectTrigger className="!bg-white">
                    <SelectValue placeholder="Select price code" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="bluegown">Blue Gown</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="rncgps">RNCGPs</SelectItem>
                    <SelectItem value="standardhire">Standard Hire</SelectItem>
                    <SelectItem value="branch">Branch</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="nelsonnmit">Nelson NMIT</SelectItem>
                    <SelectItem value="polytech">Polytech</SelectItem>
                    <SelectItem value="qrc">QRC</SelectItem>
                    <SelectItem value="school">School</SelectItem>
                    <SelectItem value="familymembers">Family Members</SelectItem>
                  </SelectContent>
                </Select>
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

              {/*<hr className="row-start-9 col-span-full border-t border-gray-300 my-4" />*/}

              <div className="row-start-10 col-start-1 flex justify-around gap-0 mt-4" aria-label="Paper size choice">
                <div className="paper-choice flex gap-3 mt-1 items-center w-36">
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

                <Button className={`${navButtonClass} w-24`}
                        onClick={handlePrintBulkAddressLabels}
                        type="button"
                        disabled={false}
                >
                  <Printer /> Address
                </Button>
              </div>

              <div className="row-start-10 col-start-2 flex justify-around mt-4">
                <Button onClick={handlePrint}
                        type="button"
                        className={`${navButtonClass} w-30`}>
                  <Printer /> Worksheet
                </Button>

                <Button className={`${navButtonClass} w-30`}
                        onClick={handlePrintPackingDocs}
                        disabled={false}
                        type="button"
                >
                  <Printer /> Packing Docs
                </Button>
              </div>

              <div className="row-start-10 col-start-3 flex justify-around mt-4">
                <Button
                    disabled={false}
                    onClick={handlePrintLabels}
                    type="button"
                    className={`${navButtonClass} w-24`}>
                  <Printer /> Labels
                </Button>
              </div>

              <div className="row-start-10 col-start-4 flex justify-around mt-4">
                <Button onClick={handlePrintInvoice}
                        type="button"
                        className={`${navButtonClass} w-24`}>
                  <Printer /> Invoice
                </Button>
              </div>

              <div className="row-start-11 col-start-1 flex justify-around mt-4">
                <Button
                    className={`${navButtonClass} w-30`}
                    onClick={goPrev}
                    type="button"
                    disabled={currentIndex === 0}
                >
                  <ChevronsLeft />
                </Button>

                <Button
                    className={`${navButtonClass} w-30`}
                    onClick={goNext}
                    type="button"
                    disabled={currentIndex === ceremonies.length - 1}
                >
                  <ChevronsRight />
                </Button>
              </div>

              <div className="row-start-11 col-start-2 flex justify-around mt-4">
                <Button onClick={handleCopy}
                        type="button"
                        className={`${navButtonClass} w-24`}>
                  <Copy />
                </Button>

                <Button className={`${navButtonClass} w-24`}
                        type="button"
                        onClick={handleNew}
                >
                  <PlusCircle />
                </Button>
              </div>

              <Button
                  type="submit"
                  className={`${navButtonClass} row-start-11 col-start-3 mt-4 place-self-center`}
                  disabled={!changed}
                  onClick={handleSubmit}
              >
                <Save/>
              </Button>

              <Button className={`${navButtonClass} w-24 row-start-11 col-start-4 mt-4 place-self-center`}
                      onClick={exportToCSV}
                      type="button"
                      disabled={false}
              >
                <FileDown /> Xero
              </Button>

            </form>
          </CardContent>
        </Card>
      </div>
      {showPrint && <PrintReportOrder ceremony={formData}/>}
      {showPrintInvoice && <PrintBulkInvoice ceremony={formData} onDone={() => setShowPrintInvoice(false)}/>}
      {showPrintBulkAddressLabels && <PrintBulkAddressLabels ceremony={formData} paper={paper}
                                                             onDone={() => setShowPrintBulkAddressLabels(false)}/>}
      {showPrintPackingDocs && <PrintBulkPackingDocs ceremony={formData} onDone={() => setShowPrintPackingDocs(false)}/>}
    </>
  );
}
