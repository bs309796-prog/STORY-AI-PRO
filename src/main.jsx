
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import {
  WandSparkles,
  Clapperboard,
  BookOpen,
  Mic,
  FolderOpen,
  Settings,
  LogOut,
  Menu,
  Download,
  Sparkles,
  UserRound,
  Coins
} from "lucide-react";
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
  const [length, setLength] = useState("8–10 मिनट");
  const [script, setScript] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [projects, setProjects] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sap-projects") || "[]");
    } catch {
      return [];
    }
  });
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    if (!sb) return;

    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data } = sb.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function auth(mode) {
    if (!sb) {
      setNotice("लॉगिन सुविधा अभी सेटअप नहीं है।");
      return;
    }

    const result =
      mode === "in"
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

    setNotice(
      mode === "in"
        ? "लॉगिन सफल हुआ।"
        : "ईमेल पर पुष्टि लिंक भेजा गया।"
    );

    if (mode === "in") {
      const { data } = await sb.auth.getSession();
      setSession(data.session);
    }
  }

  async function generate() {
    if (!idea.trim()) {
      setNotice("पहले अपनी कहानी का आइडिया लिखें।");
      return;
    }

    setBusy(true);
    setNotice("");
    setScript("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        cache: "no-store",
        body: JSON.stringify({
          idea: idea.trim(),
          storyType: genre,
          duration: length
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "कहानी बनाने में समस्या आई।"
        );
      }

      const result = data.story || data.text;

      if (!result) {
        throw new Error("AI से कहानी नहीं मिली।");
      }

      setScript(result);
      setNotice("आपकी कहानी तैयार हो गई है!");
    } catch (error) {
      setNotice(
        error.message || "कुछ गड़बड़ हुई। दोबारा कोशिश करें।"
      );
    } finally {
      setBusy(false);
    }
  }

  function save() {
    if (!script) {
      setNotice("पहले कहानी तैयार करें।");
      return;
    }

    const next = [
      {
        id: Date.now(),
        title: idea.slice(0, 42) || "मेरी कहानी",
        genre,
        script
      },
      ...projects
    ];

    setProjects(next);
    localStorage.setItem("sap-projects", JSON.stringify(next));
    setNotice("प्रोजेक्ट इस ब्राउज़र में सेव हो गया।");
  }

  function download() {
    if (!script) {
      setNotice("डाउनलोड करने के लिए पहले कहानी बनाएं।");
      return;
    }

    const blob = new Blob([script], {
      type: "text/plain;charset=utf-8"
    });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "story-ai-pro-script.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const nav = [
    ["create", "Create Story", WandSparkles],
    ["projects", "My Projects", FolderOpen],
    ["characters", "Characters", UserRound],
    ["voice", "Voice Studio", Mic],
    ["video", "Video Maker", Clapperboard],
    ["settings", "Settings", Settings]
  ];

  if (!session && sb) {
    return (
      <div className="auth">
        <div className="authbox">
          <div className="logo big">
            <WandSparkles /> STORY AI PRO
          </div>

          <h1>अपनी कहानी को वीडियो में बदलें</h1>
          <p>लॉगिन या नया अकाउंट बनाएँ</p>

          <input
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            placeholder="Password (कम से कम 6 अक्षर)"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />

          <button onClick={() => auth("in")}>Login</button>
          <button
            className="secondary"
            onClick={() => auth("up")}
          >
            Create account
          </button>

          <small>{notice}</small>
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
              <b>Free workspace</b>
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
            <Menu />
          </button>

          <div>
            <span className="muted">Workspace /</span>{" "}
            {nav.find((item) => item[0] === page)?.[1]}
          </div>

          <div className="avatar">
            {session?.user?.email?.[0]?.toUpperCase() || "G"}
          </div>
        </header>

        <section className="content">
          <div className="welcome">
            <div>
              <div className="eyebrow">
                AI STORY CREATION STUDIO
              </div>

              <h1>
                {page === "create"
                  ? "Create something unforgettable"
                  : nav.find((item) => item[0] === page)?.[1]}
              </h1>

              <p>
                अपना आइडिया लिखें और कहानी की शुरुआत करें।
              </p>
            </div>

            <span className="pill">
              <span /> {sb ? "Connected mode" : "AI Studio"}
            </span>
          </div>

          {page === "create" ? (
            <>
              <div className="panel">
                <div className="paneltitle">
                  <div className="round">
                    <WandSparkles />
                  </div>

                  <div>
                    <h2>Story Generator</h2>
                    <p>अपनी कहानी का आइडिया बताइए</p>
                  </div>
                </div>

                <label>कहानी का आइडिया</label>

                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="उदाहरण: अमीर बाप की बिगड़ी हुई औलाद..."
                />

                <div className="fields">
                  <div>
                    <label>कहानी का प्रकार</label>

                    <select
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                    >
                      {[
                        "Moral Story",
                        "Horror",
                        "Emotional Drama",
                        "Mystery",
                        "Historical",
                        "Motivational"
                      ].map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>वीडियो की अवधि</label>

                    <select
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                    >
                      <option>1 मिनट</option>
                      <option>3–5 मिनट</option>
                      <option>8–10 मिनट</option>
                      <option>10–15 मिनट</option>
                    </select>
                  </div>
                </div>

                <button
                  className="primary"
                  onClick={generate}
                  disabled={busy}
                >
                  <Sparkles size={18} />
                  {busy ? "कहानी बन रही है..." : "Generate Story"}
                </button>

                {notice && (
                  <p className="notice">{notice}</p>
                )}
              </div>

              <div className="panel result">
                <div className="resulthead">
                  <div>
                    <h2>
                      <BookOpen size={19} /> Generated Script
                    </h2>
                    <p>अपनी स्क्रिप्ट सेव करें या डाउनलोड करें</p>
                  </div>

                  <div className="actions">
                    <button className="secondary" onClick={save}>
                      Save
                    </button>

                    <button
                      className="secondary"
                      onClick={download}
                    >
                      <Download size={16} /> Download
                    </button>
                  </div>
                </div>

                <textarea
                  className="output"
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="आपकी तैयार AI कहानी यहाँ दिखाई देगी..."
                />
              </div>
            </>
          ) : page === "projects" ? (
            <div className="panel">
              <h2>Saved projects</h2>

              {projects.length ? (
                projects.map((project) => (
                  <div className="project" key={project.id}>
                    <div>
                      <b>{project.title}</b>
                      <small>{project.genre}</small>
                    </div>

                    <button
                      className="secondary"
                      onClick={() => {
                        setIdea(project.title);
                        setScript(project.script);
                        setPage("create");
                      }}
                    >
                      Open
                    </button>
                  </div>
                ))
              ) : (
                <p className="muted">
                  अभी कोई प्रोजेक्ट सेव नहीं है।
                </p>
              )}
            </div>
          ) : (
            <div className="panel coming">
              <div className="round">
                <Clapperboard />
              </div>

              <h2>
                {nav.find((item) => item[0] === page)?.[1]} is coming next
              </h2>

              <p>
                इस मॉड्यूल का इंटरफेस तैयार किया जाएगा।
                अभी यह सुविधा चालू नहीं है।
              </p>

              <small>
                अगला चरण: consistent character images,
                Hindi voiceover और MP4 video rendering जोड़ना।
              </small>
            </div>
          )}

          <footer>
            BHAGAT SINGH AI STUDIO · Build your story, scene by scene.
          </footer>
        </section>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
