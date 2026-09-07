import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, CheckCircle2, Building2, Download, ShieldCheck, CreditCard } from 'lucide-react';
import { Client, Payment, CompanySettings } from '../types';

interface InstallmentVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  payment: Payment | null;
  companySettings: CompanySettings;
  contractTotal: number;
  totalPaidSoFar: number;
}

export default function InstallmentVoucherModal({
  isOpen,
  onClose,
  client,
  payment,
  companySettings,
  contractTotal,
  totalPaidSoFar,
}: InstallmentVoucherModalProps) {
  if (!isOpen || !client || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const remainingBalance = Math.max(0, contractTotal - totalPaidSoFar);
  const paidPercent = contractTotal > 0 ? Math.min(100, Math.round((totalPaidSoFar / contractTotal) * 100)) : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-surface border border-border w-full max-w-xl rounded-2xl overflow-hidden shadow-pop font-sans"
        >
          {/* Header Actions */}
          <div className="bg-surface-2 p-4 border-b border-border flex justify-between items-center print:hidden">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-gain" size={18} />
              <span className="text-xs font-mono font-bold text-ink uppercase tracking-wider">
                Official Installment Voucher & Receipt
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-brand hover:bg-brand/90 text-white font-mono font-bold py-1.5 px-3 rounded-xl text-xs transition-colors cursor-pointer shadow-card"
              >
                <Printer size={13} />
                Print Voucher
              </button>
              <button
                onClick={onClose}
                className="text-ink-faint hover:text-ink p-1 rounded-lg hover:bg-surface transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Printable Voucher Body */}
          <div id="printable-voucher" className="p-8 bg-surface text-ink space-y-6">
            {/* Branding & Voucher ID */}
            <div className="flex justify-between items-start border-b border-border pb-6">
              <div>
                {companySettings.logoUrl ? (
                  <img src={companySettings.logoUrl} alt={companySettings.companyName} className="h-10 object-contain mb-2" />
                ) : (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center font-bold font-display text-white text-sm">
                      {companySettings.companyName ? companySettings.companyName.charAt(0) : 'S'}
                    </div>
                    <span className="font-display font-bold text-base text-ink tracking-wider uppercase">
                      {companySettings.companyName || 'ScarletCRM'}
                    </span>
                  </div>
                )}
                <p className="text-[10px] text-ink-faint font-mono">{companySettings.address || 'Corporate Operations Center'}</p>
                <p className="text-[10px] text-ink-faint font-mono">{companySettings.email} | {companySettings.phone}</p>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded-full bg-gain-soft text-gain text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
                  ✓ PAYMENT VERIFIED
                </span>
                <p className="text-xs font-mono font-bold text-ink">VOUCHER #{payment.id.toUpperCase().slice(-8)}</p>
                <p className="text-[10px] font-mono text-ink-faint">Date: {payment.date}</p>
              </div>
            </div>

            {/* Client & Project Details */}
            <div className="grid grid-cols-2 gap-4 bg-surface-2 p-4 rounded-xl border border-border text-xs font-mono">
              <div>
                <span className="text-[9px] text-ink-faint uppercase block tracking-wider mb-0.5">Billed Client</span>
                <p className="font-bold text-ink">{client.company}</p>
                <p className="text-ink-soft">{client.name}</p>
                <p className="text-ink-faint text-[10px]">{client.email}</p>
              </div>

              <div>
                <span className="text-[9px] text-ink-faint uppercase block tracking-wider mb-0.5">Project Arrangement</span>
                <p className="font-bold text-brand">Fixed Contract Quote</p>
                <p className="text-ink-soft truncate max-w-[200px]">
                  {client.projectScope || 'Development Contract'}
                </p>
                <p className="text-ink-faint text-[10px]">
                  Payment Method: {payment.method === 'Cash' ? (companySettings.cashLabel || 'Cash') : (payment.method || 'Wire Transfer')}
                </p>
              </div>
            </div>

            {/* Installment Summary */}
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-surface-2 text-[10px] uppercase text-ink-faint border-b border-border">
                  <tr>
                    <th className="py-2.5 px-4">Milestone / Installment Description</th>
                    <th className="py-2.5 px-4 text-center">Category</th>
                    <th className="py-2.5 px-4 text-right">Amount Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-ink">
                      {payment.notes || 'Installment Payment'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-surface-2 border border-border text-[10px] text-ink-soft">
                        {payment.workCategory || 'Installment'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gain text-sm">
                      {companySettings.currencySymbol || '₹'}{payment.amount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Financial Contract Ledger Balance */}
            <div className="bg-surface-2 p-4 rounded-xl border border-border space-y-2 text-xs font-mono">
              <div className="flex justify-between text-ink-soft">
                <span>Total Fixed Contract Value:</span>
                <span className="font-bold text-ink">{companySettings.currencySymbol || '₹'}{contractTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-ink-soft">
                <span>Total Installments Collected To Date:</span>
                <span className="font-bold text-gain">{companySettings.currencySymbol || '₹'}{totalPaidSoFar.toLocaleString()} ({paidPercent}%)</span>
              </div>
              <div className="flex justify-between text-ink pt-2 border-t border-border font-bold">
                <span className="text-warn">Remaining Contract Balance Due:</span>
                <span className={remainingBalance > 0 ? 'text-warn font-bold text-sm' : 'text-gain'}>
                  {companySettings.currencySymbol || '₹'}{remainingBalance.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Authorization Footer */}
            <div className="pt-4 border-t border-border flex justify-between items-end text-[10px] font-mono text-ink-faint">
              <div>
                <p className="flex items-center gap-1 text-gain font-medium">
                  <CheckCircle2 size={12} /> Digital Ledger Entry Authenticated
                </p>
                <p>Generated via {companySettings.companyName || 'ScarletCRM'} Finance Engine</p>
              </div>
              <div className="text-right border-t border-dashed border-border pt-2 w-36">
                <p className="font-bold text-ink uppercase">Authorized Seal</p>
                <p className="text-[9px] text-ink-faint">Finance & Accounts</p>
              </div>
            </div>
          </div>

          {/* Footer Close */}
          <div className="bg-surface-2 p-4 border-t border-border flex justify-end print:hidden">
            <button
              onClick={onClose}
              className="bg-surface hover:bg-surface-2 text-ink-soft font-medium py-1.5 px-4 rounded-xl text-xs cursor-pointer border border-border transition-colors"
            >
              Close Voucher
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
