import React, { useState, useEffect, useRef } from 'react';
import signalRService from '../services/signalrService';
import notificationApi from '../api/notificationApi';
import './Css/NotificationBell.css';

function NotificationBell() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [reminderCount, setReminderCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [activeTab, setActiveTab] = useState(null); // 'reminders' or 'notifications'
  const [reminders, setReminders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Load initial unread count
    loadUnreadCount();

    // Initialize SignalR connection
    signalRService.startConnection();

    // Listen for medication reminders
    const handleMedicationReminder = (reminder) => {
      console.log('Received medication reminder:', reminder);
      setReminderCount(prev => prev + 1);
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification if supported
      if (Notification.permission === 'granted') {
        new Notification('Medication Reminder', {
          body: `Time to take ${reminder.medicationName}. ${reminder.dosage}`,
          icon: '/medication-icon.png'
        });
      }
    };

    // Listen for appointment notifications
    const handleAppointmentNotification = (notification) => {
      console.log('Received appointment notification:', notification);
      setNotificationCount(prev => prev + 1);
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification if supported
      if (Notification.permission === 'granted') {
        new Notification('Appointment Reminder', {
          body: `You have an appointment with Dr. ${notification.doctorName}`,
          icon: '/appointment-icon.png'
        });
      }
    };

    signalRService.on('ReceiveMedicationReminder', handleMedicationReminder);
    signalRService.on('ReceiveAppointmentNotification', handleAppointmentNotification);

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      signalRService.off('ReceiveMedicationReminder', handleMedicationReminder);
      signalRService.off('ReceiveAppointmentNotification', handleAppointmentNotification);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadUnreadCount = async () => {
    try {
      const data = await notificationApi.getUnreadCount();
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const loadReminders = async () => {
    setLoadingReminders(true);
    try {
      const data = await notificationApi.getMyNotifications();
      console.log('All notifications:', data);
      
      // Filter for medication reminders - check for "days remaining" or medicine format
      const medicationReminders = data.filter(n => {
        const msg = n.message.toLowerCase();
        return msg.includes('days remaining') || 
               msg.includes(' - ') && msg.includes(': use'); // Format: "name - dosage: use instructions"
      });
      
      console.log('Filtered medication reminders:', medicationReminders);
      setReminders(medicationReminders);
      
      // Count unread reminders
      const unread = medicationReminders.filter(n => !n.isRead).length;
      setReminderCount(unread);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoadingReminders(false);
    }
  };

  const loadNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const data = await notificationApi.getMyNotifications();
      
      // Filter for appointment notifications - exclude medication reminders
      const appointmentNotifs = data.filter(n => {
        const msg = n.message.toLowerCase();
        const isMedication = msg.includes('days remaining') || 
                            (msg.includes(' - ') && msg.includes(': use'));
        
        return !isMedication && (
          msg.includes('appointment') || 
          msg.includes('dr.') ||
          msg.includes('doctor')
        );
      });
      
      setNotifications(appointmentNotifs);
      
      // Count unread notifications
      const unread = appointmentNotifs.filter(n => !n.isRead).length;
      setNotificationCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
    if (!dropdownOpen) {
      setActiveTab(null); // Reset active tab when opening
    }
  };

  const handleTabClick = (tab) => {
    if (activeTab === tab) {
      setActiveTab(null); // Close if clicking the same tab
    } else {
      setActiveTab(tab);
      if (tab === 'reminders') {
        loadReminders();
        // Mark all reminders as read
        markRemindersAsRead();
      } else if (tab === 'notifications') {
        loadNotifications();
        // Mark all notifications as read
        markNotificationsAsRead();
      }
    }
  };

  const markRemindersAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setReminderCount(0);
      setUnreadCount(prev => Math.max(0, prev - reminderCount));
    } catch (error) {
      console.error('Error marking reminders as read:', error);
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotificationCount(0);
      setUnreadCount(prev => Math.max(0, prev - notificationCount));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button 
        className="notification-bell-btn" 
        onClick={toggleDropdown}
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {dropdownOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h6 className="mb-0">Notifications</h6>
          </div>
          <div className="notification-dropdown-body">
            {/* Medication Reminders Tab */}
            <div 
              className={`notification-tab-item ${activeTab === 'reminders' ? 'active' : ''}`}
              onClick={() => handleTabClick('reminders')}
            >
              <span className="material-symbols-outlined">medication</span>
              <span>Medication Reminders</span>
              {reminderCount > 0 && (
                <span className="notification-item-badge">{reminderCount}</span>
              )}
            </div>

            {/* Reminders List */}
            {activeTab === 'reminders' && (
              <div className="notification-list">
                {loadingReminders ? (
                  <div className="notification-loading">Loading...</div>
                ) : reminders.length > 0 ? (
                  reminders.map(reminder => (
                    <div key={reminder.notificationID} className={`notification-list-item ${!reminder.isRead ? 'unread' : ''}`}>
                      <div className="notification-content">
                        <p className="notification-message" style={{ whiteSpace: 'pre-line' }}>{reminder.message}</p>
                        <span className="notification-time">{formatDate(reminder.createdAt)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="notification-empty">No medication reminders</div>
                )}
              </div>
            )}

            {/* Appointment Notifications Tab */}
            <div 
              className={`notification-tab-item ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => handleTabClick('notifications')}
            >
              <span className="material-symbols-outlined">event</span>
              <span>Appointment Notifications</span>
              {notificationCount > 0 && (
                <span className="notification-item-badge">{notificationCount}</span>
              )}
            </div>

            {/* Notifications List */}
            {activeTab === 'notifications' && (
              <div className="notification-list">
                {loadingNotifications ? (
                  <div className="notification-loading">Loading...</div>
                ) : notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div key={notification.notificationID} className={`notification-list-item ${!notification.isRead ? 'unread' : ''}`}>
                      <div className="notification-content">
                        <p className="notification-message">{notification.message}</p>
                        <span className="notification-time">{formatDate(notification.createdAt)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="notification-empty">No appointment notifications</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
