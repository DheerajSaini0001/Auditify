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

  const handleLogin = () => {
    console.log("[LoginOverlay] Log In clicked. auditId:", auditId);
    if (auditId) {
      savePostAuthIntent(auditId, `/report/${auditId}`);
    }
    navigate("/login");
  };

  const handleRegister = () => {
    console.log("[LoginOverlay] Sign Up clicked. auditId:", auditId);
    if (auditId) {
      savePostAuthIntent(auditId, `/report/${auditId}`);
    }
    navigate("/register");
  };

  return (
  <> 
      
      {/* Card */}
      <div
        className={`max-w-2xl rounded-2xl       w-full p-12 lg:p-14  text-center border transition-all duration-300 transform shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] ${
          darkMode
            ? "bg-slate-900 border-slate-800 shadow-black/40"
            : "bg-white/95 backdrop-blur border-slate-100"
        }`}
      >
        
        {/* Animated Icon */}
        <div className="mb-8 relative flex justify-center">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse"></div>
          
          <div
            className={`relative p-6 rounded-full border shadow-inner ${
              darkMode
                ? "bg-slate-800 border-slate-700"
                : "bg-slate-50 border-white"
            }`}
          >
            <Lock
              className={`w-10 h-10 ${
                darkMode ? "text-blue-400" : "text-blue-600"
              }`}
            />
          </div>
        </div>

        {/* Heading */}
        <h2
          className={`text-3xl font-black tracking-tight mb-4 ${
            darkMode ? "text-white" : "text-slate-900"
          }`}
        >
          Log in or Sign up to see the rest of the Report
        </h2>

        {/* Description */}
        <p
          className={`text-base leading-relaxed mb-10 opacity-70 ${
            darkMode ? "text-slate-400" : "text-slate-600"
          }`}
        >
          Try out Auditify for FREE and get full report details, more tests,
          monitoring, locations, and more!
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mt-4">
          
          {/* Login */}
          <button
            onClick={handleLogin}
            className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold transition-all duration-300 w-full sm:w-auto shadow-sm hover:shadow active:scale-95 ${
              darkMode
                ? "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
                : "bg-black text-white hover:bg-slate-900"
            }`}
          >
            <LogIn size={18} />
            Log in
          </button>

          <span
            className={`text-[11px] font-bold uppercase tracking-[0.2em] opacity-40 ${
              darkMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            or
          </span>

          {/* Register */}
          <button
            onClick={handleRegister}
            className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold transition-all duration-300 w-full sm:w-auto shadow-sm hover:shadow active:scale-95 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <UserPlus size={18} />
            Create a FREE account
          </button>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-8 border-t border-dashed opacity-10"></div>

        <p
          className={`text-[10px] font-bold uppercase tracking-[0.2em] opacity-30 mt-4 ${
            darkMode ? "text-slate-500" : "text-slate-400"
          }`}
        >
          Join 50,000+ businesses auditing with Auditify
        </p>
      </div>
   </>
  );
}