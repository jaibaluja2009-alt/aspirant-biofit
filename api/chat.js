export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { messages } = req.body || {};

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: "No messages provided" });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: "Gemini API key is missing on server"
            });
        }

        // Keep only recent messages to avoid unnecessarily large requests
        const recentMessages = messages.slice(-12);

        const contents = [
            {
                role: "user",
                parts: [{
                    text: `You are Sora AI, a friendly wellness and study companion for students.

You help with study habits, productivity, general wellness, sleep routines,
hydration, motivation, and organization.

Be supportive, practical, and concise. Remember the context of the conversation.

Do not diagnose medical or mental health conditions. For serious health concerns,
encourage the user to speak with a trusted adult or qualified professional.`
                }]
            },
            ...recentMessages.map(msg => ({
                role: msg.role === "model" ? "model" : "user",
                parts: [{ text: String(msg.text || "") }]
            }))
        ];

        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ contents })
            }
        );

        const data = await geminiResponse.json();

        if (!geminiResponse.ok) {
            console.error("Gemini Chat API Error:", data);
            return res.status(geminiResponse.status).json({
                error: data?.error?.message || "Gemini API request failed"
            });
        }

        const reply =
            data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
            "Sorry, I couldn't generate a response right now.";

        return res.status(200).json({ reply });

    } catch (error) {
        console.error("Server Chat Error:", error);
        return res.status(500).json({ error: "Server chat error" });
    }
}
