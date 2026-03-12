async function testAPI() {
    try {
        const response = await fetch('http://localhost:3000/api/ai/roteiros', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nicho: 'Marketing',
                avatar: 'Empreendedores',
                produto: 'Curso de IA',
                plataforma: 'Instagram Reels',
                objetivo: 'Gerar vendas',
                tomVoz: 'Persuasivo'
            })
        });
        const data = await response.json();
        console.log('API Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('API Test Failed:', error);
    }
}

testAPI();
