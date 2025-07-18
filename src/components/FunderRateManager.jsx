// src/components/FunderRateManager.jsx
import React, { useState } from 'react';
import { useFunderRates } from '../hooks/useFunderRates.js';

export function FunderRateManager() {
  const { rates, updateRate, rateHistory } = useFunderRates();
  const [selectedFunder, setSelectedFunder] = useState('westpac');
  const [newRate, setNewRate] = useState('');
  const [reason, setReason] = useState('');

  const handleUpdateRate = (e) => {
    e.preventDefault();
    if (newRate && reason) {
      updateRate(selectedFunder, parseFloat(newRate) / 100, reason);
      setNewRate('');
      setReason('');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Funder Rate Management</h2>
      
      {/* Current Rates Display */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Current Rates</h3>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(rates).map(([funder, rate]) => (
            <div key={funder} className="bg-gray-50 p-3 rounded">
              <div className="font-medium">{funder.toUpperCase()}</div>
              <div className="text-2xl font-bold text-blue-600">
                {(rate * 100).toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rate Update Form */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Update Rate</h3>
        <form onSubmit={handleUpdateRate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Funder</label>
              <select 
                value={selectedFunder}
                onChange={(e) => setSelectedFunder(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="westpac">Westpac</option>
                <option value="cba">CBA</option>
                <option value="pepper">Pepper</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">New Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                placeholder="6.35"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reason</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Westpac funding cost increase"
              className="w-full p-2 border rounded"
            />
          </div>
          <button 
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Update Rate
          </button>
        </form>
      </div>

      {/* Rate History */}
      {rateHistory.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Recent Changes</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {rateHistory.slice(-5).reverse().map((change, index) => (
              <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                <div className="font-medium">{change.funder.toUpperCase()}</div>
                <div>
                  {(change.previousRate * 100).toFixed(2)}% → {(change.newRate * 100).toFixed(2)}%
                </div>
                <div className="text-gray-600">{change.reason}</div>
                <div className="text-xs text-gray-500">
                  {change.timestamp.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}