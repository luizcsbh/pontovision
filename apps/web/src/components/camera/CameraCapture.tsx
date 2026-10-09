import React, { useRef, useState, useEffect } from 'react';
import { Camera, SwitchCamera, Upload, X, AlertCircle } from 'lucide-react';

interface CameraCaptureProps {
  onImageCaptured: (file: File) => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onImageCaptured }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraActive(true);
    } catch (err: any) {
      setCameraError('Câmera indisponível ou permissão negada. Use a opção de upload de arquivo abaixo.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    }
  }, [facingMode]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const takePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `comprovante_${Date.now()}.jpg`, { type: 'image/jpeg' });
        stopCamera();
        onImageCaptured(file);
      }
    }, 'image/jpeg', 0.95);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageCaptured(file);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-800 mb-2">Capturar Comprovante de Ponto</h3>
      <p className="text-sm text-slate-500 mb-6">
        Fotografe seu recibo ou comprovante de ponto térmico para reconhecimento automático.
      </p>

      {cameraError && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-2 text-amber-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      {isCameraActive ? (
        <div className="relative rounded-2xl overflow-hidden bg-black max-w-xl mx-auto aspect-video mb-6 flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Guide Overlay for Receipt Alignment */}
          <div className="absolute inset-4 border-2 border-dashed border-white/60 rounded-xl pointer-events-none flex items-center justify-center">
            <span className="text-xs text-white/80 bg-black/40 px-2 py-1 rounded">
              Enquadre o comprovante aqui
            </span>
          </div>

          <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center space-x-4">
            <button
              onClick={toggleCamera}
              className="p-3 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition-colors"
              title="Alternar Câmera"
            >
              <SwitchCamera className="w-6 h-6" />
            </button>
            <button
              onClick={takePhoto}
              className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold shadow-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Camera className="w-5 h-5" />
              <span>Capturar Foto</span>
            </button>
            <button
              onClick={stopCamera}
              className="p-3 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition-colors"
              title="Cancelar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={startCamera}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 rounded-2xl transition-all group"
          >
            <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-sm">
              <Camera className="w-7 h-7" />
            </div>
            <span className="font-semibold text-slate-800">Abrir Câmera</span>
            <span className="text-xs text-slate-500 mt-1">Fotografar pelo celular ou webcam</span>
          </button>

          <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 hover:border-slate-500 bg-slate-50/50 hover:bg-slate-50 rounded-2xl transition-all group cursor-pointer">
            <div className="w-14 h-14 bg-slate-700 text-white rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-sm">
              <Upload className="w-7 h-7" />
            </div>
            <span className="font-semibold text-slate-800">Upload de Arquivo</span>
            <span className="text-xs text-slate-500 mt-1">Galeria ou computador (JPEG, PNG, WEBP)</span>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
  );
};
