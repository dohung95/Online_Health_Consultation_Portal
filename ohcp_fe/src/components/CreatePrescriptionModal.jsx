import React, { useState } from 'react';
import { prescriptionService } from '../api/prescriptionApi';
import './Css/PrescriptionModal.css';

const CreatePrescriptionModal = ({ isOpen, onClose, appointment, patient }) => {
  const [currentMedicine, setCurrentMedicine] = useState({
    medicationName: '',
    dosage: '',
    quantity: '',
    instructions: '',
    totalSupplyDays: 0
  });

  const [prescriptionItems, setPrescriptionItems] = useState([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Helper to calculate age
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentMedicine(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddMedicine = () => {
    // Validation
    if (!currentMedicine.medicationName.trim()) {
      setError('Please enter medicine name');
      return;
    }
    if (!currentMedicine.dosage.trim()) {
      setError('Please enter dosage');
      return;
    }
    if (!currentMedicine.quantity.trim()) {
      setError('Please enter quantity');
      return;
    }
    if (!currentMedicine.instructions.trim()) {
      setError('Please enter usage instructions');
      return;
    }
    if (!currentMedicine.totalSupplyDays || currentMedicine.totalSupplyDays <= 0) {
      setError('Please enter valid supply days');
      return;
    }

    // Add to list
    setPrescriptionItems(prev => [...prev, { ...currentMedicine, id: Date.now() }]);
    
    // Reset form
    setCurrentMedicine({
      medicationName: '',
      dosage: '',
      quantity: '',
      instructions: '',
      totalSupplyDays: 0
    });
    setError('');
  };

  const handleRemoveMedicine = (id) => {
    setPrescriptionItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = async () => {
    if (prescriptionItems.length === 0) {
      setError('Please add at least one medication');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Get appointment ID and patient ID
      const appointmentId = appointment?.appointmentID;
      const patientId = patient?.patientID || appointment?.patientID;

      if (!appointmentId) {
        setError('Appointment ID not found');
        setIsSubmitting(false);
        return;
      }

      if (!patientId) {
        setError('Patient ID not found');
        setIsSubmitting(false);
        return;
      }
      
      const prescriptionData = {
        appointmentID: appointmentId,
        patientID: patientId,
        medications: prescriptionItems.map(item => ({
          medicationName: item.medicationName,
          dosage: item.dosage,
          instructions: item.instructions,
          totalSupplyDays: parseInt(item.totalSupplyDays)
        }))
      };

      console.log('Sending prescription data:', prescriptionData);

      await prescriptionService.createPrescription(prescriptionData);
      
      // Success - close modal and reset
      alert('Prescription created successfully!');
      handleClose();
    } catch (err) {
      console.error('Error creating prescription:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.title || err.response?.data?.message || 'Failed to create prescription. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPrescriptionItems([]);
    setCurrentMedicine({
      medicationName: '',
      dosage: '',
      quantity: '',
      instructions: '',
      totalSupplyDays: 0
    });
    setAdditionalNotes('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content-custom" onClick={(e) => e.stopPropagation()}>
        <div className="d-flex flex-column">
          
          {/* Modal Header */}
          <div className="d-flex align-items-center justify-content-between p-4 border-bottom border-gray-200 prescription-modal-header">
            <div className="d-flex flex-column gap-1">
              <h1 className="fs-4 fw-bold text-gray-800 mb-0">Write Prescription</h1>
              <p className="small text-gray-500 mb-0">
                Patient: {patient?.fullName || 'N/A'} - {calculateAge(patient?.dateOfBirth)} years - {appointment?.reason || 'N/A'}
              </p>
            </div>
            <button 
              className="btn p-2 rounded-circle border-0 bg-transparent text-gray-500"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          {/* Modal Body */}
          <div className="p-4 d-flex flex-column gap-4">
            
            {/* Error Message */}
            {error && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                {error}
                <button type="button" className="btn-close" onClick={() => setError('')}></button>
              </div>
            )}

            {/* Add Medicine Form */}
            <div className="p-3 p-md-4 border border-gray-200 rounded-3 bg-white">
              <div className="row g-3 align-items-start">
                {/* Medicine Name */}
                <div className="col-12 col-lg-6">
                  <label className="d-flex flex-column w-100">
                    <p className="text-text-light-primary small fw-medium mb-2">Medicine Name *</p>
                    <input 
                      className="form-control prescription-form-control" 
                      placeholder="Enter medicine name..." 
                      name="medicationName"
                      value={currentMedicine.medicationName}
                      onChange={handleInputChange}
                    />
                  </label>
                </div>
                
                {/* Dosage */}
                <div className="col-6 col-lg-3">
                  <label className="d-flex flex-column w-100">
                    <p className="text-text-light-primary small fw-medium mb-2">Dosage *</p>
                    <input 
                      className="form-control prescription-form-control" 
                      placeholder="e.g. 500mg" 
                      name="dosage"
                      value={currentMedicine.dosage}
                      onChange={handleInputChange}
                    />
                  </label>
                </div>
                
                {/* Quantity */}
                <div className="col-6 col-lg-3">
                  <label className="d-flex flex-column w-100">
                    <p className="text-text-light-primary small fw-medium mb-2">Quantity *</p>
                    <input 
                      className="form-control prescription-form-control" 
                      placeholder="e.g. 20 pills" 
                      name="quantity"
                      value={currentMedicine.quantity}
                      onChange={handleInputChange}
                    />
                  </label>
                </div>

                {/* Supply Days */}
                <div className="col-12 col-lg-4">
                  <label className="d-flex flex-column w-100">
                    <p className="text-text-light-primary small fw-medium mb-2">Total Supply Days *</p>
                    <input 
                      type="number"
                      className="form-control prescription-form-control" 
                      placeholder="e.g. 7" 
                      name="totalSupplyDays"
                      value={currentMedicine.totalSupplyDays || ''}
                      onChange={handleInputChange}
                      min="1"
                    />
                  </label>
                </div>

                {/* Frequency/Usage */}
                <div className="col-12 col-lg-6">
                  <label className="d-flex flex-column w-100">
                    <p className="text-text-light-primary small fw-medium mb-2">Frequency/Usage *</p>
                    <input 
                      className="form-control prescription-form-control" 
                      placeholder="e.g. Morning 1 pill, Evening 1 pill after meal" 
                      name="instructions"
                      value={currentMedicine.instructions}
                      onChange={handleInputChange}
                    />
                  </label>
                </div>

                {/* Add button */}
                <div className="col-12 col-lg-2 d-grid align-self-end">
                  <button 
                    className="btn btn-add-medicine d-flex align-items-center justify-content-center gap-2 px-3 fw-semibold"
                    onClick={handleAddMedicine}
                    type="button"
                  >
                    <span className="material-symbols-outlined small">add_circle</span>
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Prescription List */}
            {prescriptionItems.length > 0 && (
              <div className="d-flex flex-column gap-3">
                <h3 className="fs-6 fw-semibold text-gray-700 mb-0">Current Prescription</h3>
                <div className="overflow-auto border border-gray-200 rounded-3">
                  <table className="table table-borderless table-striped align-middle mb-0 prescription-table">
                    <thead className="prescription-table-header">
                      <tr>
                        <th className="px-3 py-3" scope="col">No.</th>
                        <th className="px-3 py-3" scope="col">Medicine Name</th>
                        <th className="px-3 py-3" scope="col">Dose & Qty</th>
                        <th className="px-3 py-3" scope="col">Supply Days</th>
                        <th className="px-3 py-3" scope="col">Usage</th>
                        <th className="px-3 py-3 text-end" scope="col"><span className="visually-hidden">Action</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescriptionItems.map((item, index) => (
                        <tr key={item.id}>
                          <td className="px-3 py-3 prescription-table-body-row-medium">{index + 1}</td>
                          <td className="px-3 py-3 prescription-table-body-row-medium">{item.medicationName}</td>
                          <td className="px-3 py-3 text-gray-500">{item.dosage} - {item.quantity}</td>
                          <td className="px-3 py-3 text-gray-500">{item.totalSupplyDays} days</td>
                          <td className="px-3 py-3 text-gray-500">{item.instructions}</td>
                          <td className="px-3 py-3 text-end">
                            <button 
                              className="btn-delete-medicine"
                              onClick={() => handleRemoveMedicine(item.id)}
                              type="button"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Notes section */}
            <div>
              <label className="d-flex flex-column w-100">
                <p className="text-text-light-primary small fw-medium mb-2">Instructions / Additional Notes</p>
                <textarea 
                  className="form-control" 
                  rows="4" 
                  placeholder="Enter notes if any..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                ></textarea>
              </label>
            </div>
          </div>
          
          {/* Modal Footer */}
          <div className="d-flex align-items-center justify-content-end gap-3 p-4 border-top border-gray-200 prescription-modal-footer rounded-bottom-3">
            <button 
              className="btn btn-sm px-4 py-2 fw-semibold text-gray-700 bg-white border border-gray-300"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              className="btn btn-sm px-4 py-2 fw-semibold text-white btn-add-medicine"
              onClick={handleSubmit}
              disabled={isSubmitting || prescriptionItems.length === 0}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : (
                'Save Prescription'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePrescriptionModal;
