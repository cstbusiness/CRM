export type UserRole = 'admin' | 'agent' | 'client';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string;
  company?: string;
  status: 'active' | 'suspended';
  mfaEnabled: boolean;
  mfaSecret?: string;
}

export type CRMLeadStage = 'new' | 'contacted' | 'proposal' | 'won' | 'lost';

export interface CRMLead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  stage: CRMLeadStage;
  value: number;
  lastContactDate: string;
  notes: string[];
  assignedAgentId?: string;
  assignedAgentName?: string;
  createdAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
}

export type InvoiceStatus = 'paid' | 'pending' | 'overdue';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  total: number;
  status: InvoiceStatus;
  paymentGateway?: 'Stripe' | 'PayPal' | 'Mercado Pago' | 'Wompi';
  paidAt?: string;
  transactionId?: string;
}

export type TicketPriority = 'low' | 'medium' | 'high';
export type TicketStatus = 'open' | 'in_progress' | 'resolved';

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  subject: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  messages: TicketMessage[];
}

export interface NotificationLog {
  id: string;
  type: 'email' | 'sms';
  recipient: string;
  title: string;
  body: string;
  timestamp: string;
  status: 'sent' | 'failed';
}

export interface ComplianceAuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress: string;
  userEmail: string;
  status: 'success' | 'warning' | 'alert';
}
