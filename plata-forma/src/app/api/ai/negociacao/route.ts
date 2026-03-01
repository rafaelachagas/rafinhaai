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

        const systemPrompt = `
Você é um simulador de negociação chamado Rafinha.AI. Você vai interpretar o papel de um CLIENTE DIFÍCIL que está interessado em comprar mas tem muitas objeções.

### CONTEXTO DA NEGOCIAÇÃO:
${contexto ? `
- **Produto/Serviço:** ${contexto.produto || 'Produto digital'}
- **Preço:** ${contexto.preco || 'Não informado'}
- **Nicho:** ${contexto.nicho || 'Marketing Digital'}
- **Nível de dificuldade:** ${contexto.dificuldade || 'Médio'}
` : '- Produto digital genérico'}

### SUAS REGRAS COMO CLIENTE:
1. Você é um cliente REAL e deve agir como uma pessoa real agiria
2. Tenha objeções reais: preço alto, desconfiança, comparação com concorrentes, "vou pensar", "não tenho dinheiro agora", "será que funciona para mim?"
3. NÃO seja impossível — se o vendedor fizer um bom trabalho, ceda gradualmente
4. Use linguagem informal brasileira, como um cliente real falaria no WhatsApp/DM
5. Reaja emocionalmente: demonstre dúvida, interesse parcial, resistência
6. Dê sinais sutis de interesse para o vendedor trabalhar
7. NUNCA quebre o personagem — você É o cliente
8. Faça perguntas difíceis que testam o conhecimento do vendedor
9. Baseado no nível de dificuldade: Fácil (cede rápido), Médio (algumas objeções), Difícil (muitas objeções e resistência forte)

### FORMATO DA RESPOSTA:
- Responda APENAS como o cliente, em primeira pessoa
- Mantenha respostas curtas e naturais (como um WhatsApp real)
- Use no máximo 2-3 frases por resposta
- NÃO adicione análise ou feedback dentro da mensagem do cliente
- NÃO use formatação Markdown — seja natural
`;

        // Build conversation history
        const conversationHistory = messages.map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        const chat = model.startChat({
            history: [
                { role: 'user', parts: [{ text: systemPrompt }] },
                { role: 'model', parts: [{ text: 'Entendido! Estou pronto para simular o cliente. Pode começar a negociação.' }] },
                ...conversationHistory.slice(0, -1)
            ]
        });

        const lastMessage = messages[messages.length - 1].content;
        const result = await chat.sendMessage(lastMessage);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ reply: text });
    } catch (error) {
        console.error('AI Negociação Error:', error);
        return NextResponse.json({ error: 'Falha na simulação de negociação.' }, { status: 500 });
    }
}
