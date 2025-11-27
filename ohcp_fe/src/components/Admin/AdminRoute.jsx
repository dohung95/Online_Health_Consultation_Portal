import React, { useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, roles, loading } = useAuth();
  const hasShownAlert = useRef(false);

  // Đợi authentication load xong
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem'
      }}>
       Loading...
      </div>
    );
  }

  // Kiểm tra xem người dùng có đăng nhập không
  if (!isAuthenticated) {
    // Không hiển thị alert nếu đang trong quá trình logout
    const isLoggingOut = localStorage.getItem('isLoggingOut') === 'true';
    if (!hasShownAlert.current && !isLoggingOut) {
      hasShownAlert.current = true;
      setTimeout(() => {
        alert('You cannot access this page!');
      }, 0);
    }
    return <Navigate to="/login" replace />;
  }

  // Kiểm tra xem người dùng có role "admin" không
  const isAdmin = roles.includes('admin');

  if (!isAdmin) {
    if (!hasShownAlert.current) {
      hasShownAlert.current = true;
      setTimeout(() => {
        alert('You cannot access this page!');
      }, 0);
    }
    return <Navigate to="/" replace />;
  }

  // Nếu là admin, render component
  return children;
};

export default AdminRoute;
