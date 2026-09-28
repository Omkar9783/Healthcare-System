import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('medisecure_token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('medisecure_user') || 'null'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('medisecure_token', token);
      if (!user) fetchCurrentUser();
    } else {
      localStorage.removeItem('medisecure_token');
      localStorage.removeItem('medisecure_user');
      setUser(null);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/auth/me');
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('medisecure_user', JSON.stringify(data.user));
      } else {
        logout();
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Request OTP code to Email or Mobile
   */
  const sendOtp = async ({ identifier, purpose = 'SIGNUP', channel = 'EMAIL', role = 'PATIENT' }) => {
    setLoading(true);
    try {
      const data = await apiFetch('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ identifier, purpose, channel, role })
      });
      return data;
    } catch (err) {
      return { success: false, message: err.message || 'Failed to send verification code.' };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verify an OTP Code
   */
  const verifyOtpCode = async ({ identifier, otp, purpose = 'SIGNUP' }) => {
    setLoading(true);
    try {
      const data = await apiFetch('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ identifier, otp, purpose })
      });
      return data;
    } catch (err) {
      return { success: false, message: err.message || 'Verification failed.' };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login with Email OR Mobile Number (with Password OR OTP)
   */
  const login = async (credentials) => {
    setLoading(true);
    try {
      // Support string arguments or object argument
      const payload = typeof credentials === 'string'
        ? { identifier: credentials, password: arguments[1] }
        : credentials;

      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('medisecure_token', data.token);
        localStorage.setItem('medisecure_user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      return { success: false, message: err.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register with verified OTP & demographic details
   */
  const register = async (formData) => {
    setLoading(true);
    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('medisecure_token', data.token);
        localStorage.setItem('medisecure_user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      return { success: false, message: err.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('medisecure_token');
    localStorage.removeItem('medisecure_user');
  };

  /**
   * Quick 1-Click Demo Login
   */
  const loginAsDemoRole = async (identifier, role) => {
    return await login({ identifier, password: 'password123', role });
  };

  return (
    <AuthContext.Provider value={{
      token,
      user,
      loading,
      login,
      register,
      logout,
      sendOtp,
      verifyOtpCode,
      loginAsDemoRole,
      fetchCurrentUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
