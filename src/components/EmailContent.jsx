import { useState, useEffect, useRef } from "react";
import JoditEditor from "jodit-react";
import AdminNavbar from "../pages/AdminNavbar";
import { sendOrderCompleteTemplate } from "../api/TemplateApi.js";

export default function EmailContent() {
  const editor = useRef(null);

  const LOCAL_KEY = "email_template_order_receipt";

  const [html, setHtml] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");

  // --------------------------------------------------
  // VARIABLE LIST (must match placeholders in template)
  // --------------------------------------------------
  const variableList = [
    "gstNumber",
    "invoiceNumber",
    "invoiceDate",
    "firstName",
    "lastName",
    "address",
    "city",
    "postcode",
    "country",
    "studentId",
    "email",
    "mobile",
    "phone",
    "cartRows",
    "total",
    "amountPaid",
    "balanceOwing"
  ];

  // --------------------------------------------------
  // DEFAULT TEMPLATE (FULLY FIXED)
  // --------------------------------------------------
  const defaultTemplate = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Order Confirmation</title>
</head>

<body style="margin:0; padding:0; background:#f4f4f4; font-family:Arial, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
<tr>
<td align="center">

<table width="750" cellpadding="0" cellspacing="0" style="background:white; border-radius:8px; padding:25px;">

  <!-- HEADER -->
  <tr>
    <td>
      <h1 style="margin:0; font-size:24px; color:#111;">Order Confirmation</h1>
      <div style="font-size:12px; color:#777; margin-top:3px;">
        GST No: {{gstNumber}}
      </div>
    </td>

    <td align="right" style="font-size:13px; line-height:1.4; color:#444;">
      <strong>Academic Dress Hire</strong><br>
      Refectory Rd, University Ave,<br>
      Massey University, Tennent Drive<br>
      Palmerston North<br>
      Email: info@masseygowns.org.nz<br>
      Ph: +64 6 350 4166
    </td>
  </tr>

  <tr><td colspan="2" style="padding-top:10px;"><hr></td></tr>

  <!-- INTRO -->
  <tr>
    <td colspan="2" style="font-size:14px; padding-top:10px; color:#333;">
      Congratulations, you have successfully ordered. Please click on the print link
      below to print your receipt. All collection and return information can be found
      on the attached receipt. Your receipt and order confirmation will also be emailed
      to you shortly!
    </td>
  </tr>

  <!-- ORDER DETAILS -->
  <tr>
    <td colspan="2" style="padding-top:25px;">
      <table width="100%" cellpadding="8" cellspacing="0" style="font-size:14px;">

        <tr>
          <td width="50%" valign="top">
            <div><strong>Order Number</strong><br>{{invoiceNumber}}</div>
            <div style="margin-top:8px;"><strong>Name</strong><br>{{firstName}} {{lastName}}</div>
            <div style="margin-top:8px;"><strong>Email Address</strong><br>{{email}}</div>
            <div style="margin-top:8px;"><strong>Mobile Number</strong><br>{{mobile}}</div>
          </td>

          <td width="50%" valign="top">
            <div><strong>Address</strong><br>{{address}}</div>
            <div style="margin-top:8px;"><strong>City, Post Code</strong><br>{{city}} {{postcode}}</div>
            <div style="margin-top:8px;"><strong>Country</strong><br>{{country}}</div>
            <div style="margin-top:8px;"><strong>Phone Number</strong><br>{{phone}}</div>
          </td>
        </tr>

      </table>
    </td>
  </tr>

  <!-- CART TABLE -->
  <tr>
    <td colspan="2" style="padding-top:20px;">
      <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse; font-size:14px; border:1px solid #ddd;">

        <thead>
          <tr style="background:#f7f7f7; border-bottom:1px solid #ccc;">
            <th align="left" style="padding:10px;">Item</th>
            <th align="center" style="padding:10px;">Unit</th>
            <th align="center" style="padding:10px;">Quantity</th>
            <th align="right" style="padding:10px;">Total</th>
          </tr>
        </thead>

        <tbody>
          {{cartRows}}
        </tbody>

        <tfoot>
          <tr style="border-top:1px solid #ccc;">
            <td colspan="3" align="right" style="padding:10px;"><strong>Grand total</strong></td>
            <td align="right" style="padding:10px;"><strong>{{total}}</strong></td>
          </tr>

          <tr>
            <td colspan="4" style="padding:10px; font-size:12px; color:#666;">
              All prices include GST
            </td>
          </tr>
        </tfoot>

      </table>
    </td>
  </tr>

  <!-- PAYMENT INSTRUCTIONS -->
  <tr>
    <td colspan="2" style="padding-top:25px;">
      <h2 style="font-size:16px; margin:0 0 10px 0;">Direct Credit Payment Instructions:</h2>

      <p style="color:red; font-size:14px; margin:0;">
        Please NOW go into your bank account and make the payment of the amount showing on this order.
      </p>
      <p style="color:red; font-size:14px; margin:0;">
        The Account Number, Account Name and the information to include is shown below.
      </p>

      <p style="font-size:14px; margin-top:15px;">
        <strong>Bank:</strong> Bank of New Zealand<br>
        <strong>Bank Swift Code:</strong> BKNZNZ22500<br>
        <strong>Account Name:</strong> Graduate Women Manawatu Charitable Trust Inc.<br>
        <strong>Account Number:</strong> 02-1231-0017007-000
      </p>

      <p style="font-size:14px;">
        In the 'Particulars' field type in the order number: <strong>{{invoiceNumber}}</strong><br>
        In the 'Payee Code' field type your surname.<br>
        Leave the 'Reference' field blank.
      </p>

      <p>
        <a href="#" style="display:inline-block; background:#eee; padding:10px 15px; border-radius:5px; font-size:14px; text-decoration:none; color:#333;">
          🖨️ Please print this receipt for your records
        </a>
      </p>

    </td>
  </tr>

  <!-- CONTACT FOOTER -->
  <tr>
    <td colspan="2" style="padding-top:25px; border-top:1px solid #ddd;">
      <h3 style="font-size:16px;">Contact Us</h3>
      <p style="font-size:13px;">
        You can click here to <a href="https://masseygowns.org.nz/contact" target="_blank">Contact Us</a>
        and then send us your queries.
      </p>

      <p style="font-size:13px;">
        <strong>Customer Service:</strong><br>
        Phone: 06 350 4166<br>
        Hours: 9:00am – 2:30pm, Mon – Thurs
      </p>

    </td>
  </tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;

  // --------------------------------------------------
  // SAMPLE PREVIEW VALUES (CLEAN + MATCHES VARIABLES)
  // --------------------------------------------------
  const sampleData = {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    mobile: "021123456",
    phone: "0275050782",
    address: "9 The Avenue",
    city: "Albany",
    postcode: "0632",
    country: "NZ",
    invoiceNumber: "41782315",
    gstNumber: "41782315",
    total: "$0.00",
    cartRows: `
      <tr>
        <td>Gown Hire</td>
        <td align="center">1</td>
        <td align="center">1</td>
        <td align="right">$45.00</td>
      </tr>
    `,
  };

  // --------------------------------------------------
  // LOAD TEMPLATE
  // --------------------------------------------------
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    const initial = saved || defaultTemplate;
    setHtml(initial);
    updatePreview(initial);
  }, []);

  // --------------------------------------------------
  // ENABLE DRAG & DROP IN JODIT
  // --------------------------------------------------
  useEffect(() => {
    if (!editor.current) return;

    const jodit = editor.current;

    jodit.events?.on("ready", () => {
      const editable = jodit.editor?.editor;

      if (!editable) return;

      const handleDrop = (event) => {
        event.preventDefault();
        const data = event.dataTransfer.getData("text/plain");
        if (data) jodit.editor.selection.insertHTML(data);
      };

      const handleDragOver = (event) => event.preventDefault();

      editable.addEventListener("drop", handleDrop);
      editable.addEventListener("dragover", handleDragOver);

      return () => {
        editable.removeEventListener("drop", handleDrop);
        editable.removeEventListener("dragover", handleDragOver);
      };
    });
  }, []);

  // --------------------------------------------------
  // PREVIEW UPDATE
  // --------------------------------------------------
  const updatePreview = (value) => {
    let output = value;

    Object.keys(sampleData).forEach((key) => {
      output = output.replaceAll(`{{${key}}}`, sampleData[key]);
    });

    setPreviewHtml(output);
  };

  // --------------------------------------------------
  // INSERT VARIABLE
  // --------------------------------------------------
  const insertVariable = (key) => {
    const placeholder = `{{${key}}}`;
    editor.current?.editor?.selection.insertHTML(placeholder);
  };

  // --------------------------------------------------
  // SAVE TEMPLATE
  // --------------------------------------------------
  const saveTemplate = async () => {
    localStorage.setItem(LOCAL_KEY, html);

    try {
      await sendOrderCompleteTemplate({
        key: "OCTemplate",
        text: html,
      });
    } catch (err) {
      console.error("Template sending failed:", err);
    }
  };

  const config = {
    height: 1000,
    enableDragAndDropFileToEditor: false,
  };

  return (
    <div style={{ display: "flex", width: "100%" }}>
      <AdminNavbar />

      <div style={{ flex: 1, padding: "30px" }}>
        <h2>Email Template Editor (Drag & Drop)</h2>

        <div style={{ marginBottom: "15px" }}>
          <strong>Variables (Drag or Click):</strong>
          <div style={{ marginTop: "8px" }}>
            {variableList.map((key) => (
              <button
                key={key}
                draggable
                onDragStart={(e) =>
                  e.dataTransfer.setData("text/plain", `{{${key}}}`)
                }
                onClick={() => insertVariable(key)}
                style={{
                  margin: "5px",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  background: "#fafafa",
                  cursor: "grab",
                  fontSize: "14px",
                }}
              >
                {`{{${key}}}`}
              </button>
            ))}
          </div>
        </div>

        <JoditEditor
          ref={editor}
          value={html}
          config={config}
          style={{ height: "1000px" }}
          onChange={(content) => {
            setHtml(content);
            updatePreview(content);
          }}
        />

        <button
          onClick={saveTemplate}
          style={{
            marginTop: "15px",
            padding: "10px 20px",
            background: "#1e40af",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Save Template
        </button>
      </div>
    </div>
  );
}
