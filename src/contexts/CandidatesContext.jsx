import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const CandidatesContext = createContext({});

export const useCandidates = () => {
  const context = useContext(CandidatesContext);
  if (!context) {
    throw new Error('useCandidates must be used within CandidatesProvider');
  }
  return context;
};

export const CandidatesProvider = ({ children }) => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        ?.from('candidates')
        ?.select('*, recruiter:user_profiles!recruiter_id(full_name)')
        ?.order('created_at', { ascending: false });
      if (error) throw error;
      setCandidates(data || []);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();

    const channel = supabase
      .channel('candidates-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setCandidates(prev =>
            prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c)
          );
        } else if (payload.eventType === 'INSERT') {
          // Refetch to get joined recruiter data
          fetchCandidates();
        } else if (payload.eventType === 'DELETE') {
          setCandidates(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCandidates]);

  const updateCandidate = useCallback(async (id, updates) => {
    // Optimistic update — all tabs using this context see it immediately
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    try {
      const { error } = await supabase
        .from('candidates')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating candidate:', error);
      fetchCandidates(); // revert on failure
    }
  }, [fetchCandidates]);

  return (
    <CandidatesContext.Provider value={{ candidates, loading, fetchCandidates, updateCandidate }}>
      {children}
    </CandidatesContext.Provider>
  );
};
