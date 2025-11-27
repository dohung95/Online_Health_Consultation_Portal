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
import Patients from './components/Admin/Patients';
import Appointments from './components/Admin/Appointments';
import MedicalRecords from './components/Admin/MedicalRecords';
import DoctorsAdmin from './components/Admin/DoctorsAdmin';
import Settings from './components/Admin/Settings';
import Invoices from './components/Admin/Invoices';

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

import DoctorPage from './components/DoctorPage';
import ProtectedRoute from './components/ProtectedRoute';

import AdminRoute from './components/Admin/AdminRoute';
import HealthRecords from './components/HealthRecords';


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

  const isDoctorPage = location.pathname === '/doctor-page';
  const isAdminPage = location.pathname === '/admin';
  const isLoginPage = location.pathname === '/login';
  
  // Don't show navbar/footer on video call, doctor page, admin page, or login page
  const hideLayout = isVideoCallPage || isDoctorPage || isAdminPage || isLoginPage;

  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <>
      {!isVideoCallPage && !isAdminPage && <IncomingCallModal />}
      <div className="App">
        {!isVideoCallPage && !isAdminPage && <Chat />}
        <ScrollToTop />
        {!hideLayout && <Navbar />}
        {!isVideoCallPage && !isAdminPage && <Navbar />}

        <div>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/contact_us" element={<ContactUs />} />
            <Route path="/about_us" element={<AboutUs />} />
            <Route path="/login" element={<Sign_in />} />
            <Route path="/register" element={<Sign_up />} />
            <Route path="/video-calling" element={<VideocallPage />} />
            
            {/* Admin only */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <Admin />
              </ProtectedRoute>
            } />
            
            {/* Doctor only */}
            <Route path="/doctor-page" element={
              <ProtectedRoute allowedRoles={['Doctor']}>
                <DoctorPage />
              </ProtectedRoute>
            } />
            
            {/* Patient only routes */}
            <Route path="/schedule" element={
              <ProtectedRoute allowedRoles={['Patient']}>
                <Schedule />
              </ProtectedRoute>
            } />
            <Route path="/book/:doctorId" element={
              <ProtectedRoute allowedRoles={['Patient']}>
                <Schedule />
              </ProtectedRoute>
            } />
            <Route path="/my-appointments" element={
              <ProtectedRoute allowedRoles={['Patient']}>
                <MyAppointments />
              </ProtectedRoute>
            } />
            <Route path="/doctors" element={
              <ProtectedRoute allowedRoles={['Patient']}>
                <Doctors />
              </ProtectedRoute>
            } />
            <Route path="/doctor/:id" element={
              <ProtectedRoute allowedRoles={['Patient']}>
                <DoctorProfile />
              </ProtectedRoute>
            } />
            <Route path="/records" element={
              <ProtectedRoute allowedRoles={['Patient']}>
                <Records />
              </ProtectedRoute>
            } />
            <Route path="/video" element={
              <ProtectedRoute allowedRoles={['Patient']}>
                <Video />
              </ProtectedRoute>
            } />
            <Route path="/prescription" element={
              <ProtectedRoute allowedRoles={['Patient']}>
                <Prescription />
              </ProtectedRoute>
            } />
            <Route path="/payment" element={
              <ProtectedRoute allowedRoles={['Patient']}>
                <Payment />
              </ProtectedRoute>
            } />
            <Route path="/reminders" element={
              <ProtectedRoute allowedRoles={['Patient']}>
                <Reminders />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
        {!hideLayout && <Footer />}

            <Route path="/health-records" element={<HealthRecords />} />

            <Route path="/admin" element={<AdminRoute> <Admin /> </AdminRoute>} />
            <Route path="/admin/patients" element={<AdminRoute> <Patients /> </AdminRoute>}/>
            <Route path="/admin/appointments" element={<AdminRoute> <Appointments /> </AdminRoute>}/>
            <Route path="/admin/medical-records" element={<AdminRoute> <MedicalRecords /> </AdminRoute>}/>
            <Route path="/admin/doctors" element={<AdminRoute> <DoctorsAdmin /> </AdminRoute>}/>
            <Route path="/admin/invoices" element={<AdminRoute> <Invoices /> </AdminRoute>}/>
            <Route  path="/admin/settings" element={<AdminRoute> <Settings /> </AdminRoute>}/>
                                          
          </Routes>
        </div>
        {!isVideoCallPage && !isAdminPage && <Footer />}

      </div>
    </>
  );
}

export default App;