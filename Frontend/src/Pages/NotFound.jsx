import React from "react";
import { Home, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

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

      <motion.div
        className="relative z-10 flex flex-col items-center max-w-lg text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Floating Icon */}
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className={`mb-6 p-5 rounded-full shadow-2xl ${darkMode ? "bg-gray-800 shadow-blue-900/20" : "bg-white shadow-blue-200"
            }`}
        >
          <AlertTriangle
            className={`w-16 h-16 sm:w-20 sm:h-20 ${darkMode ? "text-yellow-400" : "text-yellow-500"
              }`}
          />
        </motion.div>

        {/* Title with Gradient */}
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-2">
          <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            {title}
          </span>
        </h1>

        {/* Subtitle */}
        <h2
          className={`text-2xl sm:text-3xl font-semibold mb-4 ${darkMode ? "text-gray-200" : "text-gray-700"
            }`}
        >
          {subtitle}
        </h2>

        {/* Description */}
        <p
          className={`text-base sm:text-lg mb-8 max-w-md leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-500"
            }`}
        >
          {description}
        </p>

        {/* CTAs */}
        <motion.button
          onClick={handleHome}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`group flex items-center gap-3 px-8 py-3.5 rounded-full font-semibold shadow-lg transition-all duration-300 ${darkMode
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25"
            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-400/30"
            }`}
        >
          <Home className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>{buttonText}</span>
        </motion.button>
      </motion.div>
    </div>
  );
}
