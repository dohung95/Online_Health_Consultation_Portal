import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import Home from './components/Home';
import Schedule from './components/Schedule';
import Doctors from './components/Doctors';
import Records from './components/Records';
import Video from './components/Video';
import Prescription from './components/Prescription';
import Chat from './components/Chat';
import Payment from './components/Payment';
import Reminders from './components/Reminders';
import Admin from './components/Admin';
import Dashboard from './components/Dashboard'; // Thêm Dashboard
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
          <div className="container-fluid">
            <Link className="navbar-brand" to="/">Health Portal</Link>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav">
                <li className="nav-item">
                  <NavLink className="nav-link" to="/" exact>Home</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/schedule">Schedule</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/doctors">Doctors</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/records">Records</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/video">Video</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/prescription">Prescription</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/chat">Chat</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/payment">Payment</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/reminders">Reminders</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/admin">Admin</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/dashboard">Dashboard</NavLink> {/* Thêm route Dashboard */}
                </li>
              </ul>
            </div>
          </div>
        </nav>
        <div className="container mt-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/records" element={<Records />} />
            <Route path="/video" element={<Video />} />
            <Route path="/prescription" element={<Prescription />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/dashboard" element={<Dashboard />} /> {/* Thêm route Dashboard */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;