import React, { useState } from "react";
import "./UpdatePic.css";

export default function UpdatePic() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [status, setStatus] = useState("");

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);

        if (selectedFile) {
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setStatus("Please select an image first.");
            return;
        }

        const formData = new FormData();
        formData.append("image", file);

        try {
            setStatus("Uploading...");

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Upload failed");
            const data = await response.json();

            setStatus("Uploaded successfully! File ID: " + data.fileId);
        } catch (err) {
            setStatus("Error: " + err.message);
        }
    };

    return (
        <div className="upload-container">
            <h3 className="upload-title">Upload Image</h3>

            <label className="custom-file-upload">
                Select Image
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                />
            </label>

            {file && <p className="file-name">{file.name}</p>}

            {preview && (
                <div className="preview-container">
                    <img src={preview} className="preview-image" alt="preview" />
                </div>
            )}

            <button className="upload-button" onClick={handleUpload}>
                Upload
            </button>

            {status && <p className="upload-status">{status}</p>}
        </div>
    );
}
