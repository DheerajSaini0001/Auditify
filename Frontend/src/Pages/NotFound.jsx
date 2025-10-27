import React from "react";
import { Home, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function NotFound({ darkMode }) {
  const navigate = useNavigate();

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen text-center px-6 transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800"
      }`}
    >
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <AlertTriangle
          className={`w-20 h-20 ${
            darkMode ? "text-yellow-400" : "text-yellow-500"
          }`}
        />

        <h1 className="text-6xl font-extrabold">404</h1>
        <h2
          className={`text-2xl font-semibold ${
            darkMode ? "text-gray-300" : "text-gray-600"
          }`}
        >
          Page Not Found
        </h2>

        <p
          className={`max-w-md mt-2 ${
            darkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Oops! The page you’re looking for doesn’t exist or might have been
          moved.
        </p>

        <button
          onClick={() => navigate("/")}
          className={`flex items-center gap-2 mt-6 px-5 py-2 rounded-2xl font-medium shadow-md transition-all duration-200 ${
            darkMode
              ? "bg-blue-500 hover:bg-blue-600 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          <Home className="w-5 h-5" />
          Go Back Home
        </button>
      </motion.div>
    </div>
  );
}
