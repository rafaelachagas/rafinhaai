import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function POST(request: Request) {
    try {
        const { nome, nicho, resultados, diferenciais, publicoAlvo, tomVoz, objetivo, estilo } = await request.json();

        if (!nicho || !publicoAlvo) {
            return NextResponse.json({ error: 'Preencha pelo menos o nicho e o público-alvo.' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const fullPrompt = `
Você é Rafinha.AI, um especialista em branding pessoal e copywriting para Instagram. Você cria bios que convertem seguidores em clientes e transmitem autoridade instantânea.

### DADOS DO PERFIL:
- **Nome/Marca:** ${nome || 'Não informado'}
- **Nicho:** ${nicho}
- **Público-alvo:** ${publicoAlvo}
- **Resultados/Conquistas:** ${resultados || 'Não informado'}
- **Diferenciais:** ${diferenciais || 'Não informado'}
- **Tom de voz:** ${tomVoz || 'Profissional e confiante'}
- **Objetivo do perfil:** ${objetivo || 'Gerar autoridade e vender'}
- **Estilo preferido:** ${estilo || 'Moderno e impactante'}

### GERE 5 OPÇÕES DE BIO SEGUINDO ESTAS REGRAS:

Para CADA opção:
1. **Máximo 150 caracteres por linha** (limite do Instagram)
2. **Use emojis estratégicos** que reforcem a mensagem (não exagere)
3. **Inclua elementos de:**
   - Autoridade / Prova social
   - Proposta de valor clara
   - CTA sutil ou direto
4. **Varie os estilos entre:**
   - Minimalista e elegante
   - Direto e vendedor
   - Aspiracional e inspirador
   - Estratégico com dados
   - Criativo e diferenciado

### FORMATO DA RESPOSTA:

Para cada opção, use este formato:

**🔥 Opção X — [Nome do Estilo]**
\`\`\`
[Bio completa aqui, linha por linha]
\`\`\`
**Por que funciona:** [Explicação em 1-2 frases]

---

Após as 5 opções, adicione:

**💡 DICAS DE OTIMIZAÇÃO:**
- 3 dicas para maximizar o impacto da bio
- Sugestões de link na bio (tipo de ferramenta)
- Frequência ideal para atualizar a bio

### REGRAS:
- Use português brasileiro
- Cada bio deve ser DIFERENTE em estilo e abordagem
- Considere os limites reais do Instagram
- As bios devem ser prontas para copiar e colar
- Formate tudo em Markdown bonito
`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ bios: text });
    } catch (error) {
        console.error('AI Bio Error:', error);
        return NextResponse.json({ error: 'Falha ao gerar bios.' }, { status: 500 });
    }
}
