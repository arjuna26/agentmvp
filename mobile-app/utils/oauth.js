import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from './supabase';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

/**
 * Handle Spotify OAuth login
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const handleSpotifyOAuth = async () => {
  try {
    const redirectUri = makeRedirectUri({
      scheme: 'exp',
      path: 'auth/callback'
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'spotify',
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUri,
        { 
          showInRecents: true,
          preferEphemeralSession: true
        }
      );

      if (result.type === 'success' && result.url) {
        const sessionResult = await handleOAuthCallback(result.url);
        return sessionResult;
      } else if (result.type === 'cancel') {
        return { success: false, error: 'Login was cancelled' };
      } else {
        return { success: false, error: 'OAuth flow failed' };
      }
    }

    return { success: false, error: 'No authorization URL received' };
  } catch (error) {
    return { success: false, error: error.message || 'OAuth login failed' };
  }
};

/**
 * Handle OAuth callback URL and establish session
 * @param {string} url - The callback URL with tokens
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const handleOAuthCallback = async (url) => {
  try {
    // Parse the URL to extract tokens
    const urlObj = new URL(url);
    const hashParams = new URLSearchParams(urlObj.hash.substring(1));
    const searchParams = new URLSearchParams(urlObj.search);
    
    const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
    const tokenType = hashParams.get('token_type') || searchParams.get('token_type') || 'bearer';
    const expiresIn = hashParams.get('expires_in') || searchParams.get('expires_in');
    
    if (accessToken) {
      // Create session object
      const session = {
        access_token: accessToken,
        refresh_token: refreshToken || '',
        token_type: tokenType,
        expires_in: parseInt(expiresIn) || 3600
      };
      
      // Set the session
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession(session);
      
      if (sessionError) {
        return { success: false, error: 'Failed to establish session. Please try again.' };
      } else {
        return { success: true };
      }
    } else {
      return { success: false, error: 'No access token found in callback URL.' };
    }
  } catch (parseError) {
    return { success: false, error: 'Failed to process OAuth callback.' };
  }
};
