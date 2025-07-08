import { useEffect, useState } from 'react';

const loadCarQueryScript = () => {
  const existingScript = document.getElementById('carquery-script');
  if (!existingScript) {
    const script = document.createElement('script');
    script.src = 'https://www.carqueryapi.com/js/carquery.0.3.4.js';
    script.id = 'carquery-script';
    script.async = true;
    document.body.appendChild(script);
  }
};

const CarSelector = ({ onCarSelect }) => {
  const [selected, setSelected] = useState({
    year: '',
    make: '',
    model: '',
    trim: ''
  });

  useEffect(() => {
    loadCarQueryScript();

    const interval = setInterval(() => {
      if (window.CarQuery) {
        clearInterval(interval);

        const cq = new window.CarQuery();
        cq.init();
        cq.initYearMakeModelTrim("cq-year", "cq-make", "cq-model", "cq-trim");

        document.getElementById("cq-trim").addEventListener("change", () => {
          const year = document.getElementById("cq-year").value;
          const make = document.getElementById("cq-make").value;
          const model = document.getElementById("cq-model").value;
          const trim = document.getElementById("cq-trim").value;

          setSelected({ year, make, model, trim });
          if (onCarSelect) onCarSelect({ year, make, model, trim });
        });
      }
    }, 200);

    return () => clearInterval(interval);
  }, [onCarSelect]);

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label>Year:</label>
      <select id="cq-year" />
      <label>Make:</label>
      <select id="cq-make" />
      <label>Model:</label>
      <select id="cq-model" />
      <label>Trim:</label>
      <select id="cq-trim" />
    </div>
  );
};

export default CarSelector;
