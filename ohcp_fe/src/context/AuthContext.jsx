import React, { createContext, useContext, useState, useEffect } from "react";
import { login as loginAPI, register as registerAPI, logout as logoutAPI, setupAxiosInterceptors, getFirebaseTokenAPI } from '../api/auth';
import { decodeToken, getTokenExpiresIn } from '../utils/tokenUtils';

import { signInWithCustomToken, signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import * as signalR from "@microsoft/signalr";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [roles, setRoles] = useState([]);
    const [token, setToken] = useState(() => localStorage.getItem('token') || null)
    const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken') || null)
    const [tokenExpiry, setTokenExpiry] = useState(null);

    const [connection, setConnection] = useState(null); // Lưu trữ kết nối
    const [incomingCall, setIncomingCall] = useState(null);

    // Setup axios interceptors on mount
    useEffect(() => {
        setupAxiosInterceptors();
    }, []);

    // Update user and roles when token changes
    useEffect(() => {
        if (token) {
            const decoded = decodeToken(token);
            setUser(decoded);
            const expiresIn = getTokenExpiresIn(token);
            setTokenExpiry(expiresIn);
            // Extract roles from claims
            // JWT tokens may store roles in different formats
            let userRoles = [];

            // Try ClaimTypes.Role (full claim type name from ASP.NET Identity)
            const roleClaimType = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
            if (decoded?.[roleClaimType]) {
                const roleValue = decoded[roleClaimType];
                userRoles = Array.isArray(roleValue) ? roleValue : [roleValue];
            }
            // Try short key 'role'
            else if (decoded?.role) {
                const roleValue = decoded.role;
                userRoles = Array.isArray(roleValue) ? roleValue : [roleValue];
            }
            // Try 'roles' (plural)
            else if (decoded?.roles) {
                const roleValue = decoded.roles;
                userRoles = Array.isArray(roleValue) ? roleValue : [roleValue];
            }
            // Check all keys for role-related claims (in case of multiple role claims)
            else {
                const allKeys = Object.keys(decoded || {});
                const roleKeys = allKeys.filter(key =>
                    key.toLowerCase().includes('role') ||
                    key.includes('http://schemas.microsoft.com/ws/2008/06/identity/claims/role')
                );

                if (roleKeys.length > 0) {
                    roleKeys.forEach(key => {
                        const roleValue = decoded[key];
                        if (roleValue) {
                            if (Array.isArray(roleValue)) {
                                userRoles = [...userRoles, ...roleValue];
                            } else {
                                userRoles.push(roleValue);
                            }
                        }
                    });
                    // Remove duplicates
                    userRoles = [...new Set(userRoles)];
                }
            }

            setRoles(userRoles);
        } else {
            setUser(null);
            setRoles([]);
            setTokenExpiry(null);
        }
    }, [token]);

    // Setup auto-logout timer when token expires
    useEffect(() => {
        if (!token) return;

        const expiresIn = getTokenExpiresIn(token);
        if (expiresIn <= 0) {
            logout();
            return;
        }

        // Set logout timer for token expiry (5 minutes before actual expiry)
        // const timeoutMs = (expiresIn - 300) * 1000; // 300 seconds = 5 minutes
        // if (timeoutMs > 0) {
        //     const timer = setTimeout(() => {
        //         logout();
        //         alert('Your session has expired. Please login again.');
        //     }, timeoutMs);

        //     return () => clearTimeout(timer);
        // }
    }, [token]);

    ///=>> use for identity and firebase
    const login = async (email, password) => {
        try {
            // 1. ĐĂNG NHẬP C# (Như cũ)
            const csharpResponse = await loginAPI(email, password);
            if (!csharpResponse || !csharpResponse.accessToken) {
                throw new Error("Đăng nhập C# thất bại");
            }

            const csharpToken = csharpResponse.accessToken;
            localStorage.setItem('token', csharpToken);
            setToken(csharpToken); // Cập nhật state C#

            // 2. ĐĂNG NHẬP FIREBASE (Bước mới)
            const firebaseResponse = await getFirebaseTokenAPI(csharpToken);
            const firebaseToken = firebaseResponse.firebaseToken;

            await signInWithCustomToken(auth, firebaseToken);

            // (Hàm 'onAuthStateChanged' của Firebase sẽ tự động cập nhật user)
            return true;
        } catch (error) {
            console.error("Lỗi đăng nhập kép:", error);
            logout();
            throw error;
        }
    };

    ///=>> use for identity and firebase
    const register = async (username, phonenumber, email, password, confirmPassword, role) => {
        try {
            await registerAPI(username, phonenumber, email, password, confirmPassword);
            const csharpResponse = await loginAPI(email, password);
            const csharpToken = csharpResponse.accessToken;
            localStorage.setItem('token', csharpToken);
            setToken(csharpToken);

            // 3. ĐĂNG NHẬP FIREBASE (Bước mới)
            const firebaseResponse = await getFirebaseTokenAPI(csharpToken);
            const firebaseToken = firebaseResponse.firebaseToken;
            const userCredential = await signInWithCustomToken(auth, firebaseToken);
            const user = userCredential.user; // Lấy user Firebase

            // 4. TẠO "DANH BẠ" (Lưu user vào Firestore)
            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, {
                uid: user.uid,
                displayName: username,
                email: email,
                photoURL: "", // (Ảnh mặc định)
                role: role // <-- LƯU ROLE VÀO DATABASE
            }, { merge: true });

            console.log("dmmm role lon:      ", role)
            return true;
        } catch (error) {
            console.error("Lỗi register kép:", error);
            logout();
            throw error;
        }

    };

    ///=>> use for identity and firebase
    const logout = async () => {
        // (Hàm 'logoutAPI' của C# là không bắt buộc, vì token C# sẽ tự hết hạn)
        if (refreshToken) {
            await logoutAPI(refreshToken);
        }
        // Đăng xuất khỏi Firebase
        await signOut(auth); // <-- Thêm dòng này
        setToken(null);
        setRefreshToken(null);
        setUser(null);
        setRoles([]);
        setTokenExpiry(null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
    };

    useEffect(() => {
        // Nếu có token (đã login) VÀ chưa có kết nối
        if (token && !connection) {

            // 1. Xây dựng kết nối đến Hub
            const newConnection = new signalR.HubConnectionBuilder()
                .withUrl("https://localhost:7267/notificationcalling", { // (Đảm bảo URL này đúng)
                    // 2. GỬI KÈM JWT TOKEN ĐỂ XÁC THỰC
                    accessTokenFactory: () => token
                })
                .withAutomaticReconnect()
                .build();

            // 3. Khởi động kết nối
            newConnection.start()
                .then(() => {
                    console.log("SignalR Connected!");
                    setConnection(newConnection);

                    // 4. LẮNG NGHE CÁC SỰ KIỆN TỪ SERVER

                    // A. Khi AI ĐÓ GỌI BẠN (Reng reng!)
                    newConnection.on("IncomingCall", (callerId, callerName, roomId) => {
                        console.log(`Cuộc gọi đến từ ${callerName}`);
                        // Lưu thông tin cuộc gọi để hiển thị Pop-up
                        setIncomingCall({ callerId, callerName, roomId });
                    });

                    // B. Khi NGƯỜI BẠN GỌI đã "Bắt máy" (Bác sĩ nhận được tin này)
                    // (Phiên bản ĐÃ SỬA LỖI - chỉ có 1 listener)
                    newConnection.on("CallAccepted", (receiverId, roomId) => {
                        console.log("Cuộc gọi được chấp nhận, Bác sĩ mở Zego...");

                        // Đọc token mới nhất từ localStorage để tránh lỗi "stale state"
                        const currentToken = localStorage.getItem('token');
                        if (!currentToken) {
                            console.error("Lỗi: Không tìm thấy token của người gọi (Bác sĩ)");
                            return;
                        }

                        // Tự giải mã token (dùng hàm decodeToken của bạn)
                        const decodedUser = decodeToken(currentToken);
                        if (!decodedUser) {
                            console.error("Lỗi: Không thể giải mã token của người gọi (Bác sĩ)");
                            return;
                        }

                        // Lấy thông tin user TƯƠI MỚI (fresh)
                        const userId = decodedUser.sub;
                        const userName = decodedUser.preferred_username || decodedUser.email;

                        // Mở cửa sổ Zego (vì BẠN là người gọi)
                        const callUrl = `/video-calling?roomID=${roomId}&userID=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName)}`;
                        const windowSpecs = 'width=1000,height=700,noopener,noreferrer';
                        window.open(callUrl, '_blank', windowSpecs);
                    });

                    // C. Khi NGƯỜI BẠN GỌI đã "Từ chối"
                    newConnection.on("CallDeclined", () => {
                        console.log("Cuộc gọi bị từ chối.");
                        alert("Người dùng đã từ chối cuộc gọi.");
                    });

                })
                .catch(e => console.error("SignalR Connection Error: ", e));
        }
        // Nếu không có token (logout) VÀ đang có kết nối
        else if (!token && connection) {
            connection.stop();
            setConnection(null);
        }

        // Cleanup (chạy khi component bị hủy)
        return () => {
            if (connection) {
                connection.stop();
            }
        }
        // Chạy lại logic này mỗi khi 'token' hoặc 'connection' thay đổi
        // (Không cần 'user' trong dependency array nữa vì 'CallAccepted' đã đọc từ localStorage)
    }, [token, connection]);

    // 1. Khi BẠN bấm nút "Gọi"
    const initiateCall = async (targetUserId, roomId, targetUserName = "User") => {
        try {
            // Lấy token và decode để lấy thông tin người gọi
            const currentToken = localStorage.getItem('token');
            if (!currentToken) {
                alert("Lỗi: Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
                return;
            }

            const decodedUser = decodeToken(currentToken);
            if (!decodedUser) {
                alert("Lỗi: Token không hợp lệ.");
                return;
            }

            const currentUserId = decodedUser.sub;
            const currentUserName = decodedUser.preferred_username || decodedUser.email || "User";

            console.log('Initiating call:', {
                currentUserId,
                currentUserName,
                targetUserId,
                targetUserName,
                roomId
            });

            // ===== THÊM ĐOẠN NÀY: GỬI THÔNG BÁO CHO NGƯỜI NHẬN =====
            if (connection) {
                // Gửi thông báo qua SignalR cho bệnh nhân
                await connection.invoke("InitiateCall", targetUserId, roomId);
                console.log(`✓ Đã gửi thông báo cuộc gọi đến ${targetUserName}`);
            } else {
                console.error("Lỗi: Không có kết nối SignalR");
                alert("Lỗi: Không thể gửi thông báo cuộc gọi. Vui lòng thử lại.");
                return;
            }
            // =========================================================

            // Điều hướng người gọi đến trang video call
            const callUrl = `/video-calling?roomID=${roomId}&userID=${encodeURIComponent(currentUserId)}&userName=${encodeURIComponent(currentUserName)}`;

            // Mở trong tab mới hoặc điều hướng trực tiếp
            const windowSpecs = 'width=1000,height=700,noopener,noreferrer';
            window.open(callUrl, '_blank', windowSpecs);

        } catch (error) {
            console.error("Error initiating call:", error);
            alert("Không thể bắt đầu cuộc gọi: " + error.message);
        }
    };

    // 2. Khi BẠN bấm "Bắt máy"
    const acceptCall = async () => {
        // 1. Chỉ kiểm tra connection và cuộc gọi đến
        if (connection && incomingCall) {

            // === SỬA LỖI: Đọc token và decode tại chỗ ===

            // 2. Lấy token của chính Bệnh nhân (người nhận)
            const currentToken = localStorage.getItem('token');
            if (!currentToken) {
                console.error("Lỗi: Không tìm thấy token của người nhận (Bệnh nhân)");
                alert("Lỗi: Không tìm thấy token, vui lòng đăng nhập lại.");
                return;
            }

            // 3. Tự giải mã token (dùng hàm decodeToken của bạn)
            const decodedUser = decodeToken(currentToken);
            if (!decodedUser) {
                console.error("Lỗi: Không thể giải mã token của người nhận (Bệnh nhân)");
                alert("Lỗi: Token không hợp lệ.");
                return;
            }

            // 4. Lấy thông tin user TƯƠI MỚI (fresh)
            const userId = decodedUser.sub;
            const userName = decodedUser.preferred_username || decodedUser.email;

            // 5. Báo cho server là bạn đã bắt máy
            await connection.invoke("AcceptCall", incomingCall.callerId, incomingCall.roomId);

            // 6. Mở cửa sổ Zego (vì BẠN là người nhận)
            const callUrl = `/video-calling?roomID=${incomingCall.roomId}&userID=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName)}`;
            const windowSpecs = 'width=1000,height=700,noopener,noreferrer';
            window.open(callUrl, '_blank', windowSpecs);

            setIncomingCall(null); // Đóng pop-up
        } else {
            console.error("Không thể chấp nhận cuộc gọi: Kết nối hoặc cuộc gọi đến không xác định.");
        }
    };

    // 3. Khi BẠN bấm "Từ chối"
    const declineCall = async () => {
        if (connection && incomingCall) {
            // Báo cho server là bạn đã từ chối
            await connection.invoke("DeclineCall", incomingCall.callerId);
            setIncomingCall(null); // Đóng pop-up
        }
    };

    const value = {
        user,
        token,
        refreshToken,
        roles,
        tokenExpiry,
        login,
        logout,
        register,
        isAuthenticated: !!token,
        hasRole: (role) => roles.includes(role),

        initiateCall,
        acceptCall,
        declineCall,
        incomingCall
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

