import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import QuickBar from "../dashboard/QuickBar";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
      <main className={`min-h-screen transition-all duration-300 ${
        collapsed ? "lg:ml-16" : "lg:ml-60"
      }`}>
        <div className="flex justify-end px-6 lg:px-8 pt-4">
          <QuickBar />
        </div>
        <div className="p-6 lg:p-8 pt-2 max-w-[1400px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}