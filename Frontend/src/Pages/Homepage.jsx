import React from 'react';
import DarkCard from '../Component/InputForm.jsx';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext.jsx';


export default function Homepage({ darkMode }) {
  // ✅ get setData from context
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  return (
    <div className="w-full overflow-x-hidden">
      <DarkCard darkMode={darkMode} />
    </div>
  );
}
