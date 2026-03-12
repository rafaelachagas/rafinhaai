const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    try {
        const key = 'AIzaSyCzyVX_QQV8CXDr17kuHoEX7sKGE37WR9s';
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();
        console.log('All Models:', data.models.map(m => m.name));
    } catch (error) {
        console.error('Failed to list models:', error);
    }
}

listModels();
