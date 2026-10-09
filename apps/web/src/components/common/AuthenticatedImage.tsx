import React, { useState, useEffect } from 'react';
import { Loader2, ImageOff, AlertCircle } from 'lucide-react';

interface AuthenticatedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackText?: string;
  containerClassName?: string;
}

export const AuthenticatedImage: React.FC<AuthenticatedImageProps> = ({
  src,
  alt = 'Imagem',
  className = '',
  containerClassName = '',
  fallbackText = 'Imagem indisponível',
  ...props
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!src) {
      setLoading(false);
      setError('Caminho da imagem não informado.');
      return;
    }

    setLoading(true);
    setError(null);

    const token = localStorage.getItem('pontovision_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch(src, { headers })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Falha ao carregar imagem (HTTP ${response.status})`);
        }
        const blob = await response.blob();
        if (isMounted) {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        console.warn('Erro ao carregar imagem autenticada:', err);
        if (isMounted) {
          setError(err.message || 'Erro ao carregar imagem');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [src]);

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 text-slate-400 gap-2 min-h-[160px] ${containerClassName}`}>
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="text-xs font-medium">Carregando imagem...</span>
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 text-slate-400 gap-2 bg-slate-900/60 rounded-xl border border-slate-700/60 min-h-[160px] text-center ${containerClassName}`}>
        <ImageOff className="w-6 h-6 text-slate-500" />
        <p className="text-xs text-slate-300 font-medium">{fallbackText}</p>
        <span className="text-[10px] text-slate-500">{error || 'Arquivo não encontrado'}</span>
      </div>
    );
  }

  return (
    <img
      src={blobUrl}
      alt={alt}
      className={className}
      {...props}
    />
  );
};
