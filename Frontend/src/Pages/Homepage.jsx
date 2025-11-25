import React from 'react';
import DarkCard from '../Component/InputForm.jsx';
import { useContext } from 'react';


export default function Homepage({ darkMode }) {
   // ✅ get setData from context

  return (
    <div className="w-full overflow-x-hidden">
      <DarkCard darkMode={darkMode}  />
    </div>
  );
}
