import React, { useEffect, useState } from 'react';

export default function QuoteDropdowns({ make, model, year, onChange }) {
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);

  // Fetch makes once on load
  useEffect(() => {
    fetch('http://localhost:4000/api/makes')
      .then(res => res.json())
      .then(data => setMakes(data.filter(Boolean)))
      .catch(err => console.error("Failed to load makes:", err));
  }, []);

  // Fetch models when make changes
  useEffect(() => {
    if (!make) return setModels([]);

    fetch(`http://localhost:4000/api/models?make=${encodeURIComponent(make)}`)
      .then(res => res.json())
      .then(data => setModels(data.filter(Boolean)))
      .catch(err => console.error("Failed to load models:", err));
  }, [make]);

  // Fetch years when model changes
  useEffect(() => {
    if (!make || !model) return setYears([]);

    fetch(`http://localhost:4000/api/years?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`)
      .then(res => res.json())
      .then(data => setYears(data.filter(Boolean)))
      .catch(err => console.error("Failed to load years:", err));
  }, [make, model]);

  // Fetch vehicle details when year changes
  useEffect(() => {
    if (!make || !model || !year) return;

    fetch(`http://localhost:4000/api/details?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${year}`)
      .then(res => res.json())
      .then(data => {
        const { carType, isEV } = data;
        onChange?.({ year, carType, isEV });
      })
      .catch(err => {
        console.warn("Could not fetch car details:", err);
        onChange?.({ year });
      });
  }, [make, model, year]);

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    onChange?.({ [field]: value });
  };

  return (
    <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
      <select value={make} onChange={handleChange('make')}>
        <option value="">Select Make</option>
        {makes.map(m => <option key={m} value={m}>{m}</option>)}
      </select>

      <select value={model} onChange={handleChange('model')} disabled={!make}>
        <option value="">Select Model</option>
        {models.map(m => <option key={m} value={m}>{m}</option>)}
      </select>

      <select value={year} onChange={handleChange('year')} disabled={!model}>
        <option value="">Select Year</option>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}
