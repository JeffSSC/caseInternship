// src/schemas.ts
import { z } from 'zod';

// Schema para validação do ID do cliente nos parâmetros da URL
export const clienteIdParamSchema = z.object({
  id: z.coerce.number().int().positive({ message: "ID deve ser um número inteiro positivo." }),
});
export type ClienteIdParam = z.infer<typeof clienteIdParamSchema>;

// Schema para criação de um novo cliente
export const createClienteSchema = z.object({
  nome_completo: z.string({ required_error: "Nome completo é obrigatório." })
    .min(3, "Nome completo deve ter pelo menos 3 caracteres."),
  cpf_cnpj: z.string({ required_error: "CPF/CNPJ é obrigatório." })
    .min(11, "CPF/CNPJ deve ter entre 11 e 18 caracteres.") // Ajuste min/max conforme necessidade exata de formatação
    .max(18, "CPF/CNPJ deve ter entre 11 e 18 caracteres.")
    .regex(/^(\d{11}|\d{14})$/, "Formato de CPF/CNPJ inválido. Forneça 11 dígitos para CPF ou 14 para CNPJ, apenas números."),
  telefone: z.string({ required_error: "Telefone é obrigatório." })
    .min(10, "Telefone deve ter entre 10 e 15 caracteres.") // Ex: (XX)XXXX-XXXX ou (XX)XXXXX-XXXX
    .max(15, "Telefone deve ter entre 10 e 15 caracteres.")
    .regex(/^\d+$/, "Telefone deve conter apenas números."), // Apenas números, pode ser refinado para incluir parênteses/hífens se desejado e normalizado depois
  data_nascimento: z.coerce.date({ // z.coerce.date tentará converter uma string (ex: "YYYY-MM-DD") para um objeto Date
    required_error: "Data de nascimento é obrigatória.",
    invalid_type_error: "Data de nascimento inválida. Use o formato YYYY-MM-DD.",
  }),
  email: z.string({ required_error: "Email é obrigatório." })
    .email("Formato de email inválido."),
  // Se o campo 'endereco' for realmente necessário, adicione-o aqui
  // e também ao seu schema do Prisma para a tabela 'Cliente'.
  // endereco: z.string().optional(),
});
export type CreateClienteInput = z.infer<typeof createClienteSchema>;

// Schema para atualização de um cliente (todos os campos são opcionais)
export const updateClienteSchema = z.object({
  nome_completo: z.string().min(3, "Nome completo deve ter pelo menos 3 caracteres.").optional(),
  cpf_cnpj: z.string()
    .min(11, "CPF/CNPJ deve ter entre 11 e 18 caracteres.")
    .max(18, "CPF/CNPJ deve ter entre 11 e 18 caracteres.")
    .regex(/^(\d{11}|\d{14})$/, "Formato de CPF/CNPJ inválido.")
    .optional(),
  telefone: z.string()
    .min(10, "Telefone deve ter entre 10 e 15 caracteres.")
    .max(15, "Telefone deve ter entre 10 e 15 caracteres.")
    .regex(/^\d+$/, "Telefone deve conter apenas números.")
    .optional(),
  data_nascimento: z.coerce.date({
    invalid_type_error: "Data de nascimento inválida. Use o formato YYYY-MM-DD.",
  }).optional(),
  email: z.string().email("Formato de email inválido.").optional(),
  // endereco: z.string().optional(), // Se for atualizável e existir no banco
});
export type UpdateClienteInput = z.infer<typeof updateClienteSchema>;