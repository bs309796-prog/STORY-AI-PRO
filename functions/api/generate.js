
const MODEL = "gemini-3.8-flash";

export async function onRequestGet() {
  return Response.json({
    status: "API Connected",
    message: "AI Story Studio Backend Ready",
    features: ["story", "scenes"]
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.GEMINI_API_KEY) {
    return Response.json(
      { error: "GEMINI_API_KEY Cloudflare में सेट नहीं है।" },
      { status: 500 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  try {
    let body;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Request सही नहीं है।" },
        { status: 400 }
      );
    }

    const idea = String(body.idea || body.prompt || "").trim();
    const action = body.action || "story";

    if (!idea) {
      return Response.json(
        { error: "कहानी का आइडिया या स्क्रिप्ट डालें।" },
        { status: 400 }
      );
    }

    if (idea.length > 30000) {
      return Response.json(
        { error: "इनपुट 30,000 अक्षरों से बड़ा है। इसे हिस्सों में डालें।" },
        { status: 413 }
      );
    }

    let prompt;
    let maxOutputTokens = 8192;

    if (action === "scenes") {
      prompt = `
आप एक प्रोफेशनल हिंदी फिल्म स्टोरीबोर्ड लेखक हैं।

नीचे दी गई कहानी को वीडियो के दृश्यों में बाँटिए।
हर दृश्य में ये जानकारी दें:
- scene_number
- visual_description (English में विस्तृत image prompt)
- narration (हिंदी में)
- duration_seconds
- camera_motion

केवल वैध JSON दीजिए। Markdown या अतिरिक्त टेक्स्ट नहीं।
फॉर्मेट:
{"scenes":[{"scene_number":1,"visual_description":"...","narration":"...","duration_seconds":8,"camera_motion":"slow zoom"}]}

कहानी:
${idea}
`;
      maxOutputTokens = 8192;
    } else if (action === "story") {
      const duration = String(body.duration || "8–10 मिनट");
      const genre = String(body.storyType || "Moral Story");

      prompt = `
आप एक अनुभवी हिंदी कहानी लेखक और YouTube स्क्रिप्ट राइटर हैं।

कहानी का आइडिया:
${idea}

कहानी का प्रकार: ${genre}
वीडियो अवधि: ${duration}

निर्देश:
1. शुरुआत दमदार हुक और सस्पेंस से करें।
2. मौलिक किरदार, संवाद और घटनाएँ रखें।
3. भावनाएँ, संघर्ष, रहस्य और ट्विस्ट शामिल करें।
4. कहानी का अंत पूरा और प्रभावशाली हो।
5. अंत में दिल छू लेने वाली सीख हो।
6. केवल हिंदी में कहानी लिखें।
7. वीडियो अवधि के अनुसार पर्याप्त शब्द लिखें।
8. गैर-जरूरी भूमिका या तकनीकी निर्देश न लिखें।
9. यूज़र के दिए गए आइडिया की सभी महत्वपूर्ण बातें शामिल करें।
10. कहानी अधूरी छोड़कर समाप्त न करें।
`;
    } else {
      return Response.json(
        { error: "अज्ञात जनरेशन विकल्प।" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            maxOutputTokens,
            temperature: 0.8
          }
        }),
        signal: controller.signal
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return Response.json(
        {
          error: result.error?.message || "Gemini API में समस्या आई।"
        },
        { status: 502 }
      );
    }

    const output = result.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("\n")
      .trim();

    if (!output) {
      return Response.json(
        { error: "AI से कोई जवाब नहीं मिला। दोबारा कोशिश करें।" },
        { status: 502 }
      );
    }

    if (action === "scenes") {
      const cleaned = output
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();

      let parsed;

      try {
        parsed = JSON.parse(cleaned);
      } catch {
        return Response.json(
          { error: "सीन का JSON सही नहीं आया। दोबारा कोशिश करें।" },
          { status: 502 }
        );
      }

      if (!Array.isArray(parsed.scenes)) {
        return Response.json(
          { error: "AI ने वीडियो सीन सही तरीके से नहीं बनाए।" },
          { status: 502 }
        );
      }

      return Response.json(
        { scenes: parsed.scenes },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    return Response.json(
      { story: output, text: output },
      { headers: { "Cache-Control": "no-store" } }
    );

  } catch (error) {
    return Response.json(
      {
        error: error.name === "AbortError"
          ? "जनरेशन में 120 सेकंड से अधिक समय लगा।"
          : error.message || "सर्वर में समस्या आई।"
      },
      { status: error.name === "AbortError" ? 504 : 500 }
    );

  } finally {
    clearTimeout(timeout);
  }
}
