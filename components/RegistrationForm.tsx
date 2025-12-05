import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Visit, IdDocumentType } from '../types';
import { CameraCapture } from './CameraCapture';
import { User, Briefcase, UserCheck, Badge, Clock, Save, Hammer, Sparkles, Loader2, CreditCard, ScanText } from 'lucide-react';

interface RegistrationFormProps {
  onSubmit: (visit: Omit<Visit, 'id' | 'status' | 'checkInTime'>) => void;
  onCancel: () => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    visitorName: '',
    visitorCompany: '',
    hostName: '',
    badgeId: '',
    durationMinutes: 60,
    photoUrl: '',
    idDocumentType: 'INE' as IdDocumentType,
    idPhotoUrl: '',
    idOcrText: '',
    hasTools: false,
    toolsDescription: '',
    toolsPhotoUrl: ''
  });

  const [isAnalyzingTools, setIsAnalyzingTools] = useState(false);
  const [isAnalyzingId, setIsAnalyzingId] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handlePhotoCapture = (photoUrl: string) => {
    setFormData(prev => ({ ...prev, photoUrl }));
    if (errors.photoUrl) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.photoUrl;
        return newErrors;
      });
    }
  };

  const handleIdPhotoCapture = async (photoUrl: string) => {
    setFormData(prev => ({ ...prev, idPhotoUrl: photoUrl }));
    if (errors.idPhotoUrl) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.idPhotoUrl;
        return newErrors;
      });
    }

    const base64Data = photoUrl.split(',')[1];
    if (!base64Data) return;

    setIsAnalyzingId(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
            { text: "Analiza la imagen de este documento de identificación. Extrae el nombre completo de la persona y todo el texto legible del documento." }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Nombre completo" },
              full_text: { type: Type.STRING, description: "Texto OCR completo" }
            }
          }
        }
      });

      const responseText = response.text;
      if (responseText) {
        const data = JSON.parse(responseText);
        const detectedName = data.name || "";
        const ocrContent = data.full_text || "";

        setFormData(prev => {
          const updates = { ...prev, idOcrText: ocrContent };
          if (!prev.visitorName && detectedName) {
            const formattedName = detectedName
              .toLowerCase()
              .split(' ')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            updates.visitorName = formattedName;
          }
          return updates;
        });
      }
    } catch (error) {
      console.error("Error analyzing ID:", error);
    } finally {
      setIsAnalyzingId(false);
    }
  };

  const handleToolsPhotoCapture = async (photoUrl: string) => {
    setFormData(prev => ({ ...prev, toolsPhotoUrl: photoUrl }));
    const base64Data = photoUrl.split(',')[1];
    if (!base64Data) return;

    setIsAnalyzingTools(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
            { text: "Genera un inventario detallado de las herramientas visibles." }
          ]
        }
      });
      setFormData(prev => ({ ...prev, toolsDescription: response.text || "" }));
    } catch (error) {
      console.error("Error analyzing tools:", error);
    } finally {
      setIsAnalyzingTools(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.visitorName.trim()) newErrors.visitorName = "El nombre es requerido";
    if (!formData.visitorCompany.trim()) newErrors.visitorCompany = "La empresa es requerida";
    if (!formData.hostName.trim()) newErrors.hostName = "El anfitrión es requerido";
    if (!formData.badgeId.trim()) newErrors.badgeId = "El gafete es requerido";
    if (!formData.photoUrl) newErrors.photoUrl = "La foto es obligatoria";
    if (!formData.idPhotoUrl) newErrors.idPhotoUrl = "La identificación es obligatoria";
    if (formData.hasTools) {
      if (!formData.toolsPhotoUrl) newErrors.toolsPhotoUrl = "La foto de herramienta es requerida";
      if (!formData.toolsDescription.trim()) newErrors.toolsDescription = "La descripción es requerida";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        visitorName: formData.visitorName,
        visitorCompany: formData.visitorCompany,
        hostName: formData.hostName,
        badgeId: formData.badgeId,
        photoUrl: formData.photoUrl,
        durationMinutes: Number(formData.durationMinutes),
        idDocumentType: formData.idDocumentType,
        idPhotoUrl: formData.idPhotoUrl,
        idOcrText: formData.idOcrText,
        hasTools: formData.hasTools,
        toolsDescription: formData.hasTools ? formData.toolsDescription : undefined,
        toolsPhotoUrl: formData.hasTools ? formData.toolsPhotoUrl : undefined,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in pb-12">
      
      {/* SECTION 1: Basic Info */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-dark-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
          <div className="p-1.5 bg-primary-50 rounded-lg text-primary-500">
             <UserCheck size={20} />
          </div>
          Información del Visitante
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                name="visitorName"
                value={formData.visitorName}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-3 py-2.5 border ${errors.visitorName ? 'border-secondary-300 bg-secondary-50' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all`}
                placeholder="Ej. Juan Pérez"
              />
            </div>
            {errors.visitorName && <p className="mt-1 text-xs text-secondary-500">{errors.visitorName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Empresa / Procedencia</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Briefcase size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                name="visitorCompany"
                value={formData.visitorCompany}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-3 py-2.5 border ${errors.visitorCompany ? 'border-secondary-300 bg-secondary-50' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all`}
                placeholder="Ej. Proveedores S.A."
              />
            </div>
            {errors.visitorCompany && <p className="mt-1 text-xs text-secondary-500">{errors.visitorCompany}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Anfitrión (Staff Velas)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserCheck size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                name="hostName"
                value={formData.hostName}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-3 py-2.5 border ${errors.hostName ? 'border-secondary-300 bg-secondary-50' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all`}
                placeholder="Ej. Gerente de Mantenimiento"
              />
            </div>
            {errors.hostName && <p className="mt-1 text-xs text-secondary-500">{errors.hostName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gafete Asignado</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Badge size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                name="badgeId"
                value={formData.badgeId}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-3 py-2.5 border ${errors.badgeId ? 'border-secondary-300 bg-secondary-50' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all`}
                placeholder="No. de Gafete"
              />
            </div>
            {errors.badgeId && <p className="mt-1 text-xs text-secondary-500">{errors.badgeId}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo Estimado</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock size={18} className="text-gray-400" />
              </div>
              <select
                name="durationMinutes"
                value={formData.durationMinutes}
                onChange={handleInputChange}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all bg-white"
              >
                <option value={30}>30 Minutos</option>
                <option value={60}>1 Hora</option>
                <option value={120}>2 Horas</option>
                <option value={240}>4 Horas</option>
                <option value={480}>8 Horas (Jornada Completa)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: ID Document */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-dark-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
          <div className="p-1.5 bg-primary-50 rounded-lg text-primary-500">
             <CreditCard size={20} />
          </div>
          Identificación Oficial
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Documento</label>
              <select
                name="idDocumentType"
                value={formData.idDocumentType}
                onChange={handleInputChange}
                className="block w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-white"
              >
                <option value="INE">INE / IFE</option>
                <option value="PASSPORT">Pasaporte</option>
                <option value="LICENSE">Licencia de Conducir</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fotografía del Documento</label>
              <CameraCapture onCapture={handleIdPhotoCapture} />
              {errors.idPhotoUrl && <p className="mt-2 text-xs text-secondary-500 bg-secondary-50 p-2 rounded">{errors.idPhotoUrl}</p>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">Datos Extraídos (OCR)</label>
              {isAnalyzingId && (
                <span className="text-xs text-primary-600 flex items-center gap-1 animate-pulse font-medium">
                  <ScanText size={12} />
                  Leyendo documento...
                </span>
              )}
            </div>
            
            <div className="relative h-full min-h-[200px]">
               <textarea
                 name="idOcrText"
                 value={formData.idOcrText}
                 onChange={handleInputChange}
                 className="block w-full h-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent text-sm font-mono bg-gray-50 transition-all"
                 placeholder="Capture la foto para extraer los datos automáticamente..."
               />
               {isAnalyzingId && (
                  <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg backdrop-blur-sm">
                    <Loader2 className="animate-spin text-primary-600" size={32} />
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Tools Registration */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
         <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
            <h3 className="text-xl font-bold text-dark-900 flex items-center gap-2">
              <div className="p-1.5 bg-primary-50 rounded-lg text-primary-500">
                 <Hammer size={20} />
              </div>
              Registro de Herramientas
            </h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-sm font-medium text-gray-700">¿Ingresa equipo?</span>
              <div className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="hasTools"
                  checked={formData.hasTools} 
                  onChange={handleCheckboxChange}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </div>
            </label>
         </div>

         {formData.hasTools && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
               <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-2">1. Tome una fotografía clara de las herramientas.</p>
                  <CameraCapture onCapture={handleToolsPhotoCapture} />
                  {errors.toolsPhotoUrl && <p className="text-xs text-secondary-500 bg-secondary-50 p-2 rounded">{errors.toolsPhotoUrl}</p>}
               </div>
               
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <label className="block text-sm font-medium text-gray-700">Inventario / Descripción</label>
                     {isAnalyzingTools && (
                       <span className="text-xs text-primary-600 flex items-center gap-1 animate-pulse font-medium">
                         <Sparkles size={12} />
                         Analizando con IA...
                       </span>
                     )}
                  </div>
                  
                  <div className="relative">
                    <textarea
                      name="toolsDescription"
                      value={formData.toolsDescription}
                      onChange={handleInputChange}
                      rows={8}
                      className={`block w-full p-3 border ${errors.toolsDescription ? 'border-secondary-300' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all text-sm leading-relaxed`}
                      placeholder="Tome una foto para generar la descripción..."
                      disabled={isAnalyzingTools}
                    />
                    {isAnalyzingTools && (
                      <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg backdrop-blur-sm">
                        <Loader2 className="animate-spin text-primary-600" size={32} />
                      </div>
                    )}
                  </div>
                  {errors.toolsDescription && <p className="text-xs text-secondary-500">{errors.toolsDescription}</p>}
               </div>
            </div>
         )}
      </div>

      {/* SECTION 4: Visitor Photo */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-dark-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
           <div className="p-1.5 bg-primary-50 rounded-lg text-primary-500">
             <User size={20} />
           </div>
          Fotografía del Visitante
        </h3>
        <div className="max-w-lg mx-auto">
           <CameraCapture onCapture={handlePhotoCapture} />
           {errors.photoUrl && <p className="mt-2 text-center text-sm text-secondary-500 bg-secondary-50 py-1 rounded">{errors.photoUrl}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-8 py-3 bg-primary-400 text-dark-900 rounded-lg hover:bg-primary-300 font-bold shadow-lg shadow-primary-400/20 flex items-center gap-2 transition-transform active:scale-95"
        >
          <Save size={20} />
          Registrar Entrada
        </button>
      </div>
    </form>
  );
};