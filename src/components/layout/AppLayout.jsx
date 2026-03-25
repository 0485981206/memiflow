import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import QuickBar from "../dashboard/QuickBar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:ml-60 min-h-screen">
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