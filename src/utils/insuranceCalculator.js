// src/utils/insuranceCalculator.js
export function calculateInsurance(carType) {
  const base = 1900;
  const bump = carType==="EV" ? 1.05 : carType==="LARGE_UTE" ? 1.15 : 1;
  return base * bump;
}
