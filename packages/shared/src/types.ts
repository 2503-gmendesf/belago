import type { z } from 'zod';
import type { SPECIALTIES } from './constants.js';
import type {
  appointmentSchema,
  availabilitySlotSchema,
  createAppointmentInputSchema,
  professionalProfileSchema,
  profileSchema,
  roleSchema,
  serviceSchema,
} from './schemas.js';

export type Specialty = (typeof SPECIALTIES)[number];
export type Role = z.infer<typeof roleSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type ProfessionalProfile = z.infer<typeof professionalProfileSchema>;
export type Service = z.infer<typeof serviceSchema>;
export type AvailabilitySlot = z.infer<typeof availabilitySlotSchema>;
export type Appointment = z.infer<typeof appointmentSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentInputSchema>;
