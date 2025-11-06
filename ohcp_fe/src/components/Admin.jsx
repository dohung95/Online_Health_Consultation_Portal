import React from 'react';

function Admin() {
  return (
    <div className="section">
      <h2>Admin Dashboard</h2>
      <p>Manage consultations and patient records.</p>
      <button className="btn btn-primary">View Consultations</button>
      <button className="btn btn-secondary ml-2">Update Records</button>
    </div>
  );
}

export default Admin;