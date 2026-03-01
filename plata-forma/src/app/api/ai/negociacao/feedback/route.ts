import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function POST(request: Request) {
    try {
        const { messages, contexto } = await request.json();

        if (!messages || messages.length === 0) {
            return NextResponse.json({ error: 'Conversa vazia.' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const fullPrompt = `
Você é Rafinha.AI, um analista especialista em negociações de vendas digitais.

O vendedor acabou de realizar uma simulação de negociação. Analise TODA a conversa abaixo e forneça um feedback detalhado.

### CONVERSA DA NEGOCIAÇÃO:
${messages.map((m: any) => `**${m.role === 'user' ? 'VENDEDOR' : 'CLIENTE'}:** ${m.content}`).join('\n\n')}

${contexto ? `
### CONTEXTO:
- Produto: ${contexto.produto || 'N/A'}
- Preço: ${contexto.preco || 'N/A'}
- Nicho: ${contexto.nicho || 'N/A'}
` : ''}

### GERE O FEEDBACK SEGUINDO ESTA ESTRUTURA:

**1. 📊 SCORE DE EXECUÇÃO: X/100**
- Nota geral da performance do vendedor

**2. 🏆 PONTOS FORTES**
- Liste 3-5 coisas que o vendedor fez bem
- Explique POR QUE foram boas decisões

**3. ⚠️ PONTOS DE MELHORIA**
- Liste 3-5 erros ou oportunidades perdidas
- Para CADA erro, dê a sugestão do que deveria ter feito com um exemplo de frase

**4. 🎯 ANÁLISE POR HABILIDADE**
Dê uma nota de 0-10 para cada habilidade:
- Rapport (Conexão com o cliente)
- Escuta Ativa
- Contorno de Objeções
- Criação de Urgência
- Fechamento
- Conhecimento do Produto

**5. 📈 PLANO DE EVOLUÇÃO**
- 3 ações práticas que o vendedor deve treinar para melhorar
- Sugira exercícios ou situações para praticar

**6. 💡 FRASE-CHAVE**
- Dê UMA frase motivacional ou insight poderoso sobre vendas para o vendedor guardar

### REGRAS:
- Seja direto e construtivo, nunca ofensivo
- Use português brasileiro
- Formate em Markdown organizado
- Seja específico — cite trechos reais da conversa como exemplo
`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ feedback: text });
    } catch (error) {
        console.error('AI Feedback Error:', error);
        return NextResponse.json({ error: 'Falha ao gerar feedback.' }, { status: 500 });
    }
}
