"use client";

import { useEffect, useState } from "react";
import { AskAITab } from "@/components/AskAITab";

// Dedicated card id for the LaTeX visual test so it cannot collide with
// real study history.
const TEST_CARD_ID = "__latex-visual-test__";
const HISTORY_KEY = `study-recap:ask-ai:history:${TEST_CARD_ID}`;

const SAMPLE_HISTORY = [
  {
    role: "user",
    content: "Show me some inline and display math so I can confirm rendering.",
  },
  {
    role: "assistant",
    content: [
      "Here are a few examples that exercise inline and display math:",
      "",
      "**Inline math**",
      "",
      "- The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$.",
      "- Euler's identity: $e^{i\\pi} + 1 = 0$.",
      "- A Greek mix: $\\alpha + \\beta = \\gamma$ with $\\sigma^2$ variance.",
      "",
      "**Display math**",
      "",
      "The Gaussian integral:",
      "",
      "$$\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}$$",
      "",
      "A 2x2 matrix:",
      "",
      "$$A = \\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}$$",
      "",
      "Summation:",
      "",
      "$$\\sum_{n=1}^{N} n = \\frac{N(N+1)}{2}$$",
      "",
      "**Mixed with other markdown**",
      "",
      "| Symbol | Meaning |",
      "| --- | --- |",
      "| $\\mu$ | Mean |",
      "| $\\sigma$ | Standard deviation |",
      "| $\\chi^2$ | Chi-squared |",
      "",
      "Regular code still works: `const x = 1;` alongside $y = x^2$.",
    ].join("\n"),
  },
  {
    role: "user",
    content: "What about a long equation that might overflow?",
  },
  {
    role: "assistant",
    content: [
      "A wide expression should scroll horizontally instead of breaking the layout:",
      "",
      "$$f(x) = a_0 + a_1 x + a_2 x^2 + a_3 x^3 + a_4 x^4 + a_5 x^5 + a_6 x^6 + a_7 x^7 + a_8 x^8 + a_9 x^9 + a_{10} x^{10}$$",
    ].join("\n"),
  },
];

export default function LatexTestPage() {
  const [seeded, setSeeded] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(SAMPLE_HISTORY));
    } catch {
      // localStorage may be unavailable; the panel will just show empty state.
    }
    // Gating on `seeded` keeps SSR output consistent with the first client
    // render (no panel), then lets AskAITab mount after localStorage has the
    // sample history — so its initial load picks it up.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeeded(true);
  }, []);

  return (
    <div className="study-layout">
      <main
        style={{
          flex: 1,
          overflow: "auto",
          padding: "2rem",
        }}
      >
        <h1 style={{ marginTop: 0 }}>Ask AI — LaTeX/KaTeX visual test</h1>
        <p>
          This page seeds the Ask AI panel with a fake conversation containing
          inline and display math. The panel on the right should render the
          equations via KaTeX.
        </p>
        <p>
          History is stored under a dedicated card id
          (<code>{TEST_CARD_ID}</code>) so it never touches real study
          sessions. Reloading re-seeds the sample history; clearing the panel
          history removes it.
        </p>
        <p>
          <button type="button" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Collapse panel" : "Expand panel"}
          </button>
        </p>
        <p>
          You can also type a real question (e.g. &ldquo;give me the
          Pythagorean theorem&rdquo;) to verify streamed LaTeX from the API.
        </p>
      </main>
      {seeded && (
        <AskAITab
          contextText="LaTeX/KaTeX rendering test — no real card context."
          cardId={TEST_CARD_ID}
          isExpanded={expanded}
          onExpandedChange={setExpanded}
        />
      )}
    </div>
  );
}
