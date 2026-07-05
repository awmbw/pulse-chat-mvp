require('dotenv').config({ path: './backend/.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
    try {
        console.log("Key:", process.env.GEMINI_API_KEY ? "EXISTS" : "MISSING");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are an AI assistant in a messaging app. Your job is to summarize the following chat transcript. 
        Provide a concise, bulleted list of the main points discussed. Ignore small talk (like "hi", "how are you"). 
        If the chat is too short or doesn't have much substance, just summarize it in one brief sentence.
        
        Transcript:
        User: aap kaise ho
        Friend: Je vais bien, et vous ?`;

        const result = await model.generateContent(prompt);
        console.log("Summary Output:", result.response.text().trim());
    } catch(err) {
        console.error("Gemini Error:", err);
    }
}
testGemini();
