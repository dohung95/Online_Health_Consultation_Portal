import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { collection, query, orderBy, limit, addDoc, serverTimestamp, onSnapshot, where, doc, setDoc } from "firebase/firestore";
import getBotResponse from '../AI_BOT/BotBrain';
import { getGeminiResponse } from '../services/geminiService';
import { toast } from 'sonner';

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

    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

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
    // Người chưa đăng nhập vẫn thấy icon chat (chỉ chat với Bot)
    const isGuest = !csharpUser || !firebaseUser;

    // LOGIC load list
    useEffect(() => {
        // Nếu là Guest (chưa đăng nhập), set partner là Bot
        if (isGuest) {
            setChatPartner(BOT_USER);
            return; // Dừng lại, không load danh sách
        }

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
    }, [firebaseUser, isDoctor, isPatient, roles, isGuest]);

    // Listen
    useEffect(() => {
        if (chatPartner) {

            // Nếu là Guest và đang chat với Bot, không cần load từ DB
            if (isGuest && chatPartner.uid === BOT_USER.uid) {
                setMessages([]); // Khởi tạo mảng rỗng
                setLoading(false);
                return;
            }

            // Nếu là Guest nhưng chatPartner không phải Bot, chặn lại
            if (isGuest) {
                return;
            }

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
    }, [firebaseUser, chatPartner, isGuest]);

    /// connect with bot chat AI
    // === HÀM GỬI TIN NHẮN (ĐÃ SỬA LOGIC) ===
    const sendMessage = async (e) => {
        e.preventDefault();

        if (!formValue || !chatPartner) return;

        // 1. Lấy thông tin người gửi (LẤY CẢ 'displayName')
        const uid = isGuest ? 'guest_temp_id' : firebaseUser.uid;
        const photoURL = isGuest ? 'https://api.dicebear.com/8.x/avataaars/svg?seed=guest' : firebaseUser.photoURL;
        const myUid = uid.replace(/-/g, '');
        const targetUid = chatPartner.uid.replace(/-/g, '');
        const displayName = isGuest ? "Guest" : (csharpUser.preferred_username || "User");

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

        if (isGuest && targetUid !== BOT_USER.uid) {
            toast.error('Please login to chat with doctors!');
            return;
        }

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

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            if (file.size > 300 * 1024) { // Giới hạn 300KB (base64 sẽ to hơn ~33%)
                toast.error('Image too large! Maximum 300KB');
                return;
            }
            setSelectedFile(file);
        } else {
            toast.error('Only image files are accepted!');
        }
    };

    const sendImage = async () => {
        if (!selectedFile || !firebaseUser || !chatPartner) return;
        if (chatPartner.uid === BOT_USER.uid) {
            toast.error('Cannot send image to Bot!');
            return;
        }

        setUploading(true);
        try {
            const { uid, photoURL } = firebaseUser;
            const myUid = uid.replace(/-/g, '');
            const targetUid = chatPartner.uid.replace(/-/g, '');
            const displayName = csharpUser.preferred_username || "User";

            // Chuyển file thành Base64
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const base64Image = e.target.result; // Data URL format: "data:image/png;base64,..."

                    // Kiểm tra kích thước sau khi convert
                    if (base64Image.length > 900 * 1024) { // ~900KB (để an toàn < 1MB của Firestore)
                        toast.error('Image too large after conversion! Please choose smaller image.');
                        setUploading(false);
                        return;
                    }

                    // Lưu tin nhắn vào Firestore
                    const chatRoomId = myUid < targetUid ? `${myUid}_${targetUid}` : `${targetUid}_${myUid}`;
                    const messagesRef = collection(db, "chats", chatRoomId, "messages");
                    const chatRoomRef = doc(db, "chats", chatRoomId);

                    await addDoc(messagesRef, {
                        text: '',
                        imageUrl: base64Image, // Lưu base64 trực tiếp
                        createdAt: serverTimestamp(),
                        uid: uid,
                        photoURL: photoURL
                    });

                    await setDoc(chatRoomRef, {
                        participants: [myUid, targetUid],
                        [targetUid]: {
                            displayName: chatPartner.displayName,
                            photoURL: chatPartner.photoURL
                        },
                        [myUid]: {
                            displayName: displayName,
                            photoURL: photoURL
                        },
                        lastMessage: '📷 [Image]',
                        lastMessageAt: serverTimestamp()
                    }, { merge: true });

                    // Reset
                    setSelectedFile(null);
                    setUploading(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                } catch (error) {
                    console.error('Error sending image:', error);
                    toast.error('Error sending image!');
                    setUploading(false);
                }
            };

            reader.onerror = () => {
                toast.error('Error reading file!');
                setUploading(false);
            };

            reader.readAsDataURL(selectedFile); // Chuyển file thành base64
        } catch (error) {
            console.error('Error sending image:', error);
            toast.error('Error sending image!');
            setUploading(false);
        }
    };

    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            if (item.type.startsWith('image/')) {
                // Kiểm tra nếu đang chat với Bot
                if (chatPartner.uid === BOT_USER.uid) {
                    toast.error('Can not send image to Bot!');
                    return;
                }
                e.preventDefault();

                const file = item.getAsFile();
                if (file) {
                    if (file.size > 300 * 1024) { // Giới hạn 300KB
                        toast.error('Image too large! Maximum 300KB');
                        return;
                    }
                    setSelectedFile(file);
                }
                break;
            }
        }
    };

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
    // if (!csharpUser || !firebaseUser) {
    //     return null;
    // }

    const selectDoctor = (doctor) => {
        setChatPartner(doctor);
        setShowDoctorListModal(false); // Đóng modal
    }

    return (
        <>
            {/* 1. Chat Icon - Only show when chat box is closed */}
            {!isChatBoxOpen && (
                <div
                    className="chat-icon bg-primary rounded-circle d-flex align-items-center justify-content-center shadow-lg"
                    style={styles.chatIcon}
                    onClick={() => setIsChatBoxOpen(true)}
                    title="Open Message"
                >
                    <i className="bi bi-chat-fill text-white" style={{ fontSize: '1.5rem' }}></i>
                </div>
            )}

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
                            {isGuest && `Chat with ${chatPartner.displayName}`}
                            {!isGuest && isDoctor && !chatPartner && "Patient List"}
                            {!isGuest && isDoctor && chatPartner && `Chat with ${chatPartner.displayName}`}
                            {!isGuest && isPatient && `Chat with Doctor ${chatPartner.displayName}`}
                        </h5>

                        <button
                            className="btn-close"
                            onClick={() => setIsChatBoxOpen(false)}
                            aria-label="Close"
                        ></button>
                    </div>

                    <div className="flex-grow-1 p-3 overflow-y-auto" style={{ backgroundColor: '#f8f9fa' }}>
                        {/* Guest chỉ thấy chat với Bot */}
                        {isGuest && chatPartner && (
                            <>
                                {messages.length === 0 && <p className="text-center text-muted">Say Hello to Bot!</p>}
                                {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
                                <div ref={scrollTo}></div>
                            </>
                        )}
                        {!isGuest && isDoctor && (
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

                        {!isGuest && isPatient && chatPartner && (
                            <>
                                {loading && <p className="text-center text-muted">Loading message...</p>}
                                {messages.length === 0 && !loading && <p className="text-center text-muted">Say Hello!</p>}
                                {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
                                <div ref={scrollTo}></div>
                            </>
                        )}
                    </div>

                    {((isGuest && chatPartner) || (isPatient && chatPartner) || (isDoctor && chatPartner)) && (
                        <div className="p-2 border-top">
                            {/* Hiển thị preview hình đã chọn */}
                            {selectedFile && (
                                <div className="mb-2 p-2 bg-light rounded d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center">
                                        {/* Preview thumbnail */}
                                        {selectedFile.type.startsWith('image/') && (
                                            <img
                                                src={URL.createObjectURL(selectedFile)}
                                                alt="preview"
                                                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', marginRight: '10px' }}
                                            />
                                        )}
                                        <small className="text-truncate">{selectedFile.name}</small>
                                    </div>
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => {
                                            setSelectedFile(null);
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            <form className="d-flex" onSubmit={sendMessage}>
                                {!isGuest && isPatient && (
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary me-2"
                                        onClick={() => setShowDoctorListModal(true)}
                                        title="Choice Doctors"
                                    >
                                        <i className="bi bi-person-lines-fill"></i>
                                    </button>
                                )}

                                {!isGuest && chatPartner.uid !== BOT_USER.uid && (
                                    <>
                                        {/* Input file ẩn */}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            style={{ display: 'none' }}
                                        />

                                        {/* Nút chọn hình */}
                                        <button
                                            type="button"
                                            className="btn btn-outline-primary me-2"
                                            onClick={() => fileInputRef.current?.click()}
                                            title="Send image"
                                            disabled={uploading}
                                        >
                                            <i className="bi bi-image"></i>
                                        </button>
                                    </>
                                )}

                                <input
                                    type="text"
                                    className="form-control"
                                    value={formValue}
                                    onChange={(e) => setFormValue(e.target.value)}
                                    onPaste={handlePaste}
                                    placeholder="Input text..."
                                    disabled={uploading}
                                />

                                {selectedFile ? (
                                    <button
                                        className="btn btn-success ms-2"
                                        type="button"
                                        onClick={sendImage}
                                        disabled={uploading}
                                    >
                                        {uploading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-1"></span>
                                                Sending...
                                            </>
                                        ) : (
                                            'Submit'
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-primary ms-2"
                                        type="submit"
                                        disabled={!formValue || uploading}
                                    >
                                        Submit
                                    </button>
                                )}
                            </form>
                        </div>
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
                                            <span className="fw-bold">Dr.{doc.displayName}</span>
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
    const currentUser = auth.currentUser;
    // Cho phép hiển thị message cho cả Guest

    const { text, imageUrl, uid, photoURL, createdAt } = props.message;

    // Guest check bằng uid tạm
    const isOwnMessage = currentUser
        ? uid === currentUser.uid
        : uid === 'guest_temp_id';

    const formattedTime = createdAt?.seconds
        ? new Date(createdAt.seconds * 1000).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
        : '...';

    return (
        <div className={`message d-flex mb-3 ${isOwnMessage ? 'justify-content-end' : 'justify-content-start'}`}>
            <div style={{ maxWidth: '70%' }}>
                <div
                    className={`p-2 rounded ${isOwnMessage ? 'bg-primary text-white' : 'bg-light text-dark border'}`}
                    style={{
                        borderRadius: imageUrl ? '12px' : '20px',
                        padding: imageUrl ? '4px' : '8px 16px'
                    }}
                >
                    {/* Hiển thị hình ảnh nếu có */}
                    {imageUrl && (
                        <img
                            src={imageUrl}
                            alt="sent"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '300px',
                                borderRadius: '8px',
                                display: 'block',
                                cursor: 'pointer'
                            }}
                            onClick={() => window.open(imageUrl, '_blank')}
                        />
                    )}
                    {/* Hiển thị text nếu có */}
                    {text && <div style={{ marginTop: imageUrl ? '8px' : '0' }}>{text}</div>}
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