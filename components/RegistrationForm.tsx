
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
    durationMinutes: 60, // Default 1 hour
    photoUrl: '',
    // ID Data
    idDocumentType: 'INE' as IdDocumentType,
    idPhotoUrl: '',
    idOcrText: '',
    // Tools Data
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

    // OCR Processing
    const base64Data = photoUrl.split(',')[1];
    if (!base64Data) return;

    setIsAnalyzingId(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data
              }
            },
            {
              text: "Analiza la imagen de este documento de identificación. Extrae el nombre completo de la persona y todo el texto legible del documento."
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
                description: "El nombre completo de la persona identificada en el documento. Prioriza el nombre principal."
              },
              full_text: {
                type: Type.STRING,
                description: "Todo el texto legible extraído del documento mediante OCR, formateado como lista o párrafos."
              }
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
          
          // Auto-fill visitor name if currently empty and a name was detected
          if (!prev.visitorName && detectedName) {
            // Simple title case conversion for better presentation
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
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data
              }
            },
            {
              text: "Genera un inventario detallado de las herramientas, equipos o materiales visibles en esta imagen para un registro de seguridad de control de acceso. Sé conciso, directo y usa formato de lista si hay varios objetos."
            }
          ]
        }
      });

      const description = response.text || "";
      setFormData(prev => ({ ...prev, toolsDescription: description }));
    } catch (error) {
      console.error("Error analyzing tools:", error);
    } finally {
      setIsAnalyzingTools(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.visitorName.trim()) newErrors.visitorName = "El nombre es requerido";
    if (!formData.visitorCompany.trim()) newErrors.visitorCompany = "La empresa/origen es requerida";
    if (!formData.hostName.trim()) newErrors.hostName = "El anfitrión es requerido";
    if (!formData.badgeId.trim()) newErrors.badgeId = "El número de gafete es requerido";
    if (!formData.photoUrl) newErrors.photoUrl = "La fotografía del visitante es obligatoria";
    
    // ID Validation
    if (!formData.idPhotoUrl) newErrors.idPhotoUrl = "La foto de la identificación es obligatoria";

    if (formData.hasTools) {
      if (!formData.toolsPhotoUrl) newErrors.toolsPhotoUrl = "La foto de la herramienta es requerida";
      if (!formData.toolsDescription.trim()) newErrors.toolsDescription = "La descripción de la herramienta es requerida";
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
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in pb-12">
      
      {/* SECTION 1: Basic Info */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-velas-100">
        <h3 className="text-xl font-serif font-bold text-velas-800 mb-6 flex items-center gap-2 border-b border-velas-100 pb-4">
          <UserCheck className="text-gold-600" />
          Información del Visitante
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Visitor Name */}
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
                className={`block w-full pl-10 pr-3 py-2.5 border ${errors.visitorName ? 'border-red-300 bg-red-50' : 'border-gray-300'} rounded-lg focus:ring-velas-500 focus:border-velas-500 transition-colors`}
                placeholder="Ej. Juan Pérez"
              />
            </div>
            {errors.visitorName && <p className="mt-1 text-xs text-red-600">{errors.visitorName}</p>}
          </div>

          {/* Company */}
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
                className={`block w-full pl-10 pr-3 py-2.5 border ${errors.visitorCompany ? 'border-red-300 bg-red-50' : 'border-gray-300'} rounded-lg focus:ring-velas-500 focus:border-velas-500 transition-colors`}
                placeholder="Ej. Proveedores S.A."
              />
            </div>
            {errors.visitorCompany && <p className="mt-1 text-xs text-red-600">{errors.visitorCompany}</p>}
          </div>

          {/* Host */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Anfitrión (Personal de Velas)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserCheck size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                name="hostName"
                value={formData.hostName}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-3 py-2.5 border ${errors.hostName ? 'border-red-300 bg-red-50' : 'border-gray-300'} rounded-lg focus:ring-velas-500 focus:border-velas-500 transition-colors`}
                placeholder="Ej. Gerente de Mantenimiento"
              />
            </div>
            {errors.hostName && <p className="mt-1 text-xs text-red-600">{errors.hostName}</p>}
          </div>

          {/* Badge ID */}
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
                className={`block w-full pl-10 pr-3 py-2.5 border ${errors.badgeId ? 'border-red-300 bg-red-50' : 'border-gray-300'} rounded-lg focus:ring-velas-500 focus:border-velas-500 transition-colors`}
                placeholder="No. de Gafete"
              />
            </div>
            {errors.badgeId && <p className="mt-1 text-xs text-red-600">{errors.badgeId}</p>}
          </div>

          {/* Duration */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo Estimado en Propiedad</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock size={18} className="text-gray-400" />
              </div>
              <select
                name="durationMinutes"
                value={formData.durationMinutes}
                onChange={handleInputChange}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-velas-500 focus:border-velas-500 transition-colors bg-white"
              >
                <option value={30}>30 Minutos</option>
                <option value={60}>1 Hora</option>
                <option value={120}>2 Horas</option>
                <option value={240}>4 Horas</option>
                <option value={480}>8 Horas (Jornada Completa)</option>
              </select>
            </div>
            <p className="mt-2 text-xs text-gray-500">Se generará una alerta si el visitante excede este tiempo sin hacer Check-out.</p>
          </div>
        </div>
      </div>

      {/* SECTION 2: ID Document */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-velas-100">
        <h3 className="text-xl font-serif font-bold text-velas-800 mb-6 flex items-center gap-2 border-b border-velas-100 pb-4">
          <CreditCard className="text-gold-600" />
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
                className="block w-full p-2.5 border border-gray-300 rounded-lg focus:ring-velas-500 focus:border-velas-500 bg-white"
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
              {errors.idPhotoUrl && <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">{errors.idPhotoUrl}</p>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">Datos Extraídos (OCR)</label>
              {isAnalyzingId && (
                <span className="text-xs text-gold-600 flex items-center gap-1 animate-pulse">
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
                 className="block w-full h-full p-3 border border-gray-300 rounded-lg focus:ring-velas-500 focus:border-velas-500 text-sm font-mono bg-gray-50"
                 placeholder="Capture la foto para extraer los datos automáticamente..."
                 readOnly={false}
               />
               {isAnalyzingId && (
                  <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg backdrop-blur-sm">
                    <Loader2 className="animate-spin text-velas-600" size={32} />
                  </div>
                )}
            </div>
            <p className="text-xs text-gray-500">
              Verifique que los datos extraídos sean legibles.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: Tools Registration */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-velas-100">
         <div className="flex items-center justify-between mb-6 border-b border-velas-100 pb-4">
            <h3 className="text-xl font-serif font-bold text-velas-800 flex items-center gap-2">
              <Hammer className="text-gold-600" />
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
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-velas-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-velas-600"></div>
              </div>
            </label>
         </div>

         {formData.hasTools && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
               <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-2">1. Tome una fotografía clara de las herramientas.</p>
                  <CameraCapture onCapture={handleToolsPhotoCapture} />
                  {errors.toolsPhotoUrl && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{errors.toolsPhotoUrl}</p>}
               </div>
               
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <label className="block text-sm font-medium text-gray-700">Inventario / Descripción</label>
                     {isAnalyzingTools && (
                       <span className="text-xs text-gold-600 flex items-center gap-1 animate-pulse">
                         <Sparkles size={12} />
                         Analizando imagen con IA...
                       </span>
                     )}
                  </div>
                  
                  <div className="relative">
                    <textarea
                      name="toolsDescription"
                      value={formData.toolsDescription}
                      onChange={handleInputChange}
                      rows={8}
                      className={`block w-full p-3 border ${errors.toolsDescription ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-velas-500 focus:border-velas-500 transition-colors text-sm leading-relaxed`}
                      placeholder="Tome una foto para generar la descripción automáticamente, o escriba aquí..."
                      disabled={isAnalyzingTools}
                    />
                    {isAnalyzingTools && (
                      <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg backdrop-blur-sm">
                        <Loader2 className="animate-spin text-velas-600" size={32} />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Puede editar manualmente el inventario generado por la IA si es necesario.
                  </p>
                  {errors.toolsDescription && <p className="text-xs text-red-600">{errors.toolsDescription}</p>}
               </div>
            </div>
         )}
      </div>

      {/* SECTION 4: Visitor Photo */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-velas-100">
        <h3 className="text-xl font-serif font-bold text-velas-800 mb-6 flex items-center gap-2 border-b border-velas-100 pb-4">
          <CameraCapture onCapture={() => {}} /> {/* Dummy call to import Icon properly in header */}
          Fotografía del Visitante
        </h3>
        <div className="max-w-lg mx-auto">
           <CameraCapture onCapture={handlePhotoCapture} />
           {errors.photoUrl && <p className="mt-2 text-center text-sm text-red-600 bg-red-50 py-1 rounded">{errors.photoUrl}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-8 py-3 bg-velas-600 text-white rounded-lg hover:bg-velas-700 font-medium shadow-md flex items-center gap-2 transition-transform active:scale-95"
        >
          <Save size={20} />
          Registrar Entrada
        </button>
      </div>
    </form>
  );
};
