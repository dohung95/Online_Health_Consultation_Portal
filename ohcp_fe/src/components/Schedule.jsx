import React from 'react';

function Schedule() {
  return (
    <div className="section">
      <h2>Virtual Consultation Scheduling</h2>
      <p>Browse and select from available doctors (general practitioners, specialists).</p>
      <div className="form-group">
        <label>Preferred Date & Time:</label>
        <input type="datetime-local" className="form-control" />
      </div>
      <div className="form-group">
        <label>Consultation Type:</label>
        <select className="form-control">
          <option>Video Call</option>
          <option>Audio Call</option>
          <option>Chat</option>
        </select>
      </div>
      <button className="btn btn-primary">Schedule</button>
      <button className="btn btn-secondary ml-2">Reschedule/Cancel</button>
    </div>
  );
}

export default Schedule;