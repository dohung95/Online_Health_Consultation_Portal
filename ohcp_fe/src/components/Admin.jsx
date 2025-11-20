import Navbar from './Navbar';

function Admin() {
  return (
    <>
      <div>
        <div className='container'>
          <Navbar />
        </div>
        <div className="section">
          <h2>Admin Dashboard</h2>
          <p>Manage consultations and patient records.</p>
          <button className="btn btn-primary">View Consultations</button>
          <button className="btn btn-secondary ml-2">Update Records</button>
        </div>
      </div>
    </>
  );
}

export default Admin;