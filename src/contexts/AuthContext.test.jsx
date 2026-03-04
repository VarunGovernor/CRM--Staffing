import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('../lib/supabase');
vi.mock('../lib/auditLog', () => ({ logAuthEvent: vi.fn(), AUDIT_ACTIONS: { LOGIN: 'login', LOGOUT: 'logout' } }));
vi.mock('../lib/notifications', () => ({ notifyAdmins: vi.fn() }));

import { supabase } from '../lib/__mocks__/supabase';
import { logAuthEvent } from '../lib/auditLog';
import { notifyAdmins } from '../lib/notifications';
import { AuthProvider, useAuth } from './AuthContext';

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext — initial state', () => {
  it('starts with user null and loading true, then resolves to loading false', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('sets user from existing session on mount', async () => {
    const mockUser = { id: 'user-1', email: 'test@test.com', user_metadata: { role: 'recruiter' } };
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: { user: mockUser } } });
    supabase.from.mockImplementationOnce(() => {
      const { createQueryBuilder } = require('../lib/__mocks__/supabase');
      const qb = createQueryBuilder({ data: { id: 'user-1', full_name: 'Test User' } });
      qb.single = vi.fn().mockResolvedValue({ data: { id: 'user-1', full_name: 'Test User' }, error: null });
      return qb;
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).toEqual(mockUser));
    expect(result.current.isAuthenticated).toBe(true);
  });
});

describe('signIn()', () => {
  it('calls supabase.auth.signInWithPassword with credentials', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.signIn('user@test.com', 'password123');
    });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'user@test.com',
      password: 'password123',
    });
  });

  it('calls logAuthEvent and notifyAdmins on successful login', async () => {
    const mockUser = { id: 'u1', email: 'user@test.com', user_metadata: { role: 'recruiter', full_name: 'Test User' } };
    supabase.auth.signInWithPassword.mockResolvedValueOnce({ data: { user: mockUser, session: {} }, error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.signIn('user@test.com', 'password123');
    });

    expect(logAuthEvent).toHaveBeenCalled();
    expect(notifyAdmins).toHaveBeenCalled();
  });

  it('returns network error when exception is thrown', async () => {
    supabase.auth.signInWithPassword.mockRejectedValueOnce(new Error('Network failure'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let signInResult;
    await act(async () => {
      signInResult = await result.current.signIn('user@test.com', 'pass');
    });

    expect(signInResult.error.message).toBe('Network error. Please try again.');
  });
});

describe('signOut()', () => {
  it('calls supabase.auth.signOut', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.signOut();
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('clears user state after successful sign out', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.userProfile).toBeNull();
  });
});

describe('sendOtp()', () => {
  it('calls signInWithOtp with shouldCreateUser: false', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.sendOtp('user@test.com');
    });

    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'user@test.com',
      options: { shouldCreateUser: false },
    });
  });
});

describe('sendOtpNewUser()', () => {
  it('calls signInWithOtp with shouldCreateUser: true', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.sendOtpNewUser('new@test.com');
    });

    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'new@test.com',
      options: { shouldCreateUser: true },
    });
  });
});

describe('verifyOtp()', () => {
  it('calls verifyOtp with email, token, and type: email', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.verifyOtp('user@test.com', '123456');
    });

    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
      email: 'user@test.com',
      token: '123456',
      type: 'email',
    });
  });
});

describe('checkEmailExists()', () => {
  it('returns { exists: true } when a profile is found', async () => {
    const { createQueryBuilder } = await import('../lib/__mocks__/supabase');
    const qb = createQueryBuilder();
    qb.maybeSingle = vi.fn().mockResolvedValue({ data: { id: 'user-1' }, error: null });
    supabase.from.mockReturnValueOnce(qb);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let checkResult;
    await act(async () => {
      checkResult = await result.current.checkEmailExists('existing@test.com');
    });

    expect(checkResult.exists).toBe(true);
  });

  it('returns { exists: false } when no profile is found', async () => {
    const { createQueryBuilder } = await import('../lib/__mocks__/supabase');
    const qb = createQueryBuilder();
    qb.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    supabase.from.mockReturnValueOnce(qb);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let checkResult;
    await act(async () => {
      checkResult = await result.current.checkEmailExists('new@test.com');
    });

    expect(checkResult.exists).toBe(false);
  });
});

describe('getSession()', () => {
  it('returns session from supabase', async () => {
    const mockSession = { access_token: 'token123', user: { id: 'u1' } };
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: mockSession }, error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: mockSession }, error: null });

    let sessionResult;
    await act(async () => {
      sessionResult = await result.current.getSession();
    });

    expect(sessionResult.session).toEqual(mockSession);
  });
});
