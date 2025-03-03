import React from "react";
import logo from '../assets/logo.png';

const Header = () => {
  return (
    <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center">
            <img src={logo} alt="MapTrackr Logo" className="h-16 w-auto mr-3" />
            <div>
              <h1 className="text-3xl font-bold">MapTrackr</h1>
              <p className="text-blue-200 mt-1">Network Traffic Geolocation Analyzer</p>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col items-end">
            <a 
              href="https://github.com/yourusername/maptrackr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white text-blue-700 rounded hover:bg-blue-100 transition-colors"
            >
              GitHub
            </a>
            <p className="text-blue-200 mt-2 text-sm">Developed by Th3cs7</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;