
export async function onRequestGet() {
  return Response.json({
    status: "API Connected",
    message: "Cloudflare Function चालू है"
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.GEMINI_API_KEY) {
    return Response.json(
      { error: "GEMINI_API_KEY Cloudflare में सेट नहीं है।" },
      { status: 500 }
    );
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Request का JSON सही नहीं है।" },
      { status: 400 }
    );
  }

  const idea = String(body.idea || body.prompt || "").trim();

  if (!idea) {
    return Response.json(
      { error: "कहानी का आइडिया लिखिए।" },
      { status: 400 }
    );
  }

  const prompt = `
आप एक अनुभवी हिंदी कहानी लेखक हैं।

दिए गए आइडिया पर एक मौलिक, भावनात्मक और रोचक हिंदी कहानी लिखिए।

कहानी का आइडिया: ${idea}
कहानी का प्रकार: ${body.storyType || "Moral Story"}
वीडियो अवधि: ${body.duration || "8–10 मिनट"}

निर्देश:
1. शुरुआत में दमदार हुक और सस्पेंस हो।
2. कहानी में मौलिक किरदार और घटनाएँ हों।
3. भावनाएँ, संघर्ष, रहस्य और ट्विस्ट हों।
4. कहानी पूरी हो, अधूरी न रहे।
5. अंत में प्रभावशाली सीख हो।
6. केवल हिंदी में लिखें।
7. लगभग 1200 से 1500 शब्द लिखें।
8. कोई डेमो टेक्स्ट या तकनीकी निर्देश न लिखें।
`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 6000,
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
          error:
            result.error?.message ||
            `Gemini API Error: ${response.status}`
        },
        { status: 502 }
      );
    }

    const story = result.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("\n")
      .trim();

    if (!story) {
      return Response.json(
        {
          error:
            result.promptFeedback?.blockReason ||
            "Gemini ने कहानी नहीं दी। दोबारा कोशिश करें।"
        },
        { status: 502 }
      );
    }

    return Response.json(
      { story, text: story },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );

  } catch (error) {
    if (error.name === "AbortError") {
      return Response.json(
        {
          error: "कहानी बनाने में 90 सेकंड से अधिक समय लगा। छोटी कहानी के लिए दोबारा कोशिश करें।"
        },
        { status: 504 }
      );
    }

    return Response.json(
      {
        error: error.message || "सर्वर में समस्या आई।"
      },
      { status: 500 }
    );

  } finally {
    clearTimeout(timeout);
  }
}
