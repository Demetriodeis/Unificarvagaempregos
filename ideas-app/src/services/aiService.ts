import Anthropic from '@anthropic-ai/sdk';
import { Idea } from '../types';

function buildClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

export async function generateInsights(
  idea: Idea,
  apiKey: string,
  onChunk?: (text: string) => void
): Promise<string> {
  const client = buildClient(apiKey);

  const prompt = `Você é um consultor estratégico especializado em inovação e desenvolvimento de ideias.

Analise a seguinte ideia e gere insights valiosos em português:

**Título:** ${idea.title}

**Descrição:** ${idea.description}

**Tags:** ${idea.tags.join(', ') || 'Nenhuma'}

**Status:** ${idea.implemented ? 'Já implementada' : 'Ainda não implementada'}

**Criada em:** ${new Date(idea.createdAt).toLocaleDateString('pt-BR')}

Por favor, forneça:
1. **Análise da Ideia** - Avalie o potencial e originalidade
2. **Pontos Fortes** - Destaque os aspectos positivos
3. **Desafios Potenciais** - Identifique possíveis obstáculos
4. **Próximos Passos** - Sugira ações concretas para avançar
5. **Oportunidades** - Identifique possibilidades não exploradas
6. **Métricas de Sucesso** - Como medir se a ideia foi bem implementada

Seja específico, prático e motivador em sua análise.`;

  if (onChunk) {
    // Streaming mode
    let fullText = '';
    const stream = client.messages.stream({
      model: 'claude-opus-4-7',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        fullText += event.delta.text;
        onChunk(event.delta.text);
      }
    }

    return fullText;
  } else {
    // Non-streaming mode
    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    for (const block of response.content) {
      if (block.type === 'text') {
        return block.text;
      }
    }
    return '';
  }
}

export async function generateQuickSummary(
  ideas: Idea[],
  apiKey: string
): Promise<string> {
  if (ideas.length === 0) return 'Nenhuma ideia registrada ainda.';

  const client = buildClient(apiKey);

  const ideasList = ideas
    .slice(0, 10)
    .map((i, idx) => `${idx + 1}. "${i.title}" (${i.implemented ? 'implementada' : 'pendente'})`)
    .join('\n');

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 400,
    messages: [
      {
        role: 'user',
        content: `Analise brevemente estas ${ideas.length} ideia(s) registradas e dê um resumo motivacional em 2-3 frases em português, destacando padrões ou oportunidades:\n\n${ideasList}`,
      },
    ],
  });

  for (const block of response.content) {
    if (block.type === 'text') return block.text;
  }
  return '';
}
