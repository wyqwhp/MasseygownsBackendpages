import React from "react";

export default function SpinnerButton({
                                          onClick,
                                          loading,
                                          children,
                                          className = "",
                                          disabled = false
                                      }) {
    return (
        <button
            onClick={!loading ? onClick : undefined}
            disabled={loading || disabled}
            className={className}
            style={{
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                background: "none",
                border: "none",
                padding: 0,
                font: "inherit",
            }}
        >
            {loading ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span className="loader"></span> Processing...
        </span>
            ) : (
                children
            )}
        </button>
    );
}
