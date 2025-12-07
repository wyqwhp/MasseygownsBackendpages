    import React, {useEffect, useState} from "react";
    import {
        Button
    } from "@/components/ui/button";
    import {
        Input
    } from "@/components/ui/input";
    import {
        Label
    } from "@/components/ui/label";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle
    } from "@/components/ui/card";
    import { ChevronsLeft, ChevronsRight } from "lucide-react";
    import AdminNavbar from "@/pages/AdminNavbar.jsx";
    import axios from "axios";
    import FullscreenSpinner from "@/components/FullscreenSpinner.jsx";
    import "./AdminIndOrder.css"

    const API_URL = import.meta.env.VITE_GOWN_API_BASE; // or hardcode "http://localhost:5144"
    // const API_URL = "http://localhost:5144"

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
        });
        const [orders, setOrders] = useState([]);
        const [currentIndex, setCurrentIndex] = useState(0);
        const [loading, setLoading] = useState();
        const [error, setError] = useState(null);
        const [changed, setChanged] = useState(false);

        const retrieveItems = (order) => {
            if (order.items.length === 0) {
                setFormData(prev => ({
                    ...prev,
                    gownType: "",
                    gownSize: "",
                    hatType: "",
                    hatSize: "",
                    hoodType: "",
                }));
                return [];
            }

            let gownType = "";
            let gownSize = "";
            let hatType = "";
            let hatSize = "";
            let hoodType = "";

            for (let i of order.items) {
                if (i.itemName?.startsWith("Gown")) {
                    gownType = i.itemName;
                    gownSize = i.sizeName;
                }

                if (i.itemName?.startsWith("Trencher") || i.itemName?.startsWith("Tudor")) {
                    hatType = i.itemName;
                    hatSize = i.sizeName;
                }

                if (i.itemName?.startsWith("Hood")) {
                    hoodType = i.hoodName;
                }
            }

            setFormData(prev => ({
                ...prev,
                gownType,
                gownSize,
                hatType,
                hatSize,
                hoodType,
            }));
        }

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
                // gownType: order.items?.[0]?.itemName ?? ""
            });
            retrieveItems(order);
        }

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
                .get(`${API_URL}/orders`)
                .then((res) => {
                    setOrders(res.data);
                    localStorage.setItem("orders", JSON.stringify(res.data));
                    updateForm(res.data[0]);
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

        if (loading) return <FullscreenSpinner />;
        if (error) return <p className="text-red-600">Error: {error}</p>;

        return (
            <>
            <AdminNavbar />
                <div className="max-w-6xl mx-auto pt-24 shadow-lg">
                    <Card className="bg-green-50 pt-4">
                    {/*<CardHeader>*/}
                    {/*    <CardTitle>Order Form</CardTitle>*/}
                    {/*</CardHeader>*/}
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid grid-cols-4 md:grid-cols-4 gap-3 w-275 text-xs">
                            <div>
                                <Label htmlFor="surname">Surname</Label>
                                <Input
                                    // className="bg-white"
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
                                    // className="bg-white"
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
                                    // className="bg-white"
                                    id="orderNumber"
                                    name="orderNumber"
                                    value={formData.orderNumber}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    // className="bg-white"
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
                                    // className="bg-white"
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
                                    // className="bg-white"
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
                                    // className="bg-white"
                                    id="clientId"
                                    name="clientId"
                                    value={formData.clientId}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="ceremonyId">Ceremony Id</Label>
                                <Input
                                    // className="bg-white"
                                    id="ceremonyId"
                                    name="ceremonyId"
                                    value={formData.ceremonyId}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <hr className="col-span-full border-t border-gray-300 my-4" />

                            <div className="row-start-4">
                                <Label htmlFor="gowntype">Gown Type</Label>
                                <Input
                                    // className="bg-white"
                                    id="gowntype"
                                    name="gowntype"
                                    value={formData.gownType}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="row-start-4">
                                <Label htmlFor="gownsize">Gown Size</Label>
                                <Input
                                    // className="bg-white"
                                    id="gownsize"
                                    name="gownsize"
                                    value={formData.gownSize}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="row-start-4">
                                <Label htmlFor="hattype">Hat Type</Label>
                                <Input
                                    // className="bg-white"
                                    id="hattype"
                                    name="hattype"
                                    value={formData.hatType}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="row-start-4">
                                <Label htmlFor="hatsize">Hat Size</Label>
                                <Input
                                    // className="bg-white"
                                    id="hatsize"
                                    name="hatsize"
                                    value={formData.hatSize}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="row-start-5">
                                <Label htmlFor="hoodType">Hood Type</Label>
                                <Input
                                    // className="bg-white"
                                    id="hoodType"
                                    name="hoodType"
                                    value={formData.hoodType}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="row-start-5">
                                <Label htmlFor="height">Height</Label>
                                <Input
                                    // className="bg-white"
                                    id="height"
                                    name="height"
                                    value={formData.height}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="row-start-5">
                                <Label htmlFor="headSize">Head Size</Label>
                                <Input
                                    // className="bg-white"
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
                                    // className="bg-white"
                                    id="orderType"
                                    name="orderType"
                                    value={formData.orderType}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="row-start-7">
                                <Label htmlFor="note">Note</Label>
                                <Input
                                    // className="bg-white"
                                    id="note"
                                    name="note"
                                    value={formData.note}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="row-start-7">
                                <Label htmlFor="changes">Changes</Label>
                                <Input
                                    // className="bg-white"
                                    id="changes"
                                    name="changes"
                                    value={formData.changes}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <Label htmlFor="packNote">Pack Note</Label>
                                <Input
                                    // className="bg-white"
                                    id="packNote"
                                    name="packNote"
                                    value={formData.packNote}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="row-start-8">
                                <Label htmlFor="amountPaid">Amount Paid</Label>
                                <Input
                                    // className="bg-white"
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
                                    // className="bg-white"
                                    id="amountOwing"
                                    name="amountOwing"
                                    value={formData.amountOwing}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="row-start-8">
                                <Label htmlFor="donation">Donation</Label>
                                <Input
                                    // className="bg-white"
                                    id="donation"
                                    name="donation"
                                    value={formData.donation}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="row-start-8">
                                <Label htmlFor="freight">Freight</Label>
                                <Input
                                    // className="bg-white"
                                    id="freight"
                                    name="freight"
                                    value={formData.freight}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="row-start-9">
                                <Label htmlFor="refund">Refund</Label>
                                <Input
                                    // className="bg-white"
                                    id="refund"
                                    name="refund"
                                    value={formData.refund}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="row-start-9">
                                <Label htmlFor="adminChgs">Admin Charges</Label>
                                <Input
                                    // className="bg-white"
                                    id="adminChgs"
                                    name="adminChgs"
                                    value={formData.adminChgs}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="row-start-9">
                                <Label htmlFor="pOrder">Purchase Order #</Label>
                                <Input
                                    // className="bg-white"
                                    id="pOrder"
                                    name="pOrder"
                                    value={formData.pOrder}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="row-start-9">
                                <Label htmlFor="payBy">Pay By</Label>
                                <Input
                                    // className="bg-white"
                                    id="payBy"
                                    name="payBy"
                                    value={formData.payBy}
                                    onChange={handleChange}
                                />
                            </div>
                            <Button className="mt-4 row-start-11 col-start-1 bg-green-700 hover:bg-green-800"
                                    onClick={goPrev} disabled={currentIndex === 0}>
                                <ChevronsLeft/>
                            </Button>

                            <Button className="mt-4 row-start-11 col-start-2 bg-green-700 hover:bg-green-800"
                                    onClick={goNext} disabled={currentIndex === orders.length - 1}>
                                <ChevronsRight/>
                            </Button>

                            <Button type="submit" className="mt-4 row-start-11 col-start-3 bg-green-700 hover:bg-green-800" hidden={!changed}>
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
    };