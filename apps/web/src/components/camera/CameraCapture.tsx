import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, SwitchCamera, Upload, X, AlertCircle } from 'lucide-react';

interface CameraCaptureProps {
  onImageCaptured: (file: File) => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onImageCaptured }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // Inicia câmera HTML5 via navigator.mediaDevices.getUserMedia
  const startCamera = async () => {
    try {
      setIsStarting(true);
      setCameraError(null);

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('API HTML5 getUserMedia não suportada.');
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
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Erro ao acessar getUserMedia:', err);
      setCameraError('Acesso direto à câmera indisponível ou negado pelo navegador. Você pode usar a captura nativa do dispositivo.');
      setIsCameraActive(false);
      // Aciona automaticamente o input HTML5 se o getUserMedia falhar
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } finally {
      setIsStarting(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  }, [stream]);

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Garante que o elemento <video> receba o stream assim que montado no DOM
  useEffect(() => {
    if (isCameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((e) => console.warn('Erro ao reproduzir stream:', e));
    }
  }, [isCameraActive, stream]);

  // Recarrega se facingMode mudar
  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    }
  }, [facingMode]);

  // Para a câmera ao desmontar
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Captura foto do feed de vídeo via HTML5 Canvas
  const takePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `comprovante_${Date.now()}.jpg`, { type: 'image/jpeg' });
          stopCamera();
          onImageCaptured(file);
        }
      },
      'image/jpeg',
      0.95,
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageCaptured(file);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Fotografar</h3>
          <p className="text-xs text-slate-500">
            Aponte a câmera para o comprovante térmico para reconhecimento ótico instantâneo.
          </p>
        </div>
      </div>

      {cameraError && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center space-x-3 text-amber-800 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      {isCameraActive ? (
        <div className="relative rounded-3xl overflow-hidden bg-black max-w-xl mx-auto aspect-video sm:aspect-[4/3] mb-6 flex items-center justify-center shadow-lg">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Guia de enquadramento do comprovante de ponto */}
          <div className="absolute inset-6 border-2 border-dashed border-white/70 rounded-2xl pointer-events-none flex items-center justify-center">
            <span className="text-[11px] font-medium text-white/90 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
              Enquadre o comprovante aqui
            </span>
          </div>

          {/* Controles da câmera */}
          <div className="absolute bottom-5 left-0 right-0 flex justify-center items-center space-x-5 px-4">
            <button
              type="button"
              onClick={toggleCamera}
              className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-full transition-colors"
              title="Alternar Câmera"
              aria-label="Alternar Câmera"
            >
              <SwitchCamera className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={takePhoto}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-2 text-sm"
              aria-label="Fotografar"
            >
              <Camera className="w-5 h-5" />
              <span>Fotografar</span>
            </button>

            <button
              type="button"
              onClick={stopCamera}
              className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-full transition-colors"
              title="Fechar Câmera"
              aria-label="Fechar Câmera"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Opção 1: Câmera HTML5 Direta (Acesso via getUserMedia / live preview) */}
            <button
              type="button"
              onClick={startCamera}
              disabled={isStarting}
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 rounded-2xl transition-all group cursor-pointer text-left"
            >
              <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-sm shadow-blue-500/20">
                <Camera className="w-7 h-7" />
              </div>
              <span className="font-bold text-slate-800 text-base">Fotografar</span>
              <span className="text-xs text-slate-500 mt-1">Câmera do dispositivo</span>
            </button>

            {/* Opção 2: Upload ou Seleção de Arquivo / Galeria */}
            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50 rounded-2xl transition-all group cursor-pointer">
              <div className="w-14 h-14 bg-slate-700 text-white rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-sm">
                <Upload className="w-7 h-7" />
              </div>
              <span className="font-bold text-slate-800 text-base">Galeria ou Arquivo</span>
              <span className="text-xs text-slate-500 mt-1">Selecionar foto salva ou documento</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Input oculto com HTML5 capture="environment" para fallback ou disparo nativo */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
};
