import { Link } from "react-router-dom";

/**
 * LandingPage – polished dealer entry screen (no external icon deps)
 * Two clear calls‑to‑action styled with Tailwind + subtle motion.
 */
export default function LandingPage() {
  const NAV = [
    {
      to: "/quotes",
      title: "Quotes",
      desc: "Generate & manage vehicle quotes"
    },
    {
      to: "/dashboard",
      title: "Dashboard",
      desc: "Review submitted quotes & analytics"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-6">
      {/* --------------------------------- Header / Brand */}
      <header className="mb-10 text-center">
        {/* Swap src for your own logo if needed */}
        {/* <img src="/assets/millarx-logo.svg" alt="millarX" className="h-14 mx-auto mb-3" /> */}
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-1">
          millarX <span className="text-purple-700">Dealer Portal</span>
        </h1>
        <p className="text-gray-500">Select where you’d like to go</p>
      </header>

      {/* --------------------------------- Nav cards */}
      <nav className="grid gap-6 sm:grid-cols-2 w-full max-w-xl">
        {NAV.map(({ to, title, desc }) => (
          <Link
            key={to}
            to={to}
            className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-10 shadow transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-300"
          >
            {/* decorative gradient blob */}
            <div className="pointer-events-none absolute -inset-2 rounded-3xl bg-gradient-to-tr from-purple-100/40 to-indigo-100/40 opacity-0 transition duration-300 group-hover:opacity-100" />

            {/* content */}
            <h2 className="text-2xl font-semibold text-gray-800 mb-1 flex items-center justify-center gap-2">
              {/* simple emoji as icon substitute */}
              <span aria-hidden="true" className="text-purple-700 text-3xl">{title === "Quotes" ? "🚗" : "📊"}</span>
              {title}
            </h2>
            <p className="text-gray-500 leading-snug text-center max-w-xs mx-auto">{desc}</p>
          </Link>
        ))}
      </nav>

      {/* --------------------------------- Footer */}
      <footer className="mt-12 text-xs text-gray-400">© {new Date().getFullYear()} millarX</footer>
    </div>
  );
}

/*
 ──────────────────────────────────────────────────────────────
 Integration notes
 -------------------------------------------------------------------------
 1. Save as src/pages/LandingPage.jsx (or preferred path).
 2. Ensure `react-router-dom` is installed:
      npm i react-router-dom
 3. Add route in your router:
      <Route path="/" element={<LandingPage />} />
 4. Verify /quotes and /dashboard point to their components.
*/
