export function formatCurrency(amount: number, symbol: string = '₹'): string {
  const isNegative = amount < 0;
  const absVal = Math.abs(amount).toLocaleString();
  return `${isNegative ? '-' : ''}${symbol}${absVal}`;
}

export function formatPaymentMethod(method?: string, cashLabel: string = 'Cash'): string {
  if (!method) return 'Wire Transfer';
  if (method === 'Cash') return cashLabel || 'Cash';
  if (method === 'Wire') return 'Wire Transfer';
  if (method === 'Card') return 'Credit/Debit Card';
  if (method === 'Bank') return 'Bank Deposit';
  return method;
}
