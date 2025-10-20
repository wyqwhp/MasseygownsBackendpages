import Queries from "./components/AdminQueries.jsx";
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Authentication from "@/components/Authentication.jsx";
import AdminNavbar from "@/pages/AdminNavbar.jsx";
import AdminEditCeremonies from "./components/AdminEditCeremonies.jsx";
import AdminExtractOrders from "./components/AdminExtractOrders.jsx";
import AdminEditDegrees from "./components/AdminEditDegrees.jsx";
import BuyRegalia from "./pages/BuyRegalia";
import HireRegalia from "./pages/HireRegalia";

function App() {
  return (
      <Routes>
        <Route path="/login" element={<Authentication />}/>
        <Route path="/" element={
            <Authentication>
              <AdminNavbar />
            </Authentication>
        }/>
        <Route path="/admineditceremonies" element={
            <Authentication>
                <AdminEditCeremonies/>
            </Authentication>
        }/>
        <Route path="/admineditdegrees" element={
            <Authentication>
                <AdminEditDegrees/>
            </Authentication>
        }/>
        <Route path="/BuyRegalia" element={
            <Authentication>
                <BuyRegalia/>
            </Authentication>
        }/>
        <Route path="/HireRegalia" element={
            <Authentication>
                <HireRegalia/>
            </Authentication>
        }/>
        <Route path="/adminextractorders" element={
            <Authentication>
                <AdminExtractOrders/>
            </Authentication>
        }/>
          <Route path="/adminqueries" element={
              <Authentication>
                  <Queries/>
              </Authentication>
          }/>
      </Routes>
  );
}

export default App;
