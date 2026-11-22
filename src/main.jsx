import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import {
  WandSparkles, Clapperboard, BookOpen, Mic, FolderOpen,
  Settings, LogOut, Menu, Download, Sparkles, Play,
  Pause, Film, Coins, X
} from "lucide-react";
import "./style.css";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const sb = url && key ? createClient(url, key) : null;

const panelStyle = {
  background: "#191c29",
  border: "1px solid #34394b",
  borderRadius: 14,
  padding: 18,
  marginBottom: 18
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: 13,
  borderRadius: 9,
  border: "1px solid #50566a",
  background: "#11131c",
  color: "white",
  margin: "8px 0 15px"
};

const primaryStyle = {
  background: "#7656e8",
  color: "white",
  border: 0,
  borderRadius: 9,
  padding: "12px 17px",
  margin: 5,
  cursor: "pointer"
};

const secondaryStyle = {
  background: "#303648",
  color: "white",
  border: 0,
  borderRadius: 9,
  padding: "12px 17px",
  margin: 5,
  cursor: "pointer"
};

function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [page, setPage] = useState("create");
  const [mobile, setMobile] = useState(false);
  const [idea, setIdea] = useState("");
  const [genre, setGenre] = useState("Moral Story");
  const [duration, setDuration] = useState("8–10 मिनट");
  const [script, setScript] = useState("");
  const [scenes, setScenes] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [notice, setNotice] = useState("");
  const [rate, setRate] = useState("0.9");
  const [projects, setProjects] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sap-projects") || "[]");
    } catch {
      return [];
    }
  });

  const canvasRef = useRef(null);

  useEffect(() => {
    if (!sb) return;

    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data } = sb.auth.onAuthStateChange((_event, value) => {
      setSession(value);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  async function callAPI(payload) {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "AI सर्वर में समस्या आई।");
    }

    return data;
  }

  async function generateStory() {
    if (!idea.trim()) {
      setNotice("पहले कहानी का आइडिया लिखें।");
      return;
    }

    setBusy(true);
    setNotice("");
    setProgress("AI आपकी कहानी तैयार कर रहा है...");
    setScript("");
    setScenes([]);

    try {
      const data = await callAPI({
        action: "story",
        idea: idea.trim(),
        storyType: genre,
        duration
      });

      const result = data.story || data.text;

      if (!result) {
        throw new Error("AI से कहानी नहीं मिली।");
      }

      setScript(result);
      setNotice("आपकी कहानी तैयार हो गई है!");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  async function createScenes() {
    if (!script.trim()) {
      setNotice("पहले कहानी तैयार करें या अपनी स्क्रिप्ट डालें।");
      return;
    }

    setBusy(true);
    setNotice("");
    setProgress("AI कहानी को वीडियो के दृश्यों में बाँट रहा है...");

    try {
      const data = await callAPI({
        action: "scenes",
        idea: script
      });

      if (!Array.isArray(data.scenes) || !data.scenes.length) {
        throw new Error("वीडियो के सीन तैयार नहीं हुए।");
      }

      setScenes(data.scenes);
      setPage("video");
      setNotice(`${data.scenes.length} सीन तैयार हो गए हैं।`);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  function speak(text) {
    const content = text || script;

    if (!content.trim()) {
      setNotice("पहले कहानी तैयार करें।");
      return;
    }

    if (!("speechSynthesis" in window)) {
      setNotice("इस ब्राउज़र में हिंदी आवाज़ उपलब्ध नहीं है।");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = "hi-IN";
    utterance.rate = Number(rate);

    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v =>
      v.lang.toLowerCase().startsWith("hi")
    );

    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }

    window.speechSynthesis.speak(utterance);
    setNotice("हिंदी आवाज़ शुरू की गई।");
  }

  function stopVoice() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setNotice("आवाज़ रोक दी गई।");
  }

  function saveProject() {
    if (!script.trim()) {
      setNotice("पहले कहानी तैयार करें।");
      return;
    }

    const item = {
      id: Date.now(),
      title: idea.slice(0, 50) || "मेरी कहानी",
      genre,
      script,
      scenes
    };

    const next = [item, ...projects];

    setProjects(next);
    localStorage.setItem("sap-projects", JSON.stringify(next));
    setNotice("प्रोजेक्ट सेव हो गया।");
  }

  function downloadText() {
    if (!script.trim()) {
      setNotice("पहले कहानी तैयार करें।");
      return;
    }

    const blob = new Blob([script], {
      type: "text/plain;charset=utf-8"
    });

    const a = document.createElement("a");
    const link = URL.createObjectURL(blob);

    a.href = link;
    a.download = "bhagat-singh-story.txt";
    a.click();

    URL.revokeObjectURL(link);
  }

  function wrapText(ctx, text, maxWidth) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = "";

    for (const word of words) {
      const test = line ? line + " " + word : word;

      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }

    if (line) lines.push(line);
    return lines;
  }

  function drawScene(ctx, scene, index) {
    const w = 1280;
    const h = 720;

    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, "#10172e");
    gradient.addColorStop(1, "#624477");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#f5dca8";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText("BHAGAT SINGH AI STUDIO", 60, 65);

    ctx.fillStyle = "white";
    ctx.font = "bold 48px sans-serif";
    ctx.fillText("दृश्य " + (index + 1), 60, 160);

    ctx.font = "29px sans-serif";

    wrapText(
      ctx,
      scene.visual_description || "कहानी का दृश्य",
      1120
    ).slice(0, 5).forEach((line, i) => {
      ctx.fillText(line, 60, 245 + i * 48);
    });

    ctx.fillStyle = "#ffe5b4";
    ctx.font = "27px sans-serif";

    wrapText(
      ctx,
      scene.narration || "",
      1120
    ).slice(0, 3).forEach((line, i) => {
      ctx.fillText(line, 60, 545 + i * 42);
    });
  }

  async function exportVideo() {
    if (!scenes.length) {
      setNotice("पहले वीडियो के सीन बनाएँ।");
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas || !canvas.captureStream || !window.MediaRecorder) {
      setNotice("आपके ब्राउज़र में वीडियो एक्सपोर्ट उपलब्ध नहीं है।");
      return;
    }

    setBusy(true);
    setProgress("वीडियो तैयार हो रहा है। पेज खुला रखें...");

    try {
      const ctx = canvas.getContext("2d");
      const stream = canvas.captureStream(25);

      const mime = MediaRecorder.isTypeSupported(
        "video/webm;codecs=vp9"
      )
        ? "video/webm;codecs=vp9"
        : "video/webm";

      const recorder = new MediaRecorder(stream, {
        mimeType: mime
      });

      const chunks = [];

      recorder.ondataavailable = event => {
        if (event.data && event.data.size) {
          chunks.push(event.data);
        }
      };

      const finished = new Promise((resolve, reject) => {
        recorder.onstop = resolve;
        recorder.onerror = () => reject(
          new Error("वीडियो रिकॉर्ड नहीं हो सका।")
        );
      });

      recorder.start();

      for (let i = 0; i < scenes.length; i++) {
        const seconds = Math.max(
          4,
          Math.min(15, Number(scenes[i].duration_seconds) || 7)
        );

        const start = Date.now();

        while (Date.now() - start < seconds * 1000) {
          drawScene(ctx, scenes[i], i);

          setProgress(
            `वीडियो तैयार हो रहा है: दृश्य ${i + 1} / ${scenes.length}`
          );

          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      recorder.stop();
      await finished;

      stream.getTracks().forEach(track => track.stop());

      const blob = new Blob(chunks, {
        type: "video/webm"
      });

      const a = document.createElement("a");
      const link = URL.createObjectURL(blob);

      a.href = link;
      a.download = "bhagat-singh-story-video.webm";
      a.click();

      setTimeout(() => URL.revokeObjectURL(link), 30000);

      setNotice(
        "वीडियो डाउनलोड शुरू हुआ। यह WebM वीडियो है, इसमें हिंदी आवाज़ शामिल नहीं है।"
      );
    } catch (error) {
      setNotice(error.message || "वीडियो बनाने में समस्या आई।");
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  async function login(mode) {
    if (!sb) {
      setNotice("Supabase लॉगिन सेटअप नहीं है।");
      return;
    }

    const result = mode === "in"
      ? await sb.auth.signInWithPassword({
          email,
          password: pass
        })
      : await sb.auth.signUp({
          email,
          password: pass
        });

    if (result.error) {
      setNotice(result.error.message);
      return;
    }

    if (mode === "in") {
      const { data } = await sb.auth.getSession();
      setSession(data.session);
      setNotice("लॉगिन सफल हुआ।");
    } else {
      setNotice("ईमेल पुष्टि लिंक भेजा गया।");
    }
  }

  const nav = [
    ["create", "Create Story", WandSparkles],
    ["projects", "My Projects", FolderOpen],
    ["voice", "Voice Studio", Mic],
    ["video", "Video Maker", Clapperboard],
    ["settings", "Settings", Settings]
  ];

  if (!session && sb) {
    return (
      <div className="auth">
        <div className="authbox">
          <h1>STORY AI PRO</h1>
          <p>लॉगिन या नया अकाउंट बनाएँ</p>

          <input
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={pass}
            onChange={e => setPass(e.target.value)}
          />

          <button onClick={() => login("in")}>Login</button>
          <button onClick={() => login("up")}>Create account</button>

          <p>{notice}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className={mobile ? "show" : ""}>
        <div className="logo">
          <WandSparkles /> STORY AI <b>PRO</b>
        </div>

        <div className="workspace">WORKSPACE</div>

        {nav.map(([id, label, Icon]) => (
          <button
            key={id}
            className={"nav " + (page === id ? "active" : "")}
            onClick={() => {
              setPage(id);
              setMobile(false);
            }}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}

        <div className="sidebottom">
          <div className="credit">
            <Coins size={18} />
            <div>
              <b>Free Workspace</b>
              <small>AI Story Studio</small>
            </div>
          </div>

          {sb && session && (
            <button
              className="nav"
              onClick={() => sb.auth.signOut()}
            >
              <LogOut size={18} /> Sign out
            </button>
          )}
        </div>
      </aside>

      <main>
        <header>
          <button
            className="menubtn"
            onClick={() => setMobile(!mobile)}
          >
            {mobile ? <X /> : <Menu />}
          </button>

          <span>
            Workspace / {nav.find(n => n[0] === page)?.[1]}
          </span>

          <div className="avatar">
            {session?.user?.email?.[0]?.toUpperCase() || "G"}
          </div>
        </header>

        <section className="content" style={{ padding: 18 }}>
          <div className="welcome">
            <div>
              <div className="eyebrow">AI STORY CREATION STUDIO</div>
              <h1>{nav.find(n => n[0] === page)?.[1]}</h1>
              <p>अपनी कहानी को वीडियो में बदलें।</p>
            </div>
            <span className="pill">FREE AI STUDIO</span>
          </div>

          {page === "create" && (
            <>
              <div className="panel" style={panelStyle}>
                <h2><WandSparkles /> Story Generator</h2>

                <label>कहानी का आइडिया या पूरी स्क्रिप्ट</label>

                <textarea
                  style={{ ...inputStyle, minHeight: 160 }}
                  value={idea}
                  onChange={e => setIdea(e.target.value)}
                  placeholder="अपना आइडिया या पूरी कहानी यहाँ डालें..."
                />

                <div className="fields">
                  <div>
                    <label>कहानी का प्रकार</label>
                    <select
                      style={inputStyle}
                      value={genre}
                      onChange={e => setGenre(e.target.value)}
                    >
                      {[
                        "Moral Story",
                        "Horror",
                        "Emotional Drama",
                        "Mystery",
                        "Historical",
                        "Motivational"
                      ].map(item => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>वीडियो अवधि</label>
                    <select
                      style={inputStyle}
                      value={duration}
                      onChange={e => setDuration(e.target.value)}
                    >
                      {[
                        "1 मिनट",
                        "3–5 मिनट",
                        "8–10 मिनट",
                        "10–15 मिनट"
                      ].map(item => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  style={primaryStyle}
                  disabled={busy}
                  onClick={generateStory}
                >
                  <Sparkles size={17} />
                  {busy ? "कहानी बन रही है..." : "Generate Story"}
                </button>

                {progress && <p>{progress}</p>}
                {notice && <p>{notice}</p>}
              </div>

              <div className="panel" style={panelStyle}>
                <h2><BookOpen /> Generated Script</h2>

                <textarea
                  style={{ ...inputStyle, minHeight: 300 }}
                  value={script}
                  onChange={e => setScript(e.target.value)}
                  placeholder="यहाँ कहानी तैयार होगी या अपनी स्क्रिप्ट डालें..."
                />

                <button style={secondaryStyle} onClick={saveProject}>
                  Save
                </button>

                <button style={secondaryStyle} onClick={downloadText}>
                  <Download size={16} /> Download Script
                </button>

                <button
                  style={primaryStyle}
                  onClick={() => speak(script)}
                >
                  <Play size={16} /> कहानी सुनें
                </button>

                <button style={secondaryStyle} onClick={stopVoice}>
                  <Pause size={16} /> आवाज़ रोकें
                </button>

                <label>आवाज़ की गति</label>
                <select
                  style={inputStyle}
                  value={rate}
                  onChange={e => setRate(e.target.value)}
                >
                  <option value="0.75">धीमी</option>
                  <option value="0.9">सामान्य</option>
                  <option value="1.1">तेज़</option>
                </select>

                <button
                  style={primaryStyle}
                  disabled={busy}
                  onClick={createScenes}
                >
                  <Film size={17} /> वीडियो के सीन बनाएँ
                </button>
              </div>
            </>
          )}

          {page === "voice" && (
            <div className="panel" style={panelStyle}>
              <h2><Mic /> Voice Studio</h2>
              <p>डिवाइस में उपलब्ध हिंदी आवाज़ से कहानी सुनें।</p>

              <button
                style={primaryStyle}
                onClick={() => speak(script)}
              >
                <Play size={16} /> कहानी सुनें
              </button>

              <button style={secondaryStyle} onClick={stopVoice}>
                <Pause size={16} /> रोकें
              </button>

              <p>
                यह ब्राउज़र की आवाज़ है। यह MP3 फाइल नहीं बनाती और वीडियो में अपने आप नहीं जुड़ती।
              </p>
            </div>
          )}

          {page === "video" && (
            <div className="panel" style={panelStyle}>
              <h2><Clapperboard /> Video Maker</h2>

              <p>
                कहानी के सीन से टेक्स्ट-आधारित वीडियो बनाएँ।
              </p>

              {!scenes.length ? (
                <button
                  style={primaryStyle}
                  onClick={createScenes}
                  disabled={busy}
                >
                  सीन बनाएँ
                </button>
              ) : (
                <>
                  <p>{scenes.length} सीन तैयार हैं।</p>

                  {scenes.map((scene, index) => (
                    <div
                      key={index}
                      style={{
                        ...panelStyle,
                        background: "#252b40"
                      }}
                    >
                      <b>सीन {index + 1}</b>
                      <p>{scene.visual_description}</p>
                      <p>{scene.narration}</p>

                      <button
                        style={secondaryStyle}
                        onClick={() => speak(scene.narration)}
                      >
                        <Play size={15} /> यह सीन सुनें
                      </button>
                    </div>
                  ))}

                  <canvas
                    ref={canvasRef}
                    width="1280"
                    height="720"
                    style={{
                      width: "100%",
                      borderRadius: 10,
                      background: "#111",
                      marginTop: 12
                    }}
                  />

                  <button
                    style={primaryStyle}
                    disabled={busy}
                    onClick={exportVideo}
                  >
                    <Film size={17} /> वीडियो बनाएँ और डाउनलोड करें
                  </button>

                  <button
                    style={secondaryStyle}
            
