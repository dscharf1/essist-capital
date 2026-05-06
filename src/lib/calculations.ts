/**
 * Essist Capital — Loan Calculation Helpers
 *
 * Two-tier flat add-on interest model:
 *
 * INDIVIDUAL (Consumer):
 *   3 mo  → 8%  flat total | 6% origination
 *   6 mo  → 12% flat total | 6% origination
 *   12 mo → 15% flat total | 6% origination
 *
 * LLC / BUSINESS:
 *   3 mo  → 15% flat total | 3% origination
 *   6 mo  → 19% flat total | 3% origination
 *   12 mo → 24% flat total | 3% origination
 *
 * Range: $5,000 – $30,000
 * Finance charge = principal × flat rate (on full original principal for full term)
 */

export const VALID_TERMS = [3, 6, 12] as const;
export type ValidTerm    = (typeof VALID_TERMS)[number];
export type BorrowerType = "individual" | "llc";

// ── Rate tables ──────────────────────────────────────────────

export const FLAT_RATE: Record<BorrowerType, Record<ValidTerm, number>> = {
  individual: { 3: 0.08, 6: 0.12, 12: 0.15 },
  llc:        { 3: 0.15, 6: 0.19, 12: 0.24 },
};

export const ORIGINATION_FEE_RATE: Record<BorrowerType, number> = {
  individual: 0.06,
  llc:        0.03,
};

// ── Core helpers ─────────────────────────────────────────────

export function getFlatRate(termMonths: ValidTerm, borrowerType: BorrowerType = "individual"): number {
  return FLAT_RATE[borrowerType][termMonths] ?? 0.15;
}

export function getDisplayRate(termMonths: number, borrowerType: BorrowerType = "individual"): string {
  const rate = FLAT_RATE[borrowerType]?.[termMonths as ValidTerm];
  if (rate === undefined) return "—";
  return `${(rate * 100).toFixed(0)}% flat`;
}

export function calculateFinanceCharge(
  amount: number,
  termMonths: ValidTerm,
  borrowerType: BorrowerType = "individual"
): number {
  return Math.round(amount * getFlatRate(termMonths, borrowerType) * 100) / 100;
}

export function calculateTotalRepayment(
  amount: number,
  termMonths: ValidTerm,
  borrowerType: BorrowerType = "individual"
): number {
  return Math.round((amount + calculateFinanceCharge(amount, termMonths, borrowerType)) * 100) / 100;
}

export function calculateMonthlyPayment(
  amount: number,
  termMonths: ValidTerm,
  borrowerType: BorrowerType = "individual"
): number {
  return Math.round((calculateTotalRepayment(amount, termMonths, borrowerType) / termMonths) * 100) / 100;
}

export function calculateInterestOnlyPayment(
  amount: number,
  termMonths: ValidTerm,
  borrowerType: BorrowerType = "individual"
): number {
  return Math.round((calculateFinanceCharge(amount, termMonths, borrowerType) / termMonths) * 100) / 100;
}

export function calculateMonthlyPrincipal(amount: number, termMonths: ValidTerm): number {
  return Math.round((amount / termMonths) * 100) / 100;
}

export function calculateOriginationFee(
  amount: number,
  borrowerType: BorrowerType = "individual"
): number {
  return Math.round(amount * ORIGINATION_FEE_RATE[borrowerType] * 100) / 100;
}

export function calculateNetDisbursement(
  amount: number,
  borrowerType: BorrowerType = "individual"
): number {
  return Math.round((amount - calculateOriginationFee(amount, borrowerType)) * 100) / 100;
}

export function calculateLenderYield(
  amount: number,
  termMonths: ValidTerm,
  borrowerType: BorrowerType = "individual"
): number {
  return Math.round(
    (calculateFinanceCharge(amount, termMonths, borrowerType) +
      calculateOriginationFee(amount, borrowerType)) * 100
  ) / 100;
}

export function calculateAPR(
  amount: number,
  termMonths: ValidTerm,
  borrowerType: BorrowerType = "individual"
): number {
  const rate = getFlatRate(termMonths, borrowerType);
  const apr  = rate * 2 * termMonths / (termMonths + 1);
  return Math.round(apr * 10000) / 100;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function generatePaymentSchedule(
  amount: number,
  termMonths: ValidTerm,
  borrowerType: BorrowerType = "individual",
  startDate = new Date()
): Array<{
  paymentNumber: number;
  dueDate: Date;
  openingBalance: number;
  amountDue: number;
  principal: number;
  interest: number;
  closingBalance: number;
}> {
  const monthly          = calculateMonthlyPayment(amount, termMonths, borrowerType);
  const monthlyPrincipal = Math.round((amount / termMonths) * 100) / 100;
  const monthlyInterest  = Math.round(
    (calculateFinanceCharge(amount, termMonths, borrowerType) / termMonths) * 100
  ) / 100;

  const schedule = [];
  let openingBalance = amount;

  for (let i = 1; i <= termMonths; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    const principal      = i === termMonths
      ? Math.round(openingBalance * 100) / 100
      : monthlyPrincipal;
    const closingBalance = Math.max(0, Math.round((openingBalance - principal) * 100) / 100);
    schedule.push({
      paymentNumber: i,
      dueDate,
      openingBalance: Math.round(openingBalance * 100) / 100,
      amountDue: monthly,
      principal,
      interest: monthlyInterest,
      closingBalance,
    });
    openingBalance = closingBalance;
  }
  return schedule;
}
