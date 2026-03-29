import axios from "axios";

const API_URL = import.meta.env.VITE_GOWN_API_BASE; // or hardcode "http://localhost:5144"
// const API_URL = "http://localhost:5144"

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

const exportToCSV = ((orders) => {
    console.log(orders);
    if (!orders || !orders.length) {
        console.warn("No data to export");
        return;
    }

    // Create header row
    const header = columns.map(col => col.header).join(",");

    const itemsToString = ((items) => {
        let result = '';
        let gown = '';
        let hood = '';
        let hat = '';
        let ucol = '';
        items?.map(item => {

            if (item.itemName?.startsWith('Gown')) {
                gown = gown + (item.itemName ?? '') + ', ' + (item.sizeName ?? '') + ', ' + (item.hire ? 'Hire, ' : '')
                    + (item.fitName ?? '') + ' ';
            }
            if (item.itemName?.startsWith('Trencher') || item.itemName?.startsWith('Bonnet'))
                hat = hat + (item.itemName ?? '') + ', ' + (item.sizeName ?? '') + ', ' + (item.hire ? 'Hire, ' : '') + ' ';
            if (item.itemName?.startsWith('Hood'))
                hood = hood + (item.itemName ?? '') + ', ' + (item.hoodName ?? '') + ', ' + (item.hire ? 'Hire, ' : '') + ' ';
            if (item.itemName?.startsWith('Ucol'))
                ucol = ucol + (item.itemName ?? '') + ', ' + (item.hoodName ?? '') + ', ' + (item.hire ? 'Hire, ' : '') + ' ';
        });
        result = result + gown + hat + hood + ucol;
        return result;
    })

    // Create data rows
    const rows = orders.map(row =>
        columns.map(col => {
            let value = '';

            if (row[col.key])
                value = row[col.key] ?? "";
            if (col.key === "name")
                value = 'Sundry Debtors';
            if (col.key === "email")
                value = '';
            if (col.key === "city")
                value = '';
            if (col.key === "country")
                value = '';
            if (col.key === "reference")
                value = (row['referenceNo'] ?? '') + ' - ' + row['lastName'];
            if (col.key === "invoicedate")
                value = row['orderDate'];
            if (col.key === "duedate")
                value = row['orderDate'];
            if (col.key === "description")
                value = row['firstName'] + ' ' + row['lastName'] + ' - ' + itemsToString(row['items']) + '    ' +
                    row['address'] + ' ' + row['city'] + ' ' + row['postcode'] + ' ' + row['email'];
            if (col.key === "quantity")
                value = 1;
            if (col.key === "unitamount")
                value = row['orderAmount'] / 100;
            if (col.key === "accountcode")
                value = row['accountCode'];
            if (col.key === "taxtype")
                value = '15% GST on Income';
            if (col.key === "ab")
                value = row['ceremony'];

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
});

export function XeroToCSV(id) {
    axios
        .get(`${API_URL}/admin/ordersbyceremony/${id}`)
        .then((res) => {
            exportToCSV(res.data)
        });
}
