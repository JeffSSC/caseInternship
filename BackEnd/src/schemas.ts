// src/schemas.ts
import { z } from 'zod';

// --- Schemas de Cliente (existente) ---
export const clienteIdParamSchema = z.object({
  id: z.coerce.number().int().positive({ message: "ID do cliente deve ser um número inteiro positivo." }),
});
export type ClienteIdParam = z.infer<typeof clienteIdParamSchema>;

export const createClienteSchema = z.object({
  nome_completo: z.string({ required_error: "Nome completo é obrigatório." })
    .min(3, "Nome completo deve ter pelo menos 3 caracteres."),
  cpf_cnpj: z.string({ required_error: "CPF/CNPJ é obrigatório." })
    .min(11, "CPF/CNPJ deve ter entre 11 e 18 caracteres.")
    .max(18, "CPF/CNPJ deve ter entre 11 e 18 caracteres.")
    .regex(/^(\d{11}|\d{14})$/, "Formato de CPF/CNPJ inválido. Forneça 11 dígitos para CPF ou 14 para CNPJ, apenas números."),
  telefone: z.string({ required_error: "Telefone é obrigatório." })
    .min(10, "Telefone deve ter entre 10 e 15 caracteres.")
    .max(15, "Telefone deve ter entre 10 e 15 caracteres.")
    .regex(/^\d+$/, "Telefone deve conter apenas números."),
  data_nascimento: z.coerce.date({
    required_error: "Data de nascimento é obrigatória.",
    invalid_type_error: "Data de nascimento inválida. Use o formato YYYY-MM-DD.",
  }),
  email: z.string({ required_error: "Email é obrigatório." })
    .email("Formato de email inválido."),
});
export type CreateClienteInput = z.infer<typeof createClienteSchema>;

export const updateClienteSchema = z.object({
  nome_completo: z.string().min(3).optional(),
  cpf_cnpj: z.string().min(11).max(18).regex(/^(\d{11}|\d{14})$/).optional(),
  telefone: z.string().min(10).max(15).regex(/^\d+$/).optional(),
  data_nascimento: z.coerce.date().optional(),
  email: z.string().email().optional(),
});
export type UpdateClienteInput = z.infer<typeof updateClienteSchema>;

export const buscarClienteQuerySchema = z.object({
  nome_completo: z.string().optional(),
  cpf_cnpj: z.string().optional(),
})
.refine(data => !!data.nome_completo || !!data.cpf_cnpj, {
  message: "Forneça 'nome_completo' ou 'cpf_cnpj' para a busca.",
  path: [],
})
.refine(data => !(!!data.nome_completo && !!data.cpf_cnpj), {
  message: "Forneça apenas 'nome_completo' OU 'cpf_cnpj' para a busca, não ambos simultaneamente.",
  path: [],
});
export type BuscarClienteQueryInput = z.infer<typeof buscarClienteQuerySchema>;

// --- Schemas para Acao ---
export const acaoIdParamSchema = z.object({
  id: z.coerce.number().int().positive({ message: "ID da ação deve ser um número inteiro positivo." }),
});
export type AcaoIdParam = z.infer<typeof acaoIdParamSchema>;

export const createAcaoSchema = z.object({
  nome_ativo: z.string({ required_error: "Nome do ativo é obrigatório." }).min(3),
  codigo_ticker: z.string({ required_error: "Código ticker é obrigatório." }).min(3).max(10) // Ex: PETR4, AAPL34
    .regex(/^[A-Z0-9]+$/, "Ticker deve conter apenas letras maiúsculas e números."),
  valor_atual: z.coerce.number({ required_error: "Valor atual é obrigatório." }).positive(),
  tipo_ativo: z.string().optional(),
  descricao: z.string().optional(),
});
export type CreateAcaoInput = z.infer<typeof createAcaoSchema>;

export const updateAcaoSchema = z.object({
  nome_ativo: z.string().min(3).optional(),
  codigo_ticker: z.string().min(3).max(10).regex(/^[A-Z0-9]+$/).optional(),
  valor_atual: z.coerce.number().positive().optional(),
  tipo_ativo: z.string().optional(),
  descricao: z.string().optional().nullable(), // Permite null para limpar descrição
});
export type UpdateAcaoInput = z.infer<typeof updateAcaoSchema>;

// --- Schemas para AlocacaoCliente ---
export const alocacaoIdParamSchema = z.object({
  id: z.coerce.number().int().positive({ message: "ID da alocação deve ser um número inteiro positivo." }),
});
export type AlocacaoIdParam = z.infer<typeof alocacaoIdParamSchema>;

// Para POST /clientes/:clienteId/alocacoes
export const createAlocacaoSchema = z.object({
  acaoId: z.number({ required_error: "ID da ação é obrigatório." }).int().positive(),
  quantidade: z.coerce.number({ required_error: "Quantidade é obrigatória." }).positive("Quantidade deve ser positiva."),
  valor_medio_aquisicao: z.coerce.number({ required_error: "Valor médio de aquisição é obrigatório." }).nonnegative("Valor médio de aquisição não pode ser negativo."),
  data_ultima_compra: z.coerce.date({ required_error: "Data da última compra é obrigatória." , invalid_type_error: "Data da última compra inválida."}),
});
export type CreateAlocacaoInput = z.infer<typeof createAlocacaoSchema>;

// Para PUT /alocacoes/:id
export const updateAlocacaoSchema = z.object({
  quantidade: z.coerce.number().positive("Quantidade deve ser positiva.").optional(),
  valor_medio_aquisicao: z.coerce.number().nonnegative("Valor médio de aquisição não pode ser negativo.").optional(),
  data_ultima_compra: z.coerce.date({ invalid_type_error: "Data da última compra inválida."}).optional(),
});
export type UpdateAlocacaoInput = z.infer<typeof updateAlocacaoSchema>;