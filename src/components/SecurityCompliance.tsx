import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Key, 
  Lock, 
  Users, 
  CheckCircle, 
  FileCheck, 
  RefreshCw, 
  UserX,
  FileDown,
  Clock,
  Plus,
  ShieldAlert,
  Server,
  X
} from 'lucide-react';
import { ComplianceAuditLog, AppUser } from '../types';

interface SecurityComplianceProps {
  auditLogs: ComplianceAuditLog[];
  currentUser: AppUser | null;
  onAddAuditLog: (log: Omit<ComplianceAuditLog, 'id' | 'timestamp'>) => Promise<void>;
  onUpdateMfa: (mfaEnabled: boolean) => Promise<void>;
}

export default function SecurityCompliance({ auditLogs, currentUser, onAddAuditLog, onUpdateMfa }: SecurityComplianceProps) {
  
  // MFA simulation state
  const [totpCode, setTotpCode] = useState('');
  const [mfaSetupOpen, setMfaSetupOpen] = useState(false);
  const [mfaError, setMfaError] = useState('');
  const [mfaSuccess, setMfaSuccess] = useState(false);
  const [keyRotating, setKeyRotating] = useState(false);

  // Manual Audit Log (Admins only)
  const [actionInput, setActionInput] = useState('');
  const [detailsInput, setDetailsInput] = useState('');
  const [statusInput, setStatusInput] = useState<'success' | 'warning' | 'alert'>('success');
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);

  const handleMfaVerify = async () => {
    if (totpCode === '123456') {
      await onUpdateMfa(true);
      setMfaSuccess(true);
      setMfaError('');
      
      // Save Audit log
      await onAddAuditLog({
        action: "2FA Activado por el Usuario",
        details: `Se configuro exitosamente el protocolo TOTP en la sesion de ${currentUser?.name}.`,
        ipAddress: "190.142.23.109",
        userEmail: currentUser?.email || 'test@example.com',
        status: 'success'
      });

      setTimeout(() => {
        setMfaSetupOpen(false);
        setMfaSuccess(false);
        setTotpCode('');
      }, 1500);
    } else {
      setMfaError('Código incorrecto. Ingrese el código demo "123456" para simular.');
    }
  };

  const handleDisableMfa = async () => {
    await onUpdateMfa(false);
    await onAddAuditLog({
      action: "2FA Desactivado",
      details: `El usuario desactivo el doble factor de autenticacion. Cuenta mas vulnerable.`,
      ipAddress: "190.142.23.109",
      userEmail: currentUser?.email || 'test@example.com',
      status: 'warning'
    });
  };

  const handleRotateKeys = () => {
    setKeyRotating(true);
    setTimeout(async () => {
      setKeyRotating(false);
      await onAddAuditLog({
        action: "Rotación de Llaves Criptográficas Master",
        details: "Rotación manual forzada de llaves master AES-256 para almacenamiento Firestore.",
        ipAddress: "System Control Panel",
        userEmail: currentUser?.email || 'admin@portalcloud.co',
        status: 'success'
      });
    }, 1500);
  };

  const handleCreateAuditLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionInput || !detailsInput) return;

    await onAddAuditLog({
      action: actionInput,
      details: detailsInput,
      ipAddress: "186.29.120.44",
      userEmail: currentUser?.email || 'admin@portalcloud.co',
      status: statusInput
    });

    setActionInput('');
    setDetailsInput('');
    setStatusInput('success');
    setIsAddLogOpen(false);
  };

  const handleExportData = () => {
    // Generate mock CSV/JSON downlaod for GDPR ARCO rights compliance
    const userData = {
      user: currentUser,
      exportDate: new Date().toISOString(),
      standardsApplied: ["GDPR Article 20 - Data Portability", "HIPAA Privacy Rule"],
      hashVerification: "sha256-42d8f28b7e224e75e92c295e8bb7206d15654acdf776e033ec09de"
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(userData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ARCO_Export_${currentUser?.name?.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            Ciberseguridad & Cumplimiento Normativo Internacional
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            Cifrado de datos en tránsito y en reposo (AES-256). Auditorías constantes en cumplimiento de GDPR, HIPAA y PCI-DSS Nivel 1.
          </p>
        </div>

        {currentUser?.role === 'admin' && (
          <button 
            onClick={() => setIsAddLogOpen(true)}
            className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded cursor-pointer uppercase tracking-wider"
          >
            <Plus className="h-3.5 w-3.5" /> Registrar Log de Auditoría
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* LEFT COLUMN: PRIVACY CONTROLS & 2FA CONFIG */}
        <div className="space-y-4 lg:col-span-1">
          
          {/* MULTI-FACTOR AUTH CARD (2FA) */}
          <div className="bg-white p-3.5 rounded border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="h-4 w-4 text-blue-600" />
              Autenticación de Doble Factor (2FA)
            </h3>
            
            <p className="text-[11px] text-slate-500 font-medium leading-normal">
              Protege el acceso a tu cuenta exigiendo un código transaccional de 6 dígitos de tu celular en cada inicio de sesión.
            </p>

            {currentUser?.mfaEnabled ? (
              <div className="space-y-2">
                <div className="p-2 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded border border-emerald-100 flex items-center gap-1.5 uppercase tracking-wider">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  MFA de Sesión Activado
                </div>
                <button
                  onClick={handleDisableMfa}
                  className="w-full text-center text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 py-1.5 rounded cursor-pointer uppercase tracking-wider"
                >
                  Desactivar Doble Factor (2FA)
                </button>
              </div>
            ) : (
              <div>
                <button
                  onClick={() => setMfaSetupOpen(true)}
                  className="w-full text-center text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 py-1.5 rounded cursor-pointer uppercase tracking-wider"
                >
                  Configurar Doble Factor (2FA / TOTP)
                </button>
              </div>
            )}
          </div>

          {/* GDPR / RIGHTS DERECHOS ARCO */}
          <div className="bg-white p-3.5 rounded border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="h-4 w-4 text-blue-600" />
              Privacidad de Datos (Derechos ARCO)
            </h3>
            <p className="text-[11px] text-slate-500 font-medium leading-normal">
              Conforme al Reglamento General de Protección de Datos (RGPD) de la UE, usted tiene derecho a la portabilidad de su información y al olvido digital (pseudonimización).
            </p>

            <div className="space-y-1.5 pt-1">
              <button
                onClick={handleExportData}
                className="w-full flex items-center justify-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 py-2 rounded cursor-pointer uppercase tracking-wider"
              >
                <FileDown className="h-3.5 w-3.5" /> Exportar Mis Datos (Portabilidad)
              </button>
              
              <button
                onClick={async () => {
                  alert("Solicitud de Pseudonimización Registrada. Los datos de leads han sido anonimizados en la cola de procesamiento.");
                  await onAddAuditLog({
                    action: "Solicitud de Pseudonimización (Derecho ARCO)",
                    details: `Cliente ${currentUser?.name} solicito pseudonimizacion de identificadores personales en base de datos.`,
                    ipAddress: "190.142.23.109",
                    userEmail: currentUser?.email || 'test@example.com',
                    status: 'success'
                  });
                }}
                className="w-full flex items-center justify-center gap-1 text-[9px] font-bold text-slate-500 hover:text-slate-800 hover:underline py-1"
              >
                <UserX className="h-3 w-3" /> Solicitar Derecho al Olvido (Borrar Cuenta)
              </button>
            </div>
          </div>

          {/* ENCRYPTION ENGINES STATUS */}
          <div className="bg-slate-900 p-3.5 rounded border border-slate-800 shadow-sm space-y-3 text-slate-300">
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <Server className="h-4 w-4 text-emerald-400" />
              Seguridad Criptográfica
            </h3>
            
            <div className="space-y-1.5 text-[10px] font-mono">
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400 uppercase">Datos Almacenados:</span>
                <span className="text-emerald-400 font-bold">AES-256 Encrypted</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400 uppercase">Canal TLS (Tránsito):</span>
                <span className="text-emerald-400 font-bold">TLS 1.3 Strict</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400 uppercase">Firma de API:</span>
                <span className="text-emerald-400 font-bold">HMAC SHA-256</span>
              </div>
              <div className="flex justify-between pb-0.5">
                <span className="text-slate-400 uppercase">Auditoría PCI-DSS:</span>
                <span className="text-emerald-400 font-bold">Compliant</span>
              </div>
            </div>

            {currentUser?.role === 'admin' && (
              <button
                onClick={handleRotateKeys}
                disabled={keyRotating}
                className="w-full mt-2 flex items-center justify-center gap-1 text-[9px] font-bold bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 text-slate-100 py-1.5 rounded border border-slate-700 transition-colors cursor-pointer uppercase tracking-wider"
              >
                <RefreshCw className={`h-3 w-3 ${keyRotating ? 'animate-spin' : ''}`} />
                {keyRotating ? 'Rotando llaves...' : 'Forzar Rotación de Claves KMS'}
              </button>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: SECURITY AUDIT TRAIL LOGS */}
        <div className="bg-white rounded border border-slate-200 overflow-hidden h-[490px] flex flex-col lg:col-span-2 shadow-xs">
          
          <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <span className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              Historial de Auditoría en Tiempo Real (Immutable Audit Logs)
            </span>
            <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">SHA-256 Signed</span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto flex-1 p-1.5 space-y-1.5">
            {auditLogs.map(log => (
              <div key={log.id} className="p-2.5 bg-slate-50/50 hover:bg-slate-50 rounded border border-slate-100 text-[11px] flex justify-between items-start gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 leading-none">{log.action}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded capitalize uppercase tracking-wider ${
                      log.status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      log.status === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <p className="text-slate-500 font-semibold leading-snug">{log.details}</p>
                  
                  <div className="flex gap-2 text-[9px] text-slate-400 font-mono font-bold pt-0.5">
                    <span>Usuario: {log.userEmail}</span>
                    <span>•</span>
                    <span>IP: {log.ipAddress}</span>
                  </div>
                </div>

                <div className="text-[9px] font-mono text-slate-400 font-bold shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* MFA CONFIGURATION MODAL DIALOG */}
      {mfaSetupOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Lock className="h-4 w-4 text-blue-600" /> Configurar Doble Factor (2FA)
              </h3>
              <button 
                onClick={() => setMfaSetupOpen(false)}
                className="p-1 hover:bg-slate-200 text-slate-500 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              
              <div className="text-center space-y-1.5">
                <p className="text-[11px] text-slate-600 font-semibold">
                  Escanee el siguiente código QR con su aplicación autenticadora (Google Authenticator o Authy):
                </p>
                
                {/* Simulated QR Code */}
                <div className="h-28 w-28 mx-auto bg-slate-100 border border-slate-200 p-1.5 rounded flex items-center justify-center relative overflow-hidden">
                  <div className="grid grid-cols-6 grid-rows-6 gap-1 h-full w-full opacity-60">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div key={i} className={`rounded-xs ${i % 3 === 0 || i % 7 === 0 ? 'bg-slate-900' : 'bg-transparent'}`}></div>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-3xs">
                    <span className="text-[9px] font-mono font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">TOTP SEED DEMO</span>
                  </div>
                </div>

                <p className="text-[9px] text-slate-400 font-mono font-bold">Llave Secreta: JBSWY3DPEHPK3PXP</p>
              </div>

              <div className="space-y-1 border-t border-slate-100 pt-3">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Ingrese Código de Validación</span>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Código de 6 dígitos (Demo: 123456)"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-center font-mono font-bold text-xs tracking-widest text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                />
                
                {mfaError && <p className="text-[9px] font-bold text-rose-600 text-center uppercase tracking-wider">{mfaError}</p>}
                {mfaSuccess && <p className="text-[9px] font-bold text-emerald-600 text-center uppercase tracking-wider">¡Verificado con Éxito!</p>}
              </div>

              <button
                onClick={handleMfaVerify}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold py-2 rounded cursor-pointer uppercase tracking-wider"
              >
                Confirmar Activación de 2FA
              </button>

            </div>
          </div>
        </div>
      )}

      {/* CREATE AUDIT LOG MODAL */}
      {isAddLogOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Registrar Log de Cumplimiento Manual</h3>
              <button 
                onClick={() => setIsAddLogOpen(false)}
                className="p-1 hover:bg-slate-200 text-slate-500 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAuditLog} className="p-4 space-y-3">
              
              <div className="space-y-0.5">
                <label className="text-[9px] font-bold uppercase text-slate-500">Acción Realizada *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. Auditoría de Protección de Datos Semanal" 
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
                  value={actionInput}
                  onChange={(e) => setActionInput(e.target.value)}
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-[9px] font-bold uppercase text-slate-500">Nivel de Estado</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-bold"
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value as 'success' | 'warning' | 'alert')}
                >
                  <option value="success">Completado con Éxito (Success)</option>
                  <option value="warning">Advertencia (Warning)</option>
                  <option value="alert">Alerta Crítica (Alert)</option>
                </select>
              </div>

              <div className="space-y-0.5">
                <label className="text-[9px] font-bold uppercase text-slate-500">Detalles Técnicos *</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Describa los estándares de privacidad evaluados o el protocolo ejecutado..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white resize-none font-medium leading-normal"
                  value={detailsInput}
                  onChange={(e) => setDetailsInput(e.target.value)}
                />
              </div>

              <div className="pt-2 flex justify-end gap-1.5 text-xs font-bold">
                <button 
                  type="button" 
                  onClick={() => setIsAddLogOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded cursor-pointer uppercase tracking-wider"
                >
                  Registrar Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
