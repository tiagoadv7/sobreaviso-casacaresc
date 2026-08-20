/**
 * Firestore helpers — all data operations go through here.
 * Collections: collaborators, calls, demandTypes, scheduleOverrides, users
 */
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  deleteField,
  onSnapshot,
  query,
  writeBatch,
  Timestamp,
  getDoc,
  updateDoc,
  getDocs,
} from 'firebase/firestore';
import { db } from './config';
import {
  Collaborator,
  CallRecord,
  DemandType,
  DaySchedule,
  SystemUser,
} from '../types';
import { INITIAL_COLLABORATORS, INITIAL_DEMAND_TYPES } from '../utils/constants';

// ─── Type aliases for Firestore documents ───────────────────────────────────

type Unsubscribe = () => void;

// ─── COLLABORATORS ───────────────────────────────────────────────────────────

export function subscribeCollaborators(
  onData: (data: Collaborator[]) => void
): Unsubscribe {
  const q = query(collection(db, 'collaborators'));
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => d.data() as Collaborator));
  });
}

export async function saveCollaborator(
  data: Omit<Collaborator, 'id'>,
  existingId?: string
): Promise<string> {
  const id =
    existingId ||
    data.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') ||
    `collab-${Date.now()}`;

  await setDoc(doc(db, 'collaborators', id), { ...data, id }, { merge: true });
  return id;
}

export async function deleteCollaborator(id: string): Promise<void> {
  await deleteDoc(doc(db, 'collaborators', id));
}

export async function clearAllCollaborators(): Promise<number> {
  const snap = await getDocs(collection(db, 'collaborators'));
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return snap.size;
}

// ─── CALLS ───────────────────────────────────────────────────────────────────

export function subscribeCalls(
  onData: (data: CallRecord[]) => void
): Unsubscribe {
  const q = query(collection(db, 'calls'));
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => d.data() as CallRecord));
  });
}

export async function saveCall(
  data: Omit<CallRecord, 'id'>,
  existingId?: string
): Promise<string> {
  const id = existingId || `call-${Math.random().toString(36).slice(2, 10)}`;
  await setDoc(doc(db, 'calls', id), { ...data, id }, { merge: true });
  return id;
}

export async function deleteCall(id: string): Promise<void> {
  await deleteDoc(doc(db, 'calls', id));
}

// ─── DEMAND TYPES ────────────────────────────────────────────────────────────

export function subscribeDemandTypes(
  onData: (data: DemandType[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, 'demandTypes'), (snap) => {
    onData(snap.docs.map((d) => d.data() as DemandType));
  });
}

export async function saveDemandType(data: DemandType): Promise<void> {
  await setDoc(doc(db, 'demandTypes', data.id), data, { merge: true });
}

// ─── SCHEDULE OVERRIDES ──────────────────────────────────────────────────────

export function subscribeScheduleOverrides(
  onData: (data: Record<string, Partial<DaySchedule>>) => void
): Unsubscribe {
  return onSnapshot(collection(db, 'scheduleOverrides'), (snap) => {
    const result: Record<string, Partial<DaySchedule>> = {};
    snap.docs.forEach((d) => {
      result[d.id] = d.data() as Partial<DaySchedule>;
    });
    onData(result);
  });
}

export async function saveScheduleOverride(
  date: string,
  data: Partial<DaySchedule>
): Promise<void> {
  await setDoc(doc(db, 'scheduleOverrides', date), data, { merge: true });
}

export async function deleteScheduleOverride(date: string): Promise<void> {
  await deleteDoc(doc(db, 'scheduleOverrides', date));
}

// ─── USERS (perfis no Firestore) ────────────────────────────────────────────

export function subscribeUsers(
  onData: (data: SystemUser[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, 'users'), (snap) => {
    onData(snap.docs.map((d) => d.data() as SystemUser));
  });
}

export async function getUserProfile(uid: string): Promise<SystemUser | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as SystemUser) : null;
}

// Firestore rejeita campos com valor `undefined` (setDoc/updateDoc lançam erro).
// Campos opcionais (ex: collaboratorId não vinculado) chegam aqui como
// `undefined` — removemos antes de gravar em vez de deixar a escrita falhar.
function omitUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  (Object.keys(obj) as (keyof T)[]).forEach((key) => {
    if (obj[key] !== undefined) result[key] = obj[key];
  });
  return result;
}

export async function saveUserProfile(uid: string, data: Partial<SystemUser>): Promise<void> {
  await setDoc(doc(db, 'users', uid), { ...omitUndefined(data), uid }, { merge: true });
}

export async function updateUserProfile(uid: string, data: Partial<SystemUser>): Promise<void> {
  // Ao contrário de saveUserProfile, aqui `undefined` significa "limpar o campo"
  // (ex: desvincular colaborador) — usamos o sentinel deleteField() do Firestore.
  const sanitized: Record<string, unknown> = {};
  Object.entries(data).forEach(([key, value]) => {
    sanitized[key] = value === undefined ? deleteField() : value;
  });
  await updateDoc(doc(db, 'users', uid), sanitized);
}

// ─── SEED & SYNC ─────────────────────────────────────────────────────────────

import { INITIAL_CALLS } from '../utils/constants';

/**
 * Popula o Firestore com todos os dados iniciais se as coleções estiverem vazias.
 * Chamado automaticamente no primeiro login do admin.
 */
export async function seedInitialDataIfEmpty(): Promise<boolean> {
  const collabSnap = await getDocs(collection(db, 'collaborators'));
  if (!collabSnap.empty) return false; // Já tem dados

  return forceSyncInitialData();
}

/**
 * Força a sincronização/recriação dos dados iniciais no Firestore (chamado pelo Admin).
 */
export async function forceSyncInitialData(): Promise<boolean> {
  const batch = writeBatch(db);

  // 1. Seed collaborators
  INITIAL_COLLABORATORS.forEach((c) => {
    batch.set(doc(db, 'collaborators', c.id), c);
  });

  // 2. Seed demand types
  INITIAL_DEMAND_TYPES.forEach((dt) => {
    batch.set(doc(db, 'demandTypes', dt.id), dt);
  });

  // 3. Seed initial calls
  INITIAL_CALLS.forEach((call) => {
    batch.set(doc(db, 'calls', call.id), call);
  });

  // 4. System metadata
  batch.set(doc(db, 'systemSettings', 'general'), {
    systemName: 'Sobreaviso Casacaresc',
    primaryAdmin: 'tiago.neves@casacaresc.org.br',
    updatedAt: new Date().toISOString(),
  });

  await batch.commit();
  return true;
}
