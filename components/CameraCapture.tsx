import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCcw, CheckCircle } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
      } catch (err) {
        console.warn("Environment camera not found, falling back to default.");
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: true 
        });
      }

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      let errorMessage = "No se pudo acceder a la cámara.";
      if (err.name === 'NotAllowedError') errorMessage = "Permiso denegado.";
      else if (err.name === 'NotFoundError') errorMessage = "Dispositivo no encontrado.";
      setError(errorMessage);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        onCapture(dataUrl);
        stopCamera();
      }
    }
  }, [onCapture, stopCamera]);

  const retakePhoto = () => {
    setCapturedImage(null);
    onCapture('');
    startCamera();
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  useEffect(() => {
    if (!capturedImage) {
      startCamera();
    }
  }, [startCamera, capturedImage]);

  return (
    <div className="w-full space-y-4">
      <div className="relative w-full bg-dark-900 rounded-xl overflow-hidden aspect-video shadow-inner flex items-center justify-center group border border-gray-800">
        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center z-20 bg-dark-900">
            <p className="text-secondary-400 mb-2 font-medium">⚠️ Error de Cámara</p>
            <p className="text-sm text-gray-400 mb-4">{error}</p>
            <button 
              onClick={() => { setError(null); startCamera(); }}
              className="px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors text-sm"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Video Feed */}
        {!capturedImage && !error && (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            onLoadedMetadata={() => setIsStreaming(true)}
            className={`w-full h-full object-cover transition-opacity duration-300 ${!isStreaming ? 'opacity-0' : 'opacity-100'}`}
          />
        )}

        {/* Loading */}
        {!isStreaming && !capturedImage && !error && (
           <div className="absolute inset-0 flex items-center justify-center text-gray-500">
             <div className="w-8 h-8 border-2 border-gray-600 border-t-primary-400 rounded-full animate-spin"></div>
           </div>
        )}

        {/* Preview */}
        {capturedImage && (
          <img 
            src={capturedImage} 
            alt="Captured" 
            className="w-full h-full object-cover"
          />
        )}
        
        <canvas ref={canvasRef} className="hidden" />

        {/* Controls */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 z-10">
          {!capturedImage && isStreaming && (
            <button
              type="button"
              onClick={capturePhoto}
              className="bg-primary-400 text-dark-900 p-4 rounded-full shadow-lg shadow-primary-400/30 hover:bg-primary-300 hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-primary-400/50"
              aria-label="Tomar foto"
            >
              <Camera size={24} />
            </button>
          )}
          
          {capturedImage && (
            <button
              type="button"
              onClick={retakePhoto}
              className="bg-dark-900/80 backdrop-blur-sm text-white px-6 py-2 rounded-full shadow-lg hover:bg-black transition-all flex items-center gap-2 border border-white/10"
            >
              <RefreshCcw size={18} />
              Retomar
            </button>
          )}
        </div>

        {/* Indicator */}
        {capturedImage && (
          <div className="absolute top-4 right-4 bg-primary-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md">
            <CheckCircle size={12} />
            Capturado
          </div>
        )}
      </div>
    </div>
  );
};