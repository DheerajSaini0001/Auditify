import React from 'react'
import DarkCard from '../Component/DarkCard.jsx'
export default function Homepage({ darkMode,setData }) {
  return (
    <div className='min-h-screen w-full overflow-x-hidden '>
        <DarkCard darkMode={darkMode} setData={setData} />
    </div>
  )
}
