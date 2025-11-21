import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { collection, query, orderBy, limit, addDoc, serverTimestamp, onSnapshot, where, doc, setDoc } from "firebase/firestore";
import getBotResponse from '../AI_BOT/BotBrain';
import { getGeminiResponse } from '../services/geminiService';

const usersRef = collection(db, "users");

const BOT_USER = {
    uid: "support_bot_001",
    displayName: "Bot Chat AI",
    photoURL: "https://api.dicebear.com/8.x/bottts/svg?seed=support"
};

const styles = {
    chatIcon: {
        position: 'fixed',
        bottom: '70px',
        right: '20px',
        width: '60px',
        height: '60px',
        cursor: 'pointer',
        zIndex: 1000,
        transition: 'transform 0.2s',
    },
    chatBox: {
        position: 'fixed',
        bottom: '100px',
        right: '30px',
        width: '350px',
        height: '500px',
        zIndex: 999,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    }
};

export default function Chat() {
    const [formValue, setFormValue] = useState('');
    const scrollTo = useRef(null);
    const [messages, setMessages] = useState([]);

    const [userList, setUserList] = useState([]);
    const [doctorList, setDoctorList] = useState([]);

    // Use Context instead of local state
    const {
        isChatOpen: isChatBoxOpen,
        setIsChatOpen: setIsChatBoxOpen,
        selectedChatPartner: chatPartner,
        setSelectedChatPartner: setChatPartner
    } = useChat();

    const [loading, setLoading] = useState(false);
    // const [isChatBoxOpen, setIsChatBoxOpen] = useState(false); // Removed local state

    // State new for "mini-menu"
    const [showDoctorListModal, setShowDoctorListModal] = useState(false);

    // take USER VÀ ROLES
    const { user: csharpUser, roles } = useAuth();
    const [firebaseUser, setFirebaseUser] = useState(auth.currentUser);

    //const [doc, setDoc] = useState([])

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setFirebaseUser(user);
        });
        return unsubscribe;
    }, []);

    // Listen for custom event to open chat with pre-filled message
    useEffect(() => {
        const handleOpenChat = (event) => {
            const { message } = event.detail || {};
            setIsChatBoxOpen(true);
            if (message) {
                setFormValue(message);
            }
        };

        window.addEventListener('openChatWithMessage', handleOpenChat);
        return () => window.removeEventListener('openChatWithMessage', handleOpenChat);
    }, []);

    const isPatient = roles?.includes('patient');
    const isDoctor = roles?.includes('doctor');

    // LOGIC load list
    useEffect(() => {
        if (firebaseUser) {
            if (isPatient) {
                // Only set default bot if no partner is selected yet
                if (!chatPartner) {
                    setChatPartner(BOT_USER);
                }

                // load list doctor
                const qDoctors = query(usersRef, where("role", "==", "doctor"));
                const unsubDoctors = onSnapshot(qDoctors, (snapshot) => {
                    setDoctorList(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
                });
                return unsubDoctors; //clear
            }
            // 2. DOCTOR: load list patient
            else if (isDoctor) {
                const qPatients = query(usersRef, where("role", "==", "patient"));
                const unsubPatients = onSnapshot(qPatients, (snapshot) => {
                    setUserList(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
                });
                return unsubPatients;
            }
        }
    }, [firebaseUser, isDoctor, isPatient, roles]);

    // Listen
    useEffect(() => {
        if (firebaseUser && chatPartner) {
            setLoading(true);

            const myUid = firebaseUser.uid.replace(/-/g, '');
            const targetUid = chatPartner.uid.replace(/-/g, '');
            const chatRoomId = myUid < targetUid ? `${myUid}_${targetUid}` : `${targetUid}_${myUid}`;

            const messagesCollectionRef = collection(db, "chats", chatRoomId, "messages");
            const q = query(messagesCollectionRef, orderBy("createdAt"), limit(50));

            const unsubscribe = onSnapshot(q, (snapshot) => {
                setMessages(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
                setLoading(false);
            });

            return unsubscribe;
        }
    }, [firebaseUser, chatPartner]);

    /// connect with bot chat AI
    // === HÀM GỬI TIN NHẮN (ĐÃ SỬA LOGIC) ===
    const sendMessage = async (e) => {
        e.preventDefault();

        if (!firebaseUser || !formValue || !chatPartner) return;

        // 1. Lấy thông tin người gửi (LẤY CẢ 'displayName')
        const { uid, photoURL } = firebaseUser;
        const myUid = uid.replace(/-/g, '');
        const targetUid = chatPartner.uid.replace(/-/g, '');

        const displayName = csharpUser.preferred_username || "User";

        // 2. TẠO TIN NHẮN CỦA USER
        // (Chúng ta tạo object này trước để cập nhật UI ngay lập tức)
        const userMessage = {
            id: Date.now().toString(), // Tạo ID tạm
            text: formValue,
            createdAt: new Date(), // Dùng giờ local cho Bot
            uid: uid,
            photoURL: photoURL
        };

        // 3. CẬP NHẬT UI NGAY LẬP TỨC
        setMessages(prev => [...prev, userMessage]);
        const currentMessageText = formValue; // Lưu lại tin nhắn
        setFormValue('');

        // (Chúng ta cuộn xuống sau khi Bot trả lời, hoặc sau khi gửi)

        // 4. LOGIC RẼ NHÁNH
        if (targetUid === BOT_USER.uid) {
            // === LOGIC CHO BOT (KHÔNG LƯU DB) ===

            // Bot "suy nghĩ" với Gemini AI (tự động fallback nếu lỗi)
            const botReplyText = await getGeminiResponse(currentMessageText, []);

            // Giả lập Bot đang gõ (1 giây)
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Bot trả lời
            const botMessage = {
                id: Date.now().toString() + "_bot",
                text: botReplyText,
                createdAt: new Date(),
                uid: BOT_USER.uid,
                photoURL: BOT_USER.photoURL
            };
            setMessages(prev => [...prev, botMessage]);

        } else {
            // === LOGIC CHO NGƯỜI THẬT (LƯU VÀO DB) ===

            // Tạo ID phòng chat 1-1 (đã sắp xếp)
            const chatRoomId = myUid < targetUid ? `${myUid}_${targetUid}` : `${targetUid}_${myUid}`;
            const messagesRef = collection(db, "chats", chatRoomId, "messages");
            const chatRoomRef = doc(db, "chats", chatRoomId); // Ref cho "cuộc hội thoại"

            // 5. Ghi tin nhắn thật vào DB (dùng server time)
            await addDoc(messagesRef, {
                text: currentMessageText,
                createdAt: serverTimestamp(), // Dùng giờ server
                uid: uid,
                photoURL: photoURL
            });

            // 6. Cập nhật "cuộc hội thoại" (cho Bác sĩ sắp xếp)
            await setDoc(chatRoomRef, {
                participants: [myUid, targetUid],
                [targetUid]: {
                    displayName: chatPartner.displayName,
                    photoURL: chatPartner.photoURL
                },
                [myUid]: {
                    displayName: displayName, // (displayName từ firebaseUser)
                    photoURL: photoURL
                },
                lastMessage: currentMessageText,
                lastMessageAt: serverTimestamp()
            }, { merge: true }); // 'merge: true' = Cập nhật, không ghi đè
        }

        // 7. Cuộn xuống sau khi mọi việc hoàn tất
        if (scrollTo.current) {
            scrollTo.current.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // scroll message
    useEffect(() => {
        if (scrollTo.current) {
            scrollTo.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isChatBoxOpen]);

    const FormatTime = (timestamp) => {
        if (!timestamp) return "...";
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    /// template

    // no login, no see anything
    if (!csharpUser || !firebaseUser) {
        return null;
    }

    const selectDoctor = (doctor) => {
        setChatPartner(doctor);
        setShowDoctorListModal(false); // Đóng modal
    }

    return (
        <>
            <div
                className="chat-icon bg-primary rounded-circle d-flex align-items-center justify-content-center shadow-lg"
                style={styles.chatIcon}
                onClick={() => setIsChatBoxOpen(!isChatBoxOpen)}
                title="Open Message"
            >
                <i className="bi bi-chat-fill text-white" style={{ fontSize: '1.5rem' }}></i>
            </div>

            {/* 2. Chat Box (popup) */}
            {isChatBoxOpen && (
                <div
                    className="chat-box container d-flex flex-column border rounded shadow-lg bg-white"
                    style={styles.chatBox}
                >
                    {/* Header */}
                    <div className="p-3 border-bottom bg-light d-flex justify-content-between align-items-center">
                        {isDoctor && chatPartner && (
                            <button
                                className="btn btn-sm btn-link text-decoration-none"
                                onClick={() => setChatPartner(null)}
                            >
                                &lt; go back
                            </button>
                        )}

                        <h5 className="mb-0 fs-6">
                            {isDoctor && !chatPartner && "Patient List"}
                            {isDoctor && chatPartner && `Chat with ${chatPartner.displayName}`}
                            {isPatient && `Chat with ${chatPartner.displayName}`}
                        </h5>

                        <button
                            className="btn-close"
                            onClick={() => setIsChatBoxOpen(false)}
                            aria-label="Close"
                        ></button>
                    </div>

                    <div className="flex-grow-1 p-3 overflow-y-auto" style={{ backgroundColor: '#f8f9fa' }}>
                        {isDoctor && (
                            <>
                                {!chatPartner ? (
                                    <ul className="list-group list-group-flush">
                                        {userList.length === 0 && <li className="list-group-item">No patient list.</li>}
                                        {userList.map(u => (
                                            <li
                                                key={u.id}
                                                onClick={() => setChatPartner(u)}
                                                className="list-group-item list-group-item-action d-flex align-items-center"
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <img
                                                    src={u.photoURL || 'https://api.dicebear.com/8.x/initials/svg?seed=' + u.displayName}
                                                    alt="ava"
                                                    className="rounded-circle me-2"
                                                    style={{ width: 40, height: 40 }}
                                                />
                                                <span className="fw-bold">{u.displayName}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <>
                                        {loading && <p className="text-center text-muted">Loading message...</p>}
                                        {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
                                        <div ref={scrollTo}></div>
                                    </>
                                )}
                            </>
                        )}

                        {isPatient && chatPartner && (
                            <>
                                {loading && <p className="text-center text-muted">Loading message...</p>}
                                {messages.length === 0 && !loading && <p className="text-center text-muted">Say Hello!</p>}
                                {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
                                <div ref={scrollTo}></div>
                            </>
                        )}
                    </div>

                    {((isPatient && chatPartner) || (isDoctor && chatPartner)) && (
                        <form className="d-flex p-2 border-top" onSubmit={sendMessage}>
                            {isPatient && (
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary me-2"
                                    onClick={() => setShowDoctorListModal(true)}
                                    title="Choice Doctors"
                                >
                                    <i className="bi bi-person-lines-fill"></i>
                                </button>
                            )}
                            <input
                                type="text"
                                className="form-control"
                                value={formValue}
                                onChange={(e) => setFormValue(e.target.value)}
                                placeholder="Input text..."
                                onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(e); } }}
                            />
                            <button
                                className="btn btn-primary ms-2"
                                type="submit"
                                disabled={!formValue}
                            >
                                Submit
                            </button>
                        </form>
                    )}

                    {isPatient && showDoctorListModal && (
                        <div style={styles.doctorModal}>
                            <div className="card shadow-lg " style={{ width: '100%', marginBottom: '10px' }}>
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0 fs-6">Choice Doctors</h5>
                                    <button className="btn-close" onClick={() => setShowDoctorListModal(false)}></button>
                                </div>
                                <ul className="list-group list-group-flush" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    <li
                                        onClick={() => selectDoctor(BOT_USER)}
                                        className="list-group-item list-group-item-action d-flex align-items-center"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <img
                                            src={BOT_USER.photoURL}
                                            alt="ava"
                                            className="rounded-circle me-2"
                                            style={{ width: 40, height: 40 }}
                                        />
                                        <span className="fw-bold">{BOT_USER.displayName}</span>
                                    </li>
                                    {doctorList.map(doc => (
                                        <li
                                            key={doc.id}
                                            onClick={() => selectDoctor(doc)}
                                            className="list-group-item list-group-item-action d-flex align-items-center"
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <img
                                                src={doc.photoURL || 'https://api.dicebear.com/8.x/initials/svg?seed=' + doc.displayName}
                                                alt="ava"
                                                className="rounded-circle me-2"
                                                style={{ width: 40, height: 40 }}
                                            />
                                            <span className="fw-bold">{doc.displayName}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                </div>
            )}
        </>
    )
}

function ChatMessage(props) {
    if (!auth.currentUser) return null;

    const { text, uid, photoURL, createdAt } = props.message;

    const isOwnMessage = uid === auth.currentUser.uid;
    const messageClass = isOwnMessage ? 'sent' : 'received';

    const formattedTime = createdAt?.seconds
        ? new Date(createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
        : '...';

    return (
        <div className={`message d-flex mb-2 ${isOwnMessage ? 'justify-content-end' : 'justify-content-start'}`}>
            <div style={{ maxWidth: '70%' }}>
                <div
                    className={`p-2 px-3 rounded-pill ${isOwnMessage ? 'bg-primary text-white' : 'bg-light text-dark border'}`}
                >
                    {text}
                </div>
                <div
                    className={`small text-muted mt-1 ${isOwnMessage ? 'text-end' : 'text-start'}`}
                >
                    {formattedTime}
                </div>

            </div>
        </div>
    );
}