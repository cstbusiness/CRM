import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Layers, 
  FileText, 
  LifeBuoy, 
  ShieldCheck, 
  BellRing,
  User,
  LogOut,
  RefreshCw,
  Sliders,
  CheckCircle,
  Database
} from 'lucide-react';

import { 
  AppUser, 
  CRMLead, 
  Invoice, 
  Ticket, 
  NotificationLog, 
  ComplianceAuditLog,
  CRMLeadStage,
  TicketStatus,
  UserRole
} from './types';

import { 
  initializeDatabase,
  getCRMLeads,
  addCRMLead,
  updateCRMLeadStage,
  updateCRMLeadNotes,
  getInvoices,
  addInvoice,
  updateInvoicePayment,
  getTickets,
  addTicket,
  updateTicketStatus,
  addTicketMessage,
  getNotifications,
  addNotificationLog,
  getComplianceAuditLogs,
  addComplianceAuditLog,
  getUsers,
  updateUserMfa
} from './firebase/dbService';

import Dashboard from './components/Dashboard';
import CRM from './components/CRM';
import Billing from './components/Billing';
import Support from './components/Support';
import SecurityCompliance from './components/SecurityCompliance';
import NotificationsLog from './components/NotificationsLog';

export default function App() {
  // GLOBAL ENTITY STATES
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<ComplianceAuditLog[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);

  // SYSTEM STATES
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isDbSynced, setIsDbSynced] = useState(false);

  // FETCH ALL DATA FROM CLOUD FIRESTORE
  const loadAllData = async () => {
    setLoading(true);
    try {
      await initializeDatabase();
      
      const [leadsData, invoicesData, ticketsData, notificationsData, auditLogsData, usersData] = await Promise.all([
        getCRMLeads(),
        getInvoices(),
        getTickets(),
        getNotifications(),
        getComplianceAuditLogs(),
        getUsers()
      ]);

      setLeads(leadsData);
      setInvoices(invoicesData);
      setTickets(ticketsData);
      setNotifications(notificationsData);
      setAuditLogs(auditLogsData);
      setUsers(usersData);

      // Set initial user role to Admin (User Email: neovixcol@gmail.com)
      const defaultAdmin = usersData.find(u => u.role === 'admin') || {
        id: "admin-1",
        name: "Admin Principal",
        email: "neovixcol@gmail.com",
        role: "admin",
        phone: "+57 300 123 4567",
        company: "Portal Cloud Services",
        status: "active",
        mfaEnabled: true
      } as AppUser;
      
      if (!currentUser) {
        setCurrentUser(defaultAdmin);
      } else {
        // preserve current role if switched but sync updated properties
        const refreshed = usersData.find(u => u.id === currentUser.id);
        if (refreshed) setCurrentUser(refreshed);
      }

      setIsDbSynced(true);
    } catch (err) {
      console.error("Critical error loading cloud database records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // ROLE SWITCHER EVENT
  const handleRoleSwitch = (role: UserRole) => {
    const target = users.find(u => u.role === role);
    if (target) {
      setCurrentUser(target);
      
      // Auto register security audit log on role change simulation
      handleAddAuditLog({
        action: "Cambio de Rol Simulado",
        details: `Sesion transicionada al rol ${role.toUpperCase()} (${target.name}) para auditoria de permisos.`,
        ipAddress: "186.29.112.109",
        userEmail: target.email,
        status: 'success'
      });
    }
  };

  // SERVICE ACTIONS TRIGGER WRAPPERS
  const handleAddCRMLead = async (leadData: Omit<CRMLead, 'id' | 'createdAt'>) => {
    const fresh = await addCRMLead({
      ...leadData,
      createdAt: new Date().toISOString().split('T')[0]
    });
    setLeads(prev => [...prev, fresh]);
    
    // Register audit log
    await handleAddAuditLog({
      action: "Nuevo Prospecto CRM",
      details: `Prospecto ${fresh.name} (${fresh.company}) registrado con un valor de $${fresh.value} USD.`,
      ipAddress: "186.29.112.109",
      userEmail: currentUser?.email || 'system@portalcloud.co',
      status: 'success'
    });
  };

  const handleUpdateCRMStage = async (id: string, stage: CRMLeadStage) => {
    const success = await updateCRMLeadStage(id, stage);
    if (success) {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, stage, lastContactDate: new Date().toISOString().split('T')[0] } : l));
      
      // Register audit
      const lead = leads.find(l => l.id === id);
      await handleAddAuditLog({
        action: "Embudo CRM Actualizado",
        details: `El lead ${lead?.name} transiciono a la etapa comercial: ${stage.toUpperCase()}`,
        ipAddress: "186.29.112.109",
        userEmail: currentUser?.email || 'system@portalcloud.co',
        status: 'success'
      });
    }
  };

  const handleUpdateCRMNotes = async (id: string, notes: string[]) => {
    const success = await updateCRMLeadNotes(id, notes);
    if (success) {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, notes } : l));
    }
  };

  const handleAddInvoice = async (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
    const sequenceNumber = String(invoices.length + 1).padStart(3, '0');
    const invoiceNumber = `FAC-2026-${sequenceNumber}`;
    
    const fresh = await addInvoice({ invoiceNumber, ...invoiceData });
    setInvoices(prev => [...prev, fresh]);

    // Register Audit
    await handleAddAuditLog({
      action: "Nueva Factura Emitida",
      details: `Factura oficial ${invoiceNumber} emitida para ${fresh.clientName} por un total de $${fresh.total} USD.`,
      ipAddress: "186.29.112.109",
      userEmail: currentUser?.email || 'system@portalcloud.co',
      status: 'success'
    });
  };

  const handlePayInvoice = async (id: string, gateway: Invoice['paymentGateway'], transactionId: string) => {
    const success = await updateInvoicePayment(id, gateway, transactionId);
    if (success) {
      setInvoices(prev => prev.map(inv => inv.id === id ? {
        ...inv,
        status: 'paid',
        paymentGateway: gateway,
        paidAt: new Date().toISOString().split('T')[0],
        transactionId
      } : inv));

      // Register Audit
      const inv = invoices.find(i => i.id === id);
      await handleAddAuditLog({
        action: "Factura Cobrada Online",
        details: `Liquidacion exitosa de ${inv?.invoiceNumber} ($${inv?.total} USD) vía ${gateway}. Transaccion: ${transactionId}`,
        ipAddress: "Pago Directo Webhook",
        userEmail: inv?.clientEmail || 'client@example.com',
        status: 'success'
      });
    }
  };

  const handleAddTicket = async (ticketData: Omit<Ticket, 'id' | 'createdAt' | 'messages'>) => {
    const fresh = await addTicket({
      ...ticketData,
      createdAt: new Date().toISOString(),
      messages: []
    });
    setTickets(prev => [...prev, fresh]);

    // Audit
    await handleAddAuditLog({
      action: "Caso de Soporte Creado",
      details: `Incidencia registrada por ${fresh.clientName}: "${fresh.subject}" (Prioridad: ${fresh.priority.toUpperCase()})`,
      ipAddress: "186.29.112.109",
      userEmail: currentUser?.email || 'client@example.com',
      status: 'success'
    });
  };

  const handleUpdateTicketStatus = async (id: string, status: TicketStatus, agentId?: string, agentName?: string) => {
    const success = await updateTicketStatus(id, status, agentId, agentName);
    if (success) {
      setTickets(prev => prev.map(t => {
        if (t.id === id) {
          const updated = { ...t, status };
          if (agentId) {
            updated.assignedAgentId = agentId;
            updated.assignedAgentName = agentName;
          }
          return updated;
        }
        return t;
      }));

      // Audit
      const tk = tickets.find(t => t.id === id);
      await handleAddAuditLog({
        action: "Estado de Soporte Modificado",
        details: `Ticket "${tk?.subject}" cambio a estado: ${status.toUpperCase()}${agentName ? ` (Asignado a: ${agentName})` : ''}`,
        ipAddress: "186.29.112.109",
        userEmail: currentUser?.email || 'system@portalcloud.co',
        status: 'success'
      });
    }
  };

  const handleAddTicketMessage = async (id: string, message: string) => {
    if (!currentUser) return;
    const freshMsg = await addTicketMessage(id, {
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      message,
      createdAt: new Date().toISOString()
    });

    // Refresh tickets inside local state
    setTickets(prev => prev.map(t => t.id === id ? { ...t, messages: [...t.messages, freshMsg] } : t));
  };

  const handleTriggerNotificationLog = async (type: 'email' | 'sms', recipient: string, title: string, body: string) => {
    const fresh = await addNotificationLog({
      type,
      recipient,
      title,
      body,
      timestamp: new Date().toISOString(),
      status: 'sent'
    });
    setNotifications(prev => [fresh, ...prev]);
  };

  const handleAddAuditLog = async (logData: Omit<ComplianceAuditLog, 'id' | 'timestamp'>) => {
    const fresh = await addComplianceAuditLog({
      ...logData,
      timestamp: new Date().toISOString()
    });
    setAuditLogs(prev => [fresh, ...prev]);
  };

  const handleUpdateMfa = async (mfaEnabled: boolean) => {
    if (!currentUser) return;
    const success = await updateUserMfa(currentUser.id, mfaEnabled, mfaEnabled ? "JBSWY3DPEHPK3PXP" : undefined);
    if (success) {
      setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, mfaEnabled } : u));
      setCurrentUser(prev => prev ? { ...prev, mfaEnabled } : null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
            {/* SECURITY & PROFILE ROLES OVERLAY (STATION SELECTOR FOR TESTING) */}
      <div className="bg-slate-950 border-b border-slate-850 text-slate-400 px-4 py-1.5 text-[11px] flex flex-wrap justify-between items-center gap-3 print:hidden font-mono">
        <div className="flex items-center gap-2">
          <Sliders className="h-3.5 w-3.5 text-blue-500 animate-pulse" />
          <span className="font-bold text-slate-200 uppercase tracking-wider">ENTORNO DE PRUEBAS: SIMULAR ACCESO</span>
        </div>
        
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => handleRoleSwitch('admin')}
            className={`px-2.5 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
              currentUser?.role === 'admin' 
                ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-sm' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            ADMINISTRADOR
          </button>
          
          <button
            onClick={() => handleRoleSwitch('agent')}
            className={`px-2.5 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
              currentUser?.role === 'agent' 
                ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-sm' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            AGENTE SOPORTE
          </button>
          
          <button
            onClick={() => handleRoleSwitch('client')}
            className={`px-2.5 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
              currentUser?.role === 'client' 
                ? 'bg-emerald-600 border-emerald-600 text-white font-bold shadow-sm' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            CLIENTE FINAL
          </button>
        </div>
      </div>

      {/* PRIMARY DESKTOP NAVIGATION SIDEBAR & LAYOUT SHELL */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-full md:w-56 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 print:hidden text-slate-300">
          
          <div className="flex-1 flex flex-col overflow-y-auto">
            
            {/* BRAND HEADER LOGO */}
            <div className="p-4 border-b border-slate-800 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm tracking-tighter">C</div>
              <div>
                <span className="text-white font-semibold tracking-tight text-xs block">PORTAL CLOUD</span>
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest block font-mono">CORE Nexus v2.4</span>
              </div>
            </div>

            {/* TAB NAVIGATION MENU */}
            <nav className="p-2 space-y-0.5">
              
              <div className="px-2.5 py-1 text-[9px] uppercase font-bold text-slate-500 tracking-wider">Administración</div>
              
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'dashboard' 
                    ? 'bg-slate-800 text-white font-semibold' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Cpu className="h-3.5 w-3.5" /> Dashboard
              </button>

              <button
                onClick={() => setActiveTab('crm')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'crm' 
                    ? 'bg-slate-800 text-white font-semibold' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Layers className="h-3.5 w-3.5" /> Clientes CRM
              </button>

              <button
                onClick={() => setActiveTab('facturacion')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'facturacion' 
                    ? 'bg-slate-800 text-white font-semibold' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <FileText className="h-3.5 w-3.5" /> Facturación
              </button>

              <div className="px-2.5 py-1 text-[9px] uppercase font-bold text-slate-500 tracking-wider mt-3">Soporte</div>

              <button
                onClick={() => setActiveTab('soporte')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'soporte' 
                    ? 'bg-slate-800 text-white font-semibold' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <LifeBuoy className="h-3.5 w-3.5" /> Tickets Activos
              </button>

              <button
                onClick={() => setActiveTab('notificaciones')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'notificaciones' 
                    ? 'bg-slate-800 text-white font-semibold' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <BellRing className="h-3.5 w-3.5" /> Alertas (SMS/Email)
              </button>

              <div className="px-2.5 py-1 text-[9px] uppercase font-bold text-slate-500 tracking-wider mt-3">Configuración</div>

              <button
                onClick={() => setActiveTab('seguridad')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'seguridad' 
                    ? 'bg-slate-800 text-white font-semibold' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Seguridad & GDPR
              </button>

            </nav>

          </div>

          {/* ACTIVE USER SESSION METADATA AT BOTTOM */}
          <div className="p-3 bg-slate-950">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center font-bold font-mono text-[11px] shrink-0">
                {currentUser?.name?.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white truncate leading-tight">{currentUser?.name}</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider leading-none mt-0.5">{currentUser?.role} (Nivel {currentUser?.role === 'admin' ? '5' : '2'})</p>
              </div>
            </div>
          </div>

        </aside>

        {/* PRIMARY MAIN PANEL SCREEN */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-100">
          
          {/* TOP HEADER */}
          <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 select-none">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {activeTab === 'dashboard' ? 'Panel de Métricas en Tiempo Real' :
                 activeTab === 'crm' ? 'Gestión de Clientes & Embudo CRM' :
                 activeTab === 'facturacion' ? 'Módulo de Facturación & Cobros' :
                 activeTab === 'soporte' ? 'Cola de Soporte Técnico Especializado' :
                 activeTab === 'seguridad' ? 'Centro de Ciberseguridad & GDPR Compliance' :
                 'Bitácora de Notificaciones Transaccionales'}
              </h2>
              <div className="flex items-center gap-1.5">
                <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                <span className="text-[9px] text-slate-500 font-bold tracking-wider uppercase font-mono">Cloud Node: US-East-1 (Active)</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-[10px] font-mono text-slate-600">
                <span>Latencia: 14ms</span>
              </div>
              <div className="w-px h-6 bg-slate-200"></div>
              
              <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                <Database className="h-3.5 w-3.5 text-emerald-500" />
                <span>DB: Cloud Firestore (ONLINE)</span>
              </div>
            </div>
          </header>

            {/* MAIN PAGE BODY */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {loading ? (
              <div className="h-96 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
                <p className="text-xs font-bold text-slate-650 font-mono uppercase tracking-widest">Estableciendo túnel cifrado en la nube...</p>
              </div>
            ) : (
              <div className="max-w-7xl mx-auto w-full space-y-6 animate-fade-in">
                {activeTab === 'dashboard' && (
                <Dashboard 
                  leads={leads} 
                  invoices={invoices} 
                  tickets={tickets} 
                  notifications={notifications}
                  onNavigate={setActiveTab}
                />
              )}
              
              {activeTab === 'crm' && (
                <CRM 
                  leads={leads}
                  currentUser={currentUser}
                  onAddLead={handleAddCRMLead}
                  onUpdateStage={handleUpdateCRMStage}
                  onUpdateNotes={handleUpdateCRMNotes}
                />
              )}

              {activeTab === 'facturacion' && (
                <Billing 
                  invoices={invoices}
                  currentUser={currentUser}
                  onAddInvoice={handleAddInvoice}
                  onPayInvoice={handlePayInvoice}
                  triggerNotification={handleTriggerNotificationLog}
                />
              )}

              {activeTab === 'soporte' && (
                <Support 
                  tickets={tickets}
                  currentUser={currentUser}
                  onAddTicket={handleAddTicket}
                  onUpdateStatus={handleUpdateTicketStatus}
                  onAddMessage={handleAddTicketMessage}
                  triggerNotification={handleTriggerNotificationLog}
                />
              )}

              {activeTab === 'seguridad' && (
                <SecurityCompliance 
                  auditLogs={auditLogs}
                  currentUser={currentUser}
                  onAddAuditLog={handleAddAuditLog}
                  onUpdateMfa={handleUpdateMfa}
                />
              )}

              {activeTab === 'notificaciones' && (
                <NotificationsLog notifications={notifications} />
              )}
            </div>
          )}
          </div>
        </main>

      </div>

    </div>
  );
}
