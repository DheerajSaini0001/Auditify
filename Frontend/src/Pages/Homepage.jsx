import React from 'react';
import DarkCard from '../Component/DarkCard.jsx';
import { useContext } from 'react';
import { DataContext } from '../context/DataContext';

export default function Homepage({ darkMode }) {
  const { setData } = useContext(DataContext); // ✅ get setData from context

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <DarkCard darkMode={darkMode} setData={setData} />
    </div>
  );
}
