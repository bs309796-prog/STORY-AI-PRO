
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import { WandSparkles, Clapperboard, BookOpen, Mic, FolderOpen, Settings, Download, Sparkles, Play, Pause, Film } from "lucide-react";
import "./style.css";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const sb = url && key ? createClient(url, key) : null;

function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [page, setPage] = useState("create");
  const [idea, setIdea] = useState("");
  const [genre, setGenre] = useState("Moral Story");
  const [duration, setDuration] = useState("8–10 मिनट");
  const [script, setScript] = useState("");
  const [scenes, setScenes] = useState([]);
  const [projects, setProjects] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sap-projects") || "[]"); }
    catch { return []; }
  });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [notice, setNotice] = useState("");
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState("0.9");
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb.auth.onAuthStateChange((_event, value) => setSession(value));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  async function callAPI(payload) {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "AI सर्वर में समस्या आई।");
    return data;
  }

  async function generateStory() {
    if (!idea.trim()) return setNotice("पहले कहानी का आइडिया लिखें।");
    setBusy(true);
    setScript("");
    setScenes([]);
    setNotice("");
    setProgress("AI कहानी तैयार कर रहा है...");
    try {
      const data = await callAPI({
        action: "story",
        idea: idea.trim(),
        storyType: genre,
        duration
      });
      const result = data.story || data.text;
      if (!result) throw new Error("AI से कहानी नहीं मिली।");
      setScript(result);
      setNotice("कहानी तैयार है!");
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  async function createScenes() {
    if (!script.trim()) return setNotice("पहले कहानी लिखें या तैयार स्क्रिप्ट डालें।");
    setBusy(true);
    setProgress("AI कहानी के सीन बना रहा है...");
    setNotice("");
    try {
      const data = await callAPI({ action: "scenes", idea: script });
      if (!Array.isArray(data.scenes) || !data.scenes.length) {
        throw new Error("वीडियो सीन नहीं मिले।");
      }
      setScenes(data.scenes);
      setPage("video");
      setNotice(`${data.scenes.length} सीन तैयार हैं।`);
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  function speak(text = script) {
    if (!text.trim()) return setNotice("पहले कहानी तैयार करें।");
    if (!window.speechSynthesis) return setNotice("इस ब्राउज़र में आवाज़ उपलब्ध नहीं है।");
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    utterance.rate = Number(rate);
    const voice = window.speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith("hi"));
    if (voice) utterance.voice = voice;
    utterance.onstart = () => setPlaying(true);
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(utterance);
  }

  function stopVoice() {
    window.speechSynthesis?.cancel();
    setPlaying(false);
  }

  function saveProject() {
    if (!script.trim()) return setNotice("पहले कहानी तैयार करें।");
    const item = { id: Date.now(), title: idea.slice(0, 50) || "मेरी कहानी", genre, script, scenes };
    const next = [item, ...projects];
    setProjects(next);
    localStorage.setItem("sap-projects", JSON.stringify(next));
    setNotice("प्रोजेक्ट सेव हो गया।");
  }

  function downloadScript() {
    if (!script.trim()) return setNotice("कहानी उपलब्ध नहीं है।");
    const blob = new Blob([script], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    const u = URL.createObjectURL(blob);
    a.href = u;
    a.download = "hindi-story.txt";
    a.click();
    URL.revokeObjectURL(u);
  }

  function wrap(ctx, text, width) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = "";
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > width && line) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }

  function draw(ctx, scene, index) {
    const w = 1280, h = 720;
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#101a36");
    g.addColorStop(1, "#69427d");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#f3dca8";
    ctx.font = "bold 34px sans-serif";
    ctx.fillText("BHAGAT SINGH AI STUDIO", 60, 70);
    ctx.fillStyle = "white";
    ctx.font = "bold 48px sans-serif";
    ctx.fillText("दृश्य " + (index + 1), 60, 170);
    ctx.font = "30px sans-serif";
    wrap(ctx, scene.visual_description || "", 1120).slice(0, 5).forEach((line, i) => ctx.fillText(line, 60, 260 + i * 48));
    ctx.fillStyle = "#ffe7b8";
    wrap(ctx, scene.narration || "", 1120).slice(0, 3).forEach((line, i) => ctx.fillText(line, 60, 550 + i * 42));
  }

  async function exportVideo() {
    if (!scenes.length) return setNotice("पहले वीडियो के सीन तैयार करें।");
    const canvas = canvasRef.current;
    if (!canvas?.captureStream || !window.MediaRecorder) {
      return setNotice("आपके ब्राउज़र में वीडियो एक्सपोर्ट उपलब्ध नहीं है।");
    }
    setBusy(true);
    setProgress("वीडियो बनाया जा रहा है। पेज खुला रखें...");
    try {
      const ctx = canvas.getContext("2d");
      const stream = canvas.captureStream(25);
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      const chunks = [];
      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      const finished = new Promise((resolve, reject) => {
        recorder.onstop = resolve;
        recorder.onerror = () => reject(new Error("वीडियो रिकॉर्डिंग विफल हुई।"));
      });
      recorder.start();
      for (let i = 0; i < scenes.length; i++) {
        const seconds = Math.max(4, Math.min(15, Number(scenes[i].duration_seconds) || 7));
        const start = Date.now();
        while (Date.now() - start < seconds * 1000) {
          draw(ctx, scenes[i], i);
          setProgress(`वीडियो सीन ${i + 1} / ${scenes.length}`);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      recorder.stop();
      await finished;
      stream.getTracks().forEach(track => track.stop());
      const blob = new Blob(chunks, { type: "video/webm" });
      const a = document.createElement("a");
      const u = URL.createObjectURL(blob);
      a.href = u;
      a.download = "story-video.webm";
      a.click();
      setTimeout(() => URL.revokeObjectURL(u), 30000);
      setNotice("WebM वीडियो डाउनलोड शुरू हुआ। इसमें वॉइस शामिल नहीं है।");
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  async function login(mode) {
    if (!sb) return setNotice("Supabase लॉगिन सेटअप नहीं है।");
    const r = mode === "in"
      ? await sb.auth.signInWithPassword({ email, password: pass })
      : await sb.auth.signUp({ email, password: pass });
    if (r.error) return setNotice(r.error.message);
    if (mode === "in") {
      const { data } = await sb.auth.getSession();
      setSession(data.session);
    } else setNotice("ईमेल पुष्टि लिंक भेजा गया।");
  }

  const nav = [
    ["create", "Create Story", WandSparkles],
    ["projects", "My Projects", FolderOpen],
    ["voice", "Voice Studio", Mic],
    ["video", "Video Maker", Clapperboard],
    ["settings", "Settings", Settings]
  ];

  if (!session && sb) {
    return <div className="auth"><div className="authbox">
      <h1>STORY AI PRO</h1><p>लॉगिन या नया अकाउंट बनाएँ</p>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={pass} onChange={e => setPass(e.target.value)} />
      <button onClick={() => login("in")}>Login</button>
      <button onClick={() => login("up")}>Create account</button>
      <p>{notice}</p>
    </div></div>;
  }

  return <div className="app">
    <aside>
      <div className="logo"><WandSparkles /> STORY AI <b>PRO</b></div>
      <p className="workspace">WORKSPACE</p>
      {nav.map(([id, label, Icon]) => <button key={id} className={"nav " + (page === id ? "active" : "")} onClick={() => setPage(id)}><Icon size={18} /> {label}</button>)}
      <div className="sidebottom">
        <div className="credit"><Coins size={18} /><div><b>Free Workspace</b><small>AI Story Studio</small></div></div>
        {sb && session && <button className="nav" onClick={() => sb.auth.signOut()}><LogOut /> Sign out</button>}
      </div>
    </aside>

    <main>
      <header>
        <button className="menubtn" onClick={() => setMobile(!mobile)}><Menu /></button>
        <span>Workspace / {nav.find(n => n[0] === page)?.[1]}</span>
        <div className="avatar">{session?.user?.email?.[0]?.toUpperCase() || "G"}</div>
      </header>

      <section className="content" style={{ padding: 18 }}>
        <div className="welcome">
          <div><div className="eyebrow">AI STORY CREATION STUDIO</div><h1>{nav.find(n => n[0] === page)?.[1]}</h1><p>अपनी कहानी को वीडियो में बदलें।</p></div>
          <span className="pill">FREE AI STUDIO</span>
        </div>

        {page === "create" && <>
          <div className="panel" style={styles.panel}>
            <h2><WandSparkles /> Story Generator</h2>
            <label>कहानी का आइडिया या पूरी स्क्रिप्ट</label>
            <textarea style={{ ...styles.input, minHeight: 160 }} value={idea} onChange={e => setIdea(e.target.value)} placeholder="अपना आइडिया या पूरी तैयार कहानी यहाँ डालें..." />
            <div className="fields">
              <div><label>कहानी का प्रकार</label><select style={styles.input} value={genre} onChange={e => setGenre(e.target.value)}>{["Moral Story","Horror","Emotional Drama","Mystery","Historical","Motivational"].map(x => <option key={x}>{x}</option>)}</select></div>
              <div><label>वीडियो अवधि</label><select style={styles.input} value={duration} onChange={e => setDuration(e.target.value)}>{["1 मिनट","3–5 मिनट","8–10 मिनट","10–15 मिनट"].map(x => <option key={x}>{x}</option>)}</select></div>
            </div>
            <button style={{ ...styles.button, ...styles.primary }} disabled={busy} onClick={generateStory}><Sparkles size={18} /> {busy ? "बन रही है..." : "Generate Story"}</button>
            {progress && <p>{progress}</p>}
            {notice && <p>{notice}</p>}
          </div>

          <div className="panel" style={styles.panel}>
            <h2><BookOpen /> Generated Script</h2>
            <textarea style={{ ...styles.input, minHeight: 300 }} value={script} onChange={e => setScript(e.target.value)} placeholder="यहाँ अपनी स्क्रिप्ट डालें या AI से बनवाएँ..." />
            <button style={{ ...styles.button, ...styles.secondary }} onClick={saveProject}>Save</button>
            <button style={{ ...styles.button, ...styles.secondary }} onClick={downloadScript}><Download size={16} /> Download Script</button>
            <button style={{ ...styles.button, ...styles.primary }} onClick={() => speak()}><Play size={16} /> कहानी सुनें</button>
            <button style={{ ...styles.button, ...styles.secondary }} onClick={stopVoice}><Pause size={16} /> आवाज़ रोकें</button>
            <label>आवाज़ की गति</label>
            <select style={styles.input} value={rate} onChange={e => setRate(e.target.value)}><option value="0.75">धीमी</option><option value="0.9">सामान्य</option><option value="1.1">तेज़</option></select>
            <button style={{ ...styles.button, ...styles.primary }} disabled={busy} onClick={createScenes}><Film /> वीडियो के सीन बनाएँ</button>
          </div>
        </>}

        {page === "voice" && <div className="panel" style={styles.panel}>
          <h2><Mic /> Voice Studio</h2>
          <p>डिवाइस में उपलब्ध हिंदी आवाज़ का उपयोग करें।</p>
          <button style={{ ...styles.button, ...styles.primary }} onClick={() => speak()}>कहानी सुनें</button>
          <button style={{ ...styles.button, ...styles.secondary }} onClick={stopVoice}>रोकें</button>
          <p style={styles.muted}>यह ब्राउज़र की आवाज़ है। आवाज़ को MP3 में डाउनलोड करने की सुविधा शामिल नहीं है।</p>
        </div>}

        {page === "video" && <div className="panel" style={styles.panel}>
          <h2><Clapperboard /> Video Maker</h2>
          <p>कहानी के दृश्यों से एक सरल टेक्स्ट-आधारित वीडियो तैयार करें।</p>
          {!scenes.length ? <button style={{ ...styles.button, ...styles.primary }} onClick={createScenes} disabled={busy}>सीन बनाएँ</button> : <>
            <p>{scenes.length} सीन तैयार हैं।</p>
            {scenes.map((s, i) => <div key={i} style={styles.scene}>
              <b>सीन {i + 1} · {s.duration_seconds || 7} सेकंड</b>
              <p>{s.visual_description}</p>
              <p>{s.narration}</p>
            </div>)}
            <canvas ref={canvasRef} width="1280" height="720" style={{ width: "100%", borderRadius: 10, background: "#111", marginTop: 12 }} />
            <button style={{ ...styles.button, ...styles.primary }} disabled={busy} onClick={exportVideo}><Film /> वीडियो बनाएँ और डाउनलोड करें</button>
            <button style={{ ...styles.button, ...styles.secondary }} onClick={() => setPage("create")}>कहानी पर वापस जाएँ</button>
          </>}
          {progress && <p>{progress}</p>}
          {notice && <p>{notice}</p>}
        </div>}

        {page === "projects" && <div className="panel" style={styles.panel}>
          <h2><FolderOpen /> My Projects</h2>
          {projects.length ? projects.map(p => <div key={p.id} style={styles.scene}>
            <b>{p.title}</b><p>{p.genre}</p>
            <button style={{ ...styles.button, ...styles.secondary }} onClick={() => { setIdea(p.title); setScript(p.script); setScenes(p.scenes || []); setPage("create"); }}>Open</button>
          </div>) : <p>अभी कोई प्रोजेक्ट सेव नहीं है।</p>}
        </div>}

        {page === "settings" && <div className="panel" style={styles.panel}>
          <h2><Settings /> Settings</h2>
          <p>आपका स्टूडियो मुफ्त ब्राउज़र-आधारित टूल का उपयोग करता है।</p>
          <p>कहानी और सीन बनाने के लिए Gemini API की मुफ्त सीमा लागू हो सकती है।</p>
        </div>}

        {progress && page !== "video" && <p>{progress}</p>}
        {notice && page !== "create" && page !== "video" && <p>{notice}</p>}
        <footer>BHAGAT SINGH AI STUDIO · Create your story, scene by scene.</footer>
      </section>
    </main>
  </div>;
}

createRoot(document.getElementById("root")).render(<App />);
      
