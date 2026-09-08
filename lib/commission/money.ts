import Decimal from "decimal.js";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export const ZERO_CENTS = 0;

export function cents(value: Decimal.Value): number {
  return new Decimal(value).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}

export function dollarsToCents(value: Decimal.Value): number {
  return cents(new Decimal(value).mul(100));
}

export function percent(value: Decimal.Value): Decimal {
  const d = new Decimal(value || 0);
  return d.greaterThan(1) ? d.div(100) : d;
}

export function multiplyCents(amountCents: number, rate: Decimal.Value): number {
  return cents(new Decimal(amountCents).mul(percent(rate)));
}

export function sumCents(items: number[]): number {
  return items.reduce((total, amount) => total + amount, ZERO_CENTS);
}

export function formatMoney(amountCents: number): string {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD"
  }).format(amountCents / 100);
}

export function formatPercent(value: Decimal.Value): string {
  return `${percent(value).mul(100).toDecimalPlaces(2).toString()}%`;
}
