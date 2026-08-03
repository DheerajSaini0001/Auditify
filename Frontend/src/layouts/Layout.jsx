import React from "react";

const Layout = ({ sidebar, children }) => {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card text-ink p-4">
        {sidebar}
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-surface p-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
