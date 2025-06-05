// src/server.ts
import Fastify from 'fastify';
import { PrismaClient, Prisma } from '@prisma/client';
import {
  ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import {
  // Schemas Cliente
  clienteIdParamSchema,
  createClienteSchema,
  updateClienteSchema,
  buscarClienteQuerySchema,
  // Schemas Acao
  acaoIdParamSchema,
  createAcaoSchema,
  updateAcaoSchema,
  // Schemas Alocacao
  alocacaoIdParamSchema,
  createAlocacaoSchema,
  updateAlocacaoSchema,
} from './schemas';

const fastify = Fastify({
  logger: true,
}).setValidatorCompiler(validatorCompiler)
  .setSerializerCompiler(serializerCompiler)
  .withTypeProvider<ZodTypeProvider>();

const prisma = new PrismaClient();

// --- ROTAS CRUD PARA CLIENTES (EXISTENTES) ---
// POST /clientes
fastify.post('/clientes', { schema: { body: createClienteSchema } }, async (request, reply) => {
  try {
    const novoCliente = await prisma.cliente.create({ data: request.body });
    return reply.status(201).send(novoCliente);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = (error.meta?.target as string[])?.join(', ');
      return reply.status(409).send({ message: `Conflito: Já existe um cliente com este ${target}.` });
    }
    fastify.log.error(error);
    return reply.status(500).send({ message: 'Erro interno ao criar cliente.' });
  }
});

// GET /clientes
fastify.get('/clientes', async (request, reply) => {
  try {
    const clientes = await prisma.cliente.findMany();
    return reply.send(clientes);
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ message: 'Erro interno ao buscar clientes.' });
  }
});

// GET /clientes/buscar
fastify.get('/clientes/buscar', { schema: { querystring: buscarClienteQuerySchema } }, async (request, reply) => {
  const { nome_completo, cpf_cnpj } = request.query;
  try {
    let cliente = null;
    if (cpf_cnpj) {
      cliente = await prisma.cliente.findUnique({ where: { cpf_cnpj } });
    } else if (nome_completo) {
      cliente = await prisma.cliente.findFirst({
        where: { nome_completo: { contains: nome_completo, mode: 'insensitive' } },
      });
    }
    if (!cliente) return reply.status(404).send({ message: 'Cliente não encontrado.' });
    return reply.send(cliente);
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ message: 'Erro interno ao buscar cliente.' });
  }
});

// PUT /clientes/:id
fastify.put('/clientes/:id', { schema: { body: updateClienteSchema, params: clienteIdParamSchema } }, async (request, reply) => {
  try {
    const { id } = request.params;
    const clienteAtualizado = await prisma.cliente.update({ where: { id }, data: request.body });
    return reply.send(clienteAtualizado);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return reply.status(404).send({ message: 'Cliente não encontrado para atualização.' });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = (error.meta?.target as string[])?.join(', ');
      return reply.status(409).send({ message: `Conflito: Já existe um cliente com este ${target}.` });
    }
    fastify.log.error(error);
    return reply.status(500).send({ message: 'Erro interno ao atualizar cliente.' });
  }
});

// DELETE /clientes/:id
fastify.delete('/clientes/:id', { schema: { params: clienteIdParamSchema } }, async (request, reply) => {
  try {
    await prisma.cliente.delete({ where: { id: request.params.id } });
    return reply.status(200).send({ message: 'Cliente deletado com sucesso.' });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return reply.status(404).send({ message: 'Cliente não encontrado para deleção.' });
    }
    fastify.log.error(error);
    return reply.status(500).send({ message: 'Erro interno ao deletar cliente.' });
  }
});

// --- ROTAS CRUD PARA ACOES ---

// POST /acoes - Criar uma nova ação/ativo
fastify.post('/acoes', { schema: { body: createAcaoSchema } }, async (request, reply) => {
  try {
    const novaAcao = await prisma.acao.create({ data: request.body });
    return reply.status(201).send(novaAcao);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = (error.meta?.target as string[])?.join(', ');
      return reply.status(409).send({ message: `Conflito: Já existe uma ação com este ${target}.` });
    }
    fastify.log.error(error);
    return reply.status(500).send({ message: 'Erro interno ao criar ação.' });
  }
});

// GET /acoes - Listar todas as ações/ativos
fastify.get('/acoes', async (request, reply) => {
  try {
    const acoes = await prisma.acao.findMany();
    return reply.send(acoes);
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ message: 'Erro interno ao buscar ações.' });
  }
});

// GET /acoes/:id - Obter uma ação específica
fastify.get('/acoes/:id', { schema: { params: acaoIdParamSchema } }, async (request, reply) => {
  try {
    const acao = await prisma.acao.findUnique({ where: { id: request.params.id } });
    if (!acao) return reply.status(404).send({ message: 'Ação não encontrada.' });
    return reply.send(acao);
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ message: 'Erro interno ao buscar ação.' });
  }
});

// PUT /acoes/:id - Atualizar uma ação existente
fastify.put('/acoes/:id', { schema: { body: updateAcaoSchema, params: acaoIdParamSchema } }, async (request, reply) => {
  try {
    const acaoAtualizada = await prisma.acao.update({
      where: { id: request.params.id },
      data: request.body,
    });
    return reply.send(acaoAtualizada);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return reply.status(404).send({ message: 'Ação não encontrada para atualização.' });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = (error.meta?.target as string[])?.join(', ');
      return reply.status(409).send({ message: `Conflito: Já existe uma ação com este ${target}.` });
    }
    fastify.log.error(error);
    return reply.status(500).send({ message: 'Erro interno ao atualizar ação.' });
  }
});

// DELETE /acoes/:id - Deletar uma ação
fastify.delete('/acoes/:id', { schema: { params: acaoIdParamSchema } }, async (request, reply) => {
  try {
    await prisma.acao.delete({ where: { id: request.params.id } });
    return reply.status(200).send({ message: 'Ação deletada com sucesso.' });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') { // Não encontrado
        return reply.status(404).send({ message: 'Ação não encontrada para deleção.' });
      }
      if (error.code === 'P2003') { // Foreign key constraint failed
        return reply.status(409).send({ message: 'Não é possível deletar a ação pois ela está alocada a um ou mais clientes.' });
      }
    }
    fastify.log.error(error);
    return reply.status(500).send({ message: 'Erro interno ao deletar ação.' });
  }
});


// --- ROTAS PARA GERENCIAR ALOCACOES DE CLIENTES ---

// POST /clientes/:clienteId/alocacoes - Adicionar uma ação à carteira de um cliente
fastify.post(
  '/clientes/:id/alocacoes',
  { schema: { params: clienteIdParamSchema, body: createAlocacaoSchema } },
  async (request, reply) => {
    const { id: clienteId } = request.params;
    const { acaoId, ...dadosAlocacao } = request.body;

    try {
      // Opcional: Verificar se cliente e ação existem antes de tentar criar a alocação
      const clienteExists = await prisma.cliente.findUnique({ where: { id: clienteId } });
      if (!clienteExists) return reply.status(404).send({ message: 'Cliente não encontrado.' });

      const acaoExists = await prisma.acao.findUnique({ where: { id: acaoId } });
      if (!acaoExists) return reply.status(404).send({ message: 'Ação não encontrada.' });

      const novaAlocacao = await prisma.alocacaoCliente.create({
        data: {
          clienteId,
          acaoId,
          ...dadosAlocacao,
        },
        include: { acao: true } // Inclui os dados da ação na resposta
      });
      return reply.status(201).send(novaAlocacao);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        // @@unique([clienteId, acaoId]) violada
        return reply.status(409).send({ message: 'Este cliente já possui uma alocação para esta ação.' });
      }
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Erro interno ao criar alocação.' });
    }
  }
);

// GET /clientes/:clienteId/alocacoes - Listar alocações de um cliente
fastify.get(
  '/clientes/:id/alocacoes',
  { schema: { params: clienteIdParamSchema } },
  async (request, reply) => {
    const { id: clienteId } = request.params;
    try {
      const alocacoes = await prisma.alocacaoCliente.findMany({
        where: { clienteId },
        include: { // Para incluir detalhes da ação em cada alocação
          acao: {
            select: {
              id: true,
              nome_ativo: true,
              codigo_ticker: true,
              valor_atual: true, // O valor atual da ação (mestre)
            }
          }
        },
      });
      if (!alocacoes || alocacoes.length === 0) {
        // Considerar se um cliente sem alocações é um 404 ou um array vazio (200 OK)
        // Um array vazio é mais comum para "listar" recursos.
        // Se quiser retornar 404 se o CLIENTE não existir, adicione uma checagem para o cliente.
      }
      return reply.send(alocacoes);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Erro interno ao buscar alocações do cliente.' });
    }
  }
);

// PUT /alocacoes/:id - Atualizar uma alocação específica
fastify.put(
  '/alocacoes/:id',
  { schema: { params: alocacaoIdParamSchema, body: updateAlocacaoSchema } },
  async (request, reply) => {
    const { id } = request.params;
    try {
      const alocacaoAtualizada = await prisma.alocacaoCliente.update({
        where: { id },
        data: request.body,
        include: { acao: true }
      });
      return reply.send(alocacaoAtualizada);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return reply.status(404).send({ message: 'Alocação não encontrada para atualização.' });
      }
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Erro interno ao atualizar alocação.' });
    }
  }
);

// DELETE /alocacoes/:id - Remover uma alocação específica
fastify.delete(
  '/alocacoes/:id',
  { schema: { params: alocacaoIdParamSchema } },
  async (request, reply) => {
    const { id } = request.params;
    try {
      await prisma.alocacaoCliente.delete({ where: { id } });
      return reply.status(200).send({ message: 'Alocação deletada com sucesso.' });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return reply.status(404).send({ message: 'Alocação não encontrada para deleção.' });
      }
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Erro interno ao deletar alocação.' });
    }
  }
);

// --- INICIALIZAÇÃO DO SERVIDOR ---
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3001;
    const host = process.env.HOST || '0.0.0.0';
    await fastify.listen({ port, host });
    fastify.log.info(`Servidor rodando em http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    await prisma.$disconnect();
    process.exit(1);
  }
};

// --- GRACEFUL SHUTDOWN ---
const gracefulShutdown = async (signal: string) => {
  fastify.log.info(`Recebido sinal ${signal}. Desligando graciosamente...`);
  await fastify.close();
  await prisma.$disconnect();
  fastify.log.info('Servidor e conexão com banco de dados encerrados.');
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

start();