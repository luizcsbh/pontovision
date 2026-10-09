export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  AUDITOR = 'AUDITOR',
}

export enum TimeEntryType {
  ENTRY = 'ENTRY',                     // Entrada
  INTERVAL_START = 'INTERVAL_START',   // Saída para intervalo
  INTERVAL_END = 'INTERVAL_END',       // Retorno do intervalo
  EXIT = 'EXIT',                       // Saída final
  OTHER = 'OTHER',                     // Outra marcação
}

export enum TimeEntrySource {
  MANUAL = 'MANUAL',
  OCR_CONFIRMED = 'OCR_CONFIRMED',
  IMAGE_IMPORTED = 'IMAGE_IMPORTED',
  CORRECTED = 'CORRECTED',
}

export enum TimeEntryStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  DISPUTED = 'DISPUTED',
}

export enum DocumentStatus {
  UPLOADED = 'UPLOADED',
  PROCESSING = 'PROCESSING',
  OCR_PROCESSED = 'OCR_PROCESSED',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
}

export enum HolidayScope {
  NATIONAL = 'NATIONAL',
  STATE = 'STATE',
  MUNICIPAL = 'MUNICIPAL',
  CUSTOM = 'CUSTOM',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  OCR_EXTRACTION = 'OCR_EXTRACTION',
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  role: UserRole;
  timezone: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    notifyDiscrepancies?: boolean;
    defaultBreakDurationMinutes?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ITimeEntry {
  id: string;
  userId: string;
  workDate: string; // YYYY-MM-DD
  time: string;     // HH:mm or HH:mm:ss
  type: TimeEntryType;
  source: TimeEntrySource;
  status: TimeEntryStatus;
  documentId?: string;
  notes?: string;
  originalOcrData?: Record<string, any>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITimeDocument {
  id: string;
  userId: string;
  originalFilename: string;
  fileStorageKey: string;
  processedStorageKey?: string;
  mimeType: string;
  fileSize: number;
  processedFileSize?: number;
  width?: number;
  height?: number;
  status: DocumentStatus;
  ocrResultId?: string;
  createdAt: Date;
}

export interface IOcrExtractedFields {
  // Dados do trabalhador
  name?: string;
  cpf?: string;
  nsr?: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm
  // Dados da empresa / REP
  razaoSocial?: string;
  cnpj?: string;
  cei?: string;
  local?: string;
  nrep?: string;
  modeloRep?: string;
  // Assinatura digital
  assinaturaDigital?: string;
  rawLines?: string[];
}

export interface IOcrFieldConfidence {
  name?: number;
  cpf?: number;
  nsr?: number;
  date?: number;
  time?: number;
  overall: number;
}

export interface IOcrResult {
  id: string;
  documentId: string;
  userId: string;
  engine: string;
  engineVersion: string;
  language: string;
  rawText: string;
  extractedFields: IOcrExtractedFields;
  fieldConfidence: IOcrFieldConfidence;
  warnings: string[];
  reviewRequired: boolean;
  reviewStatus: 'PENDING' | 'ACCEPTED' | 'EDITED' | 'REJECTED';
  processedAt: Date;
}

export interface IDayScheduleRule {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  isEnabled: boolean;
  expectedWorkMinutes: number; // e.g. 480 for 8h
  plannedEntry?: string;       // 08:00
  plannedBreakStart?: string;  // 12:00
  plannedBreakEnd?: string;    // 13:00
  plannedExit?: string;        // 17:00
}

export interface IWorkSchedule {
  id: string;
  userId: string;
  name: string;
  weeklyRules: IDayScheduleRule[];
  effectiveFrom: string; // YYYY-MM-DD
  effectiveUntil?: string; // YYYY-MM-DD
  toleranceMinutes: number; // default 10min (Art. 58 CLT)
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHoliday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  scope: HolidayScope;
  region?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface IAuditLog {
  id: string;
  userId: string;
  actorId: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  changedFields?: Record<string, { before: any; after: any }>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
