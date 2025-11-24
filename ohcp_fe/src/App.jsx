// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation  } from 'react-router-dom';
import Home from './components/Home';
import Schedule from './components/Schedule';
import MyAppointments from './components/MyAppointment';
import Doctors from './components/Doctors';
import Records from './components/Records';
import Video from './components/Video';
import Prescription from './components/Prescription';
import Chat from './components/Chat';
import Payment from './components/Payment';
import Reminders from './components/Reminders';
import Admin from './components/Admin/Admin';
import Sign_in from './components/Auth/Sign_in';
import Sign_up from './components/Auth/Sign_up';
import Footer from './components/Footer';
import ContactUs from './components/ContactUs';
import AboutUs from './components/AboutUs';
import './App.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import ScrollToTop from './components/ScrollToTop';
import { ChatProvider } from './context/ChatContext';
import VideocallPage from './pages/video-calling';
import IncomingCallModal from './components/IncomingCallModal';
import Navbar from './components/Navbar';
import DoctorProfile from './components/DoctorProfile';
import AdminRoute from './components/Admin/AdminRoute';

function App() {
  return (
    <ChatProvider>
      <Router>
        <AppContent />
      </Router>
    </ChatProvider>
  );
}

// Tạo component mới để có thể dùng useLocation
function AppContent() {
  const location = useLocation();
  const isVideoCallPage = location.pathname === '/video-calling';
  const isAdminPage = location.pathname === '/admin';

  return (
    <>
      {!isVideoCallPage && !isAdminPage && <IncomingCallModal />}
      <div className="App">
        {!isVideoCallPage && !isAdminPage && <Chat />}
        <ScrollToTop />
        {!isVideoCallPage && !isAdminPage && <Navbar />}
        <div>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/contact_us" element={<ContactUs />} />
            <Route path="/about_us" element={<AboutUs />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/book/:doctorId" element={<Schedule />} />
            <Route path="/my-appointments" element={<MyAppointments />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/doctor/:id" element={<DoctorProfile />} />
            <Route path="/records" element={<Records />} />
            <Route path="/video" element={<Video />} />
            <Route path="/prescription" element={<Prescription />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/login" element={<Sign_in />} />
            <Route path="/register" element={<Sign_up />} />
            <Route path="/video-calling" element={<VideocallPage />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              }
            />
          </Routes>
        </div>
        {!isVideoCallPage && !isAdminPage && <Footer />}
      </div>
    </>
  );
}

export default App;