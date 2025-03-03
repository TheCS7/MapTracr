import React, { useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import FileUpload from "./components/FileUpload";
import Map from "./components/Map";
import Dashboard from "./components/Dashboard";
import Header from "./components/Header";
import logo from "./assets/logo.png"; // Import the logo

const App = () => {
  const [kmlUrl, setKmlUrl] = useState(null);
  const [statsUrl, setStatsUrl] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultId, setResultId] = useState(null);

  const handleUploadSuccess = (data) => {
    setKmlUrl(data.kml_url);
    setStatsUrl(data.stats_url);
    setStats(data.summary);
    setResultId(data.result_id);
    toast.success("File processed successfully!");
  };

  const handleUploadError = (error) => {
    toast.error(error || "Failed to process file");
  };

  return (
    <div className="min-h-screen bg-gray-100 relative overflow-hidden">

      <Toaster position="top-right" />
      <Header />
      <div className="container mx-auto px-4 py-6 relative" style={{ zIndex: 1 }}>
        <div className="grid grid-cols-1 gap-6">
          <FileUpload
            setLoading={setLoading}
            onSuccess={handleUploadSuccess}
            onError={handleUploadError}
          />

          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-lg">Processing your file...</p>
            </div>
          )}

          {!loading && kmlUrl && stats && (
            <>
              <Dashboard
                stats={stats}
                statsUrl={statsUrl}
                resultId={resultId}
              />
              <Map kmlUrl={kmlUrl} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;