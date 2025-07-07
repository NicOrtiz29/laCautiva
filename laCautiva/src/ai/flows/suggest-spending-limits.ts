'use server';

/**
 * @fileOverview Este archivo define un flujo de Genkit para sugerir límites de gasto basados en el saldo y el historial de gastos del usuario.
 *
 * - suggestSpendingLimits - Una función que sugiere límites de gasto.
 * - SuggestSpendingLimitsInput - El tipo de entrada para la función suggestSpendingLimits.
 * - SuggestSpendingLimitsOutput - El tipo de retorno para la función suggestSpendingLimits.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSpendingLimitsInputSchema = z.object({
  balance: z.number().describe('El saldo actual del usuario.'),
  spendingHistory: z
    .array(z.object({amount: z.number(), date: z.string()}))
    .describe('El historial de gastos del usuario.'),
});
export type SuggestSpendingLimitsInput = z.infer<typeof SuggestSpendingLimitsInputSchema>;

const SuggestSpendingLimitsOutputSchema = z.object({
  suggestedSpendingLimit: z
    .number()
    .describe('El límite de gasto sugerido para el usuario.'),
  reasoning: z
    .string()
    .describe('La justificación del límite de gasto sugerido.'),
});
export type SuggestSpendingLimitsOutput = z.infer<typeof SuggestSpendingLimitsOutputSchema>;

export async function suggestSpendingLimits(
  input: SuggestSpendingLimitsInput
): Promise<SuggestSpendingLimitsOutput> {
  return suggestSpendingLimitsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSpendingLimitsPrompt',
  input: {schema: SuggestSpendingLimitsInputSchema},
  output: {schema: SuggestSpendingLimitsOutputSchema},
  prompt: `Eres un asesor financiero que ayuda a un jubilado a administrar sus finanzas.

  Basándote en el saldo actual y el historial de gastos, sugiere un límite de gasto razonable.

Saldo Actual: {{balance}}
Historial de Gastos:
{{#each spendingHistory}}
- Fecha: {{date}}, Cantidad: {{amount}}
{{/each}}

Proporciona un límite de gasto y la justificación correspondiente. Considera la estabilidad financiera a largo plazo.
`,
});

const suggestSpendingLimitsFlow = ai.defineFlow(
  {
    name: 'suggestSpendingLimitsFlow',
    inputSchema: SuggestSpendingLimitsInputSchema,
    outputSchema: SuggestSpendingLimitsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
