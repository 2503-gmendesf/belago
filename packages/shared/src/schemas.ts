import { z } from 'zod';
import {
  APPT_LOCATION,
  APPT_STATUS,
  PAYMENT_METHOD,
  PROF_STATUS,
  ROLES,
} from './constants.js';

export const roleSchema = z.enum(ROLES);

export const profileSchema = z.object({
  id: z.string().uuid(),
  role: roleSchema,
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  gender: z.string().nullable(),
  birthDate: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const professionalProfileSchema = z.object({
  profileId: z.string().uuid(),
  specialty: z.string().min(1),
  bio: z.string().nullable(),
  cityId: z.number().int().nullable(),
  status: z.enum(PROF_STATUS),
  rating: z.number().min(0).max(5),
  reviewsCount: z.number().int().nonnegative(),
  pixKey: z.string().nullable(),
  online: z.boolean(),
  verifiedAt: z.string().nullable(),
  createdAt: z.string(),
});

export const serviceSchema = z.object({
  id: z.string().uuid(),
  professionalId: z.string().uuid(),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  durationMin: z.number().int().positive(),
  active: z.boolean(),
  createdAt: z.string(),
});

export const availabilitySlotSchema = z.object({
  id: z.string().uuid(),
  professionalId: z.string().uuid(),
  date: z.string(),
  time: z.string(),
  isBooked: z.boolean(),
});

export const appointmentSchema = z.object({
  id: z.string().uuid(),
  clientId: z.string().uuid(),
  professionalId: z.string().uuid(),
  serviceId: z.string().uuid(),
  slotId: z.string().uuid().nullable(),
  scheduledDate: z.string(),
  scheduledTime: z.string(),
  location: z.enum(APPT_LOCATION),
  addressId: z.string().uuid().nullable(),
  price: z.number().nonnegative(),
  homeFee: z.number().nonnegative(),
  status: z.enum(APPT_STATUS),
  paymentMethod: z.enum(PAYMENT_METHOD).nullable(),
  depositPaid: z.boolean(),
  cancelReason: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createAppointmentInputSchema = appointmentSchema.pick({
  professionalId: true,
  serviceId: true,
  scheduledDate: true,
  scheduledTime: true,
  location: true,
  addressId: true,
});
