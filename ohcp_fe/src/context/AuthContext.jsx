import React, { createContext, useContext, useState, useEffect } from "react";
import { login as loginAPI, register as registerAPI, logout as logoutAPI, setupAxiosInterceptors } from '../api/auth';
import { decodeToken, getTokenExpiresIn } from '../utils/tokenUtils';

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
        const timeoutMs = (expiresIn - 300) * 1000; // 300 seconds = 5 minutes
        if (timeoutMs > 0) {
            const timer = setTimeout(() => {
                logout();
                alert('Your session has expired. Please login again.');
            }, timeoutMs);

            return () => clearTimeout(timer);
        }
    }, [token]);

    const login = async (email, password) => {
        try {
            const response = await loginAPI(email, password);
            if (response && response.accessToken) {
                setToken(response.accessToken);
                setRefreshToken(response.refreshToken);
                localStorage.setItem('token', response.accessToken);
                localStorage.setItem('refreshToken', response.refreshToken);
                return true;
            }
            return false;
        } catch (error) {
            // Re-throw error to be caught by LoginPage
            throw error;
        }
    };

    const register = async (username, phonenumber, email, password, confirmPassword) => {
        try {
            const response = await registerAPI(username, phonenumber, email, password, confirmPassword);
            if (response && response.accessToken) {
                setToken(response.accessToken);
                setRefreshToken(response.refreshToken);
                localStorage.setItem('token', response.accessToken);
                localStorage.setItem('refreshToken', response.refreshToken);
                return true;
            }
            return false;
        } catch (error) {
            // Re-throw error to be caught by RegisterPage
            throw error;
        }
    };

    const logout = async () => {
        // Call logout API to revoke refresh token
        if (refreshToken) {
            await logoutAPI(refreshToken);
        }

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

