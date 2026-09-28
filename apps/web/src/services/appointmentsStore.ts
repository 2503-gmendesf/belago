import { CFG } from '@belago/shared';
import { PROFESSIONALS } from '../features/discovery/fixtures.js';
import { toMinutes } from '../lib/format.js';
import type { AppointmentView, CreateAppointmentInput, ProAppointmentView } from '../features/appointments/types.js';

const STORAGE_KEY = 'belago:mock-appointments';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function isoOffset(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

interface StoredAppointment extends AppointmentView {
  clientId: string;
  clientName: string;
  clientPhone: string;
}

const DEMO_CLIENT_NAME = 'Juliana Souza';
const DEMO_CLIENT_PHONE = '31988887777';

function proById(id: string) {
  return PROFESSIONALS.find((p) => p.id === id);
}

function seed(): StoredAppointment[] {
  const demoClientId = 'demo-cliente';
  const make = (
    proId: string,
    serviceIndex: number,
    dayOffset: number,
    time: string,
    location: 'estudio' | 'domicilio',
    extra: Partial<StoredAppointment> = {},
  ): StoredAppointment | null => {
    const pro = proById(proId);
    const svc = pro?.services[serviceIndex];
    if (!pro || !svc) return null;
    return {
      id: `seed-${proId}-${serviceIndex}-${dayOffset}-${time}`,
      clientId: demoClientId,
      clientName: DEMO_CLIENT_NAME,
      clientPhone: DEMO_CLIENT_PHONE,
      professionalId: pro.id,
      professionalName: pro.name,
      serviceName: svc.name,
      category: svc.category,
      durationMin: svc.durationMin,
      price: svc.price,
      homeFee: location === 'domicilio' ? CFG.homeFee : 0,
      scheduledDate: isoOffset(dayOffset),
      scheduledTime: time,
      location,
      address: location === 'domicilio' ? 'Rua das Acácias, 88 — apto 302' : pro.address,
      status: 'confirmado',
      rated: false,
      review: null,
      ...extra,
    };
  };

  return [
    make('p0', 0, 1, '14:00', 'estudio'),
    make('p1', 0, 4, '10:30', 'domicilio'),
    make('p2', 0, -6, '15:30', 'estudio'),
    make('p3', 0, -13, '11:00', 'estudio', {
      rated: true,
      review: { rating: 5, text: 'Unhas perfeitas.' },
    }),
    make('p0', 0, -25, '09:00', 'estudio', {
      rated: true,
      review: { rating: 5, text: 'Sempre impecável.' },
    }),
  ].filter((a): a is StoredAppointment => a !== null);
}

function readAll(): StoredAppointment[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    const seeded = seed();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw) as StoredAppointment[];
  } catch {
    return [];
  }
}

function writeAll(list: StoredAppointment[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function toView(record: StoredAppointment): AppointmentView {
  const view: Omit<StoredAppointment, 'clientId' | 'clientName' | 'clientPhone'> &
    Partial<Pick<StoredAppointment, 'clientId' | 'clientName' | 'clientPhone'>> = { ...record };
  delete view.clientId;
  delete view.clientName;
  delete view.clientPhone;
  return view;
}

function toProView(record: StoredAppointment): ProAppointmentView {
  const view: Omit<StoredAppointment, 'clientId'> & Partial<Pick<StoredAppointment, 'clientId'>> = { ...record };
  delete view.clientId;
  return view;
}

export function listForClient(clientId: string): AppointmentView[] {
  return readAll()
    .filter((a) => a.clientId === clientId)
    .map(toView);
}

export function listForProfessional(professionalId: string): ProAppointmentView[] {
  return readAll()
    .filter((a) => a.professionalId === professionalId)
    .map(toProView);
}

/** Intervalos [inicioMin, fimMin) já ocupados por agendamentos não cancelados dessa profissional na data. */
export function busySlots(professionalId: string, date: string): Array<[number, number]> {
  return readAll()
    .filter((a) => a.professionalId === professionalId && a.scheduledDate === date && a.status !== 'cancelado')
    .map((a) => {
      const start = toMinutes(a.scheduledTime);
      return [start, start + a.durationMin] as [number, number];
    });
}

export function create(
  clientId: string,
  input: CreateAppointmentInput,
  clientName: string,
  clientPhone: string,
): AppointmentView {
  const pro = proById(input.professionalId);
  const svc = pro?.services.find((s) => s.id === input.serviceId);
  if (!pro || !svc || !svc.active) {
    throw new Error('Serviço indisponível');
  }
  const record: StoredAppointment = {
    id: `a${Date.now()}`,
    clientId,
    clientName,
    clientPhone,
    professionalId: pro.id,
    professionalName: pro.name,
    serviceName: svc.name,
    category: svc.category,
    durationMin: svc.durationMin,
    price: svc.price,
    homeFee: input.location === 'domicilio' ? CFG.homeFee : 0,
    scheduledDate: input.scheduledDate,
    scheduledTime: input.scheduledTime,
    location: input.location,
    address: input.location === 'domicilio' ? input.address : pro.address,
    status: 'confirmado',
    rated: false,
    review: null,
  };
  const all = readAll();
  all.push(record);
  writeAll(all);
  return toView(record);
}

export function cancel(clientId: string, appointmentId: string): AppointmentView {
  const all = readAll();
  const record = all.find((a) => a.id === appointmentId && a.clientId === clientId);
  if (!record) throw new Error('Agendamento não encontrado');
  record.status = 'cancelado';
  writeAll(all);
  return toView(record);
}

export function rate(clientId: string, appointmentId: string, rating: number, text: string): AppointmentView {
  const all = readAll();
  const record = all.find((a) => a.id === appointmentId && a.clientId === clientId);
  if (!record) throw new Error('Agendamento não encontrado');
  if (record.rated) throw new Error('Este agendamento já foi avaliado');
  record.rated = true;
  record.review = { rating, text };
  writeAll(all);

  const pro = proById(record.professionalId);
  if (pro) {
    const priorTotal = pro.rating * pro.reviewsCount;
    pro.reviewsCount += 1;
    pro.rating = (priorTotal + rating) / pro.reviewsCount;
    pro.reviews.unshift({ name: 'Cliente', rating, text, date: record.scheduledDate });
  }

  return toView(record);
}
