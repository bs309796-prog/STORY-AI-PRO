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
        { error: "Gemini API key Cloudflare में नहीं मिली।" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const idea = String(body.idea || body.prompt || "").trim();

    if (!idea) {
      return Response.json(
        { error: "कहानी का आइडिया लिखिए।" },
        { status: 400 }
      );
    }

    const prompt = `
आप एक अनुभवी हिंदी कहानी लेखक हैं।

यूजर के दिए गए आइडिया पर एक बिल्कुल नई,
रोचक, भावनात्मक और अनोखी हिंदी कहानी लिखें।

कहानी का आइडिया: ${idea}
कहानी का प्रकार: ${body.storyType || "Moral Story"}
वीडियो अवधि: ${body.duration || "8-10 minutes"}

नियम:
1. कहानी की शुरुआत दमदार और रहस्यपूर्ण हो।
2. किरदारों के नाम और घटनाएँ मौलिक हों।
3. कहानी में भावनाएँ, संघर्ष, सस्पेंस और ट्विस्ट हों।
4. कहानी अधूरी न छोड़ें।
5. अंत में एक अच्छी सीख दें।
6. केवल हिंदी में कहानी लिखें।
7. डेमो टेक्स्ट या तकनीकी निर्देश बिल्कुल न लिखें।
8. लगभग 8000 से 10000 शब्दों की विस्तृत कहानी लिखें।
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
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 24000,
            temperature: 0.9
          }
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return Response.json(
        {
          error: result.error?.message || "Gemini API से जवाब नहीं मिला।"
        },
        { status: response.status }
      );
    }

    const story = result.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("\n")
      .trim();

    if (!story) {
      return Response.json(
        { error: "AI ने कहानी नहीं बनाई। दोबारा कोशिश करें।" },
        { status: 502 }
      );
    }

    return Response.json({ story, text: story });

  } catch (error) {
    return Response.json(
      { error: error.message || "Server में समस्या आई।" },
      { status: 500 }
    );
  }
}
