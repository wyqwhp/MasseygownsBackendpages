import Queries from "./components/AdminQueries.jsx";
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Authentication from "@/components/Authentication.jsx";
import AdminEditCeremonies from "./components/AdminEditCeremonies.jsx";
import AdminExtractOrders from "./components/AdminExtractOrders.jsx";
import AdminEditDegrees from "./components/AdminEditDegrees.jsx";
import AdminEditItems from "./components/AdminEditItems.jsx";
import AdminUsers from "./components/AdminUsers.jsx";
import BuyRegalia from "./pages/BuyRegalia";
import HireRegalia from "./pages/HireRegalia";
import UpdatePic from "@/components/UpdatePic.jsx";
import HomepageEdit from "./components/HomepageEdit.jsx";
import HomePage from "@/pages/HomePage.jsx";
import AdminIndOrder from "@/components/AdminIndOrder.jsx";
import AdminBulkOrder from "@/components/AdminBulkInstitutions.jsx";
import AdminImportBulk from "@/components/AdminImportBulk.jsx";
import EmailTemplatesPage from "@/pages/EmailTemplatesPage.jsx";
import PrintAddressLabels from "@/pages/PrintAddressLabels.jsx";
import AdminEditDelivery from "./components/AdminEditDelivery.jsx";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Authentication />} />
      <Route
        path="/"
        element={
          <Authentication>
            <HomePage />
          </Authentication>
        }
      />
      <Route
        path="/admineditceremonies"
        element={
          <Authentication>
            <AdminEditCeremonies />
          </Authentication>
        }
      />
      <Route
        path="/admineditdegrees"
        element={
          <Authentication>
            <AdminEditDegrees />
          </Authentication>
        }
      />
      <Route
        path="/adminedititems"
        element={
          <Authentication>
            <AdminEditItems />
          </Authentication>
        }
      />
      <Route
        path="/admintest"
        element={
          <Authentication>
            <UpdatePic />
          </Authentication>
        }
      />
      <Route
        path="/BuyRegalia"
        element={
          <Authentication>
            <BuyRegalia />
          </Authentication>
        }
      />
      <Route
        path="/HireRegalia"
        element={
          <Authentication>
            <HireRegalia />
          </Authentication>
        }
      />
      <Route
        path="/adminextractorders"
        element={
          <Authentication>
            <AdminExtractOrders />
          </Authentication>
        }
      />
      <Route
        path="/adminqueries"
        element={
          <Authentication>
            <Queries />
          </Authentication>
        }
      />
      <Route
        path="/HomepageEdit"
        element={
          <Authentication>
            <HomepageEdit />
          </Authentication>
        }
      />
      <Route
        path="/EmailEdit"
        element={
          <Authentication>
            <EmailTemplatesPage />
          </Authentication>
        }
      />
      <Route
        path="/adminusers"
        element={
          <Authentication>
            <AdminUsers />
          </Authentication>
        }
      />
      <Route
        path="/IndOrder"
        element={
          <Authentication>
            <AdminIndOrder />
          </Authentication>
        }
      />
      <Route
        path="/BulkOrder"
        element={
          <Authentication>
            <AdminBulkOrder />
          </Authentication>
        }
      />
      <Route
        path="/ImportBulk"
        element={
          <Authentication>
            <AdminImportBulk />
          </Authentication>
        }
      />
      <Route
        path="/PrintAddressLabels"
        element={
          <Authentication>
            <PrintAddressLabels />
          </Authentication>
        }
      />
      <Route
        path="/EditDelivery"
        element={
          <Authentication>
            <AdminEditDelivery />
          </Authentication>
        }
      />
    </Routes>
  );
}

export default App;
