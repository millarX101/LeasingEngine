// src/TestUtilityApp.jsx
import React, { useState } from "react";
import { calculateStampDuty }     from "./utils/stampDutyCalculator";
import { calculateRunningCosts }  from "./utils/runningCosts";
import { calculateRego }          from "./utils/regoCalculator";
import { calculateInsurance }     from "./utils/insuranceCalculator";
import { calculateFinance }       from "./utils/financeCalculator";
import { calculateIncomeTaxSavings } from "./utils/taxCalculator";

export default function TestUtilityApp() {
  /* demo inputs --------------------------------------------------------- */
  const [price,   setPrice]   = useState(77000);
  const [state,   setState]   = useState("VIC");
  const [isEV,    setIsEV]    = useState(true);
  const [carType, setCarType] = useState("EV");
  const [kms,     setKms]     = useState(15000);
  const [salary,  setSalary]  = useState(170000);
  const [termYears, setTerm]  = useState(5);

  const [results, setResults] = useState(null);

  /* run all util fns ---------------------------------------------------- */
  const runTests = () => {
    const stampDuty   = calculateStampDuty(state, price, isEV);
    const rego        = calculateRego();                // flat 900
    const insurance   = calculateInsurance(carType);

    const runningObj  = calculateRunningCosts(carType, kms);
    const runningTotal= runningObj.total;               // ← numeric

    const finance     = calculateFinance(price, stampDuty, rego, termYears);

    const annualLease = runningTotal + finance.monthlyPayment * 12;
    const taxSavings  = calculateIncomeTaxSavings(salary, annualLease);
    const outOfPocket = annualLease - taxSavings;

    const bundle = {
      stampDuty,
      rego,
      insurance,
      runningBreakdown: runningObj,
      runningTotal,
      finance,
      annualLease,
      taxSavings,
      outOfPocket
    };
    setResults(bundle);
    console.log("🔎 util test bundle:", bundle);
  };

  /* ui ------------------------------------------------------------------ */
  return (
    <div style={{ padding: 32, fontFamily: "Arial" }}>
      <h2>Utility Test App</h2>
      <button onClick={runTests}>Run All Calculations</button>

      {results && (
        <pre style={{ marginTop: 24, background:"#eee", padding:16, borderRadius:4 }}>
{JSON.stringify(results, null, 2)}
        </pre>
      )}
    </div>
  );
}
