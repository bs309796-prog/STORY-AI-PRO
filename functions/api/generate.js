const MODEL = "gemini-2.5-flash";

export async function onRequestGet() {
  return Response.json({
    status: "API Connected",
    message: "Cloudflare Function चालू है"
  });
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.GEMINI_API_KEY) {
      return Response.json(
        { error: "GEMINI_API_KEY सेट नहीं है। Cloudflare में API key जोड़ें।" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const action = body.action || "story";
    const idea = body.idea || body.prompt || "";

    if (!idea.trim()) {
      return Response.json({ error: "कहानी का आइडिया लिखें।" }, { status: 400 });
    }

    let prompt;

    if (action === "scenes") {
      prompt = `नीचे दी गई हिंदी कहानी को 8 से 12 छोटे वीडियो दृश्यों में बाँटो।
हर दृश्य के लिए visual_description, narration, duration_seconds और camera_motion दो।
visual_description में सुंदर cinematic 3D cartoon दृश्य का वर्णन हो।
केवल valid JSON array दो। कोई markdown या अतिरिक्त टेक्स्ट नहीं।
कहानी:
${idea}`;
    } else {
      prompt = `तुम एक अनुभवी हिंदी कहानी लेखक हो।
इस विचार पर एक मौलिक, भावनात्मक, रहस्य और सस्पेंस से भरी हिंदी नैतिक कहानी लिखो।
कहानी YouTube voice-over के लिए हो।
शुरुआत आकर्षक हो, घटनाएँ स्वाभाविक हों और अंत में मजबूत सीख हो।
कहानी का विचार: ${idea}
कहानी का प्रकार: ${body.storyType || "Moral Story"}
लंबाई: लगभग 1200 से 1500 शब्द।
केवल पूरी कहानी हिंदी में लिखो।`;
    }

    const apiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.9 }
        })
      }
    );

    const result = await apiResponse.json();

    if (!apiResponse.ok) {
      return Response.json(
        { error: result.error?.message || "Gemini API में समस्या आई।" },
        { status: apiResponse.status }
      );
    }

    const output = result.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("") || "";

    if (!output) {
      return Response.json({ error: "Gemini ने खाली जवाब दिया।" }, { status: 502 });
    }

    if (action === "scenes") {
      const cleaned = output.replace(/```json|```/g, "").trim();
      const scenes = JSON.parse(cleaned);
      return Response.json({ scenes });
    }

    return Response.json({ story: output });

  } catch (error) {
    return Response.json(
      { error: error.message || "Server में कोई समस्या आई।" },
      { status: 500 }
    );
  }
}

