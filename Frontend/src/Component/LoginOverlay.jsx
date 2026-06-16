import { Lock, LogIn, UserPlus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { savePostAuthIntent } from "../utils/intentStore";
import { useData } from "../context/DataContext";

export default function LoginPrompt({ darkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data } = useData();

  // Audit ID can come from URL param or from Context if we just ran an audit
  const auditId = id || data?._id;
  // The intended post-auth destination
  const intendedPath = auditId ? `/report/${auditId}` : null;

  const handleLogin = () => {
    console.log("[LoginOverlay] Log In clicked. auditId:", auditId);
    if (auditId) {
      // Save to localStorage so the intent survives browser refresh & Google OAuth redirect
      savePostAuthIntent(auditId, `/report/${auditId}`);
    }
    // Also pass via router state so LoginPage can use it without reading localStorage
    navigate("/login", { state: { from: intendedPath } });
  };

  const handleRegister = () => {
    console.log("[LoginOverlay] Sign Up clicked. auditId:", auditId);
    if (auditId) {
      savePostAuthIntent(auditId, `/report/${auditId}`);
    }
    navigate("/register", { state: { from: intendedPath } });
  };

  return (
    <>

      {/* Card */}
      <div
        className={`max-w-2xl rounded-3xl w-full p-12 lg:p-14 text-center transition-all duration-300 transform ${darkMode
            ? "bg-slate-900 border border-slate-800 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]"
            : "bg-card/95 backdrop-blur border border-transparent shadow-[0_24px_60px_-18px_rgba(22,33,62,0.25)]"
          }`}
      >

        {/* Animated Icon */}
        <div className="mb-8 relative flex justify-center">
          <div className="absolute inset-0 bg-[#ea580c]/15 rounded-full blur-2xl animate-pulse"></div>

          <div
            className={`relative p-6 rounded-full border shadow-inner ${darkMode
                ? "bg-slate-800 border-slate-700"
                : "bg-cardsoft border-line"
              }`}
          >
            <Lock
              className={`w-10 h-10 ${darkMode ? "text-blue-400" : "text-accent"
                }`}
            />
          </div>
        </div>

        {/* Heading */}
        <h2
          className={`text-3xl font-black tracking-tight mb-4 ${darkMode ? "text-white" : "text-ink"
            }`}
        >
          Log in or Sign up to see the rest of the Report
        </h2>

        {/* Description */}
        <p
          className={`text-base leading-relaxed mb-10 opacity-70 ${darkMode ? "text-slate-400" : "text-muted"
            }`}
        >
          Try out Dealerpulse for FREE and get full report details, more tests,
          monitoring, locations, and more!
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mt-4">

          {/* Login */}
          <button
            onClick={handleLogin}
            className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold transition-all duration-300 w-full sm:w-auto shadow-sm hover:shadow active:scale-95 ${darkMode
                ? "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
                : "bg-black text-white hover:bg-slate-900"
              }`}
          >
            <LogIn size={18} />
            Log in
          </button>

          <span
            className={`text-[11px] font-semibold uppercase tracking-[0.2em] opacity-40 ${darkMode ? "text-slate-500" : "text-faint"
              }`}
          >
            or
          </span>

          {/* Register */}
          <button
            onClick={handleRegister}
            className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold transition-all duration-300 w-full sm:w-auto shadow-sm hover:shadow active:scale-95 bg-accent hover:bg-accenthover text-white"
          >
            <UserPlus size={18} />
            Create a FREE account
          </button>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-8 border-t border-dashed opacity-10"></div>

        <p
          className={`text-[11px] font-semibold uppercase tracking-[0.2em] mt-4 ${darkMode ? "text-slate-400" : "text-muted"
            }`}
        >
          Join 50,000+ businesses auditing with Dealerpulse
        </p>
      </div>
    </>
  );
}