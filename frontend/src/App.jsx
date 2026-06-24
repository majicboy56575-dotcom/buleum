import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Items from './pages/Items';
import ItemDetail from './pages/ItemDetail';
import Town from './pages/Town';
import Chat from './pages/Chat';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ItemWrite from './pages/ItemWrite';
import TownWrite from './pages/TownWrite';
import Profile from './pages/Profile';
import Requests from './pages/Requests';
import Progress from './pages/Progress';
import Experts from './pages/Experts';
import Notifications from './pages/Notifications';
import PaymentPage from './pages/PaymentPage';
import LikedItems from './pages/LikedItems';
import Review from './pages/Review';
import Verification from './pages/Verification';
import AdminDashboard from './pages/AdminDashboard';
import CustomerCenter from './pages/CustomerCenter';
import './styles/index.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/items" element={<Items />} />
            <Route path="/items/write" element={<ItemWrite />} />
            <Route path="/items/:id" element={<ItemDetail />} />
            <Route path="/town" element={<Town />} />
            <Route path="/town/write" element={<TownWrite />} />
            <Route path="/experts" element={<Experts />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/liked" element={<LikedItems />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/payments/deposit/:buleumId" element={<PaymentPage />} />
            <Route path="/review" element={<Review />} />
            <Route path="/verify" element={<Verification />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/customer-center" element={<CustomerCenter />} />
            {/* Fallback for other routes */}
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
