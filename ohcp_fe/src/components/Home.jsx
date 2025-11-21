import { useState, useEffect } from 'react';
import './Css/Home.css';
import Navbar from './Navbar';
import Loading from './Loading';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Home() {
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, roles } = useAuth();
  const navigate = useNavigate();

  const isUser = roles.includes('patient');

  useEffect(() => {
    // Giả lập thời gian load trang (có thể thay bằng logic load data thực tế)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500); // 1.5 giây

    return () => clearTimeout(timer);
  }, []);

  // Handle Chat with AI click - Check authentication and open chat with "Hello!"
  const handleChatClick = (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (isUser) {
      // Dispatch custom event to open chat with pre-filled message
      window.dispatchEvent(new CustomEvent('openChatWithMessage', {
        detail: { message: 'Hello!' }
      }));
    } else {
      navigate('/');
    }
  };

  // Handle Appointment click - Check authentication and role
  const handleAppointmentClick = (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (isUser) {
      navigate('/schedule');
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <div className="home-page">
        <div className="Background_Home">
          <div className='container'>
            <Navbar />
          </div>
          <div className="container" align="center">
            <div className="hero-subtitle">
              <b>
                WE ARE HERE FOR YOUR CARE
              </b>
            </div>
            <div className="hero-title">
              Better Care,<br />
              Better Doctors.
            </div>
            <div className="hero-description">
              Online Health Portal: secure teleconsultations, health record storage, AI-powered preliminary diagnosis — making healthcare faster, safer, and more accessible.
            </div>
            <div>
              <NavLink to="/about_us">
                <button className="btn-about-us"><b>MORE ABOUT US</b></button>
              </NavLink>
            </div>
          </div>
        </div>
        <div className='row services-row'>
          <div className='col-md-4 service-card service-card-blue'>
            <div align="center" className="service-icon">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="32" cy="32" r="30" stroke="#ffffff" strokeWidth="2" opacity="0.15" />

                <g transform="translate(32,32)">
                  <path d="M0-18 L15.5-9 L15.5 9 L0 18 L-15.5 9 L-15.5-9 Z"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="3" />

                  <circle cx="0" cy="0" r="8" fill="none" stroke="#ffffff" strokeWidth="2.5" />
                  <circle cx="0" cy="0" r="3" fill="#ffffff" />

                  <line x1="0" y1="-8" x2="0" y2="-15" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  <line x1="0" y1="8" x2="0" y2="15" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  <line x1="-7" y1="-4" x2="-13" y2="-7.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  <line x1="7" y1="-4" x2="13" y2="-7.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  <line x1="-7" y1="4" x2="-13" y2="7.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  <line x1="7" y1="4" x2="13" y2="7.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />

                  <circle cx="0" cy="-15" r="2" fill="#ffffff" />
                  <circle cx="0" cy="15" r="2" fill="#ffffff" />
                  <circle cx="-13" cy="-7.5" r="1.5" fill="#ffffff" />
                  <circle cx="13" cy="-7.5" r="1.5" fill="#ffffff" />
                  <circle cx="-13" cy="7.5" r="1.5" fill="#ffffff" />
                  <circle cx="13" cy="7.5" r="1.5" fill="#ffffff" />
                </g>

                <text x="32" y="62" fontFamily="Arial, sans-serif" fontSize="12" fill="#ffffff" fontWeight="bold" textAnchor="middle">AI</text>
              </svg>
            </div>
            <div className="service-helper-text">
              <b>We are helpers</b>
            </div>
            <div className="service-title">
              <b>AI support</b>
            </div>
            <div className="service-description">
              With AI support to answer questions and find solutions to help patients.
            </div>
            <div>
              <button className="service-btn service-btn-chat" onClick={handleChatClick}>
                Chat with AI
              </button>
            </div>
          </div>
          <div className='col-md-4 service-card service-card-dark'>
            <div align="center" className="service-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="svg-doctor">
                <path fill='white' d="M340.596 309.258H300.03v17.97h-17.969v40.565h17.969v17.97h40.566v-17.97h17.97v-40.566h-17.97zm4.97 30.97v14.565h-17.97v17.97H313.03v-17.97h-17.969v-14.566h17.969v-17.97h14.566v17.97z" /><path fill='white' d="m358.984 281.018-49.045-25.036a71.077 71.077 0 0 0 11.679-19.295h2.919a21.506 21.506 0 0 0 21.481-21.482v-15.062a21.512 21.512 0 0 0-19.205-21.362v-18.618a70.813 70.813 0 0 0-141.626 0v18.618a21.512 21.512 0 0 0-19.205 21.362v15.062a21.506 21.506 0 0 0 21.481 21.482h2.92a71.072 71.072 0 0 0 11.752 19.383l-49.118 24.948a72.247 72.247 0 0 0-39.588 64.637v76.995h285.142v-76.995a72.248 72.248 0 0 0-39.587-64.637zM198.187 160.163a57.813 57.813 0 0 1 115.626 0v18.403c-71.18-2.127-72.92-39.159-72.959-40.92a6.5 6.5 0 0 0-12.982-.422c-1.215 16.533-18.559 29.92-29.685 36.865zm-3.27 63.524h-7.453a8.491 8.491 0 0 1-8.482-8.482v-15.062a8.491 8.491 0 0 1 8.482-8.481h4.231a6.624 6.624 0 0 0 .68-.037c.045-.005.089-.015.133-.02.185-.024.368-.051.548-.09.053-.012.106-.028.16-.041.17-.041.338-.086.502-.14.06-.02.12-.045.18-.066.156-.057.309-.117.459-.184.026-.012.053-.02.08-.032 1.398-.653 27.258-12.938 39.797-33.396a51.604 51.604 0 0 0 6.047 8.138c15.544 17.165 42.47 25.868 80.033 25.868h4.223a8.491 8.491 0 0 1 8.482 8.481v15.062a8.491 8.491 0 0 1-8.482 8.482h-7.453a6.5 6.5 0 0 0-6.172 4.462 57.77 57.77 0 0 1-109.824 0 6.5 6.5 0 0 0-6.171-4.462zM385.571 409.65H126.429v-63.995a59.3 59.3 0 0 1 32.485-53.052l14.265-7.246v27.85a30.198 30.198 0 0 0-26.113 29.88v34.69h13v-34.69a17.178 17.178 0 0 1 17.158-17.158h4.91a17.178 17.178 0 0 1 17.159 17.158v34.69h13v-34.69a30.199 30.199 0 0 0-26.114-29.88v-34.453l25.834-13.12a70.734 70.734 0 0 0 88.076-.084l52.987 27.048a59.305 59.305 0 0 1 32.495 53.057z" />
              </svg>
            </div>
            <div className="service-helper-text">
              <b>We are helpers</b>
            </div>
            <div className="service-title">
              <b>Doctor's</b>
            </div>
            <div className="service-description">
              View information about our doctors and specialists
            </div>
            <div>
              <NavLink to="/doctors">
                <button className="service-btn service-btn-doctor">
                  View Doctor
                </button>
              </NavLink>
            </div>
          </div>
          <div className='col-md-4 service-card service-card-blue'>
            <div align="center" className="service-icon-large">
              <svg xmlns="http://www.w3.org/2000/svg"
                width="30"
                height="auto"
                viewBox="0 0 87.22 139.998"
                preserveAspectRatio="xMidYMid meet"
                fill="none" stroke="#ffffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6">
                <g>
                  <path d="M66.948 18.436h3.4a15.033 15.033 0 0 1 14.867 15.2V122.8A15.033 15.033 0 0 1 70.352 138h-53.49A15.03 15.03 0 0 1 2 122.8V33.633a15.032 15.032 0 0 1 14.861-15.2h3.664" />
                  <path d="M58.794 13.582v8.295H28.425v-8.295H33.8a2.23 2.23 0 0 0 2.221-2.239 2.3 2.3 0 0 0-.021-.309 7.784 7.784 0 0 1-.084-1.172A7.693 7.693 0 0 1 51.3 9.5a7.659 7.659 0 0 1-.073 1.521 2.236 2.236 0 0 0 1.89 2.536 2.118 2.118 0 0 0 .308.023zM23.411 48.328H67.26M18.152 65.189H67.26M18.152 82.05H67.26M18.152 98.911H67.26M18.152 115.772H67.26" />
                </g>
              </svg>
            </div>
            <div className="service-helper-text">
              <b>We are helpers</b>
            </div>
            <div className="service-title">
              <b>Make An Appointment</b>
            </div>
            <div className="service-description">
              Create appointments that help patients work with highly qualified doctors and specialists
            </div>
            <div>
              <button className="service-btn service-btn-appointment" onClick={handleAppointmentClick}>
                Appointment
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;