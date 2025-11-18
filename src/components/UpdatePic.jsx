import React, {useEffect, useState} from "react";
import "./UpdatePic.css";

export const PlaceholderImage = () => (
    <div className="w-24 h-24 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center mx-auto">
        <svg
            className="block w-12 h-12"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="gray"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 7L12 3 2 7l10 4 10-4z" />
            <path d="M6 10v6c4 2.5 8 2.5 12 0v-6" />
            <path d="M12 12v8" />
        </svg>
    </div>
);

export default function UpdatePic(image) {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [status] = useState("");



    useEffect(() => {
        console.log('image=', image['image']);
        if (image['image'] != null) {
            const dataUrl = image['image'].startsWith("data:")
                ? image['image']
                : `data:image/jpeg;base64,${image['image']}`;

            setPreview(dataUrl);
        }
    }, []);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);

        if (selectedFile) {
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    // const handleUpload = async () => {
    //     if (!file) {
    //         setStatus("Please select an image first.");
    //         return;
    //     }
    //
    //     const formData = new FormData();
    //     formData.append("image", file);
    //
    //     try {
    //         setStatus("Uploading...");
    //
    //         const response = await fetch("/api/upload", {
    //             method: "POST",
    //             body: formData,
    //         });
    //
    //         if (!response.ok) throw new Error("Upload failed");
    //         const data = await response.json();
    //
    //         setStatus("Uploaded successfully! File ID: " + data.fileId);
    //     } catch (err) {
    //         setStatus("Error: " + err.message);
    //     }
    // };

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

            {preview ? (
                <div className="preview-container">
                    <img src={preview} className="preview-image" alt="preview" />
                </div>
            ) : (
                <PlaceholderImage />
            )}

            {/*<button className="upload-button" onClick={handleUpload}>*/}
            {/*    Upload*/}
            {/*</button>*/}

            {status && <p className="upload-status">{status}</p>}
        </div>
    );
}
