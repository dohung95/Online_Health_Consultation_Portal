import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <h2>Something went wrong: {this.state.error.message}</h2>;
    }
    return this.props.children;
  }
}

function Dashboard() {
  const [consultations, setConsultations] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get('https://localhost:7267/api/HealthConsultation') // Đường dẫn tuyệt đối
      .then(response => {
        console.log('Response data:', response.data); // Debug
        setConsultations(Array.isArray(response.data) ? response.data : []);
        setError(null);
      })
      .catch(error => {
        console.error('Error fetching data:', error); // Log chi tiết
        setError(error.message);
      });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .post('https://localhost:7267/api/HealthConsultation', { Name: name, Description: description }) // Tuyệt đối
      .then(response => {
        setConsultations(prevConsultations => [...prevConsultations, response.data]);
        setError(null);
      })
      .catch(error => {
        console.error('Error submitting data:', error);
        setError(error.message);
      });
    setName('');
    setDescription('');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return isNaN(date) ? 'N/A' : date.toLocaleString();
  };

  return (
    <ErrorBoundary>
      <div className="App">
        <h1>Online Health Consultation Portal</h1>
        {error && <div style={{ color: 'red' }}>Error: {error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            required
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            required
          />
          <button type="submit">Add Consultation</button>
        </form>
        <h2>Consultations</h2>
        <ul>
          {consultations.map(consultation => (
            <li key={consultation.Id}>
              {consultation.name} - {consultation.description} ({formatDate(consultation.date)})
            </li>
          ))}
        </ul>
      </div>
    </ErrorBoundary>
  );
}

export default Dashboard;