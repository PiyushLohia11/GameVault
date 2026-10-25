import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import './Layout.css';

export default function Layout() {
  return (
    <div className="app-layout">
      {/* Ambient Gold Lighting Vignettes from Stitch reference */}
      <div className="ambient-vignette-top" aria-hidden="true" />
      <div className="ambient-vignette-bottom" aria-hidden="true" />
      <Sidebar />
      <div className="main-content-wrapper">
        <Topbar />
        <main className="page-content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
