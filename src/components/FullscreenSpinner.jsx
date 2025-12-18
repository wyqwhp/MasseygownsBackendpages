import ReactDOM from "react-dom";
import React from "react";
import "./Spinner.css";

export default function FullscreenSpinner() {
  return ReactDOM.createPortal(
    <div className="spinner-overlay">
      <div className="spinner-center"></div>
    </div>,
    document.body
  );
}
