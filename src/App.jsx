import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';

// Placeholder Pages for all 8 requirements + Fallback
import DashboardPage from './pages/DashboardPage';
import MyLibraryPage from './pages/MyLibraryPage';
import DiscoverPage from './pages/DiscoverPage';
import GameDetailsPage from './pages/GameDetailsPage';
import AchievementsPage from './pages/AchievementsPage';
import FriendsPage from './pages/FriendsPage';
import ReviewsPage from './pages/ReviewsPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import { startPresenceHeartbeat } from './services/presenceService';

export default function App() {
  useEffect(() => startPresenceHeartbeat(1), []);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="library" element={<MyLibraryPage />} />
          <Route path="discover" element={<DiscoverPage />} />
          <Route path="games/:id" element={<GameDetailsPage />} />
          <Route path="achievements" element={<AchievementsPage />} />
          <Route path="friends" element={<FriendsPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
