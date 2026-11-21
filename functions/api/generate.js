
export async function onRequestPost({ request, env }) {
  try {
    if (!env.GEMINI_API_KEY) {
      return Response.json(
        { error: "Gemini API key is missing." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const idea = body.prompt || body.idea || "";

    if (!idea.trim()) {
      return Response.json(
        { error: "Please enter a story idea." },
        { status: 400 }
      );
    }

    const prompt = `
आप एक बेहतरीन हिंदी कहानी लेखक हैं।
इस आइडिया पर 1200 से 1500 शब्दों की
भावनात्मक, रहस्यपूर्ण और अनोखी हिंदी कहानी लिखें।

कहानी में शुरुआत में दमदार Hook,
बीच में दिलचस्प घटनाएँ और अंत में
भावुक Climax तथा स्पष्ट नैतिक संदेश हो।

कहानी का आइडिया: ${idea}
कहानी का प्रकार: ${body.storyType || "Moral Story"}
वीडियो अवधि: ${body.duration || "8-10 minutes"}

केवल पूरी कहानी हिंदी में लिखें।
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: result.error?.message || "Gemini API error" },
        { status: response.status }
      );
    }

    const story = result.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("\n");

    if (!story) {
      return Response.json(
        { error: "AI did not return a story." },
        { status: 502 }
      );
    }

    return Response.json({ story, text: story });

  } catch (error) {
    return Response.json(
      { error: "Server error. Please try again." },
      { status: 500 }
    );
  }
}

