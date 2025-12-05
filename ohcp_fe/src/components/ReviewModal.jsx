import React from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';

const RatingStars = ({ rating }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} className={i <= rating ? 'text-warning' : 'text-muted'}>
        ★
      </span>
    );
  }
  return <>{stars}</>;
};

const ReviewModal = ({ show, onHide, review }) => {
  if (!review) return null;

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton className="border-bottom">
        <Modal.Title className="fw-bold">Review Details</Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="p-4">
        <Row className="g-4">
          <Col md={6}>
            <div className="d-flex flex-column gap-2">
              <p className="text-muted small mb-0">Review ID</p>
              <p className="fw-semibold text-dark mb-0">#{review.reviewID}</p>
            </div>
          </Col>
          
          <Col md={6}>
            <div className="d-flex flex-column gap-2">
              <p className="text-muted small mb-0">Submitted Date</p>
              <p className="fw-semibold text-dark mb-0">
                {new Date(review.reviewDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </Col>
          
          <Col md={6}>
            <div className="d-flex flex-column gap-2">
              <p className="text-muted small mb-0">Patient</p>
              <p className="fw-semibold text-dark mb-0">
                {review.patient?.fullName || 'Anonymous'}
              </p>
            </div>
          </Col>
          
          <Col md={6}>
            <div className="d-flex flex-column gap-2">
              <p className="text-muted small mb-0">Rating Score</p>
              <div className="d-flex align-items-center gap-2">
                <div className="fs-5">
                  <RatingStars rating={review.rating} />
                </div>
                <span className="fw-semibold text-dark">({review.rating}.0)</span>
              </div>
            </div>
          </Col>
          
          <Col xs={12}>
            <div className="d-flex flex-column gap-2">
              <p className="text-muted small mb-0">Comment</p>
              <p className="text-dark mb-0" style={{ lineHeight: '1.6' }}>
                {review.comment || 'No comment provided'}
              </p>
            </div>
          </Col>
        </Row>
      </Modal.Body>
      
      <Modal.Footer className="bg-light border-top">
        <Button variant="outline-secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReviewModal;
