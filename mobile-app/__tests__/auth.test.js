import * as oauth from '../utils/oauth';
import { supabase } from '../utils/supabase';
import * as WebBrowser from 'expo-web-browser';

jest.mock('../utils/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signInWithOAuth: jest.fn(),
      setSession: jest.fn(),
    },
  },
}));

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(),
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'exp://auth/callback'),
}));

describe('email/password auth', () => {
  beforeEach(() => {
    supabase.auth.signInWithPassword.mockReset();
  });

  test('successful login', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 1 } }, error: null });
    const credentials = { email: 'test@example.com', password: 'pass123' };
    const { error } = await supabase.auth.signInWithPassword(credentials);
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith(credentials);
    expect(error).toBeNull();
  });

  test('failed login returns error', async () => {
    const loginError = { message: 'Invalid login credentials' };
    supabase.auth.signInWithPassword.mockResolvedValue({ data: null, error: loginError });
    const { error } = await supabase.auth.signInWithPassword({ email: 'bad@example.com', password: 'wrong' });
    expect(error).toBe(loginError);
  });
});

describe('handleOAuthCallback', () => {
  beforeEach(() => {
    supabase.auth.setSession.mockReset();
  });

  test('sets session when access token present', async () => {
    supabase.auth.setSession.mockResolvedValue({ data: {}, error: null });
    const url = 'https://example.com/#access_token=abc&refresh_token=def&token_type=bearer&expires_in=3600';
    const result = await oauth.handleOAuthCallback(url);
    expect(supabase.auth.setSession).toHaveBeenCalledWith({
      access_token: 'abc',
      refresh_token: 'def',
      token_type: 'bearer',
      expires_in: 3600,
    });
    expect(result).toEqual({ success: true });
  });

  test('returns error when no token found', async () => {
    const result = await oauth.handleOAuthCallback('https://example.com/#foo=bar');
    expect(supabase.auth.setSession).not.toHaveBeenCalled();
    expect(result).toEqual({ success: false, error: 'No access token found in callback URL.' });
  });

  test('returns error when setSession fails', async () => {
    supabase.auth.setSession.mockResolvedValue({ data: null, error: {} });
    const result = await oauth.handleOAuthCallback('https://example.com/#access_token=abc');
    expect(result).toEqual({ success: false, error: 'Failed to establish session. Please try again.' });
  });
});

describe('handleSpotifyOAuth', () => {
  beforeEach(() => {
    supabase.auth.signInWithOAuth.mockReset();
    WebBrowser.openAuthSessionAsync.mockReset();
  });

  test('returns error from supabase', async () => {
    supabase.auth.signInWithOAuth.mockResolvedValue({ data: null, error: { message: 'Auth failed' } });
    const result = await oauth.handleSpotifyOAuth();
    expect(result).toEqual({ success: false, error: 'Auth failed' });
  });

  test('returns error when user cancels', async () => {
    supabase.auth.signInWithOAuth.mockResolvedValue({ data: { url: 'https://auth' }, error: null });
    WebBrowser.openAuthSessionAsync.mockResolvedValue({ type: 'cancel' });
    const result = await oauth.handleSpotifyOAuth();
    expect(result).toEqual({ success: false, error: 'Login was cancelled' });
  });

  test('successful OAuth flow', async () => {
    supabase.auth.signInWithOAuth.mockResolvedValue({ data: { url: 'https://auth' }, error: null });
    WebBrowser.openAuthSessionAsync.mockResolvedValue({ type: 'success', url: 'callback://#access_token=abc' });
    supabase.auth.setSession.mockResolvedValue({ data: {}, error: null });

    const result = await oauth.handleSpotifyOAuth();
    expect(supabase.auth.setSession).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });
});
