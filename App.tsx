import React, { useState, useEffect } from 'react';
import { Tab, Visit, VisitStatus } from './types';
import { RegistrationForm } from './components/RegistrationForm';
import { VisitorList } from './components/VisitorList';
import { LoginForm } from './components/LoginForm';
import { ClipboardList, PlusCircle, LogOut, History, Menu, ShieldCheck, Clock, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabaseClient';

const AUTH_KEY = 'velas_auth_session';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  // Check session on mount
  useEffect(() => {
    const auth = sessionStorage.getItem(AUTH_KEY);
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Timer for live clock
  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [isAuthenticated]);

  // Load from Supabase on authentication
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchVisits();
  }, [isAuthenticated]);

  const fetchVisits = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .order('check_in_time', { ascending: false });

      if (error) {
        console.error("Error fetching visits:", error.message, error.details);
        return;
      }

      if (data) {
        const mappedVisits: Visit[] = data.map((row: any) => ({
          id: row.id,
          visitorName: row.visitor_name,
          visitorCompany: row.visitor_company,
          hostName: row.host_name,
          badgeId: row.badge_id,
          photoUrl: row.photo_url,
          checkInTime: new Date(row.check_in_time).getTime(),
          durationMinutes: row.duration_minutes,
          checkOutTime: row.check_out_time ? new Date(row.check_out_time).getTime() : undefined,
          status: row.status as VisitStatus,
          idDocumentType: row.id_document_type,
          idPhotoUrl: row.id_photo_url,
          idOcrText: row.id_ocr_text,
          hasTools: row.has_tools,
          toolsDescription: row.tools_description,
          toolsPhotoUrl: row.tools_photo_url
        }));
        setVisits(mappedVisits);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    sessionStorage.setItem(AUTH_KEY, 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    setActiveTab('dashboard');
  };

  const handleRegister = async (data: Omit<Visit, 'id' | 'status' | 'checkInTime'>) => {
    setIsLoading(true);
    const checkInTime = new Date();
    
    const dbPayload = {
      visitor_name: data.visitorName,
      visitor_company: data.visitorCompany,
      host_name: data.hostName,
      badge_id: data.badgeId,
      photo_url: data.photoUrl,
      check_in_time: checkInTime.toISOString(),
      duration_minutes: data.durationMinutes,
      status: VisitStatus.ACTIVE,
      id_document_type: data.idDocumentType,
      id_photo_url: data.idPhotoUrl,
      id_ocr_text: data.idOcrText,
      has_tools: data.hasTools,
      tools_description: data.toolsDescription,
      tools_photo_url: data.toolsPhotoUrl
    };

    try {
      const { data: newRow, error } = await supabase
        .from('visits')
        .insert([dbPayload])
        .select()
        .single();

      if (error) {
        console.error("Error creating visit:", error.message, error.details);
        throw error;
      }

      if (newRow) {
         const newVisit: Visit = {
           id: newRow.id,
           visitorName: newRow.visitor_name,
           visitorCompany: newRow.visitor_company,
           hostName: newRow.host_name,
           badgeId: newRow.badge_id,
           photoUrl: newRow.photo_url,
           checkInTime: new Date(newRow.check_in_time).getTime(),
           durationMinutes: newRow.duration_minutes,
           status: newRow.status as VisitStatus,
           idDocumentType: newRow.id_document_type,
           idPhotoUrl: newRow.id_photo_url,
           idOcrText: newRow.id_ocr_text,
           hasTools: newRow.has_tools,
           toolsDescription: newRow.tools_description,
           toolsPhotoUrl: newRow.tools_photo_url
         };
         setVisits(prev => [newVisit, ...prev]);
         setActiveTab('dashboard');
         window.scrollTo(0, 0);
      }
    } catch (error: any) {
      console.error("Error creating visit:", error);
      alert(`No se pudo registrar la visita: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = async (visit: Visit) => {
    if (!visit.id) {
      alert("Error: Identificador de visita no válido");
      return;
    }

    const checkOutTime = new Date();
    
    try {
      const { data, error } = await supabase
        .from('visits')
        .update({
          status: VisitStatus.COMPLETED,
          check_out_time: checkOutTime.toISOString()
        })
        .eq('id', visit.id)
        .select();

      if (error) throw error;
      
      if (!data || data.length === 0) {
          throw new Error("No se pudo actualizar la visita.");
      }

      setVisits(prev => prev.map(v => 
        v.id === visit.id 
          ? { ...v, status: VisitStatus.COMPLETED, checkOutTime: checkOutTime.getTime() } 
          : v
      ));
    } catch (error: any) {
      console.error("Error updating checkout:", error);
      alert(`Error al registrar la salida: ${error.message}`);
    }
  };

  const NavItem = ({ tab, label, icon: Icon }: { tab: Tab; label: string; icon: any }) => (
    <button
      onClick={() => {
        setActiveTab(tab);
        setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        activeTab === tab 
          ? 'bg-primary-400 text-dark-900 font-bold shadow-md shadow-primary-500/20' 
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon size={20} className={activeTab === tab ? "text-dark-900" : ""} />
      <span>{label}</span>
    </button>
  );

  const formattedDate = currentDate.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
  
  const formattedTime = currentDate.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const getHeaderContent = () => {
    switch (activeTab) {
      case 'register':
        return {
          title: 'Nuevo Registro',
          desc: 'Complete la información para registrar un acceso.'
        };
      case 'history':
        return {
          title: 'Historial',
          desc: 'Registro completo de visitas finalizadas.'
        };
      default:
        return {
          title: 'Bitácora Activa',
          desc: 'Monitoreo de visitantes en tiempo real.'
        };
    }
  };

  const headerInfo = getHeaderContent();

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-dark-900/80 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Dark Theme */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-72 bg-dark-900 border-r border-dark-800 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-200 z-30 flex flex-col shadow-2xl lg:shadow-none`}>
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3 text-white mb-1">
            <div className="bg-primary-400 p-1.5 rounded-lg text-dark-900">
              <ShieldCheck size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight">VELAS RESORTS</span>
          </div>
          <p className="text-xs text-gray-500 uppercase tracking-widest pl-11">Control de Acceso</p>

          {/* Clock Widget */}
          <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 text-primary-400 mb-1">
              <Clock size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 capitalize">
                {formattedDate}
              </span>
            </div>
            <p className="text-2xl font-bold text-white tracking-tight mt-1 tabular-nums">
              {formattedTime}
            </p>
          </div>
        </div>

        <nav className="p-4 space-y-2 flex-1">
          <NavItem tab="dashboard" label="Bitácora" icon={ClipboardList} />
          <NavItem tab="register" label="Registro" icon={PlusCircle} />
          <NavItem tab="history" label="Historial" icon={History} />
        </nav>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center text-white font-bold shadow-lg">
              S
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">Seguridad</p>
              <p className="text-xs text-gray-400 truncate">Caseta Principal</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-xs text-secondary-400 hover:bg-secondary-400/10 py-3 rounded-xl transition-colors border border-secondary-400/20 font-medium"
          >
            <LogOut size={16} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
        {/* Top Bar Mobile */}
        <div className="lg:hidden bg-dark-900 border-b border-white/5 p-4 flex justify-between items-center shadow-md z-20">
          <div className="flex items-center gap-2">
             <div className="bg-primary-400 p-1 rounded-md text-dark-900">
                <ShieldCheck size={16} />
             </div>
             <span className="font-bold text-white">VELAS</span>
          </div>
          
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <Menu size={24} />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-dark-900 tracking-tight">
                  {headerInfo.title}
                </h1>
                <p className="text-gray-500 mt-2 font-medium">
                  {headerInfo.desc}
                </p>
              </div>
              {isLoading && (
                <div className="flex items-center gap-2 text-primary-600 bg-primary-50 px-4 py-2 rounded-full text-sm font-medium border border-primary-100 animate-pulse">
                  <Loader2 size={16} className="animate-spin" />
                  Sincronizando...
                </div>
              )}
            </header>

            {activeTab === 'register' ? (
              <RegistrationForm 
                onSubmit={handleRegister} 
                onCancel={() => setActiveTab('dashboard')} 
              />
            ) : activeTab === 'history' ? (
               <VisitorList 
                visits={visits} 
                onCheckout={handleCheckout} 
                viewMode="history"
              />
            ) : (
              <VisitorList 
                visits={visits} 
                onCheckout={handleCheckout} 
                viewMode="dashboard"
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}