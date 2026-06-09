import { Home, CarFront, Ban } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

/**
 * Shown when the dealership detection gate determines that an audited site is
 * NOT a car dealership. Replaces the score dashboard (which would otherwise show
 * a misleading 0% Overall / Average) with a clear, friendly message.
 */
export default function NotADealership({ darkMode, data, onButtonClick }) {
  const navigate = useNavigate();

  const url = data?.url || "this website";
  const reason =
    data?.dealershipDetection?.reason ||
    (data?.error || "").replace(/^NOT A DEALERSHIP WEBSITE\s*—\s*/i, "") ||
    "";

  const handleHome = () => {
    if (onButtonClick) onButtonClick();
    else navigate("/", { replace: true });
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center min-h-[80vh] overflow-hidden px-6 transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800"
      }`}
    >
      {/* Background Glow */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 pointer-events-none ${
          darkMode ? "bg-amber-600" : "bg-amber-300"
        }`}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 flex flex-col items-center max-w-xl text-center"
      >
        {/* Icon */}
        <div
          className={`relative mb-6 p-5 rounded-2xl ${
            darkMode ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-500"
          }`}
        >
          <CarFront className="w-12 h-12" />
          <Ban className="w-6 h-6 absolute -bottom-1 -right-1 text-rose-500 bg-white dark:bg-gray-900 rounded-full" />
        </div>

        <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
          Not a Dealership Website
        </h1>

        <p className={`mt-4 text-base leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
          Sorry, this website does not appear to belong to a car dealership, so an
          audit cannot be performed.
        </p>

        {/* URL chip */}
        <div
          className={`mt-5 inline-flex items-center max-w-full gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            darkMode ? "bg-slate-800 text-slate-300 border border-slate-700" : "bg-white text-slate-600 border border-slate-200"
          }`}
        >
          <span className="truncate">{url}</span>
        </div>

        {reason && (
          <p className={`mt-4 text-xs ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
            Reason: {reason}
          </p>
        )}

        {/* CTA */}
        <motion.button
          onClick={handleHome}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group flex items-center gap-3 px-8 py-3.5 rounded-full fontsemibold shadow-lg transition-all duration-300 mt-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25"
        >
          <Home className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Audit Another Website</span>
        </motion.button>
      </motion.div>
    </div>
  );
}
