import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  DollarSign, 
  Phone, 
  Mail, 
  Briefcase, 
  X, 
  User, 
  MessageSquare,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { CRMLead, CRMLeadStage, AppUser } from '../types';

interface CRMProps {
  leads: CRMLead[];
  currentUser: AppUser | null;
  onAddLead: (lead: Omit<CRMLead, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateStage: (id: string, stage: CRMLeadStage) => Promise<void>;
  onUpdateNotes: (id: string, notes: string[]) => Promise<void>;
}

const STAGES: { value: CRMLeadStage; label: string; color: string; bg: string }[] = [
  { value: 'new', label: 'Nuevo', color: 'text-slate-700 border-slate-300', bg: 'bg-slate-100' },
  { value: 'contacted', label: 'Contactado', color: 'text-blue-700 border-blue-300', bg: 'bg-blue-50' },
  { value: 'proposal', label: 'Propuesta', color: 'text-amber-700 border-amber-300', bg: 'bg-amber-50' },
  { value: 'won', label: 'Ganado', color: 'text-emerald-700 border-emerald-300', bg: 'bg-emerald-50' },
  { value: 'lost', label: 'Perdido', color: 'text-rose-700 border-rose-300', bg: 'bg-rose-50' }
];

export default function CRM({ leads, currentUser, onAddLead, onUpdateStage, onUpdateNotes }: CRMProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  
  // New Lead form state
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [value, setValue] = useState('');
  const [stage, setStage] = useState<CRMLeadStage>('new');

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !company || !email) return;

    await onAddLead({
      name,
      company,
      email,
      phone: phone || 'Sin número',
      stage,
      value: Number(value) || 0,
      lastContactDate: new Date().toISOString().split('T')[0],
      notes: [`Lead creado por ${currentUser?.name || 'Sistema'}`],
      assignedAgentId: currentUser?.id || 'agent-1',
      assignedAgentName: currentUser?.name || 'Soporte Técnico'
    });

    // Reset Form
    setName('');
    setCompany('');
    setEmail('');
    setPhone('');
    setValue('');
    setStage('new');
    setIsAddOpen(false);
  };

  const handleAddNote = async () => {
    if (!selectedLead || !newNote.trim()) return;
    const updatedNotes = [...selectedLead.notes, `${new Date().toLocaleDateString()}: ${newNote}`];
    await onUpdateNotes(selectedLead.id, updatedNotes);
    // Sync local selected state
    setSelectedLead({ ...selectedLead, notes: updatedNotes });
    setNewNote('');
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION WITH CRM BRANDING */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-blue-600" />
            CRM & Gestión de Prospectos
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">Administra relaciones comerciales, canales de preventa y leads estratégicos en tiempo real</p>
        </div>
        
        {/* ADD BUTTON IF ADMIN OR AGENT */}
        {currentUser?.role !== 'client' && (
          <button 
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded transition-all cursor-pointer shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" /> Nuevo Lead
          </button>
        )}
      </div>

      {/* FILTER SEARCH BAR */}
      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-slate-200">
        <Search className="h-3.5 w-3.5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar prospecto por nombre, compañía o correo..."
          className="bg-transparent text-xs text-slate-800 placeholder-slate-450 focus:outline-none w-full font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* KANBAN BOARD LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 overflow-x-auto pb-4">
        {STAGES.map(col => {
          const leadsInStage = filteredLeads.filter(l => l.stage === col.value);
          const totalValueInStage = leadsInStage.reduce((sum, item) => sum + item.value, 0);

          return (
            <div key={col.value} className={`rounded border border-slate-200 p-3 ${col.bg} min-w-[210px] flex flex-col h-[490px]`}>
              <div className="flex justify-between items-center mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${col.color}`}>
                  {col.label}
                </span>
                <span className="text-[10px] font-bold text-slate-500 font-mono">
                  {leadsInStage.length}
                </span>
              </div>
              
              <div className="mb-2.5 text-[9px] font-bold text-slate-500 flex justify-between bg-white px-2 py-1 rounded border border-slate-100">
                <span>Valor:</span>
                <span className="text-slate-800 font-mono">${totalValueInStage.toLocaleString()} USD</span>
              </div>

              {/* CARD CONTAINER */}
              <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                {leadsInStage.map(lead => (
                  <div 
                    key={lead.id} 
                    onClick={() => setSelectedLead(lead)}
                    className="bg-white p-2.5 rounded border border-slate-200 hover:border-blue-500 hover:shadow-xs cursor-pointer transition-all space-y-1.5 group"
                  >
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 line-clamp-1">{lead.name}</h4>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium truncate">{lead.company}</p>
                    
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[10px]">
                      <span className="font-bold text-slate-900 font-mono">${lead.value.toLocaleString()}</span>
                      <span className="text-slate-400 font-mono text-[9px]">{lead.lastContactDate}</span>
                    </div>
                  </div>
                ))}

                {leadsInStage.length === 0 && (
                  <div className="text-center py-10 text-[9px] text-slate-400 font-bold border border-dashed border-slate-350 bg-slate-50/20 rounded">
                    SIN LEADS AQUÍ
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* LEAD DETAIL MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded shadow-xl border border-slate-200 w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider font-mono">Ficha de Prospecto</span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">{selectedLead.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedLead(null)}
                className="p-1 hover:bg-slate-200 text-slate-500 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              
              {/* Contact Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 rounded border border-slate-100 space-y-0.5">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Empresa</span>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                    {selectedLead.company}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-100 space-y-0.5">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Presupuesto</span>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 font-mono">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                    ${selectedLead.value.toLocaleString()} USD
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-100 space-y-0.5">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Correo Electrónico</span>
                  <div className="text-slate-800 flex items-center gap-1.5 truncate">
                    <Mail className="h-3.5 w-3.5 text-slate-500" />
                    {selectedLead.email}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-100 space-y-0.5">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Teléfono</span>
                  <div className="text-slate-800 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-500" />
                    {selectedLead.phone}
                  </div>
                </div>
              </div>

              {/* STAGE CONTROLS IF PERMITTED */}
              {currentUser?.role !== 'client' && (
                <div className="p-3 bg-blue-50/55 rounded border border-blue-100/60 space-y-2">
                  <p className="text-[10px] font-bold text-blue-900 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                    Modificar Estado Comercial (Drag & Drop Sim)
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {STAGES.map(st => (
                      <button
                        key={st.value}
                        onClick={async () => {
                          await onUpdateStage(selectedLead.id, st.value);
                          setSelectedLead({ ...selectedLead, stage: st.value, lastContactDate: new Date().toISOString().split('T')[0] });
                        }}
                        className={`text-[9px] font-bold px-2 py-1 rounded border transition-all cursor-pointer ${
                          selectedLead.stage === st.value 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TIMELINE / NOTES */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
                  Historial de Interacciones & Notas
                </h4>
                
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {selectedLead.notes.map((note, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700 font-medium">
                      {note}
                    </div>
                  ))}
                </div>

                {/* ADD NOTE FORM */}
                {currentUser?.role !== 'client' && (
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Registrar nueva llamada, reunión o nota..."
                      className="flex-1 bg-slate-50 text-xs border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddNote();
                      }}
                    />
                    <button
                      onClick={handleAddNote}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-3 py-1.5 rounded cursor-pointer"
                    >
                      Añadir
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                Agente: {selectedLead.assignedAgentName || 'Sin asignar'}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Calendar className="h-3.5 w-3.5" />
                Actualizado: {selectedLead.lastContactDate}
              </span>
            </div>

          </div>
        </div>
      )}

      {/* ADD LEAD MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Crear Prospecto Comercial</h3>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="p-1 hover:bg-slate-200 text-slate-500 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitLead} className="p-4 space-y-3">
              <div className="space-y-0.5">
                <label className="text-[9px] font-bold uppercase text-slate-500">Nombre del Lead *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. Carlos Mendoza" 
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-[9px] font-bold uppercase text-slate-500">Empresa / Compañía *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. Intech Corp" 
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold uppercase text-slate-500">Correo Electrónico *</label>
                  <input 
                    type="email" 
                    required
                    placeholder="ejemplo@empresa.com" 
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold uppercase text-slate-500">Teléfono</label>
                  <input 
                    type="text" 
                    placeholder="+57 300 000 0000" 
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold uppercase text-slate-500">Valor Estimado ($ USD)</label>
                  <input 
                    type="number" 
                    placeholder="Ej. 12000" 
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-mono"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold uppercase text-slate-500">Etapa Inicial</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-bold"
                    value={stage}
                    onChange={(e) => setStage(e.target.value as CRMLeadStage)}
                  >
                    <option value="new">Nuevo</option>
                    <option value="contacted">Contactado</option>
                    <option value="proposal">Propuesta</option>
                    <option value="won">Ganado</option>
                  </select>
                </div>
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
                  Crear Prospecto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
