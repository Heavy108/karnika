"use client";

import { useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";

function UploadCard({
  fileObj,
  index,
  handleSwipeRight,
  handleSwipeLeft,
  autoSwipe,
  onAutoSwipeComplete,
  zIndex,
}) {
  const controls = useAnimation();
  const swipeThreshold = 100;

  const onDragEnd = (event, info) => {
    if (info.offset.x > swipeThreshold) {
      controls
        .start({ x: 500, opacity: 0, transition: { duration: 0.3 } })
        .then(() => {
          handleSwipeRight(index);
          controls.set({ x: 0, opacity: 1 });
        });
    } else if (info.offset.x < -swipeThreshold) {
      controls
        .start({ x: -500, opacity: 0, transition: { duration: 0.3 } })
        .then(() => {
          handleSwipeLeft(index);
        });
    } else {
      controls.start({
        x: 0,
        transition: { type: "spring", stiffness: 300 },
      });
    }
  };

  useEffect(() => {
    if (autoSwipe) {
      controls
        .start({ x: 500, opacity: 0, transition: { duration: 0.5 } })
        .then(() => {
          handleSwipeRight(index);
          onAutoSwipeComplete(index);
          controls.set({ x: 0, opacity: 1 });
        });
    }
  }, [autoSwipe, controls, handleSwipeRight, index, onAutoSwipeComplete]);

  return (
    <motion.div
      key={index}
      initial={{ x: 0, opacity: 1 }}
      animate={controls}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.5}
      onDragEnd={onDragEnd}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        border: "1px solid #ddd",
        padding: "1rem",
        zIndex: zIndex,
      }}
    >
      {fileObj.file.type.startsWith("image/") ? (
        <img
          src={fileObj.preview}
          alt="preview"
          style={{ maxWidth: "100%", height: "auto" }}
        />
      ) : (
        <div
          style={{
            padding: "2rem",
            background: "#f9f9f9",
            textAlign: "center",
          }}
        >
          {fileObj.file.name}
        </div>
      )}

      {fileObj.isLoading && <p style={{ color: "blue" }}>Processing...</p>}
      {fileObj.error && (
        <p style={{ color: "red" }}>
          <strong>Error:</strong> {fileObj.error}
        </p>
      )}
      {fileObj.result && (
        <div>
          <h3>Extracted Text:</h3>
          <pre style={{ background: "#f4f4f4", padding: "1rem" }}>
            {fileObj.result}
          </pre>
        </div>
      )}
      <p style={{ fontSize: "0.8rem", color: "#666" }}>
        Swipe right to re-fetch result, swipe left to delete.
      </p>
    </motion.div>
  );
}

export default function UploadPage() {
  const [filesData, setFilesData] = useState([]);
  const [overallLoading, setOverallLoading] = useState(false);
  const [csvFileName, setCsvFileName] = useState("document_data.csv");
  const [autoSwipeIndex, setAutoSwipeIndex] = useState(null);

  const updateFileData = (index, newData) => {
    setFilesData((prevFiles) =>
      prevFiles.map((fileObj, idx) =>
        idx === index ? { ...fileObj, ...newData } : fileObj
      )
    );
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files).map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
      result: "",
      error: "",
      isLoading: false,
    }));
    setFilesData(selectedFiles);
  };

 const handleSwipeRight = async (index) => {
   // Set the card to a loading state
   updateFileData(index, { isLoading: true, error: "", result: "" });
   const fileObj = filesData[index];
   const formData = new FormData();
   formData.append("file", fileObj.file);
   formData.append("csvName", csvFileName);

   try {
     const response = await fetch("/api/document", {
       method: "POST",
       body: formData,
     });
     if (!response.ok) {
       throw new Error("File upload failed. Please try again.");
     }
     const data = await response.json();
     if (data.error) {
       updateFileData(index, { error: data.error });
     } else {
       // After a successful upload, remove the file from preview.
       setFilesData((prevFiles) => prevFiles.filter((_, idx) => idx !== index));
       // If you prefer to keep the card but hide the image, you can instead update the fileObj to hide it.
     }
   } catch (err) {
     updateFileData(index, { error: err.message });
   }
   updateFileData(index, { isLoading: false });
 };


  const handleSwipeLeft = (index) => {
    setFilesData((prevFiles) => prevFiles.filter((_, idx) => idx !== index));
  };

  const handleUploadAll = (event) => {
    event.preventDefault();
    if (filesData.length === 0) return;
    setOverallLoading(true);
    setAutoSwipeIndex(0);
  };

  const onAutoSwipeComplete = (completedIndex) => {
    if (completedIndex === autoSwipeIndex) {
      if (autoSwipeIndex + 1 < filesData.length) {
        setAutoSwipeIndex(autoSwipeIndex + 1);
      } else {
        setOverallLoading(false);
        setAutoSwipeIndex(null);
      }
    }
  };

  const handleDownloadCsv = async () => {
    try {
      const response = await fetch(
        `/api/download-csv?csvName=${encodeURIComponent(csvFileName)}`
      );
      if (!response.ok) {
        throw new Error("Failed to download CSV file");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = csvFileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download CSV error:", error);
      alert("Error downloading CSV file: " + error.message);
    }
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "2rem auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Multiple File Upload and Swipe</h1>

      <div style={{ marginBottom: "1rem" }}>
        <label
          htmlFor="csvName"
          style={{ display: "block", marginBottom: "0.5rem" }}
        >
          CSV File Name (include .csv extension):
        </label>
        <input
          id="csvName"
          type="text"
          value={csvFileName}
          onChange={(e) => setCsvFileName(e.target.value)}
          style={{ padding: "0.5rem", width: "100%" }}
        />
      </div>

      <form onSubmit={handleUploadAll}>
        <label
          htmlFor="fileInput"
          style={{ display: "block", marginBottom: "0.5rem" }}
        >
          Select Files (images or PDFs):
        </label>
        <input
          id="fileInput"
          type="file"
          multiple
          onChange={handleFileChange}
        />
        <button
          type="submit"
          disabled={overallLoading}
          style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
        >
          {overallLoading ? "Processing..." : "Upload All"}
        </button>
      </form>

      <button
        onClick={handleDownloadCsv}
        style={{
          marginTop: "1.5rem",
          padding: "0.5rem 1rem",
          backgroundColor: "#0070f3",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Download CSV
      </button>

      {filesData.length > 0 && (
        <div
          style={{
            position: "relative",
            height: "400px", // Adjust this value based on your design
            marginTop: "2rem",
          }}
        >
          <h2>Uploaded Files</h2>
          {filesData.map((fileObj, index) => (
            <UploadCard
              key={index}
              fileObj={fileObj}
              index={index}
              handleSwipeRight={handleSwipeRight}
              handleSwipeLeft={handleSwipeLeft}
              autoSwipe={autoSwipeIndex === index}
              onAutoSwipeComplete={onAutoSwipeComplete}
              zIndex={filesData.length - index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
