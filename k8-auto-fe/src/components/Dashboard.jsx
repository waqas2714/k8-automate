import React from "react";

function Dashboard({ children }) {
  return (
    <div className="flex h-screen bg-gray-100 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 shadow-md hidden md:block">
        <div className="p-6 font-bold text-xl border-b border-gray-200">
          Dashboard
        </div>
        <nav className="mt-4">
          <ul className="space-y-2 p-4">
            <li className="hover:bg-gray-200 p-2 rounded cursor-pointer">Home</li>
            <li className="hover:bg-gray-200 p-2 rounded cursor-pointer">Settings</li>
            <li className="hover:bg-gray-200 p-2 rounded cursor-pointer">Analytics</li>
            <li className="hover:bg-gray-200 p-2 rounded cursor-pointer">Logout</li>
          </ul>
        </nav>
      </aside>


      <div className="flex-1 overflow-auto">
        <header className="p-6">
          <h1 className="text-2xl font-semibold">Welcome</h1>
        </header>
        <section className="">{children}</section>
      </div>
    </div>
  );
}

export default Dashboard;
