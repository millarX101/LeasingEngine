// src/utils/taxCalculator.js
// 2024-25 resident marginal bands
const bands = [
  [0,      18_200,  0,       0],
  [18_201, 45_000,  0.19,    0],
  [45_001, 135_000, 0.30,  5_094],
  [135_001,190_000, 0.37, 31_494],
  [190_001,Infinity,0.45, 53_094]
];

export function calculateIncomeTaxSavings(income, preTaxDeduct) {
  const taxable = Math.max(0, income - preTaxDeduct);
  let tax = 0;
  for (const [lo, hi, rate, base] of bands) {
    if (taxable>lo) tax = base + (Math.min(taxable,hi)-lo)*rate;
    else break;
  }
  // tax with deduction vs without
  let taxNoDeduct=0;
  for (const [lo,hi,rate,base] of bands) {
    if (income>lo) taxNoDeduct = base + (Math.min(income,hi)-lo)*rate;
    else break;
  }
  return taxNoDeduct - tax;
}
  