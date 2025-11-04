import React, { useState } from 'react';

/**
 * A collapsible dropdown component styled with Tailwind CSS and dark mode support.
 *
 * @param {object} props
 * @param {string} props.title - Section title (e.g., "Performance Issues").
 * @param {object[]} props.items - Array of metric objects.
 * @param {boolean} props.darkMode - Enable/disable dark mode.
 */
const AuditDropdown = ({ title, items, darkMode = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => setIsOpen(!isOpen);

  if (!items || items.length === 0) return null;

  return (
    <div
      className={`pl-4 rounded-2xl  w-full max-w-6xl mx-auto font-sans border-b py-2 mb-5 transition-colors duration-300 ${
        darkMode
          ? 'bg-gray-800 border-gray-700 text-gray-200'
          : 'bg-white border-gray-200 text-gray-800'
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3
          className={`text-base font-medium tracking-wide ${
            darkMode ? 'text-gray-100' : 'text-gray-800'
          }`}
        >
          {title}
          <span
            className={`ml-2 font-normal ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            ({items.length})
          </span>
        </h3>
        <button
          onClick={handleToggle}
          className={`text-sm font-medium py-1 px-2 focus:outline-none transition-colors duration-200 ${
            darkMode
              ? 'text-gray-300 hover:text-gray-100'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {isOpen ? 'Hide' : 'Show'}
        </button>
      </div>

      {/* Collapsible Section */}
      {isOpen && (
        <div className="mt-4 space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className={`rounded-md p-4 text-sm shadow-sm border transition-colors duration-300 ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-200'
                  : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              {/* Object Data */}
              {typeof item === 'object' && item.metric ? (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h4
                      className={`font-semibold ${
                        darkMode ? 'text-gray-100' : 'text-gray-800'
                      }`}
                    >
                      {item.metric}
                    </h4>
                    <span
                      className={`text-xs font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}
                    >
                      {item.severity}
                    </span>
                  </div>
                  <div
                    className={`grid grid-cols-2 gap-x-3 text-sm mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}
                  >
                    <p>
                      <strong>Current:</strong> {item.current}
                    </p>
                    <p>
                      <strong>Recommended:</strong> {item.recommended}
                    </p>
                  </div>
                  <p
                    className={`italic ${
                      darkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}
                  >
                    {item.suggestion}
                  </p>
                </div>
              ) : (
                // Fallback for plain strings
                <div>{item}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditDropdown;
