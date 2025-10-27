import React from 'react';
import DarkCard from '../Component/DarkCard.jsx';
import { useContext } from 'react';


export default function Homepage({ darkMode }) {
   // ✅ get setData from context

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <DarkCard darkMode={darkMode}  />
    </div>
  );
}
