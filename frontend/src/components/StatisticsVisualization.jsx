import React, { useState, useEffect } from 'react';
import { LineChart, BarChart, PieChart, Cell, Bar, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line } from 'recharts';

const StatisticsVisualization = ({ statsData }) => {
  const [protocolData, setProtocolData] = useState([]);
  const [connectionData, setConnectionData] = useState([]);
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  
  useEffect(() => {
    if (statsData) {
      // Format protocol data for pie chart
      if (statsData.protocols) {
        const protocols = Object.entries(statsData.protocols).map(([name, count]) => ({
          name,
          value: count
        }));
        setProtocolData(protocols);
      }
      
      // Format connection type data for bar chart
      const connectionTypes = [
        { name: 'Public to Public', value: statsData.public_connections || 0 },
        { name: 'Private to Public', value: statsData.private_to_public || 0 },
        { name: 'Public to Private', value: statsData.public_to_private || 0 },
      ];
      setConnectionData(connectionTypes);
      
      // Generate time series data from connections
      if (statsData.connections && statsData.connections.length > 0) {
        // Group connections by hour
        const connectionsByHour = {};
        
        statsData.connections.forEach(conn => {
          if (conn.timestamp) {
            // Extract hour from timestamp (format: YYYY-MM-DD HH:MM:SS)
            const hour = conn.timestamp.split(' ')[1].split(':')[0] + ":00";
            
            if (!connectionsByHour[hour]) {
              connectionsByHour[hour] = { 
                hour,
                'Public to Public': 0,
                'Private to Public': 0,
                'Public to Private': 0
              };
            }
            
            // Increment the correct connection type
            if (conn.type === 'public_to_public') {
              connectionsByHour[hour]['Public to Public']++;
            } else if (conn.type === 'private_to_public') {
              connectionsByHour[hour]['Private to Public']++;
            } else if (conn.type === 'public_to_private') {
              connectionsByHour[hour]['Public to Private']++;
            }
          }
        });
        
        // Convert to array and sort by hour
        const timeData = Object.values(connectionsByHour).sort((a, b) => 
          a.hour.localeCompare(b.hour)
        );
        
        setTimeSeriesData(timeData);
      }
    }
  }, [statsData]);
  
  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  return (
    <div className="bg-gray-100 rounded-lg p-5 my-5 shadow">
      <h2 className="text-2xl text-gray-800 mb-5 text-center font-bold">Network Traffic Analysis</h2>
      
      <div className="mb-8 p-4 bg-white rounded-lg shadow-sm">
        <h3 className="text-lg text-gray-700 mb-3 pb-2 border-b border-gray-200">Protocol Distribution</h3>
        {protocolData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={protocolData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {protocolData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} connections`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No protocol data available</p>
        )}
      </div>
      
      <div className="mb-8 p-4 bg-white rounded-lg shadow-sm">
        <h3 className="text-lg text-gray-700 mb-3 pb-2 border-b border-gray-200">Connection Types</h3>
        {connectionData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={connectionData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} connections`, 'Count']} />
                <Legend />
                <Bar dataKey="value" name="Connections" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No connection type data available</p>
        )}
      </div>
      
      <div className="mb-8 p-4 bg-white rounded-lg shadow-sm">
        <h3 className="text-lg text-gray-700 mb-3 pb-2 border-b border-gray-200">Connection Activity Over Time</h3>
        {timeSeriesData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={timeSeriesData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Public to Public" stroke="#0088FE" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Private to Public" stroke="#00C49F" />
                <Line type="monotone" dataKey="Public to Private" stroke="#FFBB28" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No time series data available</p>
        )}
      </div>
      
      <div className="p-4 bg-white rounded-lg shadow-sm">
        <h3 className="text-lg text-gray-700 mb-3 pb-2 border-b border-gray-200">Network Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-gray-50 p-3 rounded-md flex flex-col items-center text-center">
            <span className="text-sm text-gray-600 mb-1">Total Connections</span>
            <span className="text-xl font-semibold text-blue-600">{statsData.total_connections || 0}</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-md flex flex-col items-center text-center">
            <span className="text-sm text-gray-600 mb-1">Unique Source IPs</span>
            <span className="text-xl font-semibold text-blue-600">{statsData.unique_sources || 0}</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-md flex flex-col items-center text-center">
            <span className="text-sm text-gray-600 mb-1">Unique Destination IPs</span>
            <span className="text-xl font-semibold text-blue-600">{statsData.unique_destinations || 0}</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-md flex flex-col items-center text-center">
            <span className="text-sm text-gray-600 mb-1">Countries</span>
            <span className="text-xl font-semibold text-blue-600">{statsData.countries ? Object.keys(statsData.countries).length : 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsVisualization;