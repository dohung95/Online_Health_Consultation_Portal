import React from 'react';
import { useAuth } from '../context/AuthContext'; // Import hook của bạn

// Thêm CSS (hoặc dùng file CSS riêng) để nó nổi lên
const modalStyles = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '20px',
    background: 'white',
    border: '1px solid black',
    borderRadius: '8px',
    zIndex: 9999, // Đảm bảo nó nổi lên trên
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
};

export default function IncomingCallModal() {
    // 1. Lắng nghe 'incomingCall' từ AuthContext
    const { incomingCall, acceptCall, declineCall, roles } = useAuth();

    // 2. Nếu không có ai gọi, component này "vô hình" (trả về null)
    if (!incomingCall) {
        return null;
    }

    // === XÁC ĐỊNH XEM NGƯỜI GỌI CÓ PHẢI BÁC SĨ KHÔNG ===
    // Nếu người nhận là bệnh nhân → người gọi là bác sĩ
    const isPatient = roles && roles.some(r => String(r).trim().toLowerCase() === 'patient');
    const callerIsDoctor = incomingCall.callerType === 'doctor' || isPatient;

    // 3. Nếu CÓ cuộc gọi, hiển thị Modal
    return (
        <div style={modalStyles}>
            <h4>Incoming Call!</h4>
            {/* Hiển thị tên người gọi */}
            <p>
                From: {callerIsDoctor ? `Dr. ${incomingCall.callerName}` : incomingCall.callerName}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <button
                    onClick={acceptCall} // <-- Gọi hàm "Bắt máy" từ Context
                    style={{ backgroundColor: 'green', color: 'white', border: 'none', padding: '10px' }}
                >
                    Accept
                </button>
                <button
                    onClick={declineCall} // <-- Gọi hàm "Từ chối" từ Context
                    style={{ backgroundColor: 'red', color: 'white', border: 'none', padding: '10px' }}
                >
                    Decline
                </button>
            </div>
        </div>
    );
}