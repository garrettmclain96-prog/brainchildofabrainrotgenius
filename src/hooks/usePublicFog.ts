import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Thought, Echo, DecaySpeed, DecayMode, ThoughtZone, DECAY_DURATIONS, ECHO_DECAY_DURATION, ZONE_META } from '@/types/thought';
import { getSessionId } from '@/hooks/useSessionId';

interface PublicFogState {
  thoughts: Thought[];
  echoes: Map<string, Echo[]>;
  activeZone: ThoughtZone;
  isLoading: boolean;
  error: string | null;
  fadedCount: number;
}

export function usePublicFog() {
  const [state, setState] = useState<PublicFogState>({
    thoughts: [],
    echoes: new Map(),
    activeZone: 'overflow',
    isLoading: true,
    error: null,
    fadedCount: 0,
  });

  // Track if "rare" room should be visible this session
  const [rareVisible] = useState(() => Math.random() < 0.15);

  const fetchData = useCallback(async () => {
    try {
      const { data: thoughtsData, error: thoughtsError } = await supabase
        .from('thoughts_with_decay')
        .select('*')
        .order('created_at', { ascending: false });

      if (thoughtsError) throw thoughtsError;

      const { data: echoesData, error: echoesError } = await supabase
        .from('echoes_with_info')
        .select('*')
        .order('created_at', { ascending: false });

      if (echoesError) throw echoesError;

      const { data: fadedData } = await supabase.rpc('count_faded_thoughts');

      const thoughts: Thought[] = (thoughtsData || []).map((t: any) => ({
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
        zone: (t.zone || 'overflow') as ThoughtZone,
      }));

      const echoMap = new Map<string, Echo[]>();
      (echoesData || []).forEach((e: any) => {
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
        fadedCount: typeof fadedData === 'number' ? fadedData : 0,
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

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const thoughtsChannel = supabase
      .channel('public-thoughts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'public_thoughts' }, () => fetchData())
      .subscribe();

    const echoesChannel = supabase
      .channel('echoes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'echoes' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(thoughtsChannel);
      supabase.removeChannel(echoesChannel);
    };
  }, [fetchData]);

  // Filter thoughts by active zone — with zone-specific sorting
  const filteredThoughts = useMemo(() => {
    let result = state.thoughts.filter((t) => t.zone === state.activeZone);

    // Zone-specific display behaviors
    const zoneMeta = ZONE_META[state.activeZone];
    
    switch (state.activeZone) {
      case 'almost-gone':
        // Only show thoughts with <10% remaining
        result = state.thoughts.filter((t) => t.decayLevel >= 90);
        result.sort((a, b) => b.decayLevel - a.decayLevel);
        break;
      case 'noise':
        // Shuffle — chaotic
        result.sort(() => Math.random() - 0.5);
        break;
      case 'quiet':
        // Shortest thoughts first, slow reveal
        result.sort((a, b) => a.content.length - b.content.length);
        break;
      case 'preserved':
      case 'static':
      case 'quiet-period':
      case 'discarded':
        // Stable order — oldest first
        result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        break;
      case 'flood':
        // Newest first — high volume feel
        result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      default:
        // Anti-feed random
        result.sort(() => Math.random() - 0.5);
        break;
    }

    return result;
  }, [state.thoughts, state.activeZone]);

  // Zone counts for subtle indicators
  const zoneCounts = useMemo(() => {
    const counts: Partial<Record<ThoughtZone, number>> = {};
    state.thoughts.forEach((t) => {
      if (t.zone) {
        counts[t.zone] = (counts[t.zone] || 0) + 1;
      }
    });
    // Add "almost-gone" virtual count
    counts['almost-gone'] = state.thoughts.filter((t) => t.decayLevel >= 90).length;
    return counts;
  }, [state.thoughts]);

  const setZone = useCallback((zone: ThoughtZone) => {
    setState((prev) => ({ ...prev, activeZone: zone }));
  }, []);

  const createPublicThought = useCallback(async (content: string, mode: DecayMode, decaySpeed: DecaySpeed) => {
    const sessionId = getSessionId();
    
    const trimmedContent = content.trim();
    if (trimmedContent.length < 1 || trimmedContent.length > 1000) {
      throw new Error('Content must be between 1 and 1000 characters');
    }
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + DECAY_DURATIONS[decaySpeed] * 60 * 1000);

    // Determine zone based on decay speed, content, and time
    let zone: ThoughtZone = 'overflow';
    const hour = now.getHours();
    
    if (decaySpeed === 'fast' || decaySpeed === 'sink') zone = 'noise';
    else if (trimmedContent.length < 40) zone = 'quiet';
    else if (hour >= 22 || hour < 6) zone = 'late-night';

    const { error: rateLimitError } = await supabase
      .from('rate_limits')
      .insert({ session_id: sessionId, action_type: 'thought' });

    if (rateLimitError) {
      console.error('Rate limit tracking error:', rateLimitError);
    }

    const { data, error } = await supabase
      .from('public_thoughts')
      .insert({
        content: trimmedContent,
        mode,
        decay_speed: decaySpeed,
        expires_at: expiresAt.toISOString(),
        session_id: sessionId,
        zone,
      } as any)
      .select()
      .single();

    if (error) {
      if (error.message?.includes('rate') || error.code === '42501') {
        throw new Error('Rate limit exceeded. Please wait before posting again.');
      }
      throw error;
    }

    await fetchData();
    return data;
  }, [fetchData]);

  const addEcho = useCallback(async (thoughtId: string, text: string) => {
    const sessionId = getSessionId();
    
    const trimmedText = text.trim();
    if (trimmedText.length < 1 || trimmedText.length > 50) {
      throw new Error('Echo must be between 1 and 50 characters');
    }
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ECHO_DECAY_DURATION * 60 * 1000);

    const { error: rateLimitError } = await supabase
      .from('rate_limits')
      .insert({ session_id: sessionId, action_type: 'echo' });

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
      throw error;
    }

    await fetchData();
  }, [fetchData]);

  const addThought = useCallback(async (thought: Thought) => {
    await createPublicThought(thought.content, thought.mode, thought.decaySpeed);
  }, [createPublicThought]);

  return {
    thoughts: filteredThoughts,
    allThoughts: state.thoughts,
    echoes: state.echoes,
    activeZone: state.activeZone,
    isLoading: state.isLoading,
    error: state.error,
    fadedCount: state.fadedCount,
    zoneCounts,
    setZone,
    addThought,
    addEcho,
    createPublicThought,
    totalCount: state.thoughts.length,
    rareVisible,
  };
}
