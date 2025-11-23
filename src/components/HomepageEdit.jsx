import React, { useMemo, useState, useEffect } from "react";
import "./HomepageEdit.css";

const API_BASE = import.meta.env.VITE_GOWN_API_BASE;
const PAGE_SIZE = 15;

function getPages(items) {
  return Array.from(new Set(items.map((i) => i.page)));
}

function getSectionsForPage(items, page) {
  return Array.from(
    new Set(items.filter((i) => i.page === page).map((i) => i.section))
  );
}

export default function HomepageEdit() {
  const [items, setItems] = useState([]);
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

  const [currentPage, setCurrentPage] = useState(1);

  // Load CMS blocks from the API on mount
  useEffect(() => {
    async function loadBlocks() {
      try {
        const res = await fetch(`${API_BASE}/api/CmsContent`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to load CMS blocks (${res.status}): ${text}`);
        }
        const json = await res.json();
        setItems(json.data || []);
      } catch (err) {
        console.error(err);
        setStatusError(
          err instanceof Error ? err.message : "Failed to load CMS content."
        );
      }
    }

    loadBlocks();
  }, []);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageFilter, sectionFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / PAGE_SIZE) || 1
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, currentPage]);

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

  // Save text block via CMS API
  async function handleSaveText() {
    if (!selectedItem || selectedItem.type !== "text") return;

    setIsSaving(true);
    setStatusMessage("");
    setStatusError("");

    try {
      const res = await fetch(`${API_BASE}/api/CmsContent/save-text`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: selectedItem.key,
          text: editText,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to save text (${res.status}): ${text}`);
      }

      const json = await res.json();
      const updated = json.data;

      const newValue =
        (updated && typeof updated.value === "string" && updated.value) ||
        editText;

      const updatedAt =
        (updated && updated.updatedAt && updated.updatedAt.slice(0, 10)) ||
        new Date().toISOString().slice(0, 10);

      setItems((prev) =>
        prev.map((item) =>
          item.id === selectedItem.id
            ? { ...item, value: newValue, updatedAt }
            : item
        )
      );

      setSelectedItem((prev) =>
        prev && prev.id === selectedItem.id
          ? { ...prev, value: newValue, updatedAt }
          : prev
      );

      setStatusMessage(json.message || "Text updated successfully.");
    } catch (err) {
      setStatusError(
        err instanceof Error ? err.message : "Failed to save text."
      );
    } finally {
      setIsSaving(false);
    }
  }

  // Upload image via CMS API (/api/CmsContent/upload-image)
  async function handleUploadImage() {
    if (!selectedItem || selectedItem.type !== "image" || !editFile) return;

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
      formData.append("Key", selectedItem.key);
      formData.append("File", editFile);

      const response = await fetch(`${API_BASE}/api/CmsContent/upload-image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Upload failed (${response.status}): ${text}`);
      }

      const json = await response.json();
      const data = json.data || {};
      const newUrl = data.url || (data.block && data.block.value) || "";

      if (!newUrl) {
        throw new Error(
          "Upload succeeded but response did not contain the image URL."
        );
      }

      const updatedAt =
        (data.block &&
          data.block.updatedAt &&
          data.block.updatedAt.slice(0, 10)) ||
        new Date().toISOString().slice(0, 10);

      setImageError(false);

      setItems((prev) =>
        prev.map((item) =>
          item.id === selectedItem.id
            ? { ...item, value: newUrl, updatedAt }
            : item
        )
      );

      setSelectedItem((prev) =>
        prev && prev.id === selectedItem.id
          ? { ...prev, value: newUrl, updatedAt }
          : prev
      );

      setStatusMessage(json.message || "Image updated successfully.");
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
              pagedItems.map((item) => (
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
                  <td>{item.updatedAt && item.updatedAt.slice(0, 10)}</td>
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

        {filteredItems.length > 0 && (
          <div className="acm-pagination">
            <span className="acm-pagination-info">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filteredItems.length)} of{" "}
              {filteredItems.length}
            </span>
            <div className="acm-pagination-buttons">
              <button
                type="button"
                className="acm-button small"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="acm-pagination-page">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                className="acm-button small"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
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
