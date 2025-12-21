// import puppeteer from "puppeteer";

const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Order Report</title>
</head>

<body style="margin:0; padding:0; background:#f4f4f4; font-family:Arial, sans-serif;">
    <div style="position:absolute; font-weight: bold; font-size: xx-large; top:50px; left:40px">
        {{idCode}}
    </div>
    <div style="position:absolute; font-weight: bold; font-size: xx-large; top:40px; left:340px">
        Despatch Date\t{{despatchDate}}
    </div>
    <div style="position:absolute; font-weight: bold; font-size: x-large; top:80px; left:340px">
        Date Sent:
    </div>
    <div style="position:absolute; font-weight: bold; font-size: xx-large; top:140px; left:40px">
        {{Name}}
    </div>
    <div style="position:absolute; font-size: x-large; top:220px; left:40px">
        Courier Address:\t434 Botanical Road Palmerston North 4412
    </div>
    <div style="position:absolute; font-size: x-large; top:280px; left:40px">
        CeremonyDate(s):\t{{ceremonyDate}}\tEmail: {{email}}
    </div>
    <div style="position:absolute; font-size: x-large; top:340px; left:40px">
        Organiser:\t{{organiser}}\tPhone {{phone}}
    </div>
    <div style="position:absolute; font-size: x-large; top:400px; left:40px">
        Order acknowledged:\tPurchase Order No:
    </div>
    <div style="position:absolute; font-size: x-large; top:460px; left:40px">
        Amount Due {{$3,040.00}} (Inc.Freight {{$0.00}})\tInvoice Number:
    </div>
    <div style="position:absolute; font-size: x-large; top:520px; left:40px">
        Data checked:
    </div>
    <div style="position:absolute; font-weight: bold; font-size: x-large; top:580px; left:40px">
        Notes:
    </div>
    <div style="position:absolute; font-size: large; top:610px; left:40px">
        {{Xero INV-12572}}
    </div>
</body>
</html>
`;

export default async function printPDF()
{
    // const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(html, {waitUntil: "networkidle0"});
    await page.pdf({path: "certificate.pdf", format: "A4"});

    await browser.close();
}
