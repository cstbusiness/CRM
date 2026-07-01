import React, { useState, useMemo } from 'react';
import { 
  LifeBuoy, 
  Plus, 
  Search, 
  MessageSquare, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  UserPlus, 
  Send,
  User,
  Shield,
  Tag,
  Sparkles
} from 'lucide-react';
import { Ticket, TicketPriority, TicketStatus, AppUser } from '../types';

interface SupportProps {
  tickets: Ticket[];
  currentUser: AppUser | null;
  onAddTicket: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'messages'>) => Promise<void>;
  onUpdateStatus: (id: string, status: TicketStatus, agentId?: string, agentName?: string) => Promise<void>;
  onAddMessage: (id: string, message: string) => Promise<void>;
  triggerNotification: (type: 'email' | 'sms', recipient: string, title: string, body: string) => Promise<void>;
}

export default function Support({ 
  tickets, 
  currentUser, 
  onAddTicket, 
  onUpdateStatus, 
  onAddMessage,
  triggerNotification
}: SupportProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // Create ticket state
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Facturación / Pasarelas');
  const [priority, setPriority] = useState<TicketPriority>('medium');

  // Conversation state
  const [msgInput, setMsgInput] = useState('');

  // Filtering tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(tk => {
      const matchesSearch = tk.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            tk.clientName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || tk.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || tk.priority === priorityFilter;

      // Clients only see their own tickets! Staff see everything!
      if (currentUser?.role === 'client') {
        return matchesSearch && matchesStatus && matchesPriority && tk.clientEmail === currentUser.email;
      }
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, searchTerm, statusFilter, priorityFilter, currentUser]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) return;

    const newTicketData = {
      clientId: currentUser?.id || `client-${Date.now()}`,
      clientName: currentUser?.name || 'Cliente de Prueba',
      clientEmail: currentUser?.email || 'test@example.com',
      subject,
      description,
      category,
      priority,
      status: 'open' as TicketStatus,
      messages: []
    };

    await onAddTicket(newTicketData);

    // Trigger notification automatic logs
    await triggerNotification(
      'email',
      currentUser?.email || 'admin@portalcloud.co',
      `Nuevo Ticket Registrado: #${subject}`,
      `Estimado ${currentUser?.name}, su caso de soporte con asunto "${subject}" ha sido registrado. Un agente técnico lo atenderá pronto.`
    );

    // Reset Form
    setSubject('');
    setDescription('');
    setCategory('Facturación / Pasarelas');
    setPriority('medium');
    setIsAddOpen(false);
  };

  const handleSendMessage = async () => {
    if (!selectedTicket || !msgInput.trim()) return;

    await onAddMessage(selectedTicket.id, msgInput);

    // Trigger Notification automatically!
    if (currentUser?.role === 'client') {
      // Notify technical team/admin
      await triggerNotification(
        'email',
        'soporte@portalcloud.co',
        `Cliente respondió en ticket: ${selectedTicket.subject}`,
        `El cliente ${currentUser.name} ha dejado un nuevo mensaje: "${msgInput}". Por favor revise el caso.`
      );
    } else {
      // Notify the client!
      await triggerNotification(
        'email',
        selectedTicket.clientEmail,
        `Respuesta de Soporte Técnico: ${selectedTicket.subject}`,
        `Hola, nuestro agente técnico ${currentUser?.name} ha respondido a tu ticket: "${msgInput}".`
      );
    }

    setMsgInput('');
    
    // Sync local selectedTicket details by re-fetching latest messages
    const updatedTickets = tickets.find(t => t.id === selectedTicket.id);
    if (updatedTickets) {
      setSelectedTicket(updatedTickets);
    }
  };

  const handleClaimTicket = async (ticketId: string) => {
    if (!currentUser) return;
    await onUpdateStatus(ticketId, 'in_progress', currentUser.id, currentUser.name);
    
    // Trigger notification
    const tk = tickets.find(t => t.id === ticketId);
    if (tk) {
      await triggerNotification(
        'email',
        tk.clientEmail,
        `Soporte Asignado: ${tk.subject}`,
        `Hola, el agente ${currentUser.name} se ha asignado a tu caso y ya se encuentra trabajando en resolver el inconveniente.`
      );
      
      setSelectedTicket({
        ...tk,
        status: 'in_progress',
        assignedAgentId: currentUser.id,
        assignedAgentName: currentUser.name
      });
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    await onUpdateStatus(ticketId, 'resolved');
    const tk = tickets.find(t => t.id === ticketId);
    if (tk) {
      await triggerNotification(
        'email',
        tk.clientEmail,
        `Caso Resuelto: ${tk.subject}`,
        `Estimado cliente, su ticket ha sido marcado como RESUELTO. Si requiere soporte adicional, puede responder el caso o crear uno nuevo.`
      );
      
      setSelectedTicket({
        ...tk,
        status: 'resolved'
      });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <LifeBuoy className="h-4 w-4 text-blue-600" />
            Centro de Soporte Técnico & SLA
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            {currentUser?.role === 'client' 
              ? 'Reporta inconvenientes con pasarelas de pago, facturación o integraciones de API'
              : 'Atención a incidentes con seguimiento de SLA en tiempo real y asignación de agentes'}
          </p>
        </div>

        {currentUser?.role === 'client' && (
          <button 
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded transition-all cursor-pointer shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" /> Registrar Ticket
          </button>
        )}
      </div>

      {/* FILTER SEARCH PANEL */}
      <div className="flex flex-col md:flex-row gap-2 bg-white p-2.5 rounded border border-slate-200">
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 flex-1">
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por asunto, cliente, categoría..."
            className="bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-full font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-1.5">
          {/* Status Select Filter */}
          <select
            className="bg-white border border-slate-200 text-[10px] font-bold rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'all')}
          >
            <option value="all">Todos los Estados</option>
            <option value="open">Abierto (Open)</option>
            <option value="in_progress">En Progreso (In Progress)</option>
            <option value="resolved">Resuelto (Resolved)</option>
          </select>

          {/* Priority Select Filter */}
          <select
            className="bg-white border border-slate-200 text-[10px] font-bold rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | 'all')}
          >
            <option value="all">Todas las Prioridades</option>
            <option value="low">Baja (Low)</option>
            <option value="medium">Media (Medium)</option>
            <option value="high">Alta (High)</option>
          </select>
        </div>
      </div>

      {/* TWO COLUMN SPLIT (LEFT LIST, RIGHT CONVERSATION PANE) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* TICKETS LIST PANEL (1 Col or 3 Cols on small/medium) */}
        <div className="bg-white rounded border border-slate-200 overflow-hidden h-[510px] flex flex-col lg:col-span-1 shadow-xs">
          <div className="bg-slate-50 p-2.5 border-b border-slate-200">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Lista de Casos ({filteredTickets.length})</span>
          </div>
          
          <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
            {filteredTickets.map(tk => {
              const isSelected = selectedTicket?.id === tk.id;
              return (
                <div 
                  key={tk.id}
                  onClick={() => setSelectedTicket(tk)}
                  className={`p-3 cursor-pointer hover:bg-slate-50/70 transition-all space-y-2 text-xs ${
                    isSelected ? 'bg-blue-50/50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-slate-800 line-clamp-2">{tk.subject}</h4>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded capitalize shrink-0 border ${
                      tk.priority === 'high' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      tk.priority === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {tk.priority}
                    </span>
                  </div>

                  <p className="text-slate-500 line-clamp-2 text-[10px] font-medium leading-normal">{tk.description}</p>
                  
                  <div className="flex justify-between items-center text-[9px] text-slate-400 pt-1.5 border-t border-slate-100/60 font-bold uppercase tracking-wider">
                    <span className="truncate max-w-[110px]">{tk.clientName}</span>
                    <span className={`font-bold uppercase tracking-wider ${
                      tk.status === 'resolved' ? 'text-emerald-600' :
                      tk.status === 'in_progress' ? 'text-amber-500' :
                      'text-rose-500 animate-pulse'
                    }`}>
                      {tk.status === 'in_progress' ? 'En proceso' : tk.status === 'resolved' ? 'Resuelto' : 'Abierto'}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredTickets.length === 0 && (
              <div className="text-center py-20 text-slate-400 text-[10px] font-bold uppercase">
                Sines tickets de soporte
              </div>
            )}
          </div>
        </div>

        {/* CONVERSATION TIMELINE VIEW PANEL (2 Col) */}
        <div className="bg-white rounded border border-slate-200 overflow-hidden h-[510px] flex flex-col lg:col-span-2 shadow-xs">
          {selectedTicket ? (
            <div className="flex flex-col h-full">
              {/* Conversation Header */}
              <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{selectedTicket.subject}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500 font-bold flex-wrap">
                    <span className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-700">{selectedTicket.category}</span>
                    <span>• Reportado por: <strong>{selectedTicket.clientName}</strong></span>
                    {selectedTicket.assignedAgentName && (
                      <span>• Agente: <strong className="text-blue-600">{selectedTicket.assignedAgentName}</strong></span>
                    )}
                  </div>
                </div>

                {/* Agent Action Buttons */}
                {currentUser?.role !== 'client' && (
                  <div className="flex gap-1">
                    {selectedTicket.status === 'open' && (
                      <button
                        onClick={() => handleClaimTicket(selectedTicket.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="h-3 w-3" /> Atender Caso
                      </button>
                    )}
                    {selectedTicket.status !== 'resolved' && (
                      <button
                        onClick={() => handleResolveTicket(selectedTicket.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="h-3 w-3" /> Resolver Caso
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Chat messages list */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50">
                {/* Initial Description from Client */}
                <div className="flex gap-2 max-w-[85%]">
                  <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 uppercase font-bold text-[10px] font-mono select-none shrink-0">
                    CL
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200 text-xs text-slate-800 space-y-1">
                    <div className="flex items-center gap-1 mb-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>{selectedTicket.clientName}</span>
                      <span>•</span>
                      <span>Cliente</span>
                    </div>
                    <p className="leading-snug font-bold text-slate-900">{selectedTicket.subject}</p>
                    <p className="leading-snug text-slate-600 font-medium">{selectedTicket.description}</p>
                    <p className="text-[8px] text-slate-400 font-mono text-right pt-0.5">{selectedTicket.createdAt.split('T')[0]}</p>
                  </div>
                </div>

                {/* Ticket Message Thread */}
                {selectedTicket.messages.map((msg, idx) => {
                  const isStaff = msg.senderRole === 'admin' || msg.senderRole === 'agent';
                  return (
                    <div 
                      key={idx} 
                      className={`flex gap-2 max-w-[85%] ${isStaff ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center uppercase font-bold text-[10px] shrink-0 select-none ${
                        isStaff ? 'bg-blue-600 text-white font-mono' : 'bg-slate-200 text-slate-600 font-mono'
                      }`}>
                        {isStaff ? 'ST' : 'CL'}
                      </div>
                      
                      <div className={`p-2.5 rounded border text-xs space-y-1 ${
                        isStaff 
                          ? 'bg-blue-600 text-white border-blue-700' 
                          : 'bg-white text-slate-800 border-slate-200'
                      }`}>
                        <div className={`flex items-center gap-1 mb-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          isStaff ? 'text-blue-100' : 'text-slate-500'
                        }`}>
                          <span>{msg.senderName}</span>
                          <span>•</span>
                          <span>{isStaff ? 'Soporte' : 'Cliente'}</span>
                        </div>
                        <p className="leading-snug whitespace-pre-line font-medium">{msg.message}</p>
                        <p className={`text-[8px] font-mono text-right pt-0.5 ${isStaff ? 'text-blue-100' : 'text-slate-400'}`}>
                          Justo ahora
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input form */}
              {selectedTicket.status !== 'resolved' ? (
                <div className="p-2 border-t border-slate-200 bg-white flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Escribe una respuesta técnica..."
                    className="flex-1 bg-slate-50 text-xs border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMessage();
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer"
                  >
                    Enviar <Send className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold text-center border-t border-slate-200 flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> ESTE CASO DE SOPORTE HA SIDO CERRADO Y RESUELTO.
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-2 bg-slate-50/50">
              <LifeBuoy className="h-8 w-8 text-slate-300" />
              <div>
                <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Ningún ticket seleccionado</p>
                <p className="text-[10px] text-slate-400 max-w-xs mt-0.5 font-medium leading-relaxed">Selecciona un caso de soporte de la lista izquierda para visualizar su historial completo y responder.</p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* CREATE TICKET MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Registrar Incidencia de Soporte</h3>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="p-1 hover:bg-slate-200 text-slate-500 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-4 space-y-3">
              
              <div className="p-2.5 bg-blue-50/50 rounded border border-blue-100 text-[11px] text-blue-900 leading-relaxed font-semibold">
                Nuestros agentes técnicos se encuentran activos en un SLA de respuesta menor a 4 horas.
              </div>

              <div className="space-y-0.5">
                <label className="text-[9px] font-bold uppercase text-slate-500">Asunto del Ticket *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. Problema con la llave API de Stripe" 
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold uppercase text-slate-500">Categoría</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-bold"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option>Facturación / Pasarelas</option>
                    <option>Soporte de API / Código</option>
                    <option>Seguridad / Cuentas</option>
                    <option>Notificaciones SMS / Correo</option>
                    <option>Infraestructura Cloud</option>
                  </select>
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold uppercase text-slate-500">Prioridad</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-bold"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TicketPriority)}
                  >
                    <option value="low">Baja (Low)</option>
                    <option value="medium">Media (Medium)</option>
                    <option value="high">Alta (High)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-0.5">
                <label className="text-[9px] font-bold uppercase text-slate-500">Descripción Detallada *</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Por favor, describe detalladamente el error y adjunta logs o códigos de respuesta HTTP recibidos." 
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white resize-none font-medium leading-normal"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
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
                  Abrir Incidencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
