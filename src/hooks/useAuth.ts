import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types';

function parseJwt(token: string): User | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      sub: payload.sub,
    };
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const idToken = localStorage.getItem("google_id_token");
    if (idToken) {
      const parsedUser = parseJwt(idToken);
      if (parsedUser) {
        setUser(parsedUser);
      } else {
        // Clear invalid tokens
        localStorage.removeItem("google_id_token");
        localStorage.removeItem("google_access_token");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(() => {
    const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
    const REDIRECT_URI = "http://localhost:3000/google-callback";
    const SCOPE = "https://www.googleapis.com/auth/calendar.readonly openid email profile";
    
    const url = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=token id_token` +
      `&scope=${encodeURIComponent(SCOPE)}` +
      `&nonce=nonce` +
      `&prompt=consent`;
    
    window.location.href = url;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("google_id_token");
    localStorage.removeItem("google_access_token");
    setUser(null);
  }, []);

  const getAccessToken = useCallback(() => {
    return localStorage.getItem("google_access_token");
  }, []);

  return {
    user,
    loading,
    login,
    logout,
    getAccessToken,
    isAuthenticated: !!user,
  };
} 