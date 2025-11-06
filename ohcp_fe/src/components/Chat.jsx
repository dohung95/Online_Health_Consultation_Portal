import React from 'react';

function Chat() {
  return (
    <div className="section">
      <h2>Chat & Text Communication</h2>
      <p>Ask questions or discuss non-urgent matters.</p>
      <div className="form-group">
        <textarea className="form-control" placeholder="Type your message..."></textarea>
      </div>
      <button className="btn btn-primary">Send</button>
    </div>
  );
}

export default Chat;