import React from "react";
import "./HomePage.css";
import AdminNavbar from "@/components/AdminNavbar";

export default function HomePage() {
  return (
    <>
      <AdminNavbar />
      <div className="top-container">
        <div className="flex items-center justify-center min-h-screen pt-20">
          <img src="/cms.svg" alt="CMS logo" className="w-192 h-auto" />
        </div>
      </div>
    </>
  );
}
