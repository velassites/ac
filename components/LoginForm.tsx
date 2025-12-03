
import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';

interface LoginFormProps {
  onLogin: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay for better UX
    setTimeout(() => {
      if (email.trim() === 'seguridadrn@velasresorts.com' && password === 'Grand2025#') {
        onLogin();
      } else {
        setError('Credenciales incorrectas. Por favor verifique su usuario y contraseña.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-velas-800 flex items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center bg-no-repeat relative">
      {/* Overlay */}
      <div className="absolute inset-0 bg-velas-900/80 backdrop-blur-sm"></div>

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-velas-50 p-8 pb-6 text-center border-b border-velas-100">
           <div className="flex justify-center mb-4">
             <div className="w-16 h-16 bg-velas-600 rounded-full flex items-center justify-center shadow-lg text-gold-500">
                <ShieldCheck size={32} />
             </div>
           </div>
           <h1 className="font-serif font-bold text-2xl text-velas-800 tracking-tight">VELAS RESORTS</h1>
           <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Control de Acceso & Seguridad</p>
        </div>

        {/* Form */}
        <div className="p-8 pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex items-start gap-2">
                 <span className="mt-0.5">⚠️</span>
                 {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Usuario</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-velas-500 focus:border-velas-500 transition-colors"
                  placeholder="usuario@velasresorts.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-velas-500 focus:border-velas-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-velas-600 text-white py-3 rounded-lg font-medium shadow-md hover:bg-velas-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-velas-500 transition-all active:scale-[0.99] flex justify-center items-center gap-2 mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
        
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
           <p className="text-xs text-gray-400">© 2025 Velas Resorts. Uso exclusivo personal autorizado.</p>
        </div>
      </div>
    </div>
  );
};
