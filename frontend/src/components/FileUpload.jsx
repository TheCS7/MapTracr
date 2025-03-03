import React, { useState, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const FileUpload = ({ setLoading, onSuccess, onError }) => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    // Check file type
    const validTypes = ['application/vnd.tcpdump.pcap', 'application/octet-stream', 'application/x-pcapng'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!validTypes.includes(file.type) && !['pcap', 'pcapng'].includes(fileExtension)) {
      onError("Invalid file type. Please upload a .pcap or .pcapng file.");
      return;
    }
    
    // Check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      onError("File too large. Maximum size is 100MB.");
      return;
    }
    
    setFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      onError("Please select a file first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      if (response.data) {
        onSuccess(response.data);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      onError(error.response?.data?.error || "Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  const openFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4">Upload PCAP File</h2>
      
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept=".pcap,.pcapng"
          ref={fileInputRef}
        />
        
        <svg 
          className="w-12 h-12 mx-auto text-gray-400"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        
        <p className="mt-4 text-lg text-gray-700">
          Drag and drop your PCAP file here, or{" "}
          <button 
            type="button"
            className="text-blue-600 hover:text-blue-800 font-medium focus:outline-none"
            onClick={openFileSelector}
          >
            browse
          </button>
        </p>
        
        <p className="mt-2 text-sm text-gray-500">
          Supports .pcap and .pcapng files up to 100MB
        </p>
        
        {file && (
          <div className="mt-4 px-4 py-2 bg-blue-50 rounded flex items-center">
            <svg 
              className="w-5 h-5 text-blue-500 mr-2" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                fillRule="evenodd"
                d="M8 4a3 3 0 00-3 3v4a3 3 0 006 0V7a1 1 0 112 0v4a5 5 0 01-10 0V7a5 5 0 0110 0v4a1 1 0 11-2 0V7a3 3 0 00-3-3z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-gray-700 truncate max-w-xs">{file.name}</span>
            <span className="ml-2 text-gray-500 text-sm">
              ({(file.size / (1024 * 1024)).toFixed(2)} MB)
            </span>
          </div>
        )}
      </div>
      
      <div className="mt-6 flex justify-end">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleUpload}
          disabled={!file}
          className={`px-6 py-2 rounded-md text-white font-medium ${
            file 
              ? "bg-blue-600 hover:bg-blue-700" 
              : "bg-blue-300 cursor-not-allowed"
          }`}
        >
          Analyze Network Traffic
        </motion.button>
      </div>
    </div>
  );
};

export default FileUpload;