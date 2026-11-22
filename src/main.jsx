
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BookOpen, Image as ImageIcon, Video, Mic, Download,
  Save, Sparkles, Play
} from "lucide-react";
import "./style.css";

function App() {
  const [idea, setIdea] = useState("");
  const [story, setStory] = useState("");
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("story");
  const [projects, setProjects] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("storyProjects") || "[]");
    } catch {
      return [];
    }
  });

  async function generate(action) {
    if (!idea.trim()) {
      alert("पहले कहानी का आइडिया लिखें।");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, idea, storyType: "Moral Story", duration: "8-10 minutes" })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "कहानी नहीं बन पाई");
      if (action === "story") setStory(data.story || "");
      if (action === "scenes") setScenes(data.scenes || []);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  function saveProject() {
    const updated = [{ idea, story, scenes, date: new Date().toLocaleString("hi-IN") }, ...projects];
    setProjects(updated);
    localStorage.setItem("storyProjects", JSON.stringify(updated));
    alert("प्रोजेक्ट सेव हो गया।");
  }

  function speakStory() {
    if (!story) return alert("पहले कहानी बनाएं।");
    const speech = new SpeechSynthesisUtterance(story);
    speech.lang = "hi-IN";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);
  }

  function downloadStory() {
    if (!story) return alert("पहले कहानी बनाएं।");
    const file = new Blob([story], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meri-hindi-kahani.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app">
      <header>
        <div className="brand"><Sparkles /> AI STORY STUDIO</div>
        <h1>अपनी कहानी को नया रूप दें</h1>
        <p>AI से हिंदी कहानी और वीडियो बनाने का स्टूडियो</p>
      </header>

      <nav>
        {[
          ["story", "कहानी", BookOpen],
          ["scenes", "सीन", ImageIcon],
          ["images", "AI इमेज", ImageIcon],
          ["video", "AI वीडियो", Video],
          ["projects", "प्रोजेक्ट", Save]
        ].map(([id, label, Icon]) => (
          <button className={tab === id ? "active" : ""} onClick={() => setTab(id)} key={id}>
            <Icon size={17} /> {label}
          </button>
        ))}
      </nav>

      <main>
        {tab === "story" && <>
          <section className="panel">
            <h2>नई हिंदी कहानी बनाएं</h2>
            <label>अपनी कहानी का आइडिया बताइए</label>
            <textarea value={idea} onChange={e => setIdea(e.target.value)}
              placeholder="जैसे: एक गरीब लड़का जो अपनी ईमानदारी से अमीर बन जाता है..." />
            <button className="primary" disabled={loading} onClick={() => generate("story")}>
              <Sparkles size={18} /> {loading ? "कहानी बन रही है..." : "Generate Story"}
            </button>
          </section>
          {story && <section className="panel">
            <h2>आपकी कहानी</h2>
            <div className="story">{story}</div>
            <div className="actions">
              <button onClick={speakStory}><Play size={16} /> कहानी सुनें</button>
              <button onClick={downloadStory}><Download size={16} /> डाउनलोड</button>
              <button onClick={saveProject}><Save size={16} /> सेव करें</button>
            </div>
          </section>}
        </>}

        {tab === "scenes" && <section className="panel">
          <h2>कहानी को सीन में बाँटें</h2>
          <p>पहले कहानी बनाएं, फिर नीचे बटन दबाएं।</p>
          <button className="primary" disabled={loading || !story} onClick={() => {
            setIdea(story);
            generate("scenes");
          }}>{loading ? "सीन बन रहे हैं..." : "सीन बनाएं"}</button>
          {scenes.map((scene, i) => <article className="scene" key={i}>
            <h3>सीन {i + 1}</h3>
            <p>{scene.visual_description}</p>
            <p><b>नरेशन:</b> {scene.narration}</p>
            <small>अवधि: {scene.duration_seconds} सेकंड</small>
          </article>)}
        </section>}

        {tab === "images" && <section className="panel">
          <h2>AI इमेज जनरेशन</h2>
          <p>हर सीन के लिए 3D कार्टून इमेज बनाने हेतु इमेज सेवा का API जोड़ना बाकी है।</p>
          <button disabled>इमेज बनाएं — API कनेक्शन बाकी</button>
        </section>}

        {tab === "video" && <section className="panel">
          <h2>AI वीडियो मेकर</h2>
          <p>सीन को एनिमेट करके MP4 बनाने के लिए वीडियो सेवा का API जोड़ना बाकी है।</p>
          <button disabled>वीडियो बनाएं — API कनेक्शन बाकी</button>
          <p><Mic size={16} /> हिंदी आवाज़ के लिए कहानी टैब में “कहानी सुनें” इस्तेमाल करें।</p>
        </section>}

        {tab === "projects" && <section className="panel">
          <h2>सेव किए गए प्रोजेक्ट</h2>
          {projects.length === 0 ? <p>अभी कोई प्रोजेक्ट सेव नहीं है।</p> :
            projects.map((p, i) => <article className="scene" key={i}>
              <b>{p.idea.slice(0, 100)}</b><p>{p.date}</p>
              <button onClick={() => { setIdea(p.idea); setStory(p.story); setScenes(p.scenes || []); setTab("story"); }}>खोलें</button>
            </article>)}
        </section>}
      </main>
      <footer>AI Story Studio · Hindi Story Creator</footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
