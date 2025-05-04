import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpotifyAuth, SpotifyTokenData } from '@/integrations/spotify/SpotifyAuth';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const SpotifyCallback = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { saveTokenToStorage } = useSpotifyAuth();

  useEffect(() => {
    // Extract authorization code from URL
    const handleCallback = async () => {
      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        // If there's an error in the callback
        if (error) {
          setStatus('error');
          setErrorMessage(`Authentication failed: ${error}`);
          return;
        }

        // If code or state is missing, authentication failed
        if (!code || !state) {
          setStatus('error');
          setErrorMessage('Missing authentication data in the callback.');
          return;
        }

        // Verify state matches what we stored before redirecting
        const storedState = sessionStorage.getItem('spotify_auth_state');
        if (!storedState || state !== storedState) {
          setStatus('error');
          setErrorMessage('State verification failed. Please try again.');
          return;
        }

        // Get code verifier from storage
        const codeVerifier = sessionStorage.getItem('spotify_code_verifier');
        if (!codeVerifier) {
          setStatus('error');
          setErrorMessage('Code verifier missing. Please try again.');
          return;
        }

        // Exchange code for access token
        const redirectUri = `${window.location.origin}/spotify-callback`;
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: process.env.SPOTIFY_CLIENT_ID || '',
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier,
          }),
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json().catch(() => ({}));
          throw new Error(`Token exchange failed: ${JSON.stringify(errorData)}`);
        }

        const tokenData = await tokenResponse.json();
        
        // Save token data with expiration
        const spotifyToken: SpotifyTokenData = {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: Date.now() + (tokenData.expires_in * 1000),
          token_type: tokenData.token_type,
        };
        
        // Save token to storage
        saveTokenToStorage(spotifyToken);
        
        // Clean up session storage
        sessionStorage.removeItem('spotify_auth_state');
        sessionStorage.removeItem('spotify_code_verifier');
        
        // Set success state
        setStatus('success');
        
        toast({
          title: 'Success',
          description: 'Spotify account connected successfully!',
        });
        
        // Redirect after a short delay to show success message
        setTimeout(() => {
          navigate('/pomodoro');
        }, 2000);
      } catch (error) {
        console.error('Spotify callback error:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      }
    };

    handleCallback();
  }, [navigate, saveTokenToStorage, toast]);

  const getStatusContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center">
            <RefreshCw className="animate-spin h-12 w-12 text-primary mb-4" />
            <h2 className="text-lg font-medium mb-2">Connecting to Spotify</h2>
            <p className="text-muted-foreground">Please wait while we complete the authentication...</p>
          </div>
        );
      case 'success':
        return (
          <div className="flex flex-col items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-lg font-medium mb-2">Connected Successfully!</h2>
            <p className="text-muted-foreground mb-4">Your Spotify account has been linked.</p>
            <Button onClick={() => navigate('/pomodoro')}>Continue to Pomodoro Timer</Button>
          </div>
        );
      case 'error':
        return (
          <div className="flex flex-col items-center justify-center">
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-lg font-medium mb-2">Connection Failed</h2>
            <p className="text-muted-foreground mb-2">{errorMessage || 'An error occurred during authentication.'}</p>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => navigate('/pomodoro')}>
                Back to Pomodoro
              </Button>
              <Button onClick={() => window.location.href = '/pomodoro'}>
                Try Again
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardContent className="py-10">
          {getStatusContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default SpotifyCallback; 