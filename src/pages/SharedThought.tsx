import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface SharedThoughtData {
  content: string;
  decay_level: number;
  expires_at: string;
  created_at: string;
}

export default function SharedThought() {
  const { slug } = useParams<{ slug: string }>();
  const [thought, setThought] = useState<SharedThoughtData | null>(null);
  const [dissolved, setDissolved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    async function fetch() {
      const { data, error } = await supabase
        .from('public_thoughts')
        .select('content, decay_level, expires_at, created_at')
        .eq('share_slug', slug)
        .maybeSingle();

      if (error || !data) {
        setDissolved(true);
      } else if (new Date(data.expires_at) <= new Date()) {
        setDissolved(true);
      } else {
        setThought(data);
      }
      setLoading(false);
    }

    fetch();
  }, [slug]);

  // Dynamic OG meta (won't work for crawlers since it's client-side, but the og-image edge function handles that)
  useEffect(() => {
    if (slug) {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const ogUrl = `https://${projectId}.supabase.co/functions/v1/og-image?slug=${slug}`;
      
      let ogMeta = document.querySelector('meta[property="og:image"]');
      if (ogMeta) ogMeta.setAttribute('content', ogUrl);
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          className="w-2 h-2 rounded-full bg-foreground/20"
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
    );
  }

  if (dissolved) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          className="max-w-md space-y-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        >
          <p className="text-xl font-thought text-foreground/40 tracking-wider">
            this thought has dissolved.
          </p>
          <p className="text-sm text-muted-foreground/30 font-thought">
            some things aren't meant to last.
          </p>
          <Link
            to="/"
            className="inline-block mt-8 px-6 py-3 rounded-xl bg-primary/10 text-primary/60 hover:bg-primary/15 hover:text-primary/80 transition-all duration-500 text-sm font-thought tracking-wide"
          >
            try brainchild →
          </Link>
        </motion.div>
      </div>
    );
  }

  const opacity = Math.max(0.2, 1 - (thought?.decay_level || 0) * 0.008);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        className="max-w-lg w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <article className="glass-premium rounded-xl p-6 relative overflow-hidden">
          {/* Decay bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-secondary/10 overflow-hidden rounded-t-xl">
            <motion.div
              className="h-full bg-foreground/20 rounded-full"
              initial={{ width: '100%' }}
              animate={{ width: `${100 - (thought?.decay_level || 0)}%` }}
              transition={{ duration: 1.5 }}
            />
          </div>

          <p
            className="font-thought text-base leading-relaxed text-card-foreground whitespace-pre-wrap break-words"
            style={{
              opacity,
              letterSpacing: `${(thought?.decay_level || 0) * 0.001}em`,
            }}
          >
            {thought?.content}
          </p>

          <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground/40">
            <span className="font-thought">{100 - (thought?.decay_level || 0)}% remaining</span>
          </div>
        </article>

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-block px-6 py-3 rounded-xl bg-primary/10 text-primary/50 hover:bg-primary/15 hover:text-primary/70 transition-all duration-500 text-sm font-thought tracking-wide"
          >
            unload your thoughts →
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
