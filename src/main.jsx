
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function App() {
  const [idea, setIdea] = useState("");
  const [genre, setGenre] = useState("Moral Story");
  const [length, setLength] = useState("8–10 minutes");
  const [story, setStory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    if (!idea.trim()) {
      setError("पहले अपनी कहानी का आइडिया लिखें।");
      return;
    }

    setLoading(true);
    setError("");
    setStory("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          idea: idea.trim(),
          storyType: genre,
          duration: length
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "कहानी बनाने में समस्या आई।");
      }

      const result = data.story || data.text;

      if (!result) {
        throw new Error("AI से कहानी नहीं मिली।");
      }

      setStory(result);
    } catch (err) {
      setError(err.message || "कुछ गलत हुआ। दोबारा कोशिश करें।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{
      maxWidth: "850px",
      margin: "auto",
      padding: "24px",
      color: "#ffffff",
      fontFamily: "Arial, sans-serif"
    }}>
      <h1>Bhagat Singh AI Studio</h1>
      <p>अपनी खुद की AI कहानी बनाएं</p>

      <h2>Story Generator</h2>

      <label>कहानी का आइडिया</label>
      <textarea
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        placeholder="जैसे: अमीर बाप की बिगड़ी हुई औलाद"
        rows="5"
        style={{ width: "100%", padding: "12px", marginTop: "8px" }}
      />

      <p>कहानी का प्रकार</p>
      <select
        value={genre}
        onChange={(e) => setGenre(e.target.value)}
        style={{ padding: "12px", width: "100%" }}
      >
        <option>Moral Story</option>
        <option>Emotional Story</option>
        <option>Horror Story</option>
        <option>Suspense Story</option>
        <option>Drama Story</option>
      </select>

      <p>वीडियो की अवधि</p>
      <select
        value={length}
        onChange={(e) => setLength(e.target.value)}
        style={{ padding: "12px", width: "100%" }}
      >
        <option>5 minutes</option>
        <option>8–10 minutes</option>
        <option>15 minutes</option>
        <option>20 minutes</option>
      </select>

      <button
        onClick={generate}
        disabled={loading}
        style={{
          width: "100%",
          padding: "15px",
          marginTop: "20px",
          background: "#7547ff",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "17px",
          cursor: "pointer"
        }}
      >
        {loading ? "कहानी बन रही है..." : "Generate Story"}
      </button>

      {error && (
        <p style={{ color: "#ff7777", marginTop: "20px" }}>{error}</p>
      )}

      {story && (
        <section style={{ marginTop: "28px" }}>
          <h2>Generated Script</h2>
          <div style={{
            whiteSpace: "pre-wrap",
            lineHeight: "1.8",
            padding: "18px",
            background: "#202033",
            borderRadius: "10px"
          }}>
            {story}
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(story)}
            style={{ padding: "12px", marginTop: "15px" }}
          >
            कहानी कॉपी करें
          </button>
        </section>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
