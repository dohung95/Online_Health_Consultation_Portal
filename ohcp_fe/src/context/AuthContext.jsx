import React, { createContext, useContext, useState, useEffect } from "react";
import { login as loginAPI, register as registerAPI, logout as logoutAPI, setupAxiosInterceptors, getFirebaseTokenAPI } from '../api/auth';
import { decodeToken, getTokenExpiresIn } from '../utils/tokenUtils';

import { signInWithCustomToken, signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

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
        hasRole: (role) => roles.includes(role)
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

