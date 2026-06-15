import React from 'react'

export default function UrbanoExample() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Heading using Urbano font */}
      <h1 className="font-urbano text-5xl font-semibold text-gray-900 mb-4">
        Hello with Urbano Font
      </h1>

      <h2 className="font-urbano text-3xl font-semibold text-indigo-600 mb-6">
        Subheading in Urbano Bold
      </h2>

      {/* Body using default Tailwind sans */}
      <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
        This paragraph uses the default Tailwind sans-serif font stack.
        Only headings use the custom Urbano font via font-urbano class.
      </p>

      <p className="font-urbano text-xl font-normal text-gray-600">
        This line uses Urbano Regular (font-weight: 400).
      </p>
    </div>
  )
}
