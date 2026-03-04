import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('../lib/supabase');

import { supabase, mockChannel, createQueryBuilder } from '../lib/__mocks__/supabase';
import { CandidatesProvider, useCandidates } from './CandidatesContext';

const wrapper = ({ children }) => <CandidatesProvider>{children}</CandidatesProvider>;

const mockCandidates = [
  { id: 'c1', first_name: 'Alice', last_name: 'Smith', email: 'alice@test.com' },
  { id: 'c2', first_name: 'Bob', last_name: 'Jones', email: 'bob@test.com' },
];

describe('CandidatesContext — initial fetch', () => {
  it('fetches candidates on mount and sets loading to false', async () => {
    const qb = createQueryBuilder({ data: mockCandidates, count: 2 });
    supabase.from.mockReturnValueOnce(qb);

    const { result } = renderHook(() => useCandidates(), { wrapper });
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.candidates).toEqual(mockCandidates);
  });

  it('sets up realtime subscription on mount', async () => {
    const qb = createQueryBuilder({ data: [], count: 0 });
    supabase.from.mockReturnValueOnce(qb);

    renderHook(() => useCandidates(), { wrapper });
    await waitFor(() => expect(supabase.channel).toHaveBeenCalledWith('candidates-global'));
    expect(mockChannel.on).toHaveBeenCalled();
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it('removes channel on unmount', async () => {
    const qb = createQueryBuilder({ data: [], count: 0 });
    supabase.from.mockReturnValueOnce(qb);

    const { unmount } = renderHook(() => useCandidates(), { wrapper });
    await waitFor(() => expect(supabase.channel).toHaveBeenCalled());

    unmount();
    expect(supabase.removeChannel).toHaveBeenCalled();
  });
});

describe('CandidatesContext — realtime events', () => {
  beforeEach(() => {
    // Seed initial candidates
    const qb = createQueryBuilder({ data: mockCandidates, count: 2 });
    supabase.from.mockReturnValueOnce(qb);
  });

  it('UPDATE event: replaces the updated candidate in the list', async () => {
    const { result } = renderHook(() => useCandidates(), { wrapper });
    await waitFor(() => expect(result.current.candidates).toHaveLength(2));

    act(() => {
      mockChannel._trigger({
        eventType: 'UPDATE',
        new: { id: 'c1', first_name: 'Alice', last_name: 'Updated', email: 'alice@test.com' },
        old: { id: 'c1' },
      });
    });

    expect(result.current.candidates[0].last_name).toBe('Updated');
    expect(result.current.candidates).toHaveLength(2);
  });

  it('DELETE event: removes the candidate from the list', async () => {
    const { result } = renderHook(() => useCandidates(), { wrapper });
    await waitFor(() => expect(result.current.candidates).toHaveLength(2));

    act(() => {
      mockChannel._trigger({ eventType: 'DELETE', old: { id: 'c1' }, new: null });
    });

    expect(result.current.candidates).toHaveLength(1);
    expect(result.current.candidates[0].id).toBe('c2');
  });

  it('INSERT event: triggers a refetch to get candidate with joined data', async () => {
    const newCandidate = { id: 'c3', first_name: 'Carol', last_name: 'White', email: 'carol@test.com' };
    const qbRefetch = createQueryBuilder({ data: [...mockCandidates, newCandidate], count: 3 });
    supabase.from.mockReturnValueOnce(qbRefetch);

    const { result } = renderHook(() => useCandidates(), { wrapper });
    await waitFor(() => expect(result.current.candidates).toHaveLength(2));

    await act(async () => {
      mockChannel._trigger({ eventType: 'INSERT', new: newCandidate, old: null });
    });

    await waitFor(() => expect(result.current.candidates).toHaveLength(3));
    expect(result.current.candidates[2].first_name).toBe('Carol');
  });
});

describe('CandidatesContext — updateCandidate()', () => {
  it('applies optimistic update immediately', async () => {
    const qb = createQueryBuilder({ data: mockCandidates, count: 2 });
    supabase.from.mockReturnValueOnce(qb);

    // Mock the update call
    const updateQb = createQueryBuilder();
    updateQb.then = (resolve) => Promise.resolve({ error: null }).then(resolve);
    supabase.from.mockReturnValueOnce(updateQb);

    const { result } = renderHook(() => useCandidates(), { wrapper });
    await waitFor(() => expect(result.current.candidates).toHaveLength(2));

    act(() => {
      result.current.updateCandidate('c1', { status: 'placed' });
    });

    // Optimistic update is synchronous
    const updated = result.current.candidates.find(c => c.id === 'c1');
    expect(updated.status).toBe('placed');
  });

  it('calls supabase update with the correct id and data', async () => {
    const qb = createQueryBuilder({ data: mockCandidates, count: 2 });
    supabase.from.mockReturnValueOnce(qb);

    const updateQb = createQueryBuilder();
    updateQb.then = (resolve) => Promise.resolve({ error: null }).then(resolve);
    supabase.from.mockReturnValueOnce(updateQb);

    const { result } = renderHook(() => useCandidates(), { wrapper });
    await waitFor(() => expect(result.current.candidates).toHaveLength(2));

    await act(async () => {
      await result.current.updateCandidate('c2', { status: 'active' });
    });

    expect(updateQb.update).toHaveBeenCalledWith({ status: 'active' });
    expect(updateQb.eq).toHaveBeenCalledWith('id', 'c2');
  });

  it('reverts optimistic update on DB error by refetching', async () => {
    const qb = createQueryBuilder({ data: mockCandidates, count: 2 });
    supabase.from.mockReturnValueOnce(qb);

    const updateQb = createQueryBuilder();
    updateQb.then = (resolve, reject) => Promise.resolve({ error: { message: 'RLS violation' } }).then(resolve, reject);
    supabase.from.mockReturnValueOnce(updateQb);

    // Refetch after failure
    const refetchQb = createQueryBuilder({ data: mockCandidates, count: 2 });
    supabase.from.mockReturnValueOnce(refetchQb);

    const { result } = renderHook(() => useCandidates(), { wrapper });
    await waitFor(() => expect(result.current.candidates).toHaveLength(2));

    await act(async () => {
      await result.current.updateCandidate('c1', { status: 'invalid' });
    });

    await waitFor(() => expect(supabase.from).toHaveBeenCalledTimes(3)); // initial + update + refetch
  });
});
