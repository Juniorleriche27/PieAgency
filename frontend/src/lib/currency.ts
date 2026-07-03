export const EUR_TO_XOF_RATE = 655.957;

export function euroToXof(amountEuro: number) {
  return Math.round(amountEuro * EUR_TO_XOF_RATE);
}

export function xofToEuro(amountXof: number) {
  return amountXof / EUR_TO_XOF_RATE;
}

export function formatEuro(amountEuro: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountEuro);
}

export function formatXof(amountXof: number) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(amountXof) + " FCFA";
}

export function formatEuroToXof(amountEuro: number) {
  return formatXof(euroToXof(amountEuro));
}
