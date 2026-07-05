const { GoogleGenerativeAI } = require('@google/generative-ai');

const translateText = async (req, res) => {
    try {
        const { text, targetLanguage } = req.body;
        if (!text || !targetLanguage) {
            return res.status(400).json({ message: 'Missing text or targetLanguage' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Using flash model for lowest latency real-time translation
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are a real-time chat translator. Translate the following text into ${targetLanguage}. 
        Return ONLY the translated text. Do not add any conversational filler, notes, or quotes. 
        Retain the original tone, slang, and emojis if applicable.
        
        Text to translate: "${text}"`;

        const result = await model.generateContent(prompt);
        const translatedText = result.response.text().trim();

        res.json({ translatedText });
    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ message: 'Error translating text via AI' });
    }
};

const summarizeChat = async (req, res) => {
    try {
        const { transcript } = req.body;
        if (!transcript) {
            return res.status(400).json({ message: 'Missing transcript' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are an AI assistant in a messaging app. Your job is to summarize the following chat transcript. 
        Provide a concise, bulleted list of the main points discussed. Ignore small talk (like "hi", "how are you"). 
        If the chat is too short or doesn't have much substance, just summarize it in one brief sentence.
        
        Transcript:
        ${transcript}`;

        const result = await model.generateContent(prompt);
        const summary = result.response.text().trim();

        res.json({ summary });
    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ message: 'Error summarizing chat via AI' });
    }
};

module.exports = { translateText, summarizeChat };
