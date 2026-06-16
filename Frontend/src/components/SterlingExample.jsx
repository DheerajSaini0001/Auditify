import React from 'react'

export default function SterlingExample() {
  return (
    <div className="p-10 max-w-3xl mx-auto space-y-6 bg-white">

      {/* Light */}
      <h1 className="font-sterling text-5xl font-light text-gray-800">
        Sterling Light — The quick brown fox
      </h1>

      {/* Regular */}
      <h2 className="font-sterling text-4xl font-normal text-gray-800">
        Sterling Regular — The quick brown fox
      </h2>

      {/* Medium */}
      <h2 className="font-sterling text-4xl font-medium text-gray-800">
        Sterling Medium — The quick brown fox
      </h2>

      {/*  */}
      <h2 className="font-sterling text-3xl font-semibold text-indigo-700">
        Sterling  — The quick brown fox
      </h2>

      {/* Bold */}
      <h2 className="font-sterling text-3xl font-semibold text-gray-900">
        Sterling Bold — The quick brown fox
      </h2>

      {/* bold */}
      <h1 className="font-sterling text-5xl font-semibold text-gray-900">
        Sterling bold — The quick brown fox
      </h1>

      {/* Italic */}
      <p className="font-sterling text-2xl font-normal italic text-gray-600">
        Sterling Italic — The quick brown fox jumps
      </p>

      {/* Bold Italic */}
      <p className="font-sterling text-2xl font-semibold italic text-indigo-600">
        Sterling Bold Italic — The quick brown fox jumps
      </p>

      {/* Body copy — default Tailwind sans, NOT Sterling */}
      <p className="font-sans text-base text-gray-500 leading-relaxed">
        Body text uses default Tailwind sans-serif. Sterling is used only
        for headings and display text via the font-sterling utility class.
      </p>

      {/* Real-world heading example */}
      <div className="border-t pt-6">
        <h1 className="font-sterling text-6xl font-semibold tracking-tight 
                        text-gray-900 leading-none mb-3">
          Build Something Great
        </h1>
        <p className="font-sterling text-xl font-light italic text-gray-500">
          Crafted with precision and purpose.
        </p>
      </div>

    </div>
  )
}
