import { Home, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PageHeader from "../Component/PageHeader";

export default function NotFound({
  darkMode,
  title = "404",
  subtitle = "Page Not Found",
  description = "Oops! The page you’re looking for doesn’t exist or might have been moved.",
  buttonText = "Go Back Home",
  onButtonClick,
}) {
  const navigate = useNavigate();

  const handleHome = () => {
    if (onButtonClick) {
      onButtonClick();
    } else {
      navigate("/");
    }
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center min-h-[70vh] overflow-hidden px-6 transition-colors duration-300 ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800"
        }`}
    >
      {/* Background Glow Effect */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 pointer-events-none ${darkMode ? "bg-blue-600" : "bg-blue-300"
          }`}
      />

      <div className="relative z-10 flex flex-col items-center max-w-lg text-center">
        <PageHeader 
            icon={AlertTriangle}
            variant="iconic"
            title={title}
            subtitle={description}
            darkMode={darkMode}
        />

        {/* CTAs */}
        <motion.button
            onClick={handleHome}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`group flex items-center gap-3 px-8 py-3.5 rounded-full font-semibold shadow-lg transition-all duration-300 mt-8 ${darkMode
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25"
            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-400/30"
            }`}
        >
          <Home className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>{buttonText}</span>
        </motion.button>
      </div>
    </div>
  );
}
