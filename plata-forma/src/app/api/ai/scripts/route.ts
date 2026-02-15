import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function POST(request: Request) {
    try {
        const { prompt, type } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const fullPrompt = `
      Você é um especialista em marketing e criação de roteiros de alta conversão.
      Crie um roteiro para um vídeo de ${type} baseado no seguinte tema: "${prompt}".
      
      O roteiro deve seguir a estrutura:
      1. Hook (Gancho inicial)
      2. Problema + Agitação
      3. Solução
      4. Chamada para Ação (CTA)
      
      Formate a resposta em Markdown.
    `;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ script: text });
    } catch (error) {
        console.error('AI Error:', error);
        return NextResponse.json({ error: 'Falha ao gerar roteiro' }, { status: 500 });
    }
}
