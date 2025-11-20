import React, { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_GOWN_API_BASE;

export default function HomePageAdminHero() {
  // Current hero image URL from server
  const [currentHeroUrl, setCurrentHeroUrl] = useState(null);

  // File selected by admin
  const [selectedFile, setSelectedFile] = useState(null);

  // Local preview URL
  const [previewUrl, setPreviewUrl] = useState(null);

  // Loading states
  const [isLoadingCurrent, setIsLoadingCurrent] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Error & message
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  /**
   * Load current hero image from API
   */
  useEffect(() => {
    async function loadCurrentHero() {
      setIsLoadingCurrent(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE_URL}/api/HomePage`);
        if (!res.ok) throw new Error("Failed to load hero image.");

        const data = await res.json();
        setCurrentHeroUrl(data.heroImageUrl || null);
      } catch (err) {
        setError(err.message || "Failed to fetch hero image.");
      } finally {
        setIsLoadingCurrent(false);
      }
    }

    loadCurrentHero();
  }, []);

  /**
   * When admin selects a file, save it and create a local preview
   */
  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    setSelectedFile(file);
    setMessage(null);
    setError(null);

    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  /**
   * Upload new hero image to backend
   */
  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select an image file.");
      return;
    }

    // Max 5 MB limit
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB.");
      return;
    }

    // Allowed types
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Only JPG, PNG or WEBP files are allowed.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch(`${API_BASE_URL}/api/HomePage/hero-image`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed with status ${res.status}`);
      }

      const data = await res.json();
      const newUrl = data?.data?.heroImageUrl;

      if (newUrl) {
        setCurrentHeroUrl(newUrl);
      }

      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);

      setMessage(data.message || "Hero image updated successfully.");
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Home Page – Hero Image</h2>

      {/* Current hero image panel */}
      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="font-medium">Current Hero Image</h3>

        {isLoadingCurrent ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : currentHeroUrl ? (
          <>
            <img
              src={currentHeroUrl}
              alt="Current Hero"
              className="max-h-64 object-cover border rounded-md"
            />
            <a
              href={currentHeroUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 underline"
            >
              Open full image
            </a>
          </>
        ) : (
          <p className="text-sm text-gray-500">No hero image set yet.</p>
        )}
      </div>

      {/* Upload new hero image */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="font-medium">Upload New Hero Image</h3>

        <div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
          />
          <p className="text-xs text-gray-500">
            Allowed: JPG, PNG, WEBP — Max size: 5MB
          </p>
        </div>

        {/* Preview */}
        {previewUrl && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Preview</p>
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-64 object-cover border rounded-md"
            />
          </div>
        )}

        {/* Error & success messages */}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}

        {/* Upload button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className={`px-4 py-2 rounded-md text-white ${
            !selectedFile || isUploading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isUploading ? "Uploading..." : "Upload New Hero Image"}
        </button>
      </div>
    </div>
  );
}
