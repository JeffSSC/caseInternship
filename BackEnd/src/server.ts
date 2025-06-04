// src/server.ts
import Fastify from 'fastify';
import { PrismaClient, Prisma } from '@prisma/client';
import {
  ZodTypeProvider, // Importe o ZodTypeProvider
  serializerCompiler, // Importe para serialização (respostas)
  validatorCompiler,  // Importe para validação (requisições)
} from 'fastify-type-provider-zod'; // Importe do pacote
import {
  createClienteSchema,
  CreateClienteInput,
  updateClienteSchema,
  UpdateClienteInput,
  clienteIdParamSchema,
  ClienteIdParam,
} from './schemas';

// Inicialize o Fastify e configure os compilers e o type provider
const fastify = Fastify({
  logger: true,
}).setValidatorCompiler(validatorCompiler) // Define o compilador de validação
  .setSerializerCompiler(serializerCompiler) // Define o compilador de serialização
  .withTypeProvider<ZodTypeProvider>(); // Adiciona o ZodTypeProvider

const prisma = new PrismaClient();

// --- ROTAS CRUD PARA CLIENTES ---

// POST /clientes - Criar um novo cliente
fastify.post( // Não precisa mais do tipo genérico <{ Body: CreateClienteInput }> aqui,
              // pois o ZodTypeProvider vai inferir isso do schema
  '/clientes',
  {
    schema: {
      body: createClienteSchema, // Seu schema Zod diretamente
      // Se você quiser validar a resposta também (opcional):
      // response: {
      //   201: createClienteSchema, // Ou um schema específico para a resposta
      // },
    },
  },
  async (request, reply) => {
    // request.body agora é automaticamente tipado como CreateClienteInput
    // e já foi validado pelo Zod através do fastify-type-provider-zod
    try {
      const novoCliente = await prisma.cliente.create({
        data: request.body,
      });
      return reply.status(201).send(novoCliente);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = (error.meta?.target as string[])?.join(', ');
          return reply.status(409).send({
            message: `Erro de conflito: Já existe um cliente com este ${target}.`,
            fields: target,
          });
        }
      }
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Erro interno ao criar cliente.' });
    }
  }
);

// GET /clientes - Listar todos os clientes
fastify.get('/clientes', async (request, reply) => {
  // ... (lógica da rota como antes) ...
  try {
    const clientes = await prisma.cliente.findMany();
    return reply.send(clientes);
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ message: 'Erro interno ao buscar clientes.' });
  }
});

// GET /clientes/:id - Obter um cliente específico pelo ID
fastify.get(
  '/clientes/:id',
  {
    schema: {
      params: clienteIdParamSchema, // Seu schema Zod para parâmetros
    },
  },
  async (request, reply) => {
    // request.params agora é tipado e validado
    // ... (lógica da rota como antes) ...
    try {
      const cliente = await prisma.cliente.findUnique({
        where: { id: request.params.id },
      });

      if (!cliente) {
        return reply.status(404).send({ message: 'Cliente não encontrado.' });
      }
      return reply.send(cliente);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Erro interno ao buscar cliente.' });
    }
  }
);

// PUT /clientes/:id - Atualizar um cliente existente
fastify.put(
  '/clientes/:id',
  {
    schema: {
      body: updateClienteSchema,
      params: clienteIdParamSchema,
    },
  },
  async (request, reply) => {
    // request.body e request.params são tipados e validados
    // ... (lógica da rota como antes) ...
    try {
      const { id } = request.params;
      const dadosAtualizacao = request.body;

      if (Object.keys(dadosAtualizacao).length === 0) {
        return reply.status(400).send({ message: 'Nenhum dado fornecido para atualização.' });
      }

      const clienteAtualizado = await prisma.cliente.update({
        where: { id },
        data: dadosAtualizacao,
      });
      return reply.send(clienteAtualizado);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return reply.status(404).send({ message: 'Cliente não encontrado para atualização.' });
        }
        if (error.code === 'P2002') {
          const target = (error.meta?.target as string[])?.join(', ');
          return reply.status(409).send({
            message: `Erro de conflito: Já existe um cliente com este ${target}.`,
            fields: target,
          });
        }
      }
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Erro interno ao atualizar cliente.' });
    }
  }
);

// DELETE /clientes/:id - Deletar um cliente
fastify.delete(
  '/clientes/:id',
  {
    schema: {
      params: clienteIdParamSchema,
    },
  },
  async (request, reply) => {
    // request.params é tipado e validado
    // ... (lógica da rota como antes) ...
    try {
      const { id } = request.params;

      await prisma.cliente.delete({
        where: { id },
      });
      return reply.status(200).send({ message: 'Cliente deletado com sucesso.' });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return reply.status(404).send({ message: 'Cliente não encontrado para deleção.' });
        }
      }
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Erro interno ao deletar cliente.' });
    }
  }
);

// --- INICIALIZAÇÃO DO SERVIDOR ---
// ... (como antes) ...
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3001;
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    fastify.log.info(`Servidor rodando em http://<span class="math-inline">\{host\}\:</span>{port}`);
  } catch (err) {
    fastify.log.error(err);
    await prisma.$disconnect();
    process.exit(1);
  }
};

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