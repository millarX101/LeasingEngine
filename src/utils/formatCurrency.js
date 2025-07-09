export function formatCurrency(amount) {
  if (isNaN(amount)) return "$0.00";
  return `$${Number(amount).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
