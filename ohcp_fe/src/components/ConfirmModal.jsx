import React from 'react';
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  // Inline Styles
  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.3s ease-out'
    },
    container: {
      background: 'linear-gradient(135deg, #006492 0%, #3eb7e9 100%)',
      borderRadius: '20px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      maxWidth: '550px',
      width: '92%',
      overflow: 'hidden',
      animation: 'slideUp 0.4s ease-out',
      position: 'relative'
    },
    header: {
      padding: '35px 40px 30px',
      textAlign: 'center',
      color: 'white'
    },
    iconContainer: {
      width: '70px',
      height: '70px',
      background: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 20px',
      animation: 'scaleIn 0.5s ease-out',
      backdropFilter: 'blur(10px)',
      border: '3px solid rgba(255, 255, 255, 0.3)'
    },
    icon: {
      fontSize: '35px',
      color: 'white'
    },
    title: {
      margin: 0,
      fontSize: '24px',
      fontWeight: 600
    },
    body: {
      background: 'white',
      padding: '35px 45px',
      textAlign: 'center'
    },
    message: {
      color: '#444',
      fontSize: '17px',
      lineHeight: 1.6,
      margin: 0
    },
    footer: {
      background: 'white',
      padding: '20px 30px 30px',
      display: 'flex',
      gap: '20px',
      justifyContent: 'center'
    },
    buttonBase: {
      flex: 1,
      padding: '16px 28px',
      border: 'none',
      borderRadius: '12px',
      fontSize: '15px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    cancelButton: {
      background: '#e0e0e0',
      color: '#666'
    },
    confirmButton: {
      background: 'linear-gradient(135deg, #3eb7e9 0%, #0088cc 100%)',
      color: 'white'
    }
  };
  return (
    <>
      {/* CSS Animations trong <style> tag */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes scaleIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.container} onClick={(e) => e.stopPropagation()}>
          <div style={styles.header}>
            <div style={styles.iconContainer}>
              <i className="bi bi-shield-lock-fill" style={styles.icon}></i>
            </div>
            <h3 style={styles.title}>{title}</h3>
          </div>
          
          <div style={styles.body}>
            <p style={styles.message}>{message}</p>
          </div>
          
          <div style={styles.footer}>
            <button 
              style={{...styles.buttonBase, ...styles.cancelButton}} 
              onClick={onClose}
              onMouseEnter={(e) => {
                e.target.style.background = '#d0d0d0';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#e0e0e0';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <i className="bi bi-x-circle"></i> Cancel
            </button>
            <button 
              style={{...styles.buttonBase, ...styles.confirmButton}} 
              onClick={onConfirm}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 20px rgba(62, 183, 233, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <i className="bi bi-box-arrow-in-right"></i> Go to Login
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
export default ConfirmModal;