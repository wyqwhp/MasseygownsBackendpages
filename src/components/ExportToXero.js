const columns = [
    { key: "name", header: "*ContactName" },
    { key: "email", header: "EmailAddress" },
    { key: "address1", header: "POAddressLine1" },
    { key: "address2", header: "POAddressLine2" },
    { key: "address3", header: "POAddressLine3" },
    { key: "address4", header: "POAddressLine4" },
    { key: "city", header: "POCity" },
    { key: "region", header: "PORegion" },
    { key: "postalcode", header: "POPostalCode" },
    { key: "country", header: "POCountry" },
    { key: "invoice", header: "*InvoiceNumber" },
    { key: "reference", header: "Reference" },
    { key: "invoicedate", header: "*InvoiceDate" },
    { key: "duedate", header: "*DueDate" },
    { key: "invitemcode", header: "InventoryItemCode" },
    { key: "description", header: "*Description" },
    { key: "quantity", header: "*Quantity" },
    { key: "unitamount", header: "*UnitAmount" },
    { key: "discount", header: "*Discount" },
    { key: "accountcode", header: "*AccountCode" },
    { key: "taxtype", header: "*TaxType" },
    { key: "trackingname1", header: "TrackingName1" },
    { key: "trackingoption1", header: "TrackingOption1" },
    { key: "trackingname2", header: "TrackingName2" },
    { key: "trackingoption2", header: "TrackingOption2" },
    { key: "currency", header: "Currency" },
    { key: "brandingtheme", header: "BrandingTheme" },
    { key: "aa", header: "" },
    { key: "ab", header: "" }
];

const data = [
    {   name: "Sundry Debtors",
        email: "",
        address1: "",
        address2: "",
        address3: "",
        address4: "",
        city: "",
        region: "",
        postalcode: "",
        country: "",
        invoice: "INV-17710",
        reference: "ORD0059242 - Sambasivan",
        invoicedate: "20/01/2026",
        duedate: "20/01/2026",
        invitemcode: "",
        description: "Aravind Sambasivan -   Gown - Bachelor, 155-159cm, Hire, Regular Fit(1) Trencher, Hire, 59cm      8 Brixham place Merrilands New Plymouth  4312   saravind619@gmail.com",
        quantity: "1",
        unitamount: "68",
        discount: "",
        accountcode: "253",
        taxtype: "15% GST on Income",
        trackingname1: "",
        trackingoption1: "",
        trackingname2: "",
        trackingoption2: "",
        currency: "",
        brandingtheme: "",
        aa: "",
        ab: "WITT Graduation 2026",
    },
];

export function exportToCSV() {
    if (!data || !data.length) {
        console.warn("No data to export");
        return;
    }

    // Create header row
    const header = columns.map(col => col.header).join(",");

    // Create data rows
    const rows = data.map(row =>
        columns.map(col => {
            let value = row[col.key] ?? "";

            // Escape quotes
            value = String(value).replace(/"/g, '""');

            // Wrap in quotes in case of commas
            return `"${value}"`;
        }).join(",")
    );

    const csvContent = [header, ...rows].join("\n");

    // Create downloadable blob
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "ExportBulkXero.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
