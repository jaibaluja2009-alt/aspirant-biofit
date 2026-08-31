export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { sleep, study, water, mood } = req.body || {};

        if (sleep === undefined || study === undefined || water === undefined || !mood) {
            return res.status(400).json({ error: "Missing wellness data" });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: "Gemini API key is missing on server" });
        }

        const promptText = `
You are a realistic but supportive wellness coach for a student preparing for exams.

Today's data:
Sleep: ${sleep} hours
Study: ${study} hours
Water: ${water} glasses
Mood: ${mood}

Write exactly 4 lines in this format:
Sleep: short specific sleep insight
Mood: short specific mood insight
Study: short specific study insight
Hydration: short specific hydration insight

Rules:
- Keep each line under 18 words.
- No markdown.
- No bullets.
- No extra introduction.
`;

        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: promptText
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await geminiResponse.json();

       if (!geminiResponse.ok) {
    console.error("Gemini API Error:", data);
    return res.status(geminiResponse.status).json({
        error: data?.error?.message || "Gemini API request failed"
    });
}

        const aiReply =
            data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

        const sleepLine = aiReply.match(/Sleep:\s*(.*)/i);
        const moodLine = aiReply.match(/Mood:\s*(.*)/i);
        const studyLine = aiReply.match(/Study:\s*(.*)/i);
        const hydrationLine = aiReply.match(/Hydration:\s*(.*)/i);

        return res.status(200).json({
            sleep: sleepLine ? sleepLine[1].trim() : "AI could not read the sleep insight.",
            mood: moodLine ? moodLine[1].trim() : "AI could not read the mood insight.",
            study: studyLine ? studyLine[1].trim() : "AI could not read the study insight.",
            hydration: hydrationLine ? hydrationLine[1].trim() : "AI could not read the hydration insight."
        });

    } catch (error) {
        console.error("Server AI Error:", error);
        return res.status(500).json({
            error: "Server AI error"
        });
    }
}
