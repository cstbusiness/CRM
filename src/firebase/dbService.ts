import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  setDoc, 
  query, 
  orderBy, 
  limit,
  deleteDoc
} from 'firebase/firestore';
import { db } from './config';
import { 
  CRMLead, 
  Invoice, 
  Ticket, 
  NotificationLog, 
  ComplianceAuditLog,
  AppUser
} from '../types';

// Standard local fallbacks for high availability and resilient previews.
// If Firestore fails for any reason (network, rule propagation, etc.),
// the service automatically uses in-memory states and prints warning logs.
let localCRMLeads: CRMLead[] = [];
let localInvoices: Invoice[] = [];
let localTickets: Ticket[] = [];
let localNotifications: NotificationLog[] = [];
let localAuditLogs: ComplianceAuditLog[] = [];
let localUsers: AppUser[] = [];
let isFirebaseConnected = true;

// Default Mock Seed Data
const DEFAULT_LEADS: CRMLead[] = [
  {
    id: "lead-1",
    name: "Alejandro Torres",
    company: "Inversiones Alfa S.A.",
    email: "a.torres@inversionesalfa.co",
    phone: "+57 312 456 7890",
    stage: "new",
    value: 5200,
    lastContactDate: "2026-06-28",
    notes: ["Lead importado desde formulario de contacto.", "Interesado en licenciamiento anual de ERP."],
    assignedAgentId: "agent-1",
    assignedAgentName: "Soporte Técnico",
    createdAt: "2026-06-28"
  },
  {
    id: "lead-2",
    name: "Beatriz Mendoza",
    company: "Mendoza & Asociados",
    email: "bmendoza@mendoza-asoc.net",
    phone: "+52 55 1234 5678",
    stage: "contacted",
    value: 12500,
    lastContactDate: "2026-06-30",
    notes: ["Primera llamada de cortesía realizada.", "Solicitó demostración en vivo para el equipo administrativo."],
    assignedAgentId: "agent-1",
    assignedAgentName: "Soporte Técnico",
    createdAt: "2026-06-25"
  },
  {
    id: "lead-3",
    name: "Carlos Villagrán",
    company: "Tech Americas Inc.",
    email: "carlos.v@techamericas.com",
    phone: "+1 (305) 555-0199",
    stage: "proposal",
    value: 24000,
    lastContactDate: "2026-07-01",
    notes: ["Propuesta comercial enviada.", "Pendiente de aprobación presupuestal del CFO."],
    assignedAgentId: "admin-1",
    assignedAgentName: "Admin Principal",
    createdAt: "2026-06-20"
  },
  {
    id: "lead-4",
    name: "Diana Marcela Pérez",
    company: "Distribuidora del Caribe",
    email: "diana.perez@districaribe.com.co",
    phone: "+57 300 765 4321",
    stage: "won",
    value: 8500,
    lastContactDate: "2026-06-29",
    notes: ["Contrato firmado.", "Factura inicial emitida y enviada para cobro."],
    assignedAgentId: "admin-1",
    assignedAgentName: "Admin Principal",
    createdAt: "2026-06-15"
  },
  {
    id: "lead-5",
    name: "Eduardo Castillo",
    company: "Logística Global Ltda.",
    email: "e.castillo@logisticaglobal.cl",
    phone: "+56 2 2345 6789",
    stage: "lost",
    value: 6000,
    lastContactDate: "2026-06-18",
    notes: ["Propuesta rechazada.", "Prefirieron proveedor local por costo.", "Hacer seguimiento en 6 meses."],
    assignedAgentId: "agent-1",
    assignedAgentName: "Soporte Técnico",
    createdAt: "2026-06-10"
  }
];

const DEFAULT_INVOICES: Invoice[] = [
  {
    id: "inv-2026-001",
    invoiceNumber: "FAC-2026-001",
    clientId: "client-1",
    clientName: "Laura Sofía Gómez",
    clientEmail: "laura.gomez@example.com",
    clientPhone: "+57 315 888 9999",
    date: "2026-06-15",
    dueDate: "2026-07-15",
    items: [
      { description: "Licencia Anual Plata - CRM Multi-usuario", quantity: 1, price: 450 },
      { description: "Soporte Premium 24/7 (SLA 4 Horas)", quantity: 1, price: 150 },
      { description: "Servicios de Configuración e Integración Inicial", quantity: 1, price: 200 }
    ],
    total: 800,
    status: "paid",
    paymentGateway: "Stripe",
    paidAt: "2026-06-16",
    transactionId: "ch_3Mv8Y1LkdIwHu7ix0e1u9j2"
  },
  {
    id: "inv-2026-002",
    invoiceNumber: "FAC-2026-002",
    clientId: "client-2",
    clientName: "Roberto Carlos Díaz",
    clientEmail: "roberto.diaz@corporate.com",
    clientPhone: "+52 55 9876 5432",
    date: "2026-06-20",
    dueDate: "2026-07-20",
    items: [
      { description: "Licencia Mensual Oro - Módulo Facturación Plus", quantity: 5, price: 80 },
      { description: "Capacitación de Personal (Por hora)", quantity: 4, price: 50 }
    ],
    total: 600,
    status: "pending"
  },
  {
    id: "inv-2026-003",
    invoiceNumber: "FAC-2026-003",
    clientId: "client-3",
    clientName: "Sinergia Tecnológica SAS",
    clientEmail: "facturacion@sinergia-tech.co",
    clientPhone: "+57 310 555 1234",
    date: "2026-05-10",
    dueDate: "2026-06-10",
    items: [
      { description: "Mantenimiento Servidor Nube Privada", quantity: 1, price: 1200 },
      { description: "Paquete de SMS Transaccionales (5000 uds)", quantity: 1, price: 150 }
    ],
    total: 1350,
    status: "overdue"
  },
  {
    id: "inv-2026-004",
    invoiceNumber: "FAC-2026-004",
    clientId: "client-4",
    clientName: "Valeria Domínguez",
    clientEmail: "valeria@dominguezgroup.net",
    clientPhone: "+54 9 11 2345 6789",
    date: "2026-06-28",
    dueDate: "2026-07-28",
    items: [
      { description: "Módulo CRM Básico - Licencia Mensual", quantity: 1, price: 150 },
      { description: "Configuración Inicial de Base de Datos", quantity: 1, price: 100 }
    ],
    total: 250,
    status: "pending"
  }
];

const DEFAULT_TICKETS: Ticket[] = [
  {
    id: "ticket-1",
    clientId: "client-1",
    clientName: "Laura Sofía Gómez",
    clientEmail: "laura.gomez@example.com",
    subject: "Error de sincronización con API de Mercado Pago",
    description: "Al intentar procesar un cobro webhook recibimos un error de firma digital incorrecta. La pasarela indica que el secreto no coincide con el guardado en nuestra base de datos cifrada.",
    category: "Facturación / Pasarelas",
    priority: "high",
    status: "in_progress",
    createdAt: "2026-06-29T10:30:00Z",
    assignedAgentId: "agent-1",
    assignedAgentName: "Soporte Técnico",
    messages: [
      {
        id: "msg-1-1",
        senderId: "client-1",
        senderName: "Laura Sofía Gómez",
        senderRole: "client",
        message: "Hola, adjunto el log del error: HTTP 400 Bad Request. Signature Verification Failed.",
        createdAt: "2026-06-29T10:30:00Z"
      },
      {
        id: "msg-1-2",
        senderId: "agent-1",
        senderName: "Soporte Técnico",
        senderRole: "agent",
        message: "Estimada Laura, estamos revisando el token de validación. ¿Podría verificar si el ClientSecret configurado no incluye espacios en blanco al final?",
        createdAt: "2026-06-29T11:45:00Z"
      }
    ]
  },
  {
    id: "ticket-2",
    clientId: "client-2",
    clientName: "Roberto Carlos Díaz",
    clientEmail: "roberto.diaz@corporate.com",
    subject: "No recibo las notificaciones SMS de nuevas facturas",
    description: "He registrado mi número de teléfono pero mis clientes indican que no les están llegando los mensajes de alerta cuando emito una factura nueva en el sistema.",
    category: "Notificaciones SMS",
    priority: "medium",
    status: "open",
    createdAt: "2026-06-30T14:15:00Z",
    messages: [
      {
        id: "msg-2-1",
        senderId: "client-2",
        senderName: "Roberto Carlos Díaz",
        senderRole: "client",
        message: "Buen día. Generé tres facturas de prueba hoy y ninguno de los destinatarios recibió el SMS transaccional.",
        createdAt: "2026-06-30T14:15:00Z"
      }
    ]
  },
  {
    id: "ticket-3",
    clientId: "client-3",
    clientName: "Sinergia Tecnológica SAS",
    clientEmail: "facturacion@sinergia-tech.co",
    subject: "Aumento de cuota para base de datos",
    description: "Requerimos aumentar el límite de almacenamiento de leads ya que nuestra base de datos está llegando al 90% del límite de la capa actual.",
    category: "Infraestructura",
    priority: "low",
    status: "resolved",
    createdAt: "2026-06-25T08:00:00Z",
    assignedAgentId: "admin-1",
    assignedAgentName: "Admin Principal",
    messages: [
      {
        id: "msg-3-1",
        senderId: "client-3",
        senderName: "Sinergia Tecnológica SAS",
        senderRole: "client",
        message: "Hola, necesitamos escalar a 50GB. ¿Esto incrementará el costo mensual de nuestra suscripción?",
        createdAt: "2026-06-25T08:00:00Z"
      },
      {
        id: "msg-3-2",
        senderId: "admin-1",
        senderName: "Admin Principal",
        senderRole: "admin",
        message: "Buenas tardes. El escalado horizontal automático de la base de datos se ha habilitado para su cuenta. Su límite ahora se adapta de forma flexible y se facturará según el uso por GB con tarifas estándar. Saludos.",
        createdAt: "2026-06-25T11:00:00Z"
      },
      {
        id: "msg-3-3",
        senderId: "client-3",
        senderName: "Sinergia Tecnológica SAS",
        senderRole: "client",
        message: "Excelente, muchas gracias por el soporte tan ágil.",
        createdAt: "2026-06-25T12:30:00Z"
      }
    ]
  }
];

const DEFAULT_NOTIFICATIONS: NotificationLog[] = [
  {
    id: "notif-1",
    type: "email",
    recipient: "laura.gomez@example.com",
    title: "Factura de Compra Recibida - FAC-2026-001",
    body: "Estimado cliente, su factura FAC-2026-001 por valor de $800 USD ha sido procesada con éxito y se encuentra pagada. Gracias por su confianza.",
    timestamp: "2026-06-16T12:05:00Z",
    status: "sent"
  },
  {
    id: "notif-2",
    type: "sms",
    recipient: "+57 315 888 9999",
    title: "Confirmación de Pago",
    body: "CRM Portal: Recibimos su pago de $800 USD para la factura FAC-2026-001. Estado: Completado.",
    timestamp: "2026-06-16T12:05:10Z",
    status: "sent"
  },
  {
    id: "notif-3",
    type: "email",
    recipient: "roberto.diaz@corporate.com",
    title: "Nueva Factura Emitida - FAC-2026-002",
    body: "Estimado Roberto Carlos, se ha emitido una nueva factura con fecha límite de pago 2026-07-20 por valor de $600 USD.",
    timestamp: "2026-06-20T09:00:00Z",
    status: "sent"
  },
  {
    id: "notif-4",
    type: "sms",
    recipient: "+52 55 9876 5432",
    title: "Nueva Factura Pendiente",
    body: "CRM Portal: Se emitio su FAC-2026-002 de $600 USD. Vence: 2026-07-20. Pague aqui: https://ais-dev.run.app/pay",
    timestamp: "2026-06-20T09:01:00Z",
    status: "sent"
  }
];

const DEFAULT_AUDIT_LOGS: ComplianceAuditLog[] = [
  {
    id: "audit-1",
    action: "Cifrado de Base de Datos At-Rest",
    details: "Verificación automática periódica de claves criptográficas maestras AES-256 en Google Cloud KMS.",
    timestamp: "2026-07-01T08:00:00Z",
    ipAddress: "System (Automated Task)",
    userEmail: "security-compliance@system.internal",
    status: "success"
  },
  {
    id: "audit-2",
    action: "Clave de API Rotada",
    details: "Rotación y re-encapsulamiento de claves de pasarela Stripe para cumplir con PCI-DSS Nivel 1.",
    timestamp: "2026-07-01T09:30:00Z",
    ipAddress: "186.29.112.45",
    userEmail: "neovixcol@gmail.com",
    status: "success"
  },
  {
    id: "audit-3",
    action: "Intento de Acceso No Autorizado Bloqueado",
    details: "Múltiples intentos de inicio de sesión fallidos detectados para la cuenta administrador desde IP no usual.",
    timestamp: "2026-07-01T10:15:00Z",
    ipAddress: "203.0.113.88",
    userEmail: "neovixcol_admin@gmail.com",
    status: "warning"
  },
  {
    id: "audit-4",
    action: "Auditoría de Privacidad GDPR/HIPAA",
    details: "Ejecución de reporte automatizado de cumplimiento. Todos los datos de clientes se encuentran debidamente pseudonimizados y cifrados.",
    timestamp: "2026-07-01T11:00:00Z",
    ipAddress: "System (Auditor Bot)",
    userEmail: "security-compliance@system.internal",
    status: "success"
  }
];

const DEFAULT_USERS: AppUser[] = [
  {
    id: "admin-1",
    name: "Admin Principal",
    email: "neovixcol@gmail.com",
    role: "admin",
    phone: "+57 300 123 4567",
    company: "Portal Cloud Services",
    status: "active",
    mfaEnabled: true
  },
  {
    id: "agent-1",
    name: "Soporte Técnico",
    email: "soporte@portalcloud.co",
    role: "agent",
    phone: "+57 311 987 6543",
    company: "Portal Cloud Services",
    status: "active",
    mfaEnabled: false
  },
  {
    id: "client-1",
    name: "Laura Sofía Gómez",
    email: "laura.gomez@example.com",
    role: "client",
    phone: "+57 315 888 9999",
    company: "Gómez & Gómez Abogados",
    status: "active",
    mfaEnabled: false
  },
  {
    id: "client-2",
    name: "Roberto Carlos Díaz",
    email: "roberto.diaz@corporate.com",
    role: "client",
    phone: "+52 55 9876 5432",
    company: "Díaz Logística CDMX",
    status: "active",
    mfaEnabled: false
  }
];

// Helper to determine if Firestore is actually initialized and has data.
// If it fails, fallback gracefully so that the application is fully offline-resilient.
export async function initializeDatabase() {
  try {
    const leadsCol = collection(db, 'crm_leads');
    const snap = await getDocs(leadsCol);
    
    if (snap.empty) {
      console.log("Firestore está vacío. Sembrando datos iniciales...");
      
      // Seed Leads
      for (const lead of DEFAULT_LEADS) {
        await setDoc(doc(db, 'crm_leads', lead.id), lead);
      }
      // Seed Invoices
      for (const inv of DEFAULT_INVOICES) {
        await setDoc(doc(db, 'invoices', inv.id), inv);
      }
      // Seed Tickets
      for (const tk of DEFAULT_TICKETS) {
        await setDoc(doc(db, 'tickets', tk.id), tk);
      }
      // Seed Notifications
      for (const nf of DEFAULT_NOTIFICATIONS) {
        await setDoc(doc(db, 'notifications', nf.id), nf);
      }
      // Seed Audit Logs
      for (const log of DEFAULT_AUDIT_LOGS) {
        await setDoc(doc(db, 'audit_logs', log.id), log);
      }
      // Seed Users
      for (const usr of DEFAULT_USERS) {
        await setDoc(doc(db, 'users', usr.id), usr);
      }
      console.log("¡Sembrado de datos en Firestore completado con éxito!");
    }
    
    isFirebaseConnected = true;
  } catch (error) {
    console.warn("No se pudo conectar a Firebase o no se han configurado permisos. Usando caché local en memoria:", error);
    isFirebaseConnected = false;
    
    // Seed locally if memory collections are empty
    if (localCRMLeads.length === 0) {
      localCRMLeads = [...DEFAULT_LEADS];
      localInvoices = [...DEFAULT_INVOICES];
      localTickets = [...DEFAULT_TICKETS];
      localNotifications = [...DEFAULT_NOTIFICATIONS];
      localAuditLogs = [...DEFAULT_AUDIT_LOGS];
      localUsers = [...DEFAULT_USERS];
    }
  }
}

// CRM LEADS ACTIONS
export async function getCRMLeads(): Promise<CRMLead[]> {
  if (!isFirebaseConnected) return localCRMLeads;
  try {
    const snap = await getDocs(collection(db, 'crm_leads'));
    const list: CRMLead[] = [];
    snap.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as CRMLead);
    });
    return list.length > 0 ? list : localCRMLeads;
  } catch (err) {
    console.error("Firestore read error:", err);
    return localCRMLeads;
  }
}

export async function addCRMLead(lead: Omit<CRMLead, 'id'>): Promise<CRMLead> {
  const newId = `lead-${Date.now()}`;
  const newLead: CRMLead = { id: newId, ...lead };
  
  if (!isFirebaseConnected) {
    localCRMLeads.push(newLead);
    return newLead;
  }
  
  try {
    await setDoc(doc(db, 'crm_leads', newId), newLead);
    return newLead;
  } catch (err) {
    console.error("Firestore add error:", err);
    localCRMLeads.push(newLead);
    return newLead;
  }
}

export async function updateCRMLeadStage(id: string, stage: CRMLead['stage']): Promise<boolean> {
  if (!isFirebaseConnected) {
    const idx = localCRMLeads.findIndex(l => l.id === id);
    if (idx !== -1) {
      localCRMLeads[idx].stage = stage;
      localCRMLeads[idx].lastContactDate = new Date().toISOString().split('T')[0];
      return true;
    }
    return false;
  }
  
  try {
    const docRef = doc(db, 'crm_leads', id);
    await updateDoc(docRef, { 
      stage, 
      lastContactDate: new Date().toISOString().split('T')[0] 
    });
    return true;
  } catch (err) {
    console.error("Firestore update error:", err);
    const idx = localCRMLeads.findIndex(l => l.id === id);
    if (idx !== -1) {
      localCRMLeads[idx].stage = stage;
      localCRMLeads[idx].lastContactDate = new Date().toISOString().split('T')[0];
      return true;
    }
    return false;
  }
}

export async function updateCRMLeadNotes(id: string, notes: string[]): Promise<boolean> {
  if (!isFirebaseConnected) {
    const idx = localCRMLeads.findIndex(l => l.id === id);
    if (idx !== -1) {
      localCRMLeads[idx].notes = notes;
      return true;
    }
    return false;
  }
  try {
    await updateDoc(doc(db, 'crm_leads', id), { notes });
    return true;
  } catch (err) {
    console.error(err);
    const idx = localCRMLeads.findIndex(l => l.id === id);
    if (idx !== -1) {
      localCRMLeads[idx].notes = notes;
      return true;
    }
    return false;
  }
}

// INVOICES ACTIONS
export async function getInvoices(): Promise<Invoice[]> {
  if (!isFirebaseConnected) return localInvoices;
  try {
    const snap = await getDocs(collection(db, 'invoices'));
    const list: Invoice[] = [];
    snap.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as Invoice);
    });
    return list.length > 0 ? list : localInvoices;
  } catch (err) {
    console.error("Firestore read error:", err);
    return localInvoices;
  }
}

export async function addInvoice(invoice: Omit<Invoice, 'id'>): Promise<Invoice> {
  const newId = `inv-${Date.now()}`;
  const newInvoice: Invoice = { id: newId, ...invoice };
  
  if (!isFirebaseConnected) {
    localInvoices.push(newInvoice);
    return newInvoice;
  }
  
  try {
    await setDoc(doc(db, 'invoices', newId), newInvoice);
    return newInvoice;
  } catch (err) {
    console.error("Firestore add error:", err);
    localInvoices.push(newInvoice);
    return newInvoice;
  }
}

export async function updateInvoicePayment(
  id: string, 
  gateway: Invoice['paymentGateway'], 
  transactionId: string
): Promise<boolean> {
  const paidAt = new Date().toISOString().split('T')[0];
  if (!isFirebaseConnected) {
    const idx = localInvoices.findIndex(i => i.id === id);
    if (idx !== -1) {
      localInvoices[idx].status = 'paid';
      localInvoices[idx].paymentGateway = gateway;
      localInvoices[idx].paidAt = paidAt;
      localInvoices[idx].transactionId = transactionId;
      return true;
    }
    return false;
  }
  
  try {
    const docRef = doc(db, 'invoices', id);
    await updateDoc(docRef, {
      status: 'paid',
      paymentGateway: gateway,
      paidAt,
      transactionId
    });
    return true;
  } catch (err) {
    console.error("Firestore update error:", err);
    const idx = localInvoices.findIndex(i => i.id === id);
    if (idx !== -1) {
      localInvoices[idx].status = 'paid';
      localInvoices[idx].paymentGateway = gateway;
      localInvoices[idx].paidAt = paidAt;
      localInvoices[idx].transactionId = transactionId;
      return true;
    }
    return false;
  }
}

// TICKETS ACTIONS
export async function getTickets(): Promise<Ticket[]> {
  if (!isFirebaseConnected) return localTickets;
  try {
    const snap = await getDocs(collection(db, 'tickets'));
    const list: Ticket[] = [];
    snap.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as Ticket);
    });
    return list.length > 0 ? list : localTickets;
  } catch (err) {
    console.error("Firestore read error:", err);
    return localTickets;
  }
}

export async function addTicket(ticket: Omit<Ticket, 'id'>): Promise<Ticket> {
  const newId = `ticket-${Date.now()}`;
  const newTicket: Ticket = { id: newId, ...ticket };
  
  if (!isFirebaseConnected) {
    localTickets.push(newTicket);
    return newTicket;
  }
  
  try {
    await setDoc(doc(db, 'tickets', newId), newTicket);
    return newTicket;
  } catch (err) {
    console.error("Firestore add error:", err);
    localTickets.push(newTicket);
    return newTicket;
  }
}

export async function updateTicketStatus(
  id: string, 
  status: Ticket['status'], 
  assignedAgentId?: string, 
  assignedAgentName?: string
): Promise<boolean> {
  const updateData: Partial<Ticket> = { status };
  if (assignedAgentId) {
    updateData.assignedAgentId = assignedAgentId;
    updateData.assignedAgentName = assignedAgentName;
  }
  
  if (!isFirebaseConnected) {
    const idx = localTickets.findIndex(t => t.id === id);
    if (idx !== -1) {
      localTickets[idx].status = status;
      if (assignedAgentId) {
        localTickets[idx].assignedAgentId = assignedAgentId;
        localTickets[idx].assignedAgentName = assignedAgentName;
      }
      return true;
    }
    return false;
  }
  
  try {
    await updateDoc(doc(db, 'tickets', id), updateData);
    return true;
  } catch (err) {
    console.error("Firestore update error:", err);
    const idx = localTickets.findIndex(t => t.id === id);
    if (idx !== -1) {
      localTickets[idx].status = status;
      if (assignedAgentId) {
        localTickets[idx].assignedAgentId = assignedAgentId;
        localTickets[idx].assignedAgentName = assignedAgentName;
      }
      return true;
    }
    return false;
  }
}

export async function addTicketMessage(id: string, msg: Omit<Ticket['messages'][0], 'id'>): Promise<Ticket['messages'][0]> {
  const newMsgId = `msg-${Date.now()}`;
  const newMsg = { id: newMsgId, ...msg };
  
  if (!isFirebaseConnected) {
    const idx = localTickets.findIndex(t => t.id === id);
    if (idx !== -1) {
      localTickets[idx].messages.push(newMsg);
    }
    return newMsg;
  }
  
  try {
    const tickets = await getTickets();
    const target = tickets.find(t => t.id === id);
    if (target) {
      const updatedMessages = [...target.messages, newMsg];
      await updateDoc(doc(db, 'tickets', id), { messages: updatedMessages });
    }
    return newMsg;
  } catch (err) {
    console.error("Firestore add ticket message error:", err);
    const idx = localTickets.findIndex(t => t.id === id);
    if (idx !== -1) {
      localTickets[idx].messages.push(newMsg);
    }
    return newMsg;
  }
}

// NOTIFICATIONS
export async function getNotifications(): Promise<NotificationLog[]> {
  if (!isFirebaseConnected) return localNotifications;
  try {
    const snap = await getDocs(collection(db, 'notifications'));
    const list: NotificationLog[] = [];
    snap.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as NotificationLog);
    });
    // Sort reverse chronological
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    console.error(err);
    return localNotifications;
  }
}

export async function addNotificationLog(notif: Omit<NotificationLog, 'id'>): Promise<NotificationLog> {
  const newId = `notif-${Date.now()}`;
  const newNotif = { id: newId, ...notif };
  
  if (!isFirebaseConnected) {
    localNotifications.unshift(newNotif);
    return newNotif;
  }
  
  try {
    await setDoc(doc(db, 'notifications', newId), newNotif);
    return newNotif;
  } catch (err) {
    console.error(err);
    localNotifications.unshift(newNotif);
    return newNotif;
  }
}

// COMPLIANCE AUDIT LOGS
export async function getComplianceAuditLogs(): Promise<ComplianceAuditLog[]> {
  if (!isFirebaseConnected) return localAuditLogs;
  try {
    const snap = await getDocs(collection(db, 'audit_logs'));
    const list: ComplianceAuditLog[] = [];
    snap.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as ComplianceAuditLog);
    });
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    console.error(err);
    return localAuditLogs;
  }
}

export async function addComplianceAuditLog(log: Omit<ComplianceAuditLog, 'id'>): Promise<ComplianceAuditLog> {
  const newId = `audit-${Date.now()}`;
  const newLog = { id: newId, ...log };
  
  if (!isFirebaseConnected) {
    localAuditLogs.unshift(newLog);
    return newLog;
  }
  
  try {
    await setDoc(doc(db, 'audit_logs', newId), newLog);
    return newLog;
  } catch (err) {
    console.error(err);
    localAuditLogs.unshift(newLog);
    return newLog;
  }
}

// USERS
export async function getUsers(): Promise<AppUser[]> {
  if (!isFirebaseConnected) return localUsers;
  try {
    const snap = await getDocs(collection(db, 'users'));
    const list: AppUser[] = [];
    snap.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as AppUser);
    });
    return list.length > 0 ? list : localUsers;
  } catch (err) {
    console.error(err);
    return localUsers;
  }
}

export async function updateUserMfa(id: string, mfaEnabled: boolean, mfaSecret?: string): Promise<boolean> {
  if (!isFirebaseConnected) {
    const idx = localUsers.findIndex(u => u.id === id);
    if (idx !== -1) {
      localUsers[idx].mfaEnabled = mfaEnabled;
      if (mfaSecret) localUsers[idx].mfaSecret = mfaSecret;
      return true;
    }
    return false;
  }
  try {
    const data: Partial<AppUser> = { mfaEnabled };
    if (mfaSecret) data.mfaSecret = mfaSecret;
    await updateDoc(doc(db, 'users', id), data);
    return true;
  } catch (err) {
    console.error(err);
    const idx = localUsers.findIndex(u => u.id === id);
    if (idx !== -1) {
      localUsers[idx].mfaEnabled = mfaEnabled;
      if (mfaSecret) localUsers[idx].mfaSecret = mfaSecret;
      return true;
    }
    return false;
  }
}
