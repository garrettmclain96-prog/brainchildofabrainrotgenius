import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Thought, Echo, DecaySpeed, DecayMode, DECAY_DURATIONS, ECHO_DECAY_DURATION } from '@/types/thought';

type FogFilter = 'all' | 'fading' | 'near-extinction' | 'recently-disturbed';

interface PublicFogState {
  thoughts: Thought[];
  echoes: Map<string, Echo[]>;
  filter: FogFilter;
  isLoading: boolean;
  error: string | null;
}

// Generate or get session ID for anonymous rate limiting
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('brainchild-session');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('brainchild-session', sessionId);
  }
  return sessionId;
};

export function usePublicFog() {
  const [state, setState] = useState<PublicFogState>({
    thoughts: [],
    echoes: new Map(),
    filter: 'all',
    isLoading: true,
    error: null,
  });

  // Fetch thoughts and echoes
  const fetchData = useCallback(async () => {
    try {
      // Fetch thoughts with calculated decay (use the view)
      const { data: thoughtsData, error: thoughtsError } = await supabase
        .from('thoughts_with_decay')
        .select('*')
        .order('created_at', { ascending: false });

      if (thoughtsError) throw thoughtsError;

      // Fetch echoes
      const { data: echoesData, error: echoesError } = await supabase
        .from('echoes_with_info')
        .select('*')
        .order('created_at', { ascending: false });

      if (echoesError) throw echoesError;

      // Transform data
      const thoughts: Thought[] = (thoughtsData || []).map((t) => ({
        id: t.id!,
        content: t.content!,
        createdAt: new Date(t.created_at!),
        expiresAt: new Date(t.expires_at!),
        decayLevel: t.decay_level!,
        mode: t.mode as DecayMode,
        decaySpeed: t.decay_speed as DecaySpeed,
        visibility: 'public' as const,
        category: 'uncategorized' as const,
        waterCount: 0,
        starred: false,
      }));

      // Group echoes by thought
      const echoMap = new Map<string, Echo[]>();
      (echoesData || []).forEach((e) => {
        const echo: Echo = {
          id: e.id,
          thoughtId: e.thought_id,
          fragmentText: e.fragment_text,
          createdAt: new Date(e.created_at),
          expiresAt: new Date(e.expires_at),
        };
        const existing = echoMap.get(e.thought_id) || [];
        echoMap.set(e.thought_id, [...existing, echo]);
      });

      setState((prev) => ({
        ...prev,
        thoughts,
        echoes: echoMap,
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      console.error('Error fetching fog data:', err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load thoughts from the fog',
      }));
    }
  }, []);

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchData();
    
    // Refresh every 10 seconds to update decay levels
    const interval = setInterval(fetchData, 10000);
    
    return () => clearInterval(interval);
  }, [fetchData]);

  // Subscribe to real-time changes
  useEffect(() => {
    const thoughtsChannel = supabase
      .channel('public-thoughts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'public_thoughts' },
        () => fetchData()
      )
      .subscribe();

    const echoesChannel = supabase
      .channel('echoes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'echoes' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(thoughtsChannel);
      supabase.removeChannel(echoesChannel);
    };
  }, [fetchData]);

  // Filter thoughts based on selected filter
  const filteredThoughts = useMemo(() => {
    let result = [...state.thoughts];
    
    switch (state.filter) {
      case 'fading':
        result = result.filter((t) => t.decayLevel >= 25 && t.decayLevel < 75);
        break;
      case 'near-extinction':
        result = result.filter((t) => t.decayLevel >= 75);
        break;
      case 'recently-disturbed':
        result = result.filter((t) => (state.echoes.get(t.id)?.length || 0) > 0);
        break;
    }
    
    // Randomize order for anti-feed behavior
    return result.sort(() => Math.random() - 0.5);
  }, [state.thoughts, state.filter, state.echoes]);

  const setFilter = useCallback((filter: FogFilter) => {
    setState((prev) => ({ ...prev, filter }));
  }, []);

  const createPublicThought = useCallback(async (content: string, mode: DecayMode, decaySpeed: DecaySpeed) => {
    const sessionId = getSessionId();
    
    // Client-side validation (server enforces these too)
    const trimmedContent = content.trim();
    if (trimmedContent.length < 1 || trimmedContent.length > 1000) {
      throw new Error('Content must be between 1 and 1000 characters');
    }
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + DECAY_DURATIONS[decaySpeed] * 60 * 1000);

    // First, record the rate limit (insert into rate_limits table)
    const { error: rateLimitError } = await supabase
      .from('rate_limits')
      .insert({
        session_id: sessionId,
        action_type: 'thought',
      });

    if (rateLimitError) {
      console.error('Rate limit tracking error:', rateLimitError);
      // Continue anyway - the main insert will fail if rate limited
    }

    const { data, error } = await supabase
      .from('public_thoughts')
      .insert({
        content: trimmedContent,
        mode,
        decay_speed: decaySpeed,
        expires_at: expiresAt.toISOString(),
        session_id: sessionId,
      })
      .select()
      .single();

    if (error) {
      // Check if it's a rate limit error
      if (error.message?.includes('rate') || error.code === '42501') {
        throw new Error('Rate limit exceeded. Please wait before posting again.');
      }
      console.error('Error creating thought:', error);
      throw error;
    }

    // Refresh data after insert
    await fetchData();
    
    return data;
  }, [fetchData]);

  const addEcho = useCallback(async (thoughtId: string, text: string) => {
    const sessionId = getSessionId();
    
    // Client-side validation
    const trimmedText = text.trim();
    if (trimmedText.length < 1 || trimmedText.length > 500) {
      throw new Error('Echo must be between 1 and 500 characters');
    }
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ECHO_DECAY_DURATION * 60 * 1000);

    // Record rate limit
    const { error: rateLimitError } = await supabase
      .from('rate_limits')
      .insert({
        session_id: sessionId,
        action_type: 'echo',
      });

    if (rateLimitError) {
      console.error('Rate limit tracking error:', rateLimitError);
    }

    const { error } = await supabase
      .from('echoes')
      .insert({
        thought_id: thoughtId,
        fragment_text: trimmedText,
        expires_at: expiresAt.toISOString(),
        session_id: sessionId,
      });

    if (error) {
      if (error.message?.includes('rate') || error.code === '42501') {
        throw new Error('Rate limit exceeded. Please wait before echoing again.');
      }
      console.error('Error creating echo:', error);
      throw error;
    }

    // Refresh data
    await fetchData();
  }, [fetchData]);

  // Add thought from private store (for releasing to fog)
  const addThought = useCallback(async (thought: Thought) => {
    await createPublicThought(thought.content, thought.mode, thought.decaySpeed);
  }, [createPublicThought]);

  return {
    thoughts: filteredThoughts,
    echoes: state.echoes,
    filter: state.filter,
    isLoading: state.isLoading,
    error: state.error,
    setFilter,
    addThought,
    addEcho,
    createPublicThought,
    totalCount: state.thoughts.length,
  };
}
