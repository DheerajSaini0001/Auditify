import React, { useContext, useEffect } from 'react';
import DarkCard from '../Component/InputForm.jsx';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Homepage({ darkMode }) {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);

  return (
    <div className="w-full overflow-x-hidden">
      <DarkCard darkMode={darkMode} />
    </div>
  );
}
