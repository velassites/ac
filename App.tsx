
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
        alert(`Error al cargar las visitas: ${error.message}. Asegúrese de haber creado la tabla en Supabase.`);
        return;
      }

      if (data) {
        // Map Database (Snake Case) -> App (Camel Case)
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
    if (window.confirm('¿Está seguro que desea cerrar sesión?')) {
      sessionStorage.removeItem(AUTH_KEY);
      setIsAuthenticated(false);
      setActiveTab('dashboard');
    }
  };

  const handleRegister = async (data: Omit<Visit, 'id' | 'status' | 'checkInTime'>) => {
    setIsLoading(true);
    const checkInTime = new Date();
    
    // Map App (Camel Case) -> Database (Snake Case)
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
         // Add to local state to avoid full refetch
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

    // Confirmation handled in VisitorList UI now.
    // Proceed directly with update.

    const checkOutTime = new Date();
    
    try {
      // Use select() to confirm the row was actually returned/updated
      const { data, error } = await supabase
        .from('visits')
        .update({
          status: VisitStatus.COMPLETED,
          check_out_time: checkOutTime.toISOString()
        })
        .eq('id', visit.id)
        .select();

      if (error) throw error;
      
      // If RLS blocks update or ID not found, data might be empty
      if (!data || data.length === 0) {
          throw new Error("No se pudo actualizar la visita. Es posible que no tenga permisos o que la visita ya no exista.");
      }

      // Update local state
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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        activeTab === tab 
          ? 'bg-velas-600 text-white shadow-md' 
          : 'text-slate-600 hover:bg-velas-100'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  // Format Date: "lunes, 24 de octubre"
  const formattedDate = currentDate.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
  
  // Format Time: "10:42 AM"
  const formattedTime = currentDate.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // Header Content
  const getHeaderContent = () => {
    switch (activeTab) {
      case 'register':
        return {
          title: 'Registro de Entrada',
          desc: 'Complete el formulario para autorizar el acceso a las instalaciones.'
        };
      case 'history':
        return {
          title: 'Historial de Visitas',
          desc: 'Registro completo de visitas finalizadas y salidas.'
        };
      default:
        return {
          title: 'Bitácora de Visitas',
          desc: 'Monitoreo de visitantes en propiedad en tiempo real.'
        };
    }
  };

  const headerInfo = getHeaderContent();

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex bg-velas-50">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-gray-200 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-200 z-30 flex flex-col shadow-xl lg:shadow-none`}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-velas-800 mb-1">
            <ShieldCheck size={28} className="text-gold-600" />
            <span className="font-serif font-bold text-xl tracking-tight">VELAS RESORTS</span>
          </div>
          <p className="text-xs text-gray-500 uppercase tracking-widest pl-9">Control de Acceso</p>

          {/* Clock Widget (Desktop) */}
          <div className="mt-8 pt-6 border-t border-dashed border-velas-200">
            <div className="flex items-center gap-2 text-velas-600 mb-1">
              <Clock size={14} />
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500 capitalize">
                {formattedDate}
              </span>
            </div>
            <p className="text-3xl font-serif font-bold text-slate-800 tracking-tight mt-1">
              {formattedTime}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">Hora Local del Sistema</p>
          </div>
        </div>

        <nav className="p-4 space-y-2 flex-1">
          <NavItem tab="dashboard" label="Bitácora Activa" icon={ClipboardList} />
          <NavItem tab="register" label="Nuevo Registro" icon={PlusCircle} />
          <NavItem tab="history" label="Historial" icon={History} />
        </nav>

        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-velas-200 flex items-center justify-center text-velas-700 font-bold shadow-inner">
              S
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-700 truncate">Seguridad</p>
              <p className="text-xs text-gray-500 truncate">Caseta Principal</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-xs text-red-600 hover:bg-red-50 py-2 rounded-lg transition-colors border border-red-100"
          >
            <LogOut size={14} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
        {/* Top Bar Mobile */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm z-20 relative">
          <div>
             <span className="font-serif font-bold text-velas-800 text-lg block">VELAS RESORTS</span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Clock Widget (Mobile) */}
            <div className="hidden sm:block text-right">
                <p className="text-[10px] text-gray-500 uppercase font-medium">{formattedDate}</p>
                <p className="text-sm font-bold text-velas-800 font-serif">{formattedTime}</p>
            </div>

            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Menu size={24} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-serif font-bold text-gray-900">
                  {headerInfo.title}
                </h1>
                <p className="text-gray-500 mt-1">
                  {headerInfo.desc}
                </p>
              </div>
              {isLoading && (
                <div className="flex items-center gap-2 text-velas-600 bg-white px-3 py-1 rounded-full shadow-sm text-sm border border-gray-100 animate-pulse">
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
