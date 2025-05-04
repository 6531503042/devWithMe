import React, { useState, useEffect, createContext, useContext } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Music, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

// Spotify API scopes
const SPOTIFY_SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-read-playback-state',
  'user-modify-playback-state',
  'playlist-read-private',
  'playlist-read-collaborative',
  'streaming',
].join(' ');

// Environment
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';

// 🔥 Dynamic redirect URI based on environment
const REDIRECT_URI = window.location.hostname === 'localhost'
  ? 'http://localhost:8080/spotify-callback'
  : 'https://devwithme.vercel.app/spotify-callback';

// Types
export interface SpotifyTokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number; // ms timestamp
  token_type: string;
}

interface SpotifyContextType {
  isAuthenticated: boolean;
  spotifyToken: SpotifyTokenData | null;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<SpotifyTokenData | null>;
  saveTokenToStorage: (token: SpotifyTokenData) => void;
}

const SpotifyAuthContext = createContext<SpotifyContextType>({
  isAuthenticated: false,
  spotifyToken: null,
  isLoading: false,
  login: async () => {},
  logout: async () => {},
  refreshToken: async () => null,
  saveTokenToStorage: () => {},
});

// Utility functions
const generateRandomString = (length: number) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values).map(x => charset[x % charset.length]).join('');
};

const generateCodeVerifier = (length: number) => generateRandomString(length);

const generateCodeChallenge = async (verifier: string) => {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};

// Main Provider
export const SpotifyAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [spotifyToken, setSpotifyToken] = useState<SpotifyTokenData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const isAuthenticated = !!spotifyToken && spotifyToken.expires_at > Date.now();

  const saveTokenToStorage = (token: SpotifyTokenData) => {
    localStorage.setItem('spotify_token', JSON.stringify(token));
    setSpotifyToken(token);
  };

  const refreshToken = async (refreshTokenStr?: string): Promise<SpotifyTokenData | null> => {
    const tokenToUse = refreshTokenStr || spotifyToken?.refresh_token;
    if (!tokenToUse) return null;

    try {
      setIsLoading(true);
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: SPOTIFY_CLIENT_ID,
          grant_type: 'refresh_token',
          refresh_token: tokenToUse,
        }),
      });

      if (!response.ok) throw new Error('Failed to refresh token');

      const data = await response.json();
      const newToken: SpotifyTokenData = {
        access_token: data.access_token,
        refresh_token: data.refresh_token || tokenToUse,
        expires_at: Date.now() + data.expires_in * 1000,
        token_type: data.token_type,
      };
      saveTokenToStorage(newToken);
      return newToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      localStorage.removeItem('spotify_token');
      setSpotifyToken(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    if (!SPOTIFY_CLIENT_ID) {
      toast({ title: 'Error', description: 'Missing Spotify Client ID', variant: 'destructive' });
      return;
    }

    try {
      const state = generateRandomString(16);
      const codeVerifier = generateCodeVerifier(64);
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      sessionStorage.setItem('spotify_auth_state', state);
      sessionStorage.setItem('spotify_code_verifier', codeVerifier);

      const authUrl = new URL('https://accounts.spotify.com/authorize');
      authUrl.searchParams.append('client_id', SPOTIFY_CLIENT_ID);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
      authUrl.searchParams.append('state', state);
      authUrl.searchParams.append('scope', SPOTIFY_SCOPES);
      authUrl.searchParams.append('code_challenge_method', 'S256');
      authUrl.searchParams.append('code_challenge', codeChallenge);

      window.location.href = authUrl.toString();
    } catch (error) {
      console.error('Login error:', error);
      toast({ title: 'Error', description: 'Failed to start login', variant: 'destructive' });
    }
  };

  const logout = async () => {
    localStorage.removeItem('spotify_token');
    setSpotifyToken(null);
    toast({ title: 'Logged out', description: 'Disconnected from Spotify' });
  };

  useEffect(() => {
    const tokenJson = localStorage.getItem('spotify_token');
    if (tokenJson) {
      const token: SpotifyTokenData = JSON.parse(tokenJson);
      if (token.expires_at > Date.now()) {
        setSpotifyToken(token);
      } else {
        refreshToken(token.refresh_token);
      }
    }
    setIsLoading(false);
  }, []);

  return (
    <SpotifyAuthContext.Provider value={{ isAuthenticated, spotifyToken, isLoading, login, logout, refreshToken, saveTokenToStorage }}>
      {children}
    </SpotifyAuthContext.Provider>
  );
};

// Hook
export const useSpotifyAuth = () => useContext(SpotifyAuthContext);

// Auth Button
type SpotifyAuthProps = {
  buttonVariant?: ButtonProps['variant'];
  buttonSize?: ButtonProps['size'];
  className?: string;
  showIcon?: boolean;
};

const SpotifyAuth: React.FC<SpotifyAuthProps> = ({
  buttonVariant = 'outline',
  buttonSize = 'default',
  className = '',
  showIcon = true,
}) => {
  const { isAuthenticated, login, logout, isLoading } = useSpotifyAuth();

  return (
    <Button
      variant={buttonVariant}
      size={buttonSize}
      className={`${className} ${showIcon ? 'gap-2' : ''}`}
      onClick={isAuthenticated ? logout : login}
      disabled={isLoading}
    >
      {isLoading ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : showIcon ? (
        isAuthenticated ? <LogOut className="h-4 w-4" /> : <Music className="h-4 w-4" />
      ) : null}
      <span>{isAuthenticated ? 'Disconnect Spotify' : 'Connect with Spotify'}</span>
    </Button>
  );
};

export default SpotifyAuth;
