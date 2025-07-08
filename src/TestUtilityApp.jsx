import React, { useState } from "react";
import { calculateStampDuty } from "./utils/stampDutyCalculator";
import { calculateRunningCosts } from "./utils/runningCosts";
import { calculateRego } from "./utils/regoCalculator";
import { calculateInsurance } from "./utils/insuranceCalculator";
import { calculateFinance } from "./utils/financeCalculator";
import { calculateIncomeTaxSavings } from "./utils/taxCalculator";

function TestUtilityApp() {
  const [price, setPrice] = useState(77000);
  const [state, setState] = useState("VIC");
  const [isEV, setIsEV] = useState(true);
  const [carType, setCarType] = useState("EV");
  const [kms, setKms] = useState(15000);
  const [salary, setSalary] = useState(170000);
  const [termYears, setTermYears] = useState(5);

  const [results, setResults] = useState(null);

  const runTests = () => {
    const stampDuty = calculateStampDuty(state, price, isEV);
    const rego = calculateRego(state);
    const insurance = calculateInsurance(carType);
    const runningCosts = calculateRunningCosts(carType, kms);
    const finance = calculateFinance(price, stampDuty, rego, termYears);
    const leaseCost = runningCosts + (finance?.monthlyPayment ?? 0) * 12;
    const taxSavings = calculateIncomeTaxSavings(salary, leaseCost);
    const finalOutOfPocket = leaseCost - taxSavings;

    setResults({
      stampDuty,
      rego,
      insurance,
      runningCosts,
      finance,
      leaseCost,
      taxSavings,
      finalOutOfPocket
    });

    console.log({
      stampDuty,
      rego,
      insurance,
      runningCosts,
      finance,
      leaseCost,
      taxSavings,
      finalOutOfPocket
    });
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h2>Utility Test App</h2>
      <button onClick={runTests}>Run All Calculations</button>

      {results && (
        <div style={{ marginTop: "1rem" }}>
          <pre>{JSON.stringify(results, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default TestUtilityApp;
