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
        // Attempt 1: Try to get the back/environment camera (phones/tablets)
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
      } catch (err) {
        // Attempt 2: Fallback to any available video device (laptops/webcams)
        console.warn("Environment camera not found, falling back to default video device.");
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
      if (err.name === 'NotAllowedError') {
        errorMessage = "Permiso de cámara denegado. Por favor, permita el acceso en su navegador.";
      } else if (err.name === 'NotFoundError') {
        errorMessage = "No se encontró ningún dispositivo de cámara.";
      } else if (err.name === 'NotReadableError') {
        errorMessage = "La cámara está siendo usada por otra aplicación.";
      }
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
      
      // Check if video has actual dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      // Set canvas dimensions to match video
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
    onCapture(''); // Clear parent state
    startCamera();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Start camera on mount if not captured
  useEffect(() => {
    if (!capturedImage) {
      startCamera();
    }
  }, [startCamera, capturedImage]);

  return (
    <div className="w-full space-y-4">
      <div className="relative w-full bg-slate-900 rounded-lg overflow-hidden aspect-video shadow-inner flex items-center justify-center group">
        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center z-20 bg-slate-900">
            <p className="text-red-400 mb-2 font-medium">⚠️ Error de Cámara</p>
            <p className="text-sm text-gray-400 mb-4">{error}</p>
            <button 
              onClick={() => { setError(null); startCamera(); }}
              className="px-4 py-2 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors text-sm"
            >
              Reintentar acceso
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

        {/* Loading State */}
        {!isStreaming && !capturedImage && !error && (
           <div className="absolute inset-0 flex items-center justify-center text-gray-500">
             <div className="w-8 h-8 border-2 border-gray-600 border-t-velas-400 rounded-full animate-spin"></div>
           </div>
        )}

        {/* Captured Image Preview */}
        {capturedImage && (
          <img 
            src={capturedImage} 
            alt="Captured" 
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Canvas (Hidden) */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Overlay Controls */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 z-10">
          {!capturedImage && isStreaming && (
            <button
              type="button"
              onClick={capturePhoto}
              className="bg-white text-velas-700 p-4 rounded-full shadow-lg hover:bg-gray-100 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-velas-300/50"
              aria-label="Tomar foto"
            >
              <Camera size={24} />
            </button>
          )}
          
          {capturedImage && (
            <button
              type="button"
              onClick={retakePhoto}
              className="bg-slate-800/80 backdrop-blur-sm text-white px-6 py-2 rounded-full shadow-lg hover:bg-slate-700 transition-all flex items-center gap-2"
            >
              <RefreshCcw size={18} />
              Retomar
            </button>
          )}
        </div>

        {/* Success Indicator */}
        {capturedImage && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 shadow-md">
            <CheckCircle size={14} />
            Capturado
          </div>
        )}
      </div>
    </div>
  );
};