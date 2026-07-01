import React, { useState, useMemo } from 'react';
import { 
  BellRing, 
  Mail, 
  Smartphone, 
  Search, 
  CheckCircle, 
  Send, 
  ChevronRight,
  Eye,
  Info,
  Sparkles
} from 'lucide-react';
import { NotificationLog } from '../types';

interface NotificationsLogProps {
  notifications: NotificationLog[];
}

export default function NotificationsLog({ notifications }: NotificationsLogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'email' | 'sms'>('all');
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);

  const filteredLogs = useMemo(() => {
    return notifications.filter(notif => {
      const matchesSearch = 
        notif.recipient.includes(searchTerm) ||
        notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.body.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'all' || notif.type === typeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [notifications, searchTerm, typeFilter]);

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <BellRing className="h-4 w-4 text-blue-600" />
          Logs de Notificaciones Automáticas (SMS & Email)
        </h2>
        <p className="text-[11px] text-slate-500 font-medium">
          Registro en tiempo real de notificaciones transaccionales disparadas automáticamente por eventos de cobro, soporte e inscripciones.
        </p>
      </div>

      {/* DISPATCH STATE ADVISORY */}
      <div className="p-3 bg-blue-50/50 rounded border border-blue-100/60 flex items-start gap-2.5">
        <Sparkles className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-950 space-y-0.5">
          <p className="font-bold uppercase text-[10px]">Motor de Notificaciones Integrado</p>
          <p className="leading-relaxed font-semibold">
            Cada vez que emites una factura, se procesa un pago, o respondes un ticket de soporte técnico, nuestro backend en la nube dispara webhooks automáticos para notificar al cliente final vía Email transaccional y SMS de baja latencia.
          </p>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="flex flex-col md:flex-row gap-2 bg-white p-2.5 rounded border border-slate-200">
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 flex-1">
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por destinatario, asunto o contenido..."
            className="bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-full font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-1.5">
          <button
            onClick={() => setTypeFilter('all')}
            className={`text-[10px] font-bold px-2.5 py-1.5 rounded border cursor-pointer uppercase ${
              typeFilter === 'all' 
                ? 'bg-slate-900 border-slate-900 text-white' 
                : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setTypeFilter('email')}
            className={`text-[10px] font-bold px-2.5 py-1.5 rounded border flex items-center gap-1 cursor-pointer uppercase ${
              typeFilter === 'email' 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : 'bg-white text-blue-600 hover:bg-slate-50 border-slate-200'
            }`}
          >
            <Mail className="h-3 w-3" /> Emails
          </button>
          <button
            onClick={() => setTypeFilter('sms')}
            className={`text-[10px] font-bold px-2.5 py-1.5 rounded border flex items-center gap-1 cursor-pointer uppercase ${
              typeFilter === 'sms' 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : 'bg-white text-blue-600 hover:bg-slate-50 border-slate-200'
            }`}
          >
            <Smartphone className="h-3 w-3" /> SMS
          </button>
        </div>
      </div>

      {/* TWO COLUMN GRID: LEFT LOGS LIST, RIGHT INTERACTIVE PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* LOGS TABLE LISTING */}
        <div className="bg-white rounded border border-slate-200 overflow-hidden h-[460px] flex flex-col lg:col-span-2 shadow-xs">
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {filteredLogs.map(log => {
              const isSelected = selectedLog?.id === log.id;
              return (
                <div 
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`p-3 flex justify-between items-center cursor-pointer hover:bg-slate-50/50 transition-all text-xs ${
                    isSelected ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0 pr-2">
                    <div className={`p-1.5 rounded shrink-0 ${
                      log.type === 'email' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'
                    }`}>
                      {log.type === 'email' ? <Mail className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
                    </div>
                    
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 truncate">{log.recipient}</span>
                        <span className="text-[8px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5 uppercase tracking-wider">
                          <CheckCircle className="h-2 w-2" /> Entregado
                        </span>
                      </div>
                      <p className="font-bold text-slate-700 truncate mt-0.5">{log.title}</p>
                      <p className="text-slate-500 font-medium truncate text-[10px]">{log.body}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono text-[9px] text-slate-400 font-bold flex items-center gap-1">
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                  </div>
                </div>
              );
            })}

            {filteredLogs.length === 0 && (
              <div className="text-center py-20 text-slate-400 font-bold text-[10px] uppercase">
                No hay notificaciones transaccionales enviadas
              </div>
            )}
          </div>
        </div>

        {/* INTERACTIVE PREVIEW SCREEN (visual phone or mail envelope) */}
        <div className="bg-white rounded border border-slate-200 overflow-hidden h-[460px] flex flex-col lg:col-span-1 shadow-xs">
          {selectedLog ? (
            <div className="flex flex-col h-full bg-slate-50/60 p-3 justify-between">
              
              <div className="space-y-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Vista Previa del Dispositivo</span>

                {selectedLog.type === 'sms' ? (
                  /* Cell Phone Simulation Frame */
                  <div className="w-[220px] h-[330px] mx-auto bg-slate-950 rounded-[20px] border-[4px] border-slate-800 shadow-xl flex flex-col overflow-hidden relative font-sans">
                    {/* Phone Notch */}
                    <div className="w-20 h-3 bg-slate-800 mx-auto rounded-b-lg shrink-0"></div>
                    
                    {/* Chat Area */}
                    <div className="flex-1 p-2.5 flex flex-col justify-end bg-slate-900/95 space-y-2">
                      <span className="text-[8px] text-slate-400 text-center block font-bold font-mono">HOY 12:05 PM</span>
                      
                      <div className="bg-slate-800 text-white p-2.5 rounded text-[9px] leading-relaxed space-y-0.5 shadow">
                        <p className="font-bold text-blue-400 uppercase text-[8px]">🔔 Portal CRM</p>
                        <p>{selectedLog.body}</p>
                      </div>
                      
                      <span className="text-[7px] text-slate-500 font-bold uppercase tracking-wider text-left block">Entregado vía SMS</span>
                    </div>

                    {/* Phone home indicator */}
                    <div className="h-1 w-14 bg-slate-600 mx-auto my-1 rounded-full"></div>
                  </div>
                ) : (
                  /* Email Client Simulation Frame */
                  <div className="bg-white rounded border border-slate-200 shadow-sm p-3.5 text-xs space-y-2.5 font-sans">
                    <div className="border-b border-slate-100 pb-1.5 space-y-0.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400 font-bold uppercase">De:</span>
                        <span className="font-bold text-slate-800">no-reply@portalcloud.co</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400 font-bold uppercase">Para:</span>
                        <span className="font-mono text-blue-600 truncate max-w-[120px] font-bold">{selectedLog.recipient}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400 font-bold uppercase">Asunto:</span>
                        <span className="font-bold text-slate-900">{selectedLog.title}</span>
                      </div>
                    </div>

                    <div className="py-1.5 text-slate-700 leading-normal space-y-2">
                      <p className="font-bold text-xs text-slate-900 uppercase">Portal Cloud System S.A.</p>
                      <p className="text-[10px] font-medium text-slate-600 leading-relaxed">{selectedLog.body}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Atentamente,<br />Equipo de Contabilidad</p>
                    </div>

                    <div className="border-t border-slate-100 pt-1.5 text-[8px] text-slate-400 text-center font-mono font-bold uppercase">
                      Cifrado SSL / Seguro
                    </div>
                  </div>
                )}
              </div>

              <div className="text-[9px] text-slate-500 font-bold uppercase bg-white p-2 rounded border border-slate-100 text-center flex items-center gap-1 justify-center">
                <Info className="h-3 w-3 text-blue-500 shrink-0" /> Gateway SMS/Mail Activo
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-2 bg-slate-50/50">
              <Eye className="h-8 w-8 text-slate-300" />
              <div>
                <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Ninguna notificación seleccionada</p>
                <p className="text-[10px] text-slate-400 max-w-xs mt-0.5 font-medium leading-relaxed">Selecciona un log de envío a la izquierda para visualizar el diseño emulado en smartphone o email.</p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
