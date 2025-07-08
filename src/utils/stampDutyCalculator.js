// src/utils/stampDutyCalculator.js
export function calculateStampDuty(state, price, isEV=false) {
  switch (state) {
    case "VIC": return price >= 60_000 ? price*0.042 : price*0.033;
    case "NSW": return price <= 45_000 ? price*0.03
                      : 45_000*0.03 + (price-45_000)*0.05;
    case "QLD": return price*0.03;
    case "SA" : return price <= 1_000 ? 0
                      : price <= 20_000 ? 60 + (price-1_000)*0.04
                      : 760 + (price-20_000)*0.06;
    case "WA" : return price<=25_000?price*0.0275
                      : price<=50_000?price*0.0285
                      : price*0.065;
    case "TAS": return price<=600?price*0.03:price*0.04;
    case "ACT": return price*0.03;   // simplified
    case "NT" : return price*0.03;
    default   : return 0;
  }
}
