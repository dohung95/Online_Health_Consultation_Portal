import React from 'react';

function Doctors() {
  return (
    <div className="section">
      <h2>Doctor Profiles</h2>
      <div className="doctor-profile">
        <h3>Dr. John Doe</h3>
        <p>Specialty: Cardiology | Experience: 10 years | Rating: 4.8/5</p>
        <p>Languages: English, Spanish</p>
      </div>
      <div className="form-group">
        <label>Filter by:</label>
        <select className="form-control">
          <option>Specialty</option>
          <option>Availability</option>
          <option>Language</option>
          <option>Location</option>
        </select>
      </div>
    </div>
  );
}

export default Doctors;