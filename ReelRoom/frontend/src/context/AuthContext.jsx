import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';
const AuthContext = createContext(undefined);
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('yt_wp_token'));
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const initializeAuth = async () => {
            const storedToken = localStorage.getItem('yt_wp_token');
            const storedUser = localStorage.getItem('yt_wp_user');
            if (storedToken) {
                setToken(storedToken);
                // Verify with backend
                const res = await apiService.getCurrentUser(storedToken);
                const currentUserData = res.data?.user || (res.data?.id ? res.data : null);
                if (res.success && currentUserData) {
                    setUser(currentUserData);
                    localStorage.setItem('yt_wp_user', JSON.stringify(currentUserData));
                }
                else if (storedUser) {
                    try {
                        setUser(JSON.parse(storedUser));
                    }
                    catch {
                        localStorage.removeItem('yt_wp_user');
                    }
                }
            }
            else if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                }
                catch {
                    localStorage.removeItem('yt_wp_user');
                }
            }
            setIsLoading(false);
        };
        initializeAuth();
    }, []);
    const login = (authToken, userData) => {
        setToken(authToken);
        setUser(userData);
        localStorage.setItem('yt_wp_token', authToken);
        localStorage.setItem('yt_wp_user', JSON.stringify(userData));
    };
    const guestLogin = (guestUsername) => {
        const existingUserStr = localStorage.getItem('yt_wp_user');
        if (existingUserStr) {
            try {
                const parsed = JSON.parse(existingUserStr);
                if (parsed.username === guestUsername) {
                    setUser(parsed);
                    return parsed;
                }
            }
            catch { }
        }
        const guestUser = {
            id: 'guest-' + Math.random().toString(36).substring(2, 9),
            username: guestUsername,
            email: `${guestUsername.toLowerCase()}@guest.local`,
        };
        setUser(guestUser);
        localStorage.setItem('yt_wp_user', JSON.stringify(guestUser));
        return guestUser;
    };
    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('yt_wp_token');
        localStorage.removeItem('yt_wp_user');
    };
    return (_jsx(AuthContext.Provider, { value: {
            user,
            token,
            isAuthenticated: !!user,
            isLoading,
            login,
            logout,
            guestLogin,
        }, children: children }));
};
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
