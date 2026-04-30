export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatGrams(grams: number): string {
  if (grams === 0) return "0 g";
  if (grams < 0.01) return `${(grams * 1000).toFixed(0)} mg`;
  return `${grams.toFixed(grams < 1 ? 4 : 3)} g`;
}
