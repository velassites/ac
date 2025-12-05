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
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Abstract decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary-400/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-400/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="relative w-full max-w-md bg-white/5 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-8 pb-6 text-center border-b border-white/5">
           <div className="flex justify-center mb-6">
             <div className="w-16 h-16 bg-gradient-to-tr from-primary-600 to-primary-400 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20 text-white">
                <ShieldCheck size={32} />
             </div>
           </div>
           <h1 className="font-bold text-2xl text-white tracking-tight">VELAS RESORTS</h1>
           <p className="text-xs text-gray-400 uppercase tracking-widest mt-2 font-medium">Acceso de Seguridad</p>
        </div>

        {/* Form */}
        <div className="p-8 pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-secondary-500/10 text-secondary-400 text-sm p-3 rounded-lg border border-secondary-500/20 flex items-start gap-2">
                 <span className="mt-0.5">⚠️</span>
                 {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-300">Usuario</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <User size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-dark-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all placeholder-gray-600"
                  placeholder="usuario@velasresorts.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-300">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 bg-dark-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all placeholder-gray-600"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 cursor-pointer transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-400 text-dark-900 py-3 rounded-lg font-bold shadow-lg shadow-primary-400/20 hover:bg-primary-300 hover:shadow-primary-400/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900 focus:ring-primary-400 transition-all active:scale-[0.98] flex justify-center items-center gap-2 mt-6"
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
        
        <div className="p-4 text-center border-t border-white/5">
           <p className="text-[10px] text-gray-500">© 2025 Velas Resorts. Uso exclusivo personal autorizado.</p>
        </div>
      </div>
    </div>
  );
};