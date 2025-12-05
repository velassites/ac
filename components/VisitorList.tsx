import React, { useEffect, useState } from 'react';
import { Visit, VisitStatus } from '../types';
import { Clock, LogOut, AlertTriangle, Search, Building2, User, Hammer, ChevronDown, ChevronUp, CreditCard, CheckCircle2, Loader2, X } from 'lucide-react';

interface VisitorListProps {
  visits: Visit[];
  onCheckout: (visit: Visit) => Promise<void>;
  viewMode?: 'dashboard' | 'history';
}

export const VisitorList: React.FC<VisitorListProps> = ({ visits, onCheckout, viewMode = 'dashboard' }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [filter, setFilter] = useState('');
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<Set<string>>(new Set());
  
  const [visitToCheckout, setVisitToCheckout] = useState<Visit | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const relevantVisits = viewMode === 'dashboard'
    ? visits.filter(v => v.status === VisitStatus.ACTIVE)
    : visits.filter(v => v.status === VisitStatus.COMPLETED).sort((a, b) => (b.checkOutTime || 0) - (a.checkOutTime || 0));
  
  const filteredVisits = relevantVisits.filter(v => 
    v.visitorName.toLowerCase().includes(filter.toLowerCase()) ||
    v.badgeId.toLowerCase().includes(filter.toLowerCase()) ||
    v.visitorCompany.toLowerCase().includes(filter.toLowerCase())
  );

  const isOverdue = (visit: Visit) => {
    if (visit.status === VisitStatus.COMPLETED) return false;
    const expectedExit = visit.checkInTime + (visit.durationMinutes * 60 * 1000);
    return currentTime > expectedExit;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  const getDurationString = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const calculateActualDuration = (start: number, end?: number) => {
    if (!end) return 0;
    return Math.floor((end - start) / (1000 * 60));
  };

  const toggleTools = (id: string) => {
    const newSet = new Set(expandedTools);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedTools(newSet);
  };

  const toggleId = (id: string) => {
    const newSet = new Set(expandedId);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedId(newSet);
  };

  const handleCheckoutClick = (visit: Visit) => {
    setVisitToCheckout(visit);
  };

  const confirmCheckout = async () => {
    if (!visitToCheckout) return;
    
    setIsCheckingOut(true);
    try {
      await onCheckout(visitToCheckout);
      setVisitToCheckout(null);
    } catch (e) {
      console.error("Checkout failed in UI", e);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const cancelCheckout = () => {
    if (!isCheckingOut) {
      setVisitToCheckout(null);
    }
  };

  const activeCount = visits.filter(v => v.status === VisitStatus.ACTIVE).length;
  const overdueCount = visits.filter(v => v.status === VisitStatus.ACTIVE && isOverdue(v)).length;
  const completedTodayCount = visits.filter(v => {
    if (v.status !== VisitStatus.COMPLETED || !v.checkOutTime) return false;
    const today = new Date().setHours(0,0,0,0);
    return v.checkOutTime >= today;
  }).length;
  const totalHistoryCount = visits.filter(v => v.status === VisitStatus.COMPLETED).length;

  return (
    <div className="space-y-6 relative">
      
      {/* Checkout Confirmation Modal */}
      {visitToCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div 
            className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm transition-opacity"
            onClick={cancelCheckout}
          ></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100 border border-gray-200">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4 text-dark-900">
                <div className="w-12 h-12 rounded-full bg-secondary-50 flex items-center justify-center text-secondary-400">
                  <LogOut size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Confirmar Salida</h3>
                  <p className="text-sm text-gray-500">¿Desea finalizar esta visita?</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
                <div className="flex gap-3 items-center mb-2">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0">
                    <img src={visitToCheckout.photoUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-dark-900">{visitToCheckout.visitorName}</p>
                    <p className="text-xs text-gray-500">{visitToCheckout.visitorCompany}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-gray-200 pt-2 mt-2">
                  <span className="text-gray-500">Gafete Asignado:</span>
                  <span className="font-mono font-bold text-dark-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                    {visitToCheckout.badgeId}
                  </span>
                </div>
              </div>

              <div className="text-sm text-gray-600 leading-relaxed mb-2">
                Al confirmar, la visita cambiará a estado <strong>COMPLETADO</strong> y se moverá a la sección de <strong>Historial</strong>.
              </div>
            </div>

            <div className="bg-gray-50 p-4 flex gap-3 justify-end border-t border-gray-100">
              <button
                type="button"
                onClick={cancelCheckout}
                disabled={isCheckingOut}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmCheckout}
                disabled={isCheckingOut}
                className="px-5 py-2 bg-secondary-400 text-white rounded-lg hover:bg-secondary-500 font-bold shadow-md shadow-secondary-400/20 flex items-center gap-2 disabled:opacity-70"
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    Confirmar Salida
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Stats */}
      {viewMode === 'dashboard' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium mb-1">Visitas Activas</p>
            <p className="text-3xl font-bold text-primary-600">{activeCount}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium mb-1">Alertas de Tiempo</p>
            <p className={`text-3xl font-bold ${overdueCount > 0 ? 'text-secondary-400' : 'text-dark-900'}`}>
              {overdueCount}
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium mb-1">Registros del Día</p>
            <p className="text-3xl font-bold text-dark-900">{visits.filter(v => new Date(v.checkInTime).toDateString() === new Date().toDateString()).length}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium mb-1">Total Histórico</p>
            <p className="text-3xl font-bold text-dark-900">{totalHistoryCount}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium mb-1">Finalizados Hoy</p>
            <p className="text-3xl font-bold text-primary-600">{completedTodayCount}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 bg-gray-50/50">
            <p className="text-sm text-gray-500 font-medium">Archivo</p>
            <p className="text-xs text-gray-400 mt-2">Visitas finalizadas ordenadas por fecha reciente.</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nombre, empresa o gafete..." 
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-transparent shadow-sm transition-all"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* Grid List */}
      {filteredVisits.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
          <User size={48} className="mx-auto mb-4 opacity-20" />
          <p>No hay visitas {viewMode === 'dashboard' ? 'activas' : 'en el historial'} que coincidan con la búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVisits.map((visit) => {
            const overdue = isOverdue(visit);
            const timeElapsed = Math.floor((currentTime - visit.checkInTime) / (1000 * 60));
            const actualDuration = visit.checkOutTime ? calculateActualDuration(visit.checkInTime, visit.checkOutTime) : 0;
            const showTools = expandedTools.has(visit.id);
            const showId = expandedId.has(visit.id);
            
            return (
              <div 
                key={visit.id} 
                className={`bg-white rounded-2xl overflow-hidden shadow-sm border transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col ${
                  overdue ? 'border-secondary-100 ring-2 ring-secondary-50' : viewMode === 'history' ? 'border-gray-100 opacity-90' : 'border-gray-100'
                }`}
              >
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                      <div className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border ${viewMode === 'history' ? 'grayscale filter border-gray-100' : 'border-gray-100'}`}>
                        <img src={visit.photoUrl} alt={visit.visitorName} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-dark-900 leading-tight">{visit.visitorName}</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1 font-medium">
                          <Building2 size={14} className="mr-1" />
                          <span className="truncate max-w-[140px]">{visit.visitorCompany}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {viewMode === 'history' && (
                             <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200">
                               {formatDate(visit.checkInTime)}
                             </div>
                          )}
                          <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-cream-100 text-dark-900 text-xs font-bold">
                            Gafete: {visit.badgeId}
                          </div>
                          {visit.hasTools && (
                            <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary-50 text-primary-600 text-xs font-bold border border-primary-100">
                              <Hammer size={12} className="mr-1" />
                              Equipo
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {overdue && viewMode === 'dashboard' && (
                      <div className="animate-pulse text-secondary-500 bg-secondary-50 p-2 rounded-full" title="Tiempo excedido">
                        <AlertTriangle size={20} />
                      </div>
                    )}
                    {viewMode === 'history' && (
                      <div className="text-gray-400 bg-gray-50 p-2 rounded-full">
                        <CheckCircle2 size={20} />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 border-t border-gray-50 pt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 flex items-center gap-1.5 font-medium">
                        <User size={14} /> Anfitrión
                      </span>
                      <span className="font-semibold text-dark-900 text-right">{visit.hostName}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 flex items-center gap-1.5 font-medium">
                        <Clock size={14} /> Entrada
                      </span>
                      <span className="font-semibold text-dark-900">{formatTime(visit.checkInTime)}</span>
                    </div>

                    {viewMode === 'history' && visit.checkOutTime && (
                      <div className="mt-3 p-3 bg-gray-50 border border-gray-100 rounded-lg flex justify-between items-center">
                        <span className="text-gray-500 text-xs font-bold uppercase flex items-center gap-1.5">
                            <LogOut size={14} /> Salida
                        </span>
                        <span className="font-mono font-bold text-dark-900 text-sm">
                            {formatTime(visit.checkOutTime)}
                        </span>
                      </div>
                    )}

                    <div className="bg-gray-50/80 rounded-lg p-3 mt-2 border border-gray-50">
                       <div className="flex justify-between text-xs mb-1 font-medium">
                          <span className="text-gray-500">
                            {viewMode === 'history' ? 'Duración total' : 'Tiempo transcurrido'}
                          </span>
                          <span className={`${overdue ? 'text-secondary-500 font-bold' : 'text-dark-900'}`}>
                            {viewMode === 'history' 
                              ? getDurationString(actualDuration)
                              : `${getDurationString(timeElapsed)} / ${getDurationString(visit.durationMinutes)}`
                            }
                          </span>
                       </div>
                       {viewMode === 'dashboard' && (
                         <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-1000 ${overdue ? 'bg-secondary-400' : 'bg-primary-400'}`} 
                              style={{ width: `${Math.min(100, (timeElapsed / visit.durationMinutes) * 100)}%` }}
                            ></div>
                         </div>
                       )}
                    </div>

                    {/* Toggle ID Info */}
                    <div className="mt-2">
                         <button 
                           type="button"
                           onClick={() => toggleId(visit.id)}
                           className="w-full flex items-center justify-between text-sm text-primary-600 hover:text-primary-700 font-medium py-2 px-3 rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors"
                         >
                           <span className="flex items-center gap-2">
                             <CreditCard size={14} /> Documento ID
                           </span>
                           {showId ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                         </button>
                         
                         {showId && (
                           <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm animate-fade-in">
                              {visit.idPhotoUrl && (
                                <div className="mb-2 rounded-lg overflow-hidden border border-gray-200">
                                   <img src={visit.idPhotoUrl} alt="Identificación" className="w-full h-32 object-cover" />
                                </div>
                              )}
                              <p className="text-gray-600 font-mono text-xs leading-relaxed whitespace-pre-line bg-white p-2 rounded border border-gray-100">
                                {visit.idOcrText || "Sin datos OCR"}
                              </p>
                           </div>
                         )}
                    </div>

                    {/* Toggle Tools Info */}
                    {visit.hasTools && (
                      <div className="mt-1">
                         <button 
                           type="button"
                           onClick={() => toggleTools(visit.id)}
                           className="w-full flex items-center justify-between text-sm text-gray-600 hover:text-dark-900 font-medium py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                         >
                           <span className="flex items-center gap-2">
                             <Hammer size={14} /> Ver Equipo
                           </span>
                           {showTools ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                         </button>
                         
                         {showTools && (
                           <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm animate-fade-in">
                              {visit.toolsPhotoUrl && (
                                <div className="mb-2 rounded-lg overflow-hidden">
                                   <img src={visit.toolsPhotoUrl} alt="Herramientas" className="w-full h-32 object-cover" />
                                </div>
                              )}
                              <p className="text-gray-600 whitespace-pre-line text-xs leading-relaxed">
                                {visit.toolsDescription}
                              </p>
                           </div>
                         )}
                      </div>
                    )}
                  </div>
                </div>

                {viewMode === 'dashboard' && (
                  <button
                    type="button"
                    onClick={() => handleCheckoutClick(visit)}
                    className="w-full bg-gray-50 hover:bg-secondary-50 text-gray-500 font-bold py-3 border-t border-gray-100 transition-colors flex justify-center items-center gap-2 text-sm hover:text-secondary-500 group"
                  >
                    <LogOut size={16} className="group-hover:stroke-2" />
                    Registrar Salida
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};