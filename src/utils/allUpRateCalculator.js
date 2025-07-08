export function calculateAllUpRate(principal, monthlyPayment, balloon, months) {
  let low = 0;
  let high = 0.05;
  const epsilon = 1e-5;

  while (high - low > epsilon) {
    const r = (low + high) / 2;

    // Correct balloon-adjusted payment guess
    const pvBalloon = balloon / Math.pow(1 + r, months);
    const guess = ((principal - pvBalloon) * r) / (1 - Math.pow(1 + r, -months));

    if (guess > monthlyPayment) {
      high = r;
    } else {
      low = r;
    }
  }

  const annualRatePct = ((low + high) / 2) * 12 * 100;
  return parseFloat(annualRatePct.toFixed(2));
}
