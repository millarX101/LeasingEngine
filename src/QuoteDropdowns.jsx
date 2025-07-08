import React, { useEffect, useState, useCallback } from "react";

export default function QuoteDropdowns({ make, model, year, onChange }) {
  const [vehicles, setVehicles] = useState([]);
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);
  const [lastVehicleProps, setLastVehicleProps] = useState({});

  // Load vehicle data
  useEffect(() => {
    fetch("/Data/vehicles.json")
      .then((res) => res.json())
      .then((data) => {
        setVehicles(data);
        setMakes([...new Set(data.map((v) => v.make))]);
      })
      .catch((err) => console.error("Failed to load vehicles:", err));
  }, []);

  // Populate models
  useEffect(() => {
    if (!make) return setModels([]);
    const filtered = vehicles.filter((v) => v.make === make).map((v) => v.model);
    setModels([...new Set(filtered)]);
  }, [make, vehicles]);

  // Populate years
  useEffect(() => {
    if (!make || !model) return setYears([]);
    const filtered = vehicles
      .filter((v) => v.make === make && v.model === model)
      .map((v) => v.year);
    setYears([...new Set(filtered)].sort((a, b) => b - a));
  }, [make, model, vehicles]);

  // Detect carType & isEV, only update if changed
  useEffect(() => {
    if (!make || !model || !year) return;

    const selected = vehicles.find(
      (v) => v.make === make && v.model === model && v.year === parseInt(year)
    );
    if (!selected) return;

    const isEV = selected.fuel_type?.toLowerCase().includes("electric") || false;
    const carType = selected.body_style || "Car";

    const newProps = { year, isEV, carType };

    // Avoid infinite loop by checking if data is actually different
    if (
      newProps.year !== lastVehicleProps.year ||
      newProps.isEV !== lastVehicleProps.isEV ||
      newProps.carType !== lastVehicleProps.carType
    ) {
      onChange?.(newProps);
      setLastVehicleProps(newProps);
    }
  }, [make, model, year, vehicles]);

  // Dropdown change handler
  const handleChange = useCallback(
    (field) => (e) => {
      const value = e.target.value;
      onChange?.({ [field]: value });
    },
    [onChange]
  );

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <select
        value={make}
        onChange={handleChange("make")}
        className="p-3 border rounded"
      >
        <option value="">Select Make</option>
        {makes.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      <select
        value={model}
        onChange={handleChange("model")}
        disabled={!make}
        className="p-3 border rounded"
      >
        <option value="">Select Model</option>
        {models.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      <select
        value={year}
        onChange={handleChange("year")}
        disabled={!model}
        className="p-3 border rounded"
      >
        <option value="">Select Year</option>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}
