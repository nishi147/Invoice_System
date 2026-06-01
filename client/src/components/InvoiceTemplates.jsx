import React from 'react';

export const ClassicTemplate = ({ invoice, settings }) => {
  const clientInfo = invoice.clientDetailsSnapshot || invoice.client || {};
  return (
    <div className="border border-slate-300 bg-white p-8 font-serif text-slate-800 shadow-sm leading-relaxed">
      {/* Header */}
      <div className="flex justify-between border-b-2 border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold uppercase">{settings.name || 'Company Name'}</h2>
          <p className="text-xs text-slate-600 mt-1">{settings.address?.street}, {settings.address?.city}, {settings.address?.state}</p>
          {settings.gstNumber && <p className="text-xs text-slate-600">GSTIN: {settings.gstNumber}</p>}
        </div>
        <div className="text-right">
          <h1 className="text-3xl font-light tracking-widest text-slate-600">INVOICE</h1>
          <p className="text-sm font-semibold mt-2">Invoice #: {invoice.invoiceNumber || 'Draft'}</p>
          <p className="text-xs">Date: {new Date(invoice.invoiceDate).toLocaleDateString()}</p>
          <p className="text-xs">Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Bill To */}
      <div className="my-6 grid grid-cols-2 text-xs">
        <div>
          <h4 className="font-bold uppercase text-slate-700">Billed To:</h4>
          <p className="font-semibold text-sm mt-1">{clientInfo.name}</p>
          <p className="text-slate-600">{clientInfo.company}</p>
          <p className="text-slate-600">{clientInfo.address?.street}, {clientInfo.address?.city}</p>
          <p className="text-slate-600">Email: {clientInfo.email}</p>
          {clientInfo.gstNumber && <p className="text-slate-600">GSTIN: {clientInfo.gstNumber}</p>}
        </div>
        <div className="text-right">
          <h4 className="font-bold uppercase text-slate-700">Payment Information:</h4>
          <p className="mt-1">Currency: {invoice.currency}</p>
          <p className="font-semibold text-rose-700 text-sm">Balance Due: {invoice.currency} {invoice.balanceDue?.toFixed(2)}</p>
        </div>
      </div>

      {/* Table */}
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-800 font-bold uppercase">
            <th className="py-2">Item</th>
            <th className="py-2">Description</th>
            <th className="py-2 text-center">Qty</th>
            <th className="py-2 text-right">Rate</th>
            <th className="py-2 text-right">GST</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items?.map((item, idx) => (
            <tr key={idx} className="border-b border-slate-200">
              <td className="py-3 font-semibold">{item.itemName}</td>
              <td className="py-3 text-slate-500">{item.description}</td>
              <td className="py-3 text-center">{item.quantity}</td>
              <td className="py-3 text-right">{invoice.currency} {item.rate?.toFixed(2)}</td>
              <td className="py-3 text-right">{item.taxRate}%</td>
              <td className="py-3 text-right">{invoice.currency} {item.amount?.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Calculations */}
      <div className="mt-6 flex justify-end text-xs">
        <div className="w-64 space-y-2 border-t border-slate-800 pt-2 text-right">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{invoice.currency} {invoice.subtotal?.toFixed(2)}</span>
          </div>
          {invoice.taxAmount > 0 && (
            <div className="flex justify-between">
              <span>GST/Tax:</span>
              <span>{invoice.currency} {invoice.taxAmount?.toFixed(2)}</span>
            </div>
          )}
          {invoice.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Discount ({invoice.discountRate}%):</span>
              <span>- {invoice.currency} {invoice.discountAmount?.toFixed(2)}</span>
            </div>
          )}
          {invoice.tdsAmount > 0 && (
            <div className="flex justify-between text-amber-700">
              <span>TDS Deduction ({invoice.tdsRate}%):</span>
              <span>- {invoice.currency} {invoice.tdsAmount?.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-800 pt-2 font-bold text-sm">
            <span>Grand Total:</span>
            <span>{invoice.currency} {invoice.grandTotal?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 grid grid-cols-2 text-[10px] text-slate-500 border-t border-slate-200 pt-4">
        <div>
          <p className="font-semibold text-slate-700">Terms & Notes:</p>
          <p>{invoice.notes || settings.termsAndConditions}</p>
        </div>
        <div className="text-right flex flex-col items-end justify-end">
          <div className="border-t border-slate-300 w-32 mt-8 pt-1 text-center font-semibold">Authorized Sign</div>
        </div>
      </div>
    </div>
  );
};

export const ModernTemplate = ({ invoice, settings }) => {
  const clientInfo = invoice.clientDetailsSnapshot || invoice.client || {};
  return (
    <div className="border border-slate-200 bg-white p-8 font-sans text-slate-800 shadow-md rounded-2xl relative overflow-hidden">
      {/* Visual Accent */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-brand-600" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-outfit text-xl font-bold bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">{settings.name || 'Company Name'}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">{settings.address?.street}, {settings.address?.city}, {settings.address?.state}</p>
          <p className="text-xs text-slate-500">Email: {settings.email} | Phone: {settings.phone}</p>
        </div>
        <div className="sm:text-right">
          <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 uppercase tracking-wider">
            {invoice.status?.replace('_', ' ')}
          </span>
          <h1 className="font-outfit text-2xl font-bold text-slate-900 mt-3">{invoice.invoiceNumber || 'Draft Invoice'}</h1>
          <p className="text-xs text-slate-400 mt-1">Date: {new Date(invoice.invoiceDate).toLocaleDateString()}</p>
          <p className="text-xs text-slate-400">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
        </div>
      </div>

      <hr className="my-6 border-slate-100" />

      {/* Bill details */}
      <div className="grid gap-6 sm:grid-cols-2 text-xs mb-8">
        <div className="rounded-xl bg-slate-50 p-4">
          <h4 className="font-bold text-brand-600 uppercase tracking-wider mb-2">Billed To</h4>
          <p className="font-bold text-sm text-slate-900">{clientInfo.name}</p>
          <p className="text-slate-600 mt-0.5">{clientInfo.company}</p>
          <p className="text-slate-500 mt-1">{clientInfo.address?.street}, {clientInfo.address?.city}</p>
          {clientInfo.gstNumber && <p className="text-slate-500 mt-1">GSTIN: {clientInfo.gstNumber}</p>}
        </div>
        <div className="rounded-xl bg-slate-50 p-4 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-brand-600 uppercase tracking-wider mb-2">Payment Details</h4>
            <p className="text-slate-600">Currency: {invoice.currency}</p>
          </div>
          <div className="mt-4 pt-2 border-t border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Balance Due</span>
            <span className="font-outfit text-lg font-bold text-slate-900">{invoice.currency} {invoice.balanceDue?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
              <th className="p-3 rounded-l-lg">Item</th>
              <th className="p-3">Qty</th>
              <th className="p-3 text-right">Rate</th>
              <th className="p-3 text-right">GST %</th>
              <th className="p-3 text-right rounded-r-lg">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item, idx) => (
              <tr key={idx} className="border-b border-slate-100/50 hover:bg-slate-50/50">
                <td className="p-3">
                  <p className="font-semibold text-slate-950">{item.itemName}</p>
                  {item.description && <p className="text-[10px] text-slate-400 mt-0.5">{item.description}</p>}
                </td>
                <td className="p-3 text-slate-600">{item.quantity}</td>
                <td className="p-3 text-right text-slate-600">{invoice.currency} {item.rate?.toFixed(2)}</td>
                <td className="p-3 text-right text-slate-600">{item.taxRate}%</td>
                <td className="p-3 text-right font-semibold text-slate-950">{invoice.currency} {item.amount?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Calculations */}
      <div className="mt-8 flex justify-end text-xs">
        <div className="w-72 space-y-2.5">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal:</span>
            <span>{invoice.currency} {invoice.subtotal?.toFixed(2)}</span>
          </div>
          {invoice.taxAmount > 0 && (
            <div className="flex justify-between text-slate-500">
              <span>GST / Taxes:</span>
              <span>{invoice.currency} {invoice.taxAmount?.toFixed(2)}</span>
            </div>
          )}
          {invoice.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Discount ({invoice.discountRate}%):</span>
              <span>- {invoice.currency} {invoice.discountAmount?.toFixed(2)}</span>
            </div>
          )}
          {invoice.tdsAmount > 0 && (
            <div className="flex justify-between text-amber-600 font-medium">
              <span>TDS Withheld ({invoice.tdsRate}%):</span>
              <span>- {invoice.currency} {invoice.tdsAmount?.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between pt-3 border-t border-slate-100 font-outfit text-sm font-bold text-slate-900">
            <span>Grand Total:</span>
            <span>{invoice.currency} {invoice.grandTotal?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 flex flex-col md:flex-row justify-between gap-6 text-[10px] text-slate-400 pt-6 border-t border-slate-100">
        <div className="max-w-xs">
          <p className="font-semibold text-slate-500 uppercase tracking-wider mb-1">Notes & Terms</p>
          <p>{invoice.notes || settings.termsAndConditions}</p>
        </div>
        <div className="text-right flex flex-col justify-end items-end">
          <div className="h-10 w-24 bg-brand-50 rounded-lg flex items-center justify-center font-outfit text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1 border border-brand-100">
            Approved
          </div>
          <p>Verified Financial Record</p>
        </div>
      </div>
    </div>
  );
};

export const CorporateTemplate = ({ invoice, settings }) => {
  const clientInfo = invoice.clientDetailsSnapshot || invoice.client || {};
  return (
    <div className="border border-slate-200 bg-white p-8 font-sans text-slate-800 shadow-lg">
      {/* Top Banner */}
      <div className="bg-slate-950 text-white p-6 -mx-8 -mt-8 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-wider uppercase">{settings.name || 'Enterprise Client'}</h1>
          <p className="text-[10px] text-slate-400 mt-1">Corporate Billing Division</p>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold tracking-widest text-brand-400 uppercase">INVOICE</h2>
          <p className="text-xs text-slate-400 mt-1">N°: {invoice.invoiceNumber || 'DRAFT'}</p>
        </div>
      </div>

      {/* Corporate Metadata */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs border-b border-slate-100 pb-6 mb-6">
        <div>
          <span className="text-slate-400 block mb-1">Invoice Date</span>
          <span className="font-bold">{new Date(invoice.invoiceDate).toLocaleDateString()}</span>
        </div>
        <div>
          <span className="text-slate-400 block mb-1">Payment Due</span>
          <span className="font-bold">{new Date(invoice.dueDate).toLocaleDateString()}</span>
        </div>
        <div>
          <span className="text-slate-400 block mb-1">Company Registration</span>
          <span className="font-bold">{settings.panNumber || 'N/A'}</span>
        </div>
        <div>
          <span className="text-slate-400 block mb-1">GST Identification</span>
          <span className="font-bold">{settings.gstNumber || 'N/A'}</span>
        </div>
      </div>

      {/* Bill To & Bank Details */}
      <div className="grid gap-6 md:grid-cols-2 text-xs mb-8">
        <div>
          <h3 className="font-bold text-slate-950 uppercase border-b border-slate-800 pb-1 mb-2">Billed Account</h3>
          <p className="font-bold">{clientInfo.name}</p>
          <p className="text-slate-600 mt-0.5">{clientInfo.company}</p>
          <p className="text-slate-500 mt-1">{clientInfo.address?.street}, {clientInfo.address?.city}</p>
          {clientInfo.gstNumber && <p className="text-slate-500">GSTIN: {clientInfo.gstNumber}</p>}
        </div>
        <div>
          <h3 className="font-bold text-slate-950 uppercase border-b border-slate-800 pb-1 mb-2">Remittance Instructions</h3>
          {settings.bankDetails?.bankName ? (
            <div className="text-slate-600 space-y-0.5">
              <p>Bank: {settings.bankDetails.bankName}</p>
              <p>A/C Name: {settings.bankDetails.accountName}</p>
              <p>A/C No: {settings.bankDetails.accountNumber}</p>
              <p>IFSC: {settings.bankDetails.ifscCode}</p>
            </div>
          ) : (
            <p className="text-slate-400">Configure bank details in settings</p>
          )}
        </div>
      </div>

      {/* Table */}
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-y-2 border-slate-950 font-bold uppercase text-slate-950">
            <th className="py-2.5">Item Description</th>
            <th className="py-2.5 text-center">Quantity</th>
            <th className="py-2.5 text-right">Unit Rate</th>
            <th className="py-2.5 text-right">Tax Rate</th>
            <th className="py-2.5 text-right">Line Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items?.map((item, idx) => (
            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="py-3 font-semibold text-slate-900">
                {item.itemName}
                {item.description && <span className="block text-[10px] font-normal text-slate-400 mt-0.5">{item.description}</span>}
              </td>
              <td className="py-3 text-center">{item.quantity}</td>
              <td className="py-3 text-right">{invoice.currency} {item.rate?.toFixed(2)}</td>
              <td className="py-3 text-right">{item.taxRate}%</td>
              <td className="py-3 text-right font-bold text-slate-900">{invoice.currency} {item.amount?.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Calculations */}
      <div className="mt-8 flex justify-end text-xs">
        <table className="w-64 space-y-1">
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-1 text-slate-400">Subtotal:</td>
              <td className="py-1 text-right font-semibold">{invoice.currency} {invoice.subtotal?.toFixed(2)}</td>
            </tr>
            {invoice.taxAmount > 0 && (
              <tr className="border-b border-slate-100">
                <td className="py-1 text-slate-400">GST / Taxes:</td>
                <td className="py-1 text-right font-semibold">{invoice.currency} {invoice.taxAmount?.toFixed(2)}</td>
              </tr>
            )}
            {invoice.discountAmount > 0 && (
              <tr className="border-b border-slate-100 text-emerald-700">
                <td className="py-1">Discount ({invoice.discountRate}%):</td>
                <td className="py-1 text-right font-semibold">- {invoice.currency} {invoice.discountAmount?.toFixed(2)}</td>
              </tr>
            )}
            {invoice.tdsAmount > 0 && (
              <tr className="border-b border-slate-100 text-amber-700">
                <td className="py-1">TDS Withheld ({invoice.tdsRate}%):</td>
                <td className="py-1 text-right font-semibold">- {invoice.currency} {invoice.tdsAmount?.toFixed(2)}</td>
              </tr>
            )}
            <tr className="text-slate-950 font-bold border-t border-slate-950">
              <td className="py-2 text-sm uppercase">Total Due:</td>
              <td className="py-2 text-right text-sm">{invoice.currency} {invoice.grandTotal?.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-12 border-t border-slate-200 pt-6 text-[10px] text-slate-400 flex justify-between items-center">
        <p className="max-w-xs">{invoice.notes || settings.termsAndConditions}</p>
        <div className="text-center font-bold border-t border-slate-300 w-36 pt-1 text-slate-800 uppercase tracking-widest mt-4">
          Authorized Officer
        </div>
      </div>
    </div>
  );
};

export const MinimalTemplate = ({ invoice, settings }) => {
  const clientInfo = invoice.clientDetailsSnapshot || invoice.client || {};
  return (
    <div className="bg-white p-8 font-sans text-slate-800 leading-normal max-w-4xl mx-auto">
      {/* Top Section */}
      <div className="flex justify-between items-start border-b border-slate-100 pb-6 mb-8">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">{settings.name || 'Company Name'}</h2>
          <p className="text-xs text-slate-400 mt-1">{settings.address?.city}, {settings.address?.country}</p>
        </div>
        <div className="text-right">
          <span className="text-xs uppercase tracking-wider text-slate-400">Invoice</span>
          <h1 className="text-base font-bold text-slate-900 mt-1">{invoice.invoiceNumber || 'Draft'}</h1>
        </div>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-3 gap-6 text-xs mb-8 text-slate-500">
        <div>
          <span className="block font-medium text-slate-400 uppercase tracking-wider text-[9px] mb-1">Billed To</span>
          <span className="font-semibold text-slate-800">{clientInfo.name}</span>
          <span className="block mt-0.5">{clientInfo.company}</span>
          <span className="block">{clientInfo.email}</span>
        </div>
        <div>
          <span className="block font-medium text-slate-400 uppercase tracking-wider text-[9px] mb-1">Invoice Date</span>
          <span>{new Date(invoice.invoiceDate).toLocaleDateString()}</span>
        </div>
        <div>
          <span className="block font-medium text-slate-400 uppercase tracking-wider text-[9px] mb-1">Due Date</span>
          <span className="font-semibold text-slate-800">{new Date(invoice.dueDate).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Table */}
      <table className="w-full text-left text-xs mb-8">
        <thead>
          <tr className="border-b border-slate-200 text-slate-400 font-medium">
            <th className="py-2">Item Description</th>
            <th className="py-2 text-center w-12">Qty</th>
            <th className="py-2 text-right w-24">Rate</th>
            <th className="py-2 text-right w-24">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items?.map((item, idx) => (
            <tr key={idx} className="border-b border-slate-100">
              <td className="py-3">
                <span className="font-semibold text-slate-800 block">{item.itemName}</span>
                {item.description && <span className="text-[10px] text-slate-400 mt-0.5 block">{item.description}</span>}
              </td>
              <td className="py-3 text-center">{item.quantity}</td>
              <td className="py-3 text-right">{invoice.currency} {item.rate?.toFixed(2)}</td>
              <td className="py-3 text-right font-semibold text-slate-800">{invoice.currency} {item.amount?.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Calculations */}
      <div className="flex justify-end text-xs text-slate-500">
        <div className="w-64 space-y-1.5">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{invoice.currency} {invoice.subtotal?.toFixed(2)}</span>
          </div>
          {invoice.taxAmount > 0 && (
            <div className="flex justify-between">
              <span>GST/Tax:</span>
              <span>{invoice.currency} {invoice.taxAmount?.toFixed(2)}</span>
            </div>
          )}
          {invoice.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount:</span>
              <span>- {invoice.currency} {invoice.discountAmount?.toFixed(2)}</span>
            </div>
          )}
          {invoice.tdsAmount > 0 && (
            <div className="flex justify-between text-amber-600">
              <span>TDS:</span>
              <span>- {invoice.currency} {invoice.tdsAmount?.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
            <span>Total:</span>
            <span>{invoice.currency} {invoice.grandTotal?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="mt-12 border-t border-slate-100 pt-6 text-[10px] text-slate-400">
          <p className="font-semibold text-slate-600 uppercase tracking-wider mb-1">Notes</p>
          <p>{invoice.notes}</p>
        </div>
      )}
    </div>
  );
};
