import React, { useState } from "react";
import { motion } from "framer-motion";

const ConnectionDetails = ({ connection, onClose }) => {
  const getConnectionTypeColor = (type) => {
    switch (type) {
      case 'public_to_public':
        return 'bg-red-50 border-red-200';
      case 'private_to_public':
        return 'bg-green-50 border-green-200';
      case 'public_to_private':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatConnectionType = (type) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={`rounded-lg shadow-lg border p-6 ${getConnectionTypeColor(connection.type)}`}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold">Connection Details</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-200 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Connection Type</h4>
            <p className="text-lg font-medium">{formatConnectionType(connection.type)}</p>
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Protocol</h4>
            <p className="text-lg font-medium">{connection.protocol}</p>
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Timestamp</h4>
            <p className="text-lg font-medium">{connection.timestamp}</p>
          </div>
        </div>
        
        <div>
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Source IP</h4>
            <div className="flex items-center">
              <span className="text-lg font-medium">{connection.src}</span>
              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                connection.type.includes('private_to') ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {connection.type.includes('private_to') ? 'Private' : 'Public'}
              </span>
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Destination IP</h4>
            <div className="flex items-center">
              <span className="text-lg font-medium">{connection.dst}</span>
              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                connection.type.includes('to_private') ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {connection.type.includes('to_private') ? 'Private' : 'Public'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Connection Flow</h4>
        <div className="relative h-24 flex items-center justify-center">
          {/* Source IP */}
          <div className="absolute left-0 top-0 w-1/4 text-center">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
              connection.type.includes('private_to') ? 'bg-gray-200' : 'bg-blue-200'
            }`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="mt-2 text-sm font-medium truncate">{connection.src}</p>
          </div>
          
          {/* Arrow */}
          <div className="w-1/2 h-0.5 bg-gray-300 relative">
            <div 
              className={`absolute -top-1 right-0 h-3 w-3 transform rotate-45 border-t-2 border-r-2 ${
                connection.type === 'public_to_public' ? 'border-red-500' : 
                connection.type === 'private_to_public' ? 'border-green-500' : 
                'border-blue-500'
              }`}
            ></div>
          </div>
          
          {/* Destination IP */}
          <div className="absolute right-0 top-0 w-1/4 text-center">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
              connection.type.includes('to_private') ? 'bg-gray-200' : 'bg-blue-200'
            }`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="mt-2 text-sm font-medium truncate">{connection.dst}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ConnectionDetails;