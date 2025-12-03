
export enum VisitStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED'
}

export type IdDocumentType = 'INE' | 'PASSPORT' | 'LICENSE' | 'OTHER';

export interface Visit {
  id: string;
  visitorName: string;
  visitorCompany: string; // Company they represent
  hostName: string; // Who they are working with at Velas
  badgeId: string; // Assigned badge number
  photoUrl: string; // Base64 captured image
  checkInTime: number; // Timestamp
  durationMinutes: number; // Planned duration
  checkOutTime?: number; // Timestamp when checked out
  status: VisitStatus;
  
  // ID Document fields
  idDocumentType: IdDocumentType;
  idPhotoUrl?: string;
  idOcrText?: string;

  // Tool registration fields
  hasTools: boolean;
  toolsDescription?: string;
  toolsPhotoUrl?: string;
}

export type Tab = 'register' | 'dashboard' | 'history';