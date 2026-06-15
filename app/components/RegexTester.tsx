"use client";
import { useState, useMemo, useCallback } from "react";

const PRESETS = [
  { name: "Email", pattern: "[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}", flags: "gi", sample: "Send to alice@example.com or bob.smith@corp.io and cc@test.org" },
  { name: "URL", pattern: "https?:\\/\\/[^\\s/$.?#].[^\\s]*", flags: "gi", sample: "Visit https://github.com or http://example.co.uk/path?q=1 for more" },
  { name: "IPv4", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", flags: "g", sample: "Server at 192.168.1.100 blocked, use 10.0.0.1 or 172.16.254.1" },
  { name: "Hex Color", pattern: "#[0-9a-fA-F]{3,6}\\b", flags: "gi", sample: "Colors: #fff, #6c63ff, #FF5733, #3498DB and #aabbcc" },
  { name: "Date (YYYY-MM-DD)", pattern: "\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])", flags: "g", sample: "Events on 2024-01-15, 2024-12-31, and invalid 2024-13-45" },
  { name: "Semantic Version", pattern: "\\bv?\\d+\\.\\d+\\.\\d+(?:-[\\w.]+)?\\b", flags: "g", sample: "Released v1.0.0, 2.3.1-beta.1, and 10.2.0 today" },
  { name: "Phone (US)", pattern: "\\(?\\d{3}\\)?[\\s.\\-]?\\d{3}[\\s.\\-]?\\d{4}", flags: "g", sample: "Call (555) 123-4567 or 800.555.1234 or 212-555-0198" },
  { name: "JWT Token", pattern: "ey[A-Za-z0-9_\\-]+\\.ey[A-Za-z0-9_\\-]+\\.[A-Za-z0-9_\\-]+", flags: "g", sample: "Token: eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.abc123_def456" },
];

interface MatchResult {
  match: string;
  index: number;
  end: number;
  groups: (string | undefined)[];
  namedGroups: Record<string, string | undefined> | null;
}

function buildSegments(text: string, matches: MatchResult[]) {
  const segments: { text: string; isMatch: boolean; matchIdx?: number }[] = [];
  let cursor = 0;
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    if (m.index > cursor) segments.push({ text: text.slice(cursor, m.index), isMatch: false });
    segments.push({ text: m.match, isMatch: true, matchIdx: i });
    cursor = m.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), isMatch: false });
  return segments;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default function RegexTester() {
  const [pattern, setPattern] = useState("(\\w+)@(\\w+\\.\\w+)");
  const [flags, setFlags] = useState({ g: true, i: false, m: false, s: false });
  const [testStr, setTestStr] = useState("Contact alice@example.com or support@corp.io for help.");
  const [replaceStr, setReplaceStr] = useState("[email: $1 at $2]");
  const [mode, setMode] = useState<"match" | "replace">("match");
  const [copied, setCopied] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<number | null>(null);

  const flagStr = Object.entries(flags)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join("");

  const { regex, error } = useMemo(() => {
    if (!pattern) return { regex: null, error: null };
    try {
      const f = flagStr.includes("g") ? flagStr : "g" + flagStr;
      return { regex: new RegExp(pattern, f), error: null };
    } catch (e) {
      return { regex: null, error: (e as Error).message };
    }
  }, [pattern, flagStr]);

  const matches = useMemo<MatchResult[]>(() => {
    if (!regex || !testStr) return [];
    const results: MatchResult[] = [];
    regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    let safety = 0;
    while ((m = regex.exec(testStr)) !== null && safety++ < 500) {
      results.push({
        match: m[0],
        index: m.index,
        end: m.index + m[0].length,
        groups: m.slice(1),
        namedGroups: m.groups ? { ...m.groups } : null,
      });
      if (m[0].length === 0) regex.lastIndex++;
    }
    return results;
  }, [regex, testStr]);

  const replaceResult = useMemo(() => {
    if (!regex || !testStr) return testStr;
    try {
      regex.lastIndex = 0;
      return testStr.replace(regex, replaceStr);
    } catch {
      return "Invalid replacement string";
    }
  }, [regex, testStr, replaceStr]);

  const segments = useMemo(() => buildSegments(testStr, matches), [testStr, matches]);

  const copyToClipboard = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  }, []);

  const applyPreset = (idx: number) => {
    const p = PRESETS[idx];
    setPattern(p.pattern);
    const newFlags = { g: false, i: false, m: false, s: false };
    for (const f of p.flags.split("")) {
      if (f in newFlags) (newFlags as Record<string,boolean>)[f] = true;
    }
    setFlags(newFlags);
    setTestStr(p.sample);
    setActivePreset(idx);
  };

  const toggleFlag = (f: keyof typeof flags) => {
    if (f === "g") return; // always global for match display
    setFlags((prev) => ({ ...prev, [f]: !prev[f] }));
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", padding: "0" }}>
      {/* Header */}
      <header style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: 36, height: 36,
            background: "var(--accent)",
            borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>⚡</div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.5px" }}>regexcraft</h1>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>regex tester for humans</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {(["match", "replace"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: "6px 16px",
                borderRadius: 6,
                border: "1px solid",
                borderColor: mode === m ? "var(--accent)" : "var(--border)",
                background: mode === m ? "var(--accent-glow)" : "transparent",
                color: mode === m ? "var(--accent)" : "var(--text-muted)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
                transition: "all 0.15s",
              }}
            >
              {m === "match" ? "✦ Match" : "↺ Replace"}
            </button>
          ))}
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Pattern bar */}
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--text-muted)", fontSize: 18, fontFamily: "monospace", userSelect: "none" }}>/</span>
            <input
              value={pattern}
              onChange={(e) => { setPattern(e.target.value); setActivePreset(null); }}
              placeholder="Enter regex pattern..."
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: error ? "var(--error)" : "var(--accent)",
                fontSize: 18,
                fontFamily: "monospace",
                fontWeight: 600,
              }}
            />
            <span style={{ color: "var(--text-muted)", fontSize: 18, fontFamily: "monospace", userSelect: "none" }}>/</span>
            <span style={{ color: "var(--accent)", fontSize: 16, fontFamily: "monospace", minWidth: 32 }}>{flagStr}</span>
          </div>

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 12,
              color: "var(--error)",
              fontFamily: "monospace",
            }}>
              ⚠ {error}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Flags:</span>
            {(["g", "i", "m", "s"] as const).map((f) => (
              <button
                key={f}
                onClick={() => toggleFlag(f)}
                title={f === "g" ? "global (always on)" : f === "i" ? "case insensitive" : f === "m" ? "multiline" : "dotAll"}
                style={{
                  padding: "3px 10px",
                  borderRadius: 4,
                  border: "1px solid",
                  borderColor: flags[f] ? "var(--accent)" : "var(--border)",
                  background: flags[f] ? "var(--accent-glow)" : "transparent",
                  color: flags[f] ? "var(--accent)" : "var(--text-muted)",
                  cursor: f === "g" ? "default" : "pointer",
                  fontSize: 13,
                  fontFamily: "monospace",
                  fontWeight: 600,
                  opacity: f === "g" ? 0.6 : 1,
                }}
              >
                {f}
              </button>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              {!error && matches.length > 0 && (
                <span style={{
                  background: "rgba(108,99,255,0.15)",
                  color: "var(--accent)",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: 99,
                  border: "1px solid rgba(108,99,255,0.3)",
                }}>
                  {matches.length} match{matches.length !== 1 ? "es" : ""}
                </span>
              )}
              {!error && testStr && matches.length === 0 && pattern && (
                <span style={{
                  background: "rgba(239,68,68,0.1)",
                  color: "var(--error)",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: 99,
                  border: "1px solid rgba(239,68,68,0.3)",
                }}>
                  no match
                </span>
              )}
              <button
                onClick={() => copyToClipboard(`/${pattern}/${flagStr}`, "regex")}
                style={{
                  padding: "3px 12px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: copied === "regex" ? "var(--green)" : "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                {copied === "regex" ? "✓ copied" : "copy regex"}
              </button>
            </div>
          </div>
        </div>

        {/* Presets */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>Presets:</span>
          {PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => applyPreset(i)}
              style={{
                padding: "4px 12px",
                borderRadius: 6,
                border: "1px solid",
                borderColor: activePreset === i ? "var(--accent)" : "var(--border)",
                background: activePreset === i ? "var(--accent-glow)" : "var(--surface)",
                color: activePreset === i ? "var(--accent)" : "var(--text-muted)",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 500,
                transition: "all 0.12s",
              }}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Test string */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <div style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px 12px 0 0",
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid var(--border)",
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Test String</span>
              <button
                onClick={() => copyToClipboard(testStr, "test")}
                style={{ fontSize: 11, color: copied === "test" ? "var(--green)" : "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
              >
                {copied === "test" ? "✓ copied" : "copy"}
              </button>
            </div>
            <textarea
              value={testStr}
              onChange={(e) => setTestStr(e.target.value)}
              placeholder="Paste or type your test string here..."
              rows={8}
              style={{
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderTop: "none",
                borderRadius: mode === "replace" ? "0" : "0 0 12px 12px",
                padding: "14px 16px",
                color: "var(--text)",
                fontSize: 14,
                fontFamily: "monospace",
                resize: "vertical",
                outline: "none",
                lineHeight: 1.6,
                width: "100%",
              }}
            />
            {mode === "replace" && (
              <>
                <div style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderTop: "none",
                  padding: "10px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>Replace with</span>
                  <input
                    value={replaceStr}
                    onChange={(e) => setReplaceStr(e.target.value)}
                    placeholder="$1, $2, $&, $` ..."
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "var(--accent)",
                      fontSize: 14,
                      fontFamily: "monospace",
                    }}
                  />
                </div>
                <div style={{
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderTop: "none",
                  borderRadius: "0 0 12px 12px",
                  padding: "14px 16px",
                  fontSize: 14,
                  fontFamily: "monospace",
                  lineHeight: 1.6,
                  color: "var(--green)",
                  minHeight: 80,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}>
                  {replaceResult}
                </div>
              </>
            )}
          </div>

          {/* Match preview / results */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <div style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px 12px 0 0",
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid var(--border)",
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {mode === "match" ? "Match Preview" : "Result"}
              </span>
              {mode === "replace" && (
                <button
                  onClick={() => copyToClipboard(replaceResult, "result")}
                  style={{ fontSize: 11, color: copied === "result" ? "var(--green)" : "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
                >
                  {copied === "result" ? "✓ copied" : "copy"}
                </button>
              )}
            </div>

            {mode === "match" ? (
              <div style={{
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderTop: "none",
                borderRadius: "0 0 12px 12px",
                padding: "14px 16px",
                fontSize: 14,
                fontFamily: "monospace",
                lineHeight: 1.6,
                minHeight: 120,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}>
                {segments.length === 0 && <span style={{ color: "var(--text-muted)" }}>{testStr || "Enter a test string..."}</span>}
                {segments.map((seg, i) =>
                  seg.isMatch ? (
                    <mark
                      key={i}
                      title={`match #${(seg.matchIdx ?? 0) + 1} at ${matches[seg.matchIdx ?? 0]?.index}`}
                      style={{
                        background: "rgba(251,191,36,0.22)",
                        color: "#fbbf24",
                        border: "1px solid rgba(251,191,36,0.5)",
                        borderRadius: 3,
                        padding: "0 1px",
                        cursor: "default",
                      }}
                    >
                      {seg.text}
                    </mark>
                  ) : (
                    <span key={i}>{seg.text}</span>
                  )
                )}
              </div>
            ) : (
              <div style={{
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderTop: "none",
                borderRadius: "0 0 12px 12px",
                padding: "14px 16px",
                fontSize: 13,
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 120,
              }}>
                <span>← See result on left</span>
              </div>
            )}
          </div>
        </div>

        {/* Match details */}
        {mode === "match" && matches.length > 0 && (
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            overflow: "hidden",
          }}>
            <div style={{
              padding: "10px 20px",
              borderBottom: "1px solid var(--border)",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>
              Match Details
            </div>
            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              {matches.map((m, i) => (
                <div
                  key={i}
                  style={{
                    padding: "12px 20px",
                    borderBottom: i < matches.length - 1 ? "1px solid var(--border)" : "none",
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: "12px",
                    alignItems: "start",
                  }}
                >
                  <span style={{
                    background: "var(--accent-glow)",
                    color: "var(--accent)",
                    border: "1px solid rgba(108,99,255,0.3)",
                    borderRadius: 4,
                    padding: "2px 8px",
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: "monospace",
                    whiteSpace: "nowrap",
                  }}>
                    {i + 1}
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <code style={{
                      color: "#fbbf24",
                      background: "rgba(251,191,36,0.1)",
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontSize: 14,
                      wordBreak: "break-all",
                    }}>
                      {m.match || "(empty)"}
                    </code>
                    {m.groups.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
                        {m.groups.map((g, gi) => (
                          <span key={gi} style={{
                            fontSize: 11,
                            fontFamily: "monospace",
                            color: "var(--text-muted)",
                            background: "var(--surface2)",
                            padding: "1px 6px",
                            borderRadius: 3,
                            border: "1px solid var(--border)",
                          }}>
                            ${gi + 1}: {g !== undefined ? `"${g}"` : "undefined"}
                          </span>
                        ))}
                        {m.namedGroups && Object.entries(m.namedGroups).map(([name, val]) => (
                          <span key={name} style={{
                            fontSize: 11,
                            fontFamily: "monospace",
                            color: "var(--accent)",
                            background: "var(--surface2)",
                            padding: "1px 6px",
                            borderRadius: 3,
                            border: "1px solid rgba(108,99,255,0.2)",
                          }}>
                            ?&lt;{name}&gt;: {val !== undefined ? `"${val}"` : "undefined"}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                    {m.index}–{m.end}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick reference */}
        <details style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
        }}>
          <summary style={{
            padding: "12px 20px",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-muted)",
            userSelect: "none",
            listStyle: "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span>₸</span> Quick Reference
          </summary>
          <div style={{
            padding: "16px 20px",
            borderTop: "1px solid var(--border)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "8px 24px",
          }}>
            {[
              [".", "Any character except newline"],
              ["\\d", "Digit [0-9]"],
              ["\\w", "Word char [a-zA-Z0-9_]"],
              ["\\s", "Whitespace"],
              ["\\b", "Word boundary"],
              ["^", "Start of string/line"],
              ["$", "End of string/line"],
              ["*", "0 or more (greedy)"],
              ["+", "1 or more (greedy)"],
              ["?", "0 or 1 (optional)"],
              ["{n,m}", "Between n and m times"],
              ["[abc]", "Character class"],
              ["[^abc]", "Negated class"],
              ["(abc)", "Capture group"],
              ["(?:abc)", "Non-capture group"],
              ["a|b", "Alternation (a or b)"],
              ["(?=...)", "Positive lookahead"],
              ["(?!...)", "Negative lookahead"],
              ["$1, $2", "Backreference in replace"],
              ["$&", "Whole match in replace"],
            ].map(([sym, desc]) => (
              <div key={sym} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                <code style={{ color: "var(--accent)", fontFamily: "monospace", fontSize: 13, minWidth: 70, flexShrink: 0 }}>{sym}</code>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{desc}</span>
              </div>
            ))}
          </div>
        </details>

        <footer style={{ textAlign: "center", padding: "8px 0 24px", fontSize: 12, color: "var(--text-muted)" }}>
          built on a saturday night · regexcraft · client-side, zero tracking
        </footer>
      </div>
    </div>
  );
}
