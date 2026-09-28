import type { FastifyPluginAsync } from 'fastify';
import { HttpError } from '../errors.js';
import type { Repo } from '../repo.js';

export const accountRoutes =
  (repo: Repo): FastifyPluginAsync =>
  async (app) => {
    // LGPD: a própria usuária exclui a conta. O papel admin não se autoexclui por aqui.
    app.delete('/account', async (req, reply) => {
      const user = req.user!;
      if (user.role === 'admin') {
        throw new HttpError(403, 'Contas de administração não podem ser excluídas por esta rota', 'forbidden');
      }
      await repo.deleteAccount(user.id);
      return reply.status(204).send();
    });
  };
