const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testQuota() {
    const key = 'AIzaSyCzyVX_QQV8CXDr17kuHoEX7sKGE37WR9s';
    const genAI = new GoogleGenerativeAI(key);
    
    const modelsToTest = [
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-pro-latest',
        'gemini-flash-latest',
        'gemini-2.0-flash',
        'gemini-2.5-flash'
    ];

    for (const modelName of modelsToTest) {
        console.log(`Testing model: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hi");
            const response = await result.response;
            console.log(`✅ Success with ${modelName}: ${response.text()}`);
            break; // Stop at first success
        } catch (error) {
            console.log(`❌ Failed with ${modelName}: ${error.message}`);
        }
    }
}

testQuota();
