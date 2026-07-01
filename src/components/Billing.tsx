import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Printer, 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  X, 
  Trash2,
  Lock,
  Mail,
  Send,
  Sparkles
} from 'lucide-react';
import { Invoice, InvoiceItem, InvoiceStatus, AppUser } from '../types';

interface BillingProps {
  invoices: Invoice[];
  currentUser: AppUser | null;
  onAddInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => Promise<void>;
  onPayInvoice: (id: string, gateway: Invoice['paymentGateway'], transactionId: string) => Promise<void>;
  triggerNotification: (type: 'email' | 'sms', recipient: string, title: string, body: string) => Promise<void>;
}

export default function Billing({ invoices, currentUser, onAddInvoice, onPayInvoice, triggerNotification }: BillingProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  
  // Payment gateway choice
  const [paymentGateway, setPaymentGateway] = useState<'Stripe' | 'PayPal' | 'Mercado Pago' | 'Wompi'>('Stripe');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // New Invoice Form state
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([{ description: '', quantity: 1, price: 0 }]);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = 
        inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      
      // Clients only see their own invoices! Differentiated Access.
      if (currentUser?.role === 'client') {
        return matchesSearch && matchesStatus && inv.clientEmail === currentUser.email;
      }
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter, currentUser]);

  // Calculations
  const invoiceStats = useMemo(() => {
    const relevant = currentUser?.role === 'client' 
      ? invoices.filter(i => i.clientEmail === currentUser.email)
      : invoices;

    const totalRevenue = relevant.filter(i => i.status === 'paid').reduce((sum, item) => sum + item.total, 0);
    const totalPending = relevant.filter(i => i.status === 'pending').reduce((sum, item) => sum + item.total, 0);
    const totalOverdue = relevant.filter(i => i.status === 'overdue').reduce((sum, item) => sum + item.total, 0);

    return { totalRevenue, totalPending, totalOverdue };
  }, [invoices, currentUser]);

  // Line item manipulation
  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updated = [...items];
    if (field === 'quantity') {
      updated[index].quantity = Number(value) || 0;
    } else if (field === 'price') {
      updated[index].price = Number(value) || 0;
    } else {
      updated[index].description = String(value);
    }
    setItems(updated);
  };

  const invoiceTotalSum = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  }, [items]);

  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail || items.some(i => !i.description)) return;

    const invoiceData = {
      clientId: `client-${Date.now()}`,
      clientName,
      clientEmail,
      clientPhone: clientPhone || '',
      date: new Date().toISOString().split('T')[0],
      dueDate: dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items,
      total: invoiceTotalSum,
      status: 'pending' as InvoiceStatus
    };

    await onAddInvoice(invoiceData);

    // Trigger Notifications automatically!
    await triggerNotification(
      'email',
      clientEmail,
      `Nueva Factura Emitida - ${clientName}`,
      `Estimado cliente, se ha generado la factura por valor de $${invoiceTotalSum} USD. Fecha límite: ${invoiceData.dueDate}. Puede pagarla en línea desde su panel.`
    );

    if (clientPhone) {
      await triggerNotification(
        'sms',
        clientPhone,
        `Nueva Factura Pendiente`,
        `Se ha emitido su factura por $${invoiceTotalSum} USD. Pague aquí con tarjeta o PSE: https://ais-dev.run.app/pay`
      );
    }

    // Reset Form
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setDueDate('');
    setItems([{ description: '', quantity: 1, price: 0 }]);
    setIsAddOpen(false);
  };

  const handleExecutePayment = async () => {
    if (!selectedInvoice) return;
    setPaymentLoading(true);

    // Simulate Payment Gateway handshaking latencies
    setTimeout(async () => {
      const transactionId = `tx_${paymentGateway.substring(0, 3).toLowerCase()}_${Math.random().toString(36).substring(2, 11)}`;
      await onPayInvoice(selectedInvoice.id, paymentGateway, transactionId);

      // Trigger automatic SMS and Email confirming payment receipt!
      await triggerNotification(
        'email',
        selectedInvoice.clientEmail,
        `Confirmación de Pago Exitoso - ${selectedInvoice.invoiceNumber}`,
        `Estimado/a ${selectedInvoice.clientName}, hemos recibido su pago de $${selectedInvoice.total} USD a través de ${paymentGateway} con el número de transacción ${transactionId}. Estado: Pagado con Éxito.`
      );

      if (selectedInvoice.clientPhone) {
        await triggerNotification(
          'sms',
          selectedInvoice.clientPhone,
          `Pago Exitoso`,
          `Portal CRM: Recibimos su pago de $${selectedInvoice.total} USD vía ${paymentGateway}. ID: ${transactionId}. ¡Gracias por su compra!`
        );
      }

      setPaymentLoading(false);
      setPaymentSuccess(true);
      
      // Sync selected
      setSelectedInvoice({
        ...selectedInvoice,
        status: 'paid',
        paymentGateway,
        paidAt: new Date().toISOString().split('T')[0],
        transactionId
      });

      setTimeout(() => {
        setIsPayOpen(false);
        setPaymentSuccess(false);
      }, 2000);
    }, 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-blue-600" />
            Facturación & Recibos de Clientes
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            {currentUser?.role === 'client' 
              ? 'Visualiza y gestiona tus facturas pendientes y realiza pagos seguros en línea' 
              : 'Gestión contable, emisión de cobros y simulación de pasarelas globales en tiempo real'}
          </p>
        </div>

        {/* ADMINS ONLY CAN CREATE BILLS */}
        {currentUser?.role === 'admin' && (
          <button 
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded transition-all cursor-pointer shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" /> Emitir Factura Nueva
          </button>
        )}
        {currentUser?.role === 'agent' && (
          <div className="text-[10px] text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded border border-slate-200 flex items-center gap-1 font-bold uppercase select-none">
            <Lock className="h-3 w-3 text-slate-400" /> ADMIN ONLY (Facturación)
          </div>
        )}
      </div>

      {/* QUICK BILLING METRICS SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 bg-white text-slate-800 rounded border border-slate-200 border-l-4 border-l-green-600 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] font-bold uppercase text-slate-450 tracking-wider">Cobrado Exitosamente</p>
            <p className="text-lg font-bold font-mono mt-0.5 text-slate-900">${invoiceStats.totalRevenue.toLocaleString()} USD</p>
          </div>
          <CheckCircle className="h-6 w-6 text-green-500/30" />
        </div>
        <div className="p-3 bg-white text-slate-800 rounded border border-slate-200 border-l-4 border-l-amber-500 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] font-bold uppercase text-slate-450 tracking-wider">Pendiente de Cobro</p>
            <p className="text-lg font-bold font-mono mt-0.5 text-slate-900">${invoiceStats.totalPending.toLocaleString()} USD</p>
          </div>
          <Clock className="h-6 w-6 text-amber-500/30" />
        </div>
        <div className="p-3 bg-white text-slate-800 rounded border border-slate-200 border-l-4 border-l-red-500 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] font-bold uppercase text-slate-450 tracking-wider">Cartera Vencida (Overdue)</p>
            <p className="text-lg font-bold font-mono mt-0.5 text-slate-900">${invoiceStats.totalOverdue.toLocaleString()} USD</p>
          </div>
          <AlertTriangle className="h-6 w-6 text-red-500/30" />
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row gap-2 bg-white p-2.5 rounded border border-slate-200">
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 flex-1">
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por número de factura o cliente..."
            className="bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-full font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-1">
          {(['all', 'paid', 'pending', 'overdue'] as const).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`text-[10px] font-bold px-2.5 py-1.5 rounded border capitalize cursor-pointer ${
                statusFilter === f 
                  ? 'bg-slate-900 border-slate-900 text-white' 
                  : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
              }`}
            >
              {f === 'all' ? 'Ver Todos' : f}
            </button>
          ))}
        </div>
      </div>

      {/* INVOICES LIST TABLE */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-3">Factura</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Fecha de Emisión</th>
                <th className="p-3">Vencimiento</th>
                <th className="p-3">Total</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 font-bold text-slate-900 font-mono">{inv.invoiceNumber}</td>
                  <td className="p-3 font-semibold text-slate-800">
                    <div>{inv.clientName}</div>
                    <div className="text-[9px] text-slate-400 font-medium font-mono">{inv.clientEmail}</div>
                  </td>
                  <td className="p-3 text-slate-500 font-mono">{inv.date}</td>
                  <td className="p-3 text-slate-500 font-mono">{inv.dueDate}</td>
                  <td className="p-3 font-bold text-slate-900 font-mono">${inv.total.toLocaleString()} USD</td>
                  <td className="p-3 text-center">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      inv.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
                      'bg-rose-50 text-rose-700 border border-rose-200 font-bold'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button 
                      onClick={() => setSelectedInvoice(inv)}
                      className="text-indigo-600 hover:text-indigo-900 hover:underline font-bold"
                    >
                      Ver Detalle
                    </button>
                  </td>
                </tr>
              ))}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400 font-medium">
                    No se encontraron facturas registradas en el sistema.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL VIEW MODAL (WITH BILL RECEIPT AND PAYMENT EMULATOR) */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center print:hidden">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Recibo & Liquidación de Cuenta</span>
              <div className="flex gap-1.5">
                <button 
                  onClick={handlePrint}
                  className="p-1 hover:bg-slate-200 text-slate-600 rounded flex items-center gap-1 text-[11px] font-bold"
                >
                  <Printer className="h-3.5 w-3.5" /> Imprimir
                </button>
                <button 
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1 hover:bg-slate-200 text-slate-500 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 print:p-0">
              
              {/* Receipt Header Logo */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <h1 className="text-sm font-bold text-slate-950 tracking-tight uppercase">PORTAL CLOUD SYSTEM S.A.</h1>
                  <p className="text-[10px] text-slate-500 font-medium">Calle 100 #15-30, Bogotá D.C., Colombia</p>
                  <p className="text-[10px] text-slate-400 font-medium">NIT: 900.543.210-9 | Régimen Común</p>
                </div>
                <div className="text-right">
                  <h2 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Número de Factura</h2>
                  <p className="text-base font-mono font-bold text-slate-800">{selectedInvoice.invoiceNumber}</p>
                </div>
              </div>

              {/* Bill Information Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-0.5">
                  <h3 className="text-[9px] font-bold text-slate-450 uppercase">Facturado a:</h3>
                  <p className="font-bold text-slate-800">{selectedInvoice.clientName}</p>
                  <p className="text-slate-500 font-mono text-[11px]">{selectedInvoice.clientEmail}</p>
                  {selectedInvoice.clientPhone && <p className="text-slate-500 font-mono text-[11px]">{selectedInvoice.clientPhone}</p>}
                </div>
                <div className="text-right space-y-0.5">
                  <div className="flex justify-between md:justify-end gap-3 text-[11px]">
                    <span className="text-slate-400">Fecha Emisión:</span>
                    <span className="font-mono text-slate-700 font-medium">{selectedInvoice.date}</span>
                  </div>
                  <div className="flex justify-between md:justify-end gap-3 text-[11px]">
                    <span className="text-slate-400">Fecha Vencimiento:</span>
                    <span className="font-mono text-slate-700 font-medium">{selectedInvoice.dueDate}</span>
                  </div>
                  {selectedInvoice.status === 'paid' && (
                    <div className="flex justify-between md:justify-end gap-3 text-emerald-600 font-bold text-[11px] uppercase">
                      <span>Pagado Vía:</span>
                      <span>{selectedInvoice.paymentGateway} ({selectedInvoice.paidAt})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left border-collapse mt-2 text-xs">
                <thead>
                  <tr className="border-b border-slate-250 bg-slate-50 text-[9px] font-bold text-slate-500 uppercase">
                    <th className="p-2">Descripción del Item</th>
                    <th className="p-2 text-center">Cant.</th>
                    <th className="p-2 text-right">Precio Unitario</th>
                    <th className="p-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2 text-slate-800 font-medium">{item.description}</td>
                      <td className="p-2 text-center font-mono text-slate-600">{item.quantity}</td>
                      <td className="p-2 text-right font-mono text-slate-600">${item.price.toLocaleString()} USD</td>
                      <td className="p-2 text-right font-mono font-bold text-slate-850">${(item.quantity * item.price).toLocaleString()} USD</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total Summary */}
              <div className="border-t border-slate-200 pt-3 flex flex-col items-end text-xs">
                <div className="w-44 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal:</span>
                    <span className="font-mono text-slate-800">${selectedInvoice.total.toLocaleString()} USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Impuestos (IVA 0%):</span>
                    <span className="font-mono text-slate-800">$0 USD</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-150 pt-1.5 font-bold text-xs text-slate-900">
                    <span>Total Neto:</span>
                    <span className="font-mono">${selectedInvoice.total.toLocaleString()} USD</span>
                  </div>
                </div>
              </div>

              {/* Security Audit Seal (Compliancy check) */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-[9px] text-slate-400 font-semibold uppercase">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                Cifrado SHA-256. Certificación PCI-DSS.
                {selectedInvoice.transactionId && (
                  <span className="font-mono bg-slate-50 px-1 py-0.5 rounded border border-slate-100 text-[9px]">
                    TX: {selectedInvoice.transactionId}
                  </span>
                )}
              </div>

            </div>

            {/* Modal Footer / Payment Gateway trigger for Pending invoices */}
            {selectedInvoice.status !== 'paid' && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center print:hidden">
                <p className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5 text-slate-400" /> Transmisión Segura SSL 256 bits
                </p>
                <button 
                  onClick={() => setIsPayOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-1.5 rounded flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <CreditCard className="h-4 w-4" /> Pagar Factura Online
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* PAYMENT GATEWAY INTERFACE EMULATOR MODAL */}
      {isPayOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            
            {/* Header */}
            <div className="p-3 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider font-mono">Pasarela de Pagos Segura</p>
                <h3 className="text-xs font-bold">Pagar {selectedInvoice.invoiceNumber}</h3>
              </div>
              <button 
                onClick={() => setIsPayOpen(false)}
                className="p-1 hover:bg-slate-850 text-slate-400 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Selector Grid */}
            <div className="p-4 space-y-3">
              
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Monto a Cancelar:</span>
                <span className="font-bold text-slate-900 text-sm font-mono">${selectedInvoice.total.toLocaleString()} USD</span>
              </div>

              {/* Gateway Brand Selector */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Seleccione Pasarela</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setPaymentGateway('Stripe')}
                    className={`p-2 rounded border text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      paymentGateway === 'Stripe' 
                        ? 'bg-blue-50 border-blue-600 text-blue-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#5469d4]"></span>
                    Stripe Elements
                  </button>
                  <button
                    onClick={() => setPaymentGateway('PayPal')}
                    className={`p-2 rounded border text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      paymentGateway === 'PayPal' 
                        ? 'bg-amber-50 border-amber-500 text-amber-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#003087]"></span>
                    PayPal Checkout
                  </button>
                  <button
                    onClick={() => setPaymentGateway('Mercado Pago')}
                    className={`p-2 rounded border text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      paymentGateway === 'Mercado Pago' 
                        ? 'bg-sky-50 border-sky-500 text-sky-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#009ee3]"></span>
                    Mercado Pago
                  </button>
                  <button
                    onClick={() => setPaymentGateway('Wompi')}
                    className={`p-2 rounded border text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      paymentGateway === 'Wompi' 
                        ? 'bg-violet-50 border-violet-500 text-violet-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#fa4c06]"></span>
                    Wompi
                  </button>
                </div>
              </div>

              {/* INTERACTIVE FORM FIELDS VARYING ON GATEWAY */}
              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-2.5">
                {paymentGateway === 'Stripe' && (
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold text-blue-700 flex items-center gap-1 uppercase tracking-wider">
                      <Lock className="h-3 w-3" /> Stripe Checkout Seguro
                    </p>
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-500 uppercase">Número de Tarjeta</span>
                      <div className="bg-white border border-slate-200 rounded p-1.5 flex items-center justify-between font-mono text-xs">
                        <span>4242 •••• •••• 4242</span>
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-bold">VISA</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-500 uppercase">Expedición</span>
                        <div className="bg-white border border-slate-200 rounded p-1.5 font-mono text-xs">12/29</div>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-500 uppercase">CVC</span>
                        <div className="bg-white border border-slate-200 rounded p-1.5 font-mono text-xs">***</div>
                      </div>
                    </div>
                  </div>
                )}

                {paymentGateway === 'PayPal' && (
                  <div className="text-center py-2 space-y-1.5">
                    <p className="text-[11px] text-slate-600 font-bold">Se redireccionará a PayPal de manera segura para iniciar sesión.</p>
                    <div className="bg-[#ffc439] hover:bg-[#f4b31a] text-xs font-bold text-slate-900 py-2 rounded-full cursor-pointer flex items-center justify-center gap-1.5 transition-colors">
                      <span className="italic font-extrabold text-blue-900">Pay</span>
                      <span className="italic font-extrabold text-blue-700">Pal</span>
                      <span>Checkout</span>
                    </div>
                  </div>
                )}

                {paymentGateway === 'Mercado Pago' && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-sky-700">Paga con Saldo, Tarjeta o Efectivo en América Latina</p>
                    <div className="bg-[#009ee3] hover:bg-[#0087c2] text-xs font-bold text-white py-2 rounded cursor-pointer text-center transition-colors">
                      Pagar con Mercado Pago
                    </div>
                    <p className="text-[9px] text-slate-400 text-center font-bold">PROTECCIÓN AL COMPRADOR 100%</p>
                  </div>
                )}

                {paymentGateway === 'Wompi' && (
                  <div className="space-y-1.5 text-xs">
                    <p className="text-[10px] font-bold text-violet-700">Pasarela Segura PSE / Bancolombia / Nequi</p>
                    <select className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-bold">
                      <option>PSE - Débito desde cuenta corriente/ahorros</option>
                      <option>Nequi - Transferencia celular</option>
                      <option>Bancolombia Botón Bancario</option>
                    </select>
                  </div>
                )}
              </div>

              {/* TRIGGER PAYMENT ACTIONS */}
              {paymentSuccess ? (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 text-[11px] font-bold text-center rounded border border-emerald-200 flex items-center justify-center gap-1.5 animate-pulse">
                  <CheckCircle className="h-4 w-4" /> ¡Transacción Aprobada Exitosamente!
                </div>
              ) : (
                <button
                  disabled={paymentLoading}
                  onClick={handleExecutePayment}
                  className="w-full bg-slate-950 hover:bg-slate-850 disabled:bg-slate-400 text-white text-xs font-bold py-2.5 rounded flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {paymentLoading ? (
                    <>
                      <TrendingUp className="h-4 w-4 animate-bounce" /> Procesando con el Banco...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 text-emerald-400" /> Confirmar Pago de ${selectedInvoice.total.toLocaleString()} USD
                    </>
                  )}
                </button>
              )}

            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[9px] text-slate-400 font-bold uppercase">
              Certificado PCI-DSS Nivel 1. Datos cifrados AES-256.
            </div>

          </div>
        </div>
      )}

      {/* CREATE INVOICE MODAL (ADMINS ONLY) */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded shadow-xl border border-slate-200 w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
            
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Crear Factura / Cobro Oficial</h3>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="p-1 hover:bg-slate-200 text-slate-500 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitInvoice} className="p-4 space-y-3 overflow-y-auto flex-1">
              
              <div className="p-2.5 bg-blue-50/50 rounded border border-blue-100 flex items-center gap-2 text-xs text-blue-950 mb-1 font-medium">
                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                Se enviará automáticamente un correo electrónico y SMS de cobro con el enlace transaccional.
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold uppercase text-slate-500">Nombre del Cliente *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ej. Laura Gómez" 
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold uppercase text-slate-500">Fecha de Vencimiento</label>
                  <input 
                    type="date" 
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-mono"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold uppercase text-slate-500">Correo Electrónico *</label>
                  <input 
                    type="email" 
                    required
                    placeholder="cliente@ejemplo.com" 
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold uppercase text-slate-500">Teléfono (para SMS)</label>
                  <input 
                    type="text" 
                    placeholder="+57 315 888 9999" 
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Line Items Dynamic Builder */}
              <div className="space-y-2 border-t border-slate-100 pt-2.5">
                <div className="flex justify-between items-center">
                  <h4 className="text-[9px] font-bold uppercase text-slate-500">Detalle de Conceptos / Servicios</h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-[10px] font-bold text-blue-600 hover:underline"
                  >
                    + Añadir Item
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-1.5 items-center">
                      <input 
                        type="text" 
                        required
                        placeholder="Descripción del concepto" 
                        className="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      />
                      <input 
                        type="number" 
                        required
                        placeholder="Cant" 
                        className="w-11 bg-slate-50 border border-slate-200 rounded px-1.5 py-1.5 text-xs text-slate-800 text-center font-mono focus:outline-none focus:border-blue-500"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      />
                      <input 
                        type="number" 
                        required
                        placeholder="Precio" 
                        className="w-20 bg-slate-50 border border-slate-200 rounded px-1.5 py-1.5 text-xs text-slate-800 text-right font-mono focus:outline-none focus:border-blue-500"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-rose-500 p-1 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-center border-t border-slate-100 pt-2.5 text-xs font-bold text-slate-900">
                <span>Valor Total Neto:</span>
                <span className="font-mono text-sm text-blue-600">${invoiceTotalSum.toLocaleString()} USD</span>
              </div>

              <div className="pt-2 flex justify-end gap-1.5 text-xs font-bold">
                <button 
                  type="button" 
                  onClick={() => setIsAddOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded cursor-pointer"
                >
                  Emitir & Notificar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
