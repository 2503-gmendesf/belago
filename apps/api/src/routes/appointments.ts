import { appointmentFinancials, createAppointmentRequestSchema, freeTimesForDate } from '@belago/shared';
import type { FastifyPluginAsync } from 'fastify';
import { HttpError } from '../errors.js';
import { SlotTakenError, type Repo } from '../repo.js';

export const appointmentRoutes =
  (repo: Repo): FastifyPluginAsync =>
  async (app) => {
    app.post('/appointments', async (req, reply) => {
      const user = req.user!;
      if (user.role !== 'cliente') {
        throw new HttpError(403, 'Apenas clientes podem agendar', 'forbidden');
      }

      const parsed = createAppointmentRequestSchema.safeParse(req.body);
      if (!parsed.success) throw new HttpError(400, 'Dados do agendamento inválidos', 'invalid_request');
      const input = parsed.data;

      if (input.professionalId === user.id) {
        throw new HttpError(400, 'Não é possível agendar consigo mesma', 'invalid_request');
      }
      if (await repo.isClientBlocked(user.id)) {
        throw new HttpError(403, 'Sua conta está bloqueada. Fale com o suporte.', 'blocked');
      }
      if (await repo.isMaintenanceMode()) {
        throw new HttpError(503, 'Agendamentos temporariamente indisponíveis', 'maintenance');
      }

      const proStatus = await repo.getProfessionalStatus(input.professionalId);
      if (proStatus !== 'ativa') throw new HttpError(404, 'Profissional não encontrada', 'not_found');

      // Preço, duração e categoria vêm do banco, nunca do cliente (o snapshot é gravado a partir daqui).
      const service = await repo.getService(input.serviceId);
      if (!service || service.professionalId !== input.professionalId) {
        throw new HttpError(404, 'Serviço não encontrado', 'not_found');
      }
      if (!service.active) throw new HttpError(409, 'Serviço indisponível', 'service_inactive');

      const [slots, busy] = await Promise.all([
        repo.listDaySlots(input.professionalId, input.scheduledDate),
        repo.listBusyIntervals(input.professionalId, input.scheduledDate),
      ]);
      const free = freeTimesForDate(slots, input.scheduledDate, service, busy);
      if (!free.includes(input.scheduledTime)) {
        throw new HttpError(409, 'Este horário não está mais disponível', 'slot_unavailable');
      }

      const money = appointmentFinancials(service.price, input.location, await repo.getRates());
      let created: { id: string };
      try {
        created = await repo.insertAppointment({
          clientId: user.id,
          professionalId: input.professionalId,
          serviceId: service.id,
          serviceName: service.name,
          category: service.category,
          durationMin: service.durationMin,
          price: service.price,
          homeFee: money.homeFee,
          scheduledDate: input.scheduledDate,
          scheduledTime: input.scheduledTime,
          location: input.location,
          address: input.location === 'domicilio' ? (input.address ?? null) : null,
        });
      } catch (err) {
        if (err instanceof SlotTakenError) {
          throw new HttpError(409, 'Este horário não está mais disponível', 'slot_unavailable');
        }
        throw err;
      }

      // Notificação é best-effort: o agendamento já existe e não deve falhar por causa dela.
      repo
        .notify(
          input.professionalId,
          'Novo agendamento',
          `${service.name} em ${input.scheduledDate} às ${input.scheduledTime}`,
        )
        .catch((err) => req.log.warn({ err }, 'falha ao notificar profissional'));

      return reply.status(201).send({
        id: created.id,
        professionalId: input.professionalId,
        serviceName: service.name,
        category: service.category,
        durationMin: service.durationMin,
        price: service.price,
        homeFee: money.homeFee,
        total: money.total,
        platformFee: money.platformFee,
        netAmount: money.net,
        scheduledDate: input.scheduledDate,
        scheduledTime: input.scheduledTime,
        location: input.location,
        status: 'pendente',
      });
    });
  };
