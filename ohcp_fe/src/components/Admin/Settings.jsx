import React, { useState } from "react";
import NavbarAdmin from "./NavbarAdmin";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Admin.css";

export default function Settings() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <NavbarAdmin
      sidebarCollapsed={sidebarCollapsed}
      onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
    >
      <main className="admin-content p-4">
          <h2 className="mb-4">Settings</h2>

          <div className="row g-4">
            {/* General Settings */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white">
                  <h5 className="mb-0">
                    <i className="bi bi-gear-fill text-primary me-2"></i>
                    General Settings
                  </h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label">System Name</label>
                    <input type="text" className="form-control" defaultValue="Online Health Consultation Portal" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">System Email</label>
                    <input type="email" className="form-control" defaultValue="admin@ohcp.com" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Timezone</label>
                    <select className="form-select">
                      <option>GMT+7 (Bangkok, Hanoi, Jakarta)</option>
                      <option>GMT+8 (Singapore, Hong Kong)</option>
                      <option>GMT+9 (Tokyo, Seoul)</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Language</label>
                    <select className="form-select">
                      <option>English</option>
                      <option>Tiếng Việt</option>
                    </select>
                  </div>
                  <button className="btn btn-primary">
                    <i className="bi bi-save me-2"></i>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>

            {/* Appointment Settings */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white">
                  <h5 className="mb-0">
                    <i className="bi bi-calendar-check-fill text-success me-2"></i>
                    Appointment Settings
                  </h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label">Default Appointment Duration (minutes)</label>
                    <input type="number" className="form-control" defaultValue="30" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Booking Advance Time (days)</label>
                    <input type="number" className="form-control" defaultValue="14" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Cancellation Policy (hours before)</label>
                    <input type="number" className="form-control" defaultValue="24" />
                  </div>
                  <div className="mb-3 form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="autoConfirm" defaultChecked />
                    <label className="form-check-label" htmlFor="autoConfirm">
                      Auto-confirm appointments
                    </label>
                  </div>
                  <button className="btn btn-success">
                    <i className="bi bi-save me-2"></i>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white">
                  <h5 className="mb-0">
                    <i className="bi bi-bell-fill text-warning me-2"></i>
                    Notification Settings
                  </h5>
                </div>
                <div className="card-body">
                  <div className="mb-3 form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="emailNotif" defaultChecked />
                    <label className="form-check-label" htmlFor="emailNotif">
                      Email Notifications
                    </label>
                  </div>
                  <div className="mb-3 form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="smsNotif" defaultChecked />
                    <label className="form-check-label" htmlFor="smsNotif">
                      SMS Notifications
                    </label>
                  </div>
                  <div className="mb-3 form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="pushNotif" defaultChecked />
                    <label className="form-check-label" htmlFor="pushNotif">
                      Push Notifications
                    </label>
                  </div>
                  <div className="mb-3 form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="appointmentReminder" defaultChecked />
                    <label className="form-check-label" htmlFor="appointmentReminder">
                      Appointment Reminders
                    </label>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Reminder Time Before Appointment (hours)</label>
                    <input type="number" className="form-control" defaultValue="2" />
                  </div>
                  <button className="btn btn-warning">
                    <i className="bi bi-save me-2"></i>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white">
                  <h5 className="mb-0">
                    <i className="bi bi-shield-fill-check text-danger me-2"></i>
                    Security Settings
                  </h5>
                </div>
                <div className="card-body">
                  <div className="mb-3 form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="twoFactor" />
                    <label className="form-check-label" htmlFor="twoFactor">
                      Enable Two-Factor Authentication
                    </label>
                  </div>
                  <div className="mb-3 form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="sessionTimeout" defaultChecked />
                    <label className="form-check-label" htmlFor="sessionTimeout">
                      Auto Logout on Inactivity
                    </label>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Session Timeout (minutes)</label>
                    <input type="number" className="form-control" defaultValue="30" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Minimum Password Length</label>
                    <input type="number" className="form-control" defaultValue="8" />
                  </div>
                  <div className="mb-3 form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="passwordExpiry" defaultChecked />
                    <label className="form-check-label" htmlFor="passwordExpiry">
                      Password Expiry (90 days)
                    </label>
                  </div>
                  <button className="btn btn-danger">
                    <i className="bi bi-save me-2"></i>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>

            {/* Payment Settings */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white">
                  <h5 className="mb-0">
                    <i className="bi bi-credit-card-fill text-info me-2"></i>
                    Payment Settings
                  </h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label">Default Consultation Fee (VND)</label>
                    <input type="number" className="form-control" defaultValue="500000" />
                  </div>
                  <div className="mb-3 form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="onlinePayment" defaultChecked />
                    <label className="form-check-label" htmlFor="onlinePayment">
                      Enable Online Payment
                    </label>
                  </div>
                  <div className="mb-3 form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="cashPayment" defaultChecked />
                    <label className="form-check-label" htmlFor="cashPayment">
                      Enable Cash Payment
                    </label>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Tax Rate (%)</label>
                    <input type="number" className="form-control" defaultValue="10" />
                  </div>
                  <button className="btn btn-info">
                    <i className="bi bi-save me-2"></i>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>

            {/* System Maintenance */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white">
                  <h5 className="mb-0">
                    <i className="bi bi-tools text-secondary me-2"></i>
                    System Maintenance
                  </h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <button className="btn btn-outline-primary w-100 mb-2">
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Clear Cache
                    </button>
                    <button className="btn btn-outline-success w-100 mb-2">
                      <i className="bi bi-download me-2"></i>
                      Backup Database
                    </button>
                    <button className="btn btn-outline-warning w-100 mb-2">
                      <i className="bi bi-upload me-2"></i>
                      Restore Database
                    </button>
                    <button className="btn btn-outline-info w-100 mb-2">
                      <i className="bi bi-file-earmark-text me-2"></i>
                      View System Logs
                    </button>
                    <button className="btn btn-outline-danger w-100">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      Maintenance Mode
                    </button>
                  </div>
                  <div className="alert alert-info mb-0">
                    <small>
                      <i className="bi bi-info-circle me-2"></i>
                      Last backup: 2024-01-26 02:00 AM
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
    </NavbarAdmin>
  );
}
