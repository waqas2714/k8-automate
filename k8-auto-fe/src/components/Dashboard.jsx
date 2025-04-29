import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

function Dashboard({ children }) {
  const navigate = useNavigate();
  
  const linkClasses = ({ isActive }) =>
    `block p-2 rounded cursor-pointer ${
      isActive ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
    }`;

    const handleLogout = (e) => {
      e.preventDefault();

      localStorage.removeItem("github_token");
      navigate("/");
    };
    
  return (
    <div className="flex h-screen bg-gray-100 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 shadow-md hidden md:block">
        <div className="p-6 font-bold text-xl border-b border-gray-200">
          Dashboard
        </div>
        <nav className="mt-4">
          <ul className="space-y-2 p-4">
            <li>
              <NavLink to="/provision" className={linkClasses}>
                Provision
              </NavLink>
            </li>
            <li>
              <NavLink to="/status" className={linkClasses}>
                Status
              </NavLink>
            </li>
            <li>
              <NavLink to="/create" className={linkClasses}>
                Create
              </NavLink>
            </li>
            <li>
              <button className="block p-2 rounded cursor-pointer hover:bg-red-400 transition-colors duration-150 ease-in-out w-full text-left" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      <div className="flex-1 overflow-auto">
        <header className="p-6">
          <div className="flex">
          <h1 className="text-2xl font-semibold">Welcome,</h1> <p className="font-normal text-2xl ml-2">{localStorage.getItem("userName")}</p>
          </div>
        </header>
        <section className="">{children}</section>
      </div>
    </div>
  );
}

export default Dashboard;
