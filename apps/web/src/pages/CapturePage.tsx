import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CameraCapture } from '../components/camera/CameraCapture';
import { ImageEditorModal } from '../components/image-editor/ImageEditorModal';
import { OcrReviewModal } from '../components/ocr/OcrReviewModal';
import { useModalAlert } from '../components/common/ModalAlert';
import { apiRequest } from '../api/client';
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export const CapturePage: React.FC = () => {
  const navigate = useNavigate();
  const { showAlert } = useModalAlert();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleImageCaptured = (file: File) => {
    setSelectedFile(file);
    setIsEditorOpen(true);
    setErrorMsg(null);
  };

  const handleCroppedConfirm = async (croppedFile: File) => {
    setIsEditorOpen(false);
    setIsProcessingOcr(true);
    setErrorMsg(null);

    try {
      // 1. Upload do arquivo recortado
      const formData = new FormData();
      formData.append('file', croppedFile);

      const uploadedDoc = await apiRequest<any>('/documents/upload', {
        method: 'POST',
        body: formData,
      });

      setCurrentDocumentId(uploadedDoc._id);

      // 2. Dispara OCR local
      const result = await apiRequest<any>(`/ocr/process/${uploadedDoc._id}`, {
        method: 'POST',
      });

      setOcrResult(result);
      setIsReviewOpen(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao processar OCR da imagem.');
    } finally {
      setIsProcessingOcr(false);
    }
  };

  const handleOcrConfirmed = async (entryData: any) => {
    try {
      await apiRequest('/entries', {
        method: 'POST',
        body: JSON.stringify(entryData),
      });

      setIsReviewOpen(false);
      navigate('/virtual-mirror');
    } catch (err: any) {
      const msg = err.message || 'Falha ao salvar marcação.';
      setErrorMsg(msg);
      showAlert({
        title: 'Não Foi Possível Gravar',
        message: msg,
        type: 'warning',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Digitalização com OCR Local</h1>
          <p className="text-sm text-slate-500">
            Reconhecimento ótico executado no seu servidor sem envio para serviços de terceiros.
          </p>
        </div>
        <div className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Tesseract.js Local</span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center space-x-3 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isProcessingOcr ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm flex flex-col items-center justify-center space-y-4 min-h-[300px]">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <h3 className="text-lg font-bold text-slate-800">Processando OCR Localmente...</h3>
          <p className="text-sm text-slate-500 max-w-md">
            O Sharp está aprimorando a nitidez da imagem e o motor Tesseract.js está extraindo NSR, horários, datas e CPF em português.
          </p>
        </div>
      ) : (
        <CameraCapture onImageCaptured={handleImageCaptured} />
      )}

      {/* Modal de Recorte Cropper.js */}
      {selectedFile && (
        <ImageEditorModal
          imageFile={selectedFile}
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onConfirm={handleCroppedConfirm}
        />
      )}

      {/* Modal de Revisão Humana de Campos OCR */}
      {currentDocumentId && ocrResult && (
        <OcrReviewModal
          documentId={currentDocumentId}
          ocrResult={ocrResult}
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          onConfirm={handleOcrConfirmed}
        />
      )}
    </div>
  );
};
