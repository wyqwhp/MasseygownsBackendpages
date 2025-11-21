import React, { useMemo, useState } from "react";
import "./HomepageEdit.css";

const SEED_ITEMS = [
  {
    id: 1,
    page: "Homepage",
    section: "Hero Section",
    key: "home.heroImage", // wired to POST /api/HomePage/hero-image
    type: "image",
    label: "Homepage hero image",
    updatedAt: "2025-11-19",
    value:
      "https://masseygownsblob.blob.core.windows.net/site-assets/your-hero-image.png",
  },
  {
    id: 2,
    page: "Homepage",
    section: "Graduation Ceremony",
    key: "home.ceremonyImage", // wired to POST /api/HomePage/ceremony-image
    type: "image",
    label: "Ceremony section image",
    updatedAt: "2025-11-20",
    value: "/cere_img.png", // fallback 本地图
  },
  {
    id: 3,
    page: "Homepage",
    section: "Graduation Ceremony",
    key: "home.ceremonyText", // wired to POST /api/HomePage/ceremony-text
    type: "text",
    label: "Intro text for ceremony section",
    updatedAt: "2025-11-20",
    value:
      "Your graduation ceremony is a formal celebration of your achievement, and you are encouraged to dress appropriately.\n\nAll graduands are required to wear academic regalia at the graduation ceremony.\n\nAppropriate dress is considered to be\nMen: suit and tie and applicable academic dress.\nWomen: formal clothes and applicable academic dress.",
  },
];

function getPages(items) {
  return Array.from(new Set(items.map((i) => i.page)));
}

function getSectionsForPage(items, page) {
  return Array.from(
    new Set(items.filter((i) => i.page === page).map((i) => i.section))
  );
}

const API_BASE = import.meta.env.VITE_GOWN_API_BASE;

export default function HomepageEdit() {
  const [items, setItems] = useState(SEED_ITEMS);

  const [search, setSearch] = useState("");
  const [pageFilter, setPageFilter] = useState("All");
  const [sectionFilter, setSectionFilter] = useState("All");

  const [selectedItem, setSelectedItem] = useState(null);

  const [editText, setEditText] = useState("");
  const [editFile, setEditFile] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState("");

  const [imageError, setImageError] = useState(false);

  const pages = useMemo(() => getPages(items), [items]);

  const sections = useMemo(
    () => (pageFilter === "All" ? [] : getSectionsForPage(items, pageFilter)),
    [items, pageFilter]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (pageFilter !== "All" && item.page !== pageFilter) return false;
      if (
        sectionFilter !== "All" &&
        sectionFilter !== "" &&
        item.section !== sectionFilter
      )
        return false;

      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return (
        item.page.toLowerCase().includes(s) ||
        item.section.toLowerCase().includes(s) ||
        item.label.toLowerCase().includes(s) ||
        item.key.toLowerCase().includes(s)
      );
    });
  }, [items, search, pageFilter, sectionFilter]);

  function handleSelectItem(item) {
    setSelectedItem(item);
    setStatusMessage("");
    setStatusError("");
    setEditFile(null);
    setEditText(item.type === "text" ? item.value || "" : "");
    setImageError(false);
  }

  function handleCloseModal() {
    setSelectedItem(null);
    setStatusMessage("");
    setStatusError("");
    setEditFile(null);
    setEditText("");
    setIsSaving(false);
    setImageError(false);
  }

  function handlePageChange(e) {
    const value = e.target.value;
    setPageFilter(value);
    setSectionFilter("All");
    setSelectedItem(null);
    setStatusMessage("");
    setStatusError("");
  }

  async function handleSaveText() {
    if (!selectedItem) return;

    setIsSaving(true);
    setStatusMessage("");
    setStatusError("");

    try {
      const today = new Date().toISOString().slice(0, 10);

      if (selectedItem.key === "home.ceremonyText") {
        const res = await fetch(`${API_BASE}/api/HomePage/ceremony-text`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: editText }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(
            `Failed to save ceremony text (${res.status}): ${text}`
          );
        }

        const json = await res.json();
        const newText =
          (json &&
            json.data &&
            typeof json.data.ceremonyText === "string" &&
            json.data.ceremonyText) ||
          editText;

        setItems((prev) =>
          prev.map((item) =>
            item.id === selectedItem.id
              ? { ...item, value: newText, updatedAt: today }
              : item
          )
        );

        setSelectedItem((prev) =>
          prev && prev.id === selectedItem.id
            ? { ...prev, value: newText, updatedAt: today }
            : prev
        );

        setStatusMessage(
          (json && json.message) || "Ceremony text updated successfully."
        );
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500));

        setItems((prev) =>
          prev.map((item) =>
            item.id === selectedItem.id
              ? { ...item, value: editText, updatedAt: today }
              : item
          )
        );

        setSelectedItem((prev) =>
          prev && prev.id === selectedItem.id
            ? { ...prev, value: editText, updatedAt: today }
            : prev
        );

        setStatusMessage("Text updated (mock only, no API yet).");
      }
    } catch (err) {
      setStatusError(
        err instanceof Error ? err.message : "Failed to save text."
      );
    } finally {
      setIsSaving(false);
    }
  }

  // ---------- 上传图片：Hero & Ceremony 都走真实 API ----------
  async function handleUploadImage() {
    if (!selectedItem || !editFile) return;

    setIsSaving(true);
    setStatusMessage("");
    setStatusError("");

    try {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(editFile.type)) {
        throw new Error("Only JPG, PNG, and WEBP images are allowed.");
      }
      const maxSize = 5 * 1024 * 1024;
      if (editFile.size > maxSize) {
        throw new Error("File is too large. Maximum size is 5MB.");
      }

      const formData = new FormData();
      formData.append("file", editFile);

      let endpoint = "";
      let fieldName = "";

      if (selectedItem.key === "home.heroImage") {
        endpoint = "hero-image";
        fieldName = "heroImageUrl";
      } else if (selectedItem.key === "home.ceremonyImage") {
        endpoint = "ceremony-image";
        fieldName = "ceremonyImageUrl";
      } else {
        await new Promise((resolve) => setTimeout(resolve, 400));
        setStatusMessage(
          "This image block is not connected to an API yet (mock only)."
        );
        setEditFile(null);
        setIsSaving(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/HomePage/${endpoint}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Upload failed (${response.status}): ${text}`);
      }

      const json = await response.json();
      const newUrl =
        (json && json.data && json.data[fieldName]) || json[fieldName] || "";

      if (!newUrl) {
        throw new Error(
          "Upload succeeded but response did not contain the image URL."
        );
      }

      const today = new Date().toISOString().slice(0, 10);
      setImageError(false);

      setItems((prev) =>
        prev.map((item) =>
          item.id === selectedItem.id
            ? { ...item, value: newUrl, updatedAt: today }
            : item
        )
      );

      setSelectedItem((prev) =>
        prev && prev.id === selectedItem.id
          ? { ...prev, value: newUrl, updatedAt: today }
          : prev
      );

      setStatusMessage((json && json.message) || "Image updated successfully.");
      setEditFile(null);
    } catch (err) {
      setStatusError(
        err instanceof Error ? err.message : "Failed to upload image."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="admin-content-manager">
      <h1 className="acm-title">Site Content Manager</h1>

      <div className="acm-toolbar">
        <div className="acm-search-wrapper">
          <input
            type="text"
            className="acm-search-input"
            placeholder="Search by page, section, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="acm-filters">
          <select
            className="acm-filter-select"
            value={pageFilter}
            onChange={handlePageChange}
          >
            <option value="All">All pages</option>
            {pages.map((page) => (
              <option key={page} value={page}>
                {page}
              </option>
            ))}
          </select>

          <select
            className="acm-filter-select"
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            disabled={pageFilter === "All"}
          >
            <option value="All">All sections</option>
            {sections.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="acm-table-wrapper">
        <table className="acm-table">
          <thead>
            <tr>
              <th>Page</th>
              <th>Section</th>
              <th>Content</th>
              <th>Updated</th>
              <th>Check &amp; update</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="acm-table-empty">
                  No content blocks match your filters.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr
                  key={item.id}
                  className={
                    selectedItem && selectedItem.id === item.id
                      ? "acm-row-selected"
                      : ""
                  }
                >
                  <td>{item.page}</td>
                  <td>{item.section}</td>
                  <td>
                    <div className="acm-cell-label">
                      <div className="acm-cell-label-main">{item.label}</div>
                      <div className="acm-cell-label-key">
                        {item.type.toUpperCase()} · {item.key}
                      </div>
                    </div>
                  </td>
                  <td>{item.updatedAt}</td>
                  <td>
                    <button
                      type="button"
                      className="acm-button small"
                      onClick={() => handleSelectItem(item)}
                    >
                      Check &amp; update
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedItem && (
        <div className="acm-modal-overlay" onClick={handleCloseModal}>
          <div
            className="acm-modal"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="acm-modal-header">
              <h2 className="acm-detail-title">
                {selectedItem.page} · {selectedItem.section}
              </h2>
              <button
                type="button"
                className="acm-modal-close"
                onClick={handleCloseModal}
              >
                ×
              </button>
            </div>

            <p className="acm-detail-subtitle">
              {selectedItem.label} ({selectedItem.type.toUpperCase()} ·{" "}
              {selectedItem.key})
            </p>

            {(statusMessage || statusError) && (
              <div
                className={
                  statusError
                    ? "acm-status-message error"
                    : "acm-status-message success"
                }
              >
                {statusError || statusMessage}
              </div>
            )}

            {selectedItem.type === "text" ? (
              <div className="acm-detail-body">
                <label className="acm-detail-label">Current / new text</label>
                <textarea
                  className="acm-textarea"
                  rows={6}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                />
                <div className="acm-detail-actions">
                  <button
                    type="button"
                    className="acm-button secondary"
                    onClick={handleCloseModal}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="acm-button primary"
                    onClick={handleSaveText}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="acm-detail-body">
                <label className="acm-detail-label">Current image</label>
                {(() => {
                  const currentUrl = selectedItem.value || "";
                  const hasHttpUrl =
                    currentUrl.startsWith("http://") ||
                    currentUrl.startsWith("https://");
                  const canShowImage = hasHttpUrl && !imageError;
                  const fileInputId = `acm-file-input-${selectedItem.id}`;

                  return (
                    <>
                      <div className="acm-image-preview">
                        {canShowImage ? (
                          <img
                            key={currentUrl}
                            src={currentUrl}
                            alt={selectedItem.label}
                            onError={() => setImageError(true)}
                          />
                        ) : (
                          <div className="acm-image-placeholder">
                            Image will appear here after it is uploaded.
                          </div>
                        )}
                      </div>

                      {hasHttpUrl && (
                        <a
                          href={currentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="acm-link"
                        >
                          Open full image
                        </a>
                      )}

                      <label className="acm-detail-label">
                        Upload new image
                      </label>
                      <div className="acm-file-row">
                        <input
                          id={fileInputId}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="acm-hidden-file-input"
                          onChange={(e) => {
                            const file =
                              e.target.files && e.target.files[0]
                                ? e.target.files[0]
                                : null;
                            setEditFile(file);
                            setStatusMessage("");
                            setStatusError("");
                          }}
                        />
                        <label
                          htmlFor={fileInputId}
                          className="acm-file-button"
                        >
                          Choose file
                        </label>
                        <span className="acm-file-name">
                          {editFile ? editFile.name : "No file chosen"}
                        </span>
                      </div>

                      <p className="acm-detail-help">
                        Allowed formats: JPG, PNG, WEBP. Max size: 5MB.
                      </p>

                      <div className="acm-detail-actions">
                        <button
                          type="button"
                          className="acm-button secondary"
                          onClick={handleCloseModal}
                          disabled={isSaving}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="acm-button primary"
                          disabled={isSaving || !editFile}
                          onClick={handleUploadImage}
                        >
                          {isSaving ? "Uploading..." : "Upload & replace"}
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
