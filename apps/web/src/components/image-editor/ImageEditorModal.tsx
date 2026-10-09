import React, { useRef, useEffect, useState } from 'react';
import Cropper from 'cropperjs';
import { RotateCw, RotateCcw, Check, X, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageEditorModalProps {
  imageFile: File;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (croppedFile: File) => void;
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  imageFile,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [cropper, setCropper] = useState<Cropper | null>(null);
  const [imageSrc, setImageSrc] = useState<string>('');

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageSrc(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  useEffect(() => {
    if (isOpen && imageRef.current && imageSrc) {
      if (cropper) {
        cropper.destroy();
      }

      const newCropper = new Cropper(imageRef.current, {
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 0.9,
        restore: false,
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
      });

      setCropper(newCropper);

      return () => {
        newCropper.destroy();
      };
    }
  }, [isOpen, imageSrc]);

  if (!isOpen) return null;

  const handleRotate = (degree: number) => {
    cropper?.rotate(degree);
  };

  const handleZoom = (ratio: number) => {
    cropper?.zoom(ratio);
  };

  const handleCropAndSave = () => {
    if (!cropper) return;

    cropper.getCroppedCanvas({ maxWidth: 2048, maxHeight: 2048 }).toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], imageFile.name, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        onConfirm(croppedFile);
      }
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Ajustar & Recortar Comprovante</h3>
            <p className="text-xs text-slate-500">Recorte o excesso ao redor do comprovante para melhor precisão do OCR.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 bg-slate-900 overflow-hidden flex items-center justify-center p-4 min-h-[350px]">
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Para recortar"
            className="max-h-[60vh] max-w-full block"
          />
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleRotate(-90)}
              className="p-2.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-700 shadow-sm transition-colors"
              title="Girar 90° à esquerda"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleRotate(90)}
              className="p-2.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-700 shadow-sm transition-colors"
              title="Girar 90° à direita"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom(0.1)}
              className="p-2.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-700 shadow-sm transition-colors"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom(-0.1)}
              className="p-2.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-700 shadow-sm transition-colors"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCropAndSave}
              className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Concluir & Processar OCR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
