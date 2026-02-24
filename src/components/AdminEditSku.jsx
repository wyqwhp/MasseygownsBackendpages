import React, {Fragment, useEffect, useState, useMemo} from "react";
import AdminNavbar from "@/components/AdminNavbar.jsx";
import axios from "axios";
import FullscreenSpinner from "@/components/FullscreenSpinner.jsx";
import {Button} from "@/components/ui/button.jsx";
import {Save, Plus, Ban, X} from "lucide-react";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.jsx";

const API_URL = import.meta.env.VITE_GOWN_API_BASE; // or hardcode "http://localhost:5144"
// const API_URL = "http://localhost:5144" // or hardcode "http://localhost:5144"

export default function AdminEditSku({ onChange }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [skus, setSkus] = useState([]);
    const [items, setItems] = useState([]);
    const [sizes, setSizes] = useState([]);
    const [hoods, setHoods] = useState([]);
    const [selectedItemId, setSelectedItemId] = useState(0);
    const [selectedSizeId, setSelectedSizeId] = useState(0);
    const [selectedFitId, setSelectedFitId] = useState(0);
    const [selectedHoodId, setSelectedHoodId] = useState(0);
    const [newSku, setNewSku] = useState(null);
    const [edited, setEdited] = useState(0);
    const [drafts, setDrafts] = useState({});
    const navButtonClass =
        "bg-green-700 hover:bg-green-800 w-20 h-10 p-0 flex items-center justify-center";

    useEffect(() => {
        axios
            .get(`${API_URL}/admin/sku`)
            .then((res) => {
                setSkus(res.data);
            })
            .catch((err) => {
                setError(err);
            })
            .finally(() => {
                setLoading(false);
            });

        axios
            .get(`${API_URL}/admin/items`)
            .then((res) => {
                setItems(res.data);
            })
            .catch((err) => {
                setError(err);
            })
            .finally(() => {
                setLoading(false);
            });

        axios
            .get(`${API_URL}/sizesonly`)
            .then((res) => {
                setSizes(res.data);
            })
            .catch((err) => {
                setError(err);
            })
            .finally(() => {
                setLoading(false);
            });

        axios
            .get(`${API_URL}/hoodsonly`)
            .then((res) => {
                setHoods(res.data);
            })
            .catch((err) => {
                setError(err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const uniqueSizes = useMemo(() => {
        const map = new Map();

        sizes
            .filter(size => size.itemId === selectedItemId)
            .forEach(size => {
                if (!map.has(size.fitName)) {
                    map.set(size.fitName, size);
                }
            });

        return Array.from(map.values());
    }, [sizes, selectedItemId]);

    const handleEdit = (id, value) => {
        setDrafts(prev => ({
            ...prev,
            [id]: value
        }));
        setEdited(id);
    };

    const restorePrevious = (id) => {
        setDrafts(prev => {
            const { [id]: _, ...rest } = prev;
            return rest;
        });
        setEdited(0);
    };

    const handleSave = async (id, count) => {
        try {
            setLoading(true);
            await axios
                .patch(`${API_URL}/admin/sku/${id}`, {
                    Id: id,
                    Count: count,
                });
            setDrafts(prev => {
                const { [id]: _, ...rest } = prev;
                return rest;
            });
            const updated = skus.map(sku =>
                sku.id === id ? { ...sku, count: count } : sku
            );
            setSkus(updated);
        } catch (error) {
            setError(error);
            console.log(error);
        } finally {
            setLoading(false);
            setEdited(0);
        }
    };

    const handleSaveNew = async (sku) => {
        try {
            const selectedItem = items.find(i => i.id === selectedItemId);
            const selectedSize = sizes.find(i => i.id === selectedSizeId);
            const selectedFit = sizes.find(i => i.fitId === selectedFitId);
            const selectedHood = hoods.find(i => i.id === selectedHoodId);

            const duplicate = skus.some(sku =>
                    sku.id !== edited &&
                    sku.name === selectedItem?.name &&
                    sku.size === selectedSize?.size &&
                    sku.fitType === selectedFit?.fitName &&
                    sku.hoodId === selectedHoodId
            );

            console.log(edited, selectedItem?.name, selectedSize?.size, selectedFit?.fitName, duplicate);

            if (duplicate)
                throw new Error("This SKU already exists");

            setLoading(true);
            // await axios
            //     .post(`${API_URL}/admin/sku}`, {
            //         sku,
            //     });

            setSkus(prev =>
                prev.map(sku =>
                    sku.id === edited
                        ? { ...sku, name: selectedItem?.name ?? "", fitType: selectedFit?.fitName ?? "", hood: selectedHood?.name ?? "",
                        size: selectedSize?.size ?? ""}
                        : sku
                )
            );

            console.log("SKU=", sku);
            setEdited(0);
        } catch (error) {
            console.log("Error=", error.message);
            setError(error.message);
        } finally {
            setLoading(false);

        }
    };

    const addSku = () => {
        const newId = 'temp-' + crypto.randomUUID()
        setNewSku({
            id: newId,
            name: "",
            size: "",
            fitType: "",
            labelsize: "",
            hood: "",
            count: 0,
        });
        setEdited(0)
    };

    return (
        <>
        <AdminNavbar />

        <div className="space-y-2 ml-8 mr-8 topform">
            {error && (
                <div className="flex justify-between items-center mb-3 rounded-lg border border-red-500 bg-red-100 text-red-800 px-3 py-2">
                    <div>
                        {error}
                    </div>
                    <div>
                        <Button className="border-0 shadow-none border-red-100 bg-red-100 text-red-700 hover:bg-red-200"
                        onClick={() => {
                            setError(null)
                            setNewSku(null);
                        }}>
                            <X />
                        </Button>
                    </div>
                </div>
            )}

            <Button
                onClick={() => addSku()}
                className="mt-2 mb-4 px-8 py-6 border rounded-lg text-white bg-green-600 hover:bg-green-700 text-lg"
            >
                <Plus/>Add SKU
            </Button>

            {/* Header */}
            <div className="grid grid-cols-[6fr_1fr_6fr_80px_6fr_80px_90px] gap-2">
                <div className="contents font-bold">
                    <span>Name</span>
                    <span>Size</span>
                    <span>Fit Type</span>
                    <span>Code</span>
                    <span>Hood Type</span>
                    <span>Qty</span>
                    <span>Save</span>
                </div>

                {/* Rows */}
                {newSku !== null && (
                    <>
                        <Select
                            value={String(selectedItemId)}
                            onValueChange={(value) => {
                                setSelectedItemId(Number(value));

                            }}
                            required={true}
                        >
                            <SelectTrigger className="border border-green-700 rounded-lg px-2 py-1">
                                <SelectValue placeholder="Select order type" />
                            </SelectTrigger>

                            <SelectContent>
                                {items.filter(item => item.category === 'Academic Gown' || item.category === 'Headwear'
                                || item.category === 'Stole' || item.category === 'Hood').map(item => (
                                    <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={String(selectedSizeId)}
                            onValueChange={(value) => {
                                setSelectedSizeId(Number(value));

                            }}
                        >
                            <SelectTrigger className="border border-green-700 rounded-lg px-2 py-1">
                                <SelectValue placeholder="Select sizes..." />
                            </SelectTrigger>

                            <SelectContent>
                                {sizes.filter(size => size.itemId === selectedItemId && (size.fitId === 1 || size.fitId === null))
                                      .map(size => (
                                      <SelectItem key={size.id} value={String(size.id)}>{size.size}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={String(selectedFitId)}
                            onValueChange={(value) => setSelectedFitId(Number(value))}
                        >
                            <SelectTrigger className="border border-green-700 rounded-lg px-2 py-1">
                                <SelectValue placeholder="Select fit type..." />
                            </SelectTrigger>

                            <SelectContent>
                                {uniqueSizes.map(size => (
                                    <SelectItem key={size.fitId} value={String(size.fitId)}>
                                        {size.fitName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <input
                            className="border border-green-700 rounded-lg px-2 py-1"
                            value={newSku.labelsize}
                            readOnly={true}
                        />

                        <Select
                            value={String(selectedHoodId)}
                            onValueChange={(value) => setSelectedHoodId(Number(value))}
                        >
                            <SelectTrigger className="border border-green-700 rounded-lg px-2 py-1">
                                <SelectValue placeholder="Select hood type..." />
                            </SelectTrigger>

                            <SelectContent>
                                {hoods.filter(hood => hood.itemId === selectedItemId)
                                    .map(hood => (
                                        <SelectItem key={hood.id} value={String(hood.id)}>{hood.name}</SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>

                        <input
                            type="number"
                            className="border border-green-700 rounded-lg px-2 py-1"
                            value={newSku.count}
                            min={0}
                            onChange={(e) =>
                                setNewSku(prev => ({ ...prev, count: e.target.value }))
                        }
                        />
                        <div className="flex gap-2">
                            <Button className={`${navButtonClass} w-10`}
                                    onClick={() => handleSaveNew({
                                        id:newSku.id,
                                        itemId:selectedItemId,
                                        sizeId: selectedSizeId,
                                        fitId: selectedFitId,
                                        hoodId: selectedHoodId,
                                        count: newSku.count})}>
                                <Save/>
                            </Button>

                            <Button className={`${navButtonClass} w-10`}
                                    onClick={() => setNewSku(null)}>
                                <Ban/>
                            </Button>
                        </div>
                    </>
                )}



                <div className="contents font-normal">
                    {skus.map((sku) => (
                        <Fragment key={sku.id}>
                            {sku.id === edited ? (
                            <>
                                <input
                                    className="border-b px-2 py-1"
                                    value={sku.name}
                                    readOnly
                                />

                                <input
                                    className="border-b px-2 py-1"
                                    value={sku.size}
                                    readOnly
                                />

                                <input
                                    className="border-b px-2 py-1"
                                    value={sku.fitType}
                                    readOnly
                                />

                                <input
                                    className="border-b px-2 py-1"
                                    value={sku.labelsize}
                                    readOnly
                                />

                                <input
                                    className="border-b px-2 py-1"
                                    value={sku.hood}
                                    readOnly
                                />

                                <input
                                    type="number"
                                    className="border border-green-700 rounded-lg px-2 py-1"
                                    value={drafts[sku.id] ?? sku.count}
                                    min={0}
                                    onChange={(e) => {
                                        console.log("On Change");
                                        handleEdit(sku.id, e.target.value);
                                        }
                                    }
                                    onBlur={() => {
                                        restorePrevious(sku.id);
                                        }
                                    }
                                    onFocus={() => {
                                        if (newSku) setNewSku(null);
                                    }}
                                />
                                <Button className={`${navButtonClass} w-12`}
                                        onClick={() => handleSave(sku.id, drafts[sku.id] ?? sku.count)}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            handleSave(sku.id, drafts[sku.id] ?? sku.count);
                                        }}
                                >
                                    <Save/>
                                </Button>
                            </>
                            ) : (
                            <>
                                <input
                                    className="border-b px-2 py-1"
                                    value={sku.name}
                                    readOnly
                                />

                                <input
                                    className="border-b px-2 py-1"
                                    value={sku.size}
                                    readOnly
                                />

                                <input
                                    className="border-b px-2 py-1"
                                    value={sku.fitType}
                                    readOnly
                                />

                                <input
                                    className="border-b px-2 py-1"
                                    value={sku.labelsize}
                                    readOnly
                                />

                                <input
                                    className="border-b px-2 py-1"
                                    value={sku.hood}
                                    readOnly
                                />

                                <input
                                    type="number"
                                    className="border border-green-700 rounded-lg px-2 py-1"
                                    value={drafts[sku.id] ?? sku.count}
                                    min={0}
                                    onChange={(e) =>
                                        handleEdit(sku.id, Number(e.target.value))
                                    }
                                    onFocus={() => {
                                        if (newSku) setNewSku(null);
                                    }}
                                />
                                <Button className={`${navButtonClass} w-10`}
                                        disabled={true}>
                                    <Save/>
                                </Button>
                            </>
                            )}
                        </Fragment>
                    ))}
                </div>



            </div>
        </div>

        {loading && <FullscreenSpinner />}
        </>

    );
}
