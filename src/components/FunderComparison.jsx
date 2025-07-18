// src/components/FunderComparison.jsx
import React, { useState, useMemo } from 'react';
import { useFunderRates } from '../hooks/useFunderRates.js';

export function FunderComparison() {
  const { compareRates, getBestQuote } = useFunderRates();
  const [vehiclePrice, setVehiclePrice] = useState(45000);
  const [state, setState] = useState('VIC');
  const [termYears, setTermYears] = useState(3);

  const comparison = useMemo(() => {
    return compareRates(vehiclePrice, state, termYears);
  }, [compareRates, vehiclePrice, state, termYears]);

  const bestQuote = useMemo(() => {
    return getBestQuote(vehiclePrice, state, termYears);
  }, [getBestQuote, vehiclePrice, state, termYears]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Funder Comparison</h2>
      
      {/* Input Controls */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Vehicle Price</label>
          <input
            type="number"
            value={vehiclePrice}
            onChange={(e) => setVehiclePrice(Number(e.target.value))}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">State</label>
          <select 
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="VIC">VIC</option>
            <option value="NSW">NSW</option>
            <option value="QLD">QLD</option>
            <option value="SA">SA</option>
            <option value="WA">WA</option>
            <option value="TAS">TAS</option>
            <option value="ACT">ACT</option>
            <option value="NT">NT</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Term (Years)</label>
          <select 
            value={termYears}
            onChange={(e) => setTermYears(Number(e.target.value))}
            className="w-full p-2 border rounded"
          >
            <option value={1}>1 Year</option>
            <option value={2}>2 Years</option>
            <option value={3}>3 Years</option>
            <option value={4}>4 Years</option>
            <option value={5}>5 Years</option>
          </select>
        </div>
      </div>

      {/* Best Quote Highlight */}
      {bestQuote && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800">Best Quote</h3>
          <div className="text-lg font-bold text-green-600">
            {bestQuote.funder} - ${bestQuote.monthlyPayment.toFixed(2)}/month
          </div>
          <div className="text-sm text-green-700">
            All-up rate: {bestQuote.allUpRate}%
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 p-2 text-left">Funder</th>
              <th className="border border-gray-300 p-2 text-right">Base Rate</th>
              <th className="border border-gray-300 p-2 text-right">Monthly Payment</th>
              <th className="border border-gray-300 p-2 text-right">All-Up Rate</th>
              <th className="border border-gray-300 p-2 text-right">Balloon</th>
              <th className="border border-gray-300 p-2 text-right">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {comparison.map((quote, index) => (
              <tr key={quote.funder} className={index === 0 ? 'bg-green-50' : ''}>
                <td className="border border-gray-300 p-2 font-medium">
                  {quote.funder}
                  {index === 0 && <span className="ml-2 text-green-600 text-sm">BEST</span>}
                </td>
                <td className="border border-gray-300 p-2 text-right">{quote.rate}%</td>
                <td className="border border-gray-300 p-2 text-right font-semibold">
                  ${quote.monthlyPayment.toFixed(2)}
                </td>
                <td className="border border-gray-300 p-2 text-right">{quote.allUpRate}%</td>
                <td className="border border-gray-300 p-2 text-right">
                  ${quote.balloon.toFixed(2)}
                </td>
                <td className="border border-gray-300 p-2 text-right">
                  ${quote.totalCost.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Savings Calculation */}
      {comparison.length > 1 && (
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <div className="text-sm text-blue-700">
            Potential savings with best funder vs most expensive: 
            <span className="font-semibold ml-1">
              ${(comparison[comparison.length - 1].totalCost - comparison[0].totalCost).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}