import React, { useRef } from 'react';
import { Printer, Download, FileText } from 'lucide-react';
import { maskCPF } from '@pontovision/shared';

export interface ComprovanteREPData {
  // Empresa
  razaoSocial?: string;
  local?: string;
  nrep?: string;
  modeloRep?: string;
  cnpj?: string;
  cei?: string;
  // Trabalhador
  nome?: string;
  cpf?: string;
  nsr?: string;
  // Registro
  data?: string;      // formato ISO: YYYY-MM-DD
  hora?: string;      // HH:mm
  // Assinatura
  assinaturaDigital?: string;
}

interface ComprovanteREPProps {
  data: ComprovanteREPData;
  /** Se true mostra botões de impressão/download */
  showActions?: boolean;
  /** Modo edição: exibe campos como inputs */
  editMode?: boolean;
  onChange?: (field: keyof ComprovanteREPData, value: string) => void;
}

function formatData(iso?: string): string {
  if (!iso) return '___/___/______';
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

function formatCpf(cpf?: string): string {
  if (!cpf) return '___.___.___ - __';
  const c = cpf.replace(/\D/g, '');
  if (c.length !== 11) return cpf;
  return `${c.slice(0,3)}.${c.slice(3,6)}.${c.slice(6,9)}-${c.slice(9)}`;
}

function formatCnpj(cnpj?: string): string {
  if (!cnpj) return '';
  const c = cnpj.replace(/\D/g, '');
  if (c.length !== 14) return cnpj;
  return `${c.slice(0,2)}.${c.slice(2,5)}.${c.slice(5,8)}/${c.slice(8,12)}-${c.slice(12)}`;
}

// Quebra assinatura em linhas de ~40 chars estilo cupom
function formatAD(ad?: string): string[] {
  if (!ad) return [];
  const chunks: string[] = [];
  for (let i = 0; i < ad.length; i += 40) {
    chunks.push(ad.slice(i, i + 40));
  }
  return chunks;
}

const LINE = '─'.repeat(42);

export const ComprovanteREP: React.FC<ComprovanteREPProps> = ({
  data,
  showActions = true,
  editMode = false,
  onChange,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = receiptRef.current?.innerHTML;
    if (!content) return;
    const win = window.open('', '_blank', 'width=400,height=700');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8"/>
          <title>Comprovante de Ponto</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: #fff; font-family: 'Share Tech Mono', 'Courier New', monospace; font-size: 11px; color: #000; text-transform: uppercase; }
            .receipt { 
              padding: 16px 12px; 
              max-width: 320px; 
              margin: 0 auto; 
              background-color: #fefce8 !important; 
              text-transform: uppercase !important; 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
            }
            .center { text-align: center; }
            .line { border-top: 1px dashed #000; margin: 6px 0; }
            .field-label { font-size: 10px; }
            .field-value { font-weight: bold; }
            .ad { word-break: break-all; font-size: 9px; }
            .title { font-size: 12px; font-weight: bold; letter-spacing: 0.5px; }
            * { text-transform: uppercase; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const f = (
    field: keyof ComprovanteREPData,
    rendered: string,
    inputType = 'text',
  ) => {
    if (!editMode) return <span>{rendered}</span>;
    const isNumeric = field === 'nrep' || field === 'nsr';
    return (
      <input
        type={inputType}
        inputMode={isNumeric ? 'numeric' : undefined}
        pattern={isNumeric ? '[0-9]*' : undefined}
        defaultValue={data[field] ?? ''}
        onChange={isNumeric ? (e) => {
          e.target.value = e.target.value.replace(/\D/g, '');
        } : undefined}
        onBlur={(e) => {
          const val = isNumeric ? e.target.value.replace(/\D/g, '') : e.target.value;
          onChange?.(field, val);
        }}
        className="bg-transparent border-b border-dashed border-black/40 focus:outline-none focus:border-black w-full font-bold uppercase"
      />
    );
  };

  const adLines = formatAD(data.assinaturaDigital);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Botões de ação */}
      {showActions && (
        <div className="flex gap-2 self-end">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir
          </button>
        </div>
      )}

      {/* Cupom térmico */}
      <div
        ref={receiptRef}
        className="receipt text-black shadow-xl uppercase"
        style={{
          fontFamily: "'Share Tech Mono', 'Courier New', 'Courier', monospace",
          fontSize: '11px',
          width: '320px',
          padding: '20px 16px',
          lineHeight: '1.55',
          letterSpacing: '0.3px',
          backgroundColor: '#fefce8', // Amarelo quase branco estilo papel térmico
          textTransform: 'uppercase', // Todas as letras em caixa alta
          boxShadow: '0 2px 8px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(0,0,0,0.06)',
        }}
      >
        {/* Título */}
        <div className="center text-center mb-1" style={{ fontWeight: 'bold', fontSize: '12px', letterSpacing: '0.5px' }}>
          COMPROVANTE DE REGISTRO DE PONTO
        </div>
        <div className="center text-center mb-3" style={{ fontWeight: 'bold', fontSize: '12px', letterSpacing: '0.5px' }}>
          DO TRABALHADOR
        </div>

        {/* Linha divisória */}
        <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

        {/* Dados da Empresa */}
        <div className="mb-1">
          <span style={{ fontSize: '10px' }}>RSOCIAL:</span>
          <span className="ml-1 font-bold">{f('razaoSocial', data.razaoSocial || '___________________')}</span>
        </div>
        <div className="mb-1">
          <span style={{ fontSize: '10px' }}>LOCAL:</span>
          <span className="ml-1 font-bold">{f('local', data.local || '___________________')}</span>
        </div>
        <div className="mb-1">
          <span style={{ fontSize: '10px' }}>NREP:</span>
          <span className="ml-1 font-bold">{f('nrep', data.nrep ? data.nrep.replace(/\D/g, '') : '___________________')}</span>
        </div>
        <div className="mb-1">
          <span style={{ fontSize: '10px' }}>MODELO:</span>
          <span className="ml-1 font-bold">IDCLASS BIO PROX</span>
        </div>
        <div className="mb-1">
          <span style={{ fontSize: '10px' }}>CNPJ:</span>
          <span className="ml-1 font-bold">{f('cnpj', formatCnpj(data.cnpj) || '___________________')}</span>
        </div>
        <div className="mb-1">
          <span style={{ fontSize: '10px' }}>CEI:</span>
          <span className="ml-1 font-bold">{f('cei', data.cei || '000000000000000')}</span>
        </div>

        <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

        {/* Dados do Trabalhador */}
        <div className="mb-1">
          <span style={{ fontSize: '10px' }}>NOME:</span>
          <span className="ml-1 font-bold">{f('nome', data.nome || '___________________')}</span>
        </div>
        <div className="mb-1">
          <span style={{ fontSize: '10px' }}>CPF:</span>
          <span className="ml-1 font-bold">{f('cpf', formatCpf(data.cpf))}</span>
        </div>
        <div className="mb-1">
          <span style={{ fontSize: '10px' }}>NSR:</span>
          <span className="ml-1 font-bold">{f('nsr', data.nsr ? data.nsr.replace(/\D/g, '').padStart(9, '0') : '000000000')}</span>
        </div>

        <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

        {/* Data e Hora */}
        <div className="mb-1" style={{ fontSize: '12px', fontWeight: 'bold' }}>
          <span style={{ fontSize: '10px', fontWeight: 'normal' }}>DATA:</span>
          <span className="ml-1">{f('data', formatData(data.data), 'date')}</span>
          {'  '}
          <span style={{ fontSize: '10px', fontWeight: 'normal' }}>HORA:</span>
          <span className="ml-1">{f('hora', data.hora || '__:__', 'time')}</span>
        </div>

        {/* Assinatura Digital */}
        {(adLines.length > 0 || editMode) && (
          <>
            <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
            <div className="mb-1" style={{ fontSize: '10px' }}>AD:</div>
            {editMode ? (
              <textarea
                defaultValue={data.assinaturaDigital ?? ''}
                onBlur={(e) => onChange?.('assinaturaDigital', e.target.value)}
                rows={3}
                className="bg-transparent border border-dashed border-black/40 focus:outline-none focus:border-black w-full"
                style={{ fontSize: '9px', fontFamily: 'inherit', wordBreak: 'break-all', resize: 'none' }}
              />
            ) : (
              adLines.map((line, i) => (
                <div key={i} style={{ fontSize: '9px', wordBreak: 'break-all', letterSpacing: '0.5px' }}>
                  {line}
                </div>
              ))
            )}
          </>
        )}

        {/* Rodapé */}
        <div style={{ borderTop: '1px dashed #000', margin: '8px 0 4px' }} />
        <div className="text-center" style={{ fontSize: '9px', opacity: 0.6 }}>
          PontoVision AI · Processado por OCR local (Tesseract.js)
        </div>
      </div>
    </div>
  );
};
