import { useState } from 'react';
import { motion } from 'framer-motion';
import { useThoughtStore } from '@/stores/thoughtStore';
import { useCompostLayer } from '@/hooks/useCompostLayer';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

/**
 * Export and Erase — the user owns their thoughts and their absence.
 * Export runs entirely in the browser; erase is irreversible on purpose.
 */
export function ExportErase() {
  const { privateThoughts, dissolveEverything } = useThoughtStore();
  const compost = useCompostLayer();
  const [confirmWord, setConfirmWord] = useState('');

  const download = (contents: string, filename: string, type: string) => {
    const url = URL.createObjectURL(new Blob([contents], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const stamp = () => new Date().toISOString().slice(0, 10);

  const exportText = () => {
    const body = privateThoughts
      .map((t) => `— ${t.createdAt.toLocaleString()}\n${t.content}\n`)
      .join('\n');
    download(body || 'nothing here.\n', `brainchild-${stamp()}.txt`, 'text/plain');
  };

  const exportJson = () => {
    const body = JSON.stringify(
      privateThoughts.map((t) => ({
        content: t.content,
        category: t.category,
        createdAt: t.createdAt.toISOString(),
        expiresAt: t.expiresAt.toISOString(),
        starred: t.starred,
        halfLife: t.halfLife ?? null,
      })),
      null,
      2
    );
    download(body, `brainchild-${stamp()}.json`, 'application/json');
  };

  const erase = () => {
    dissolveEverything();
    compost.clear();
    try {
      localStorage.removeItem('brainchild-last-words-seen');
      localStorage.removeItem('brainchild-threshold');
    } catch {
      /* ignore */
    }
    setConfirmWord('');
    toast('everything is gone', { description: 'nothing was kept anywhere' });
  };

  return (
    <section className="glass-premium rounded-xl p-4 space-y-4">
      <p className="text-[11px] font-thought text-muted-foreground/50 leading-relaxed">
        take your thoughts with you, or end them completely
      </p>

      <div className="flex gap-2">
        <motion.button
          onClick={exportText}
          className="flex-1 min-h-[44px] rounded-xl text-xs font-thought italic text-foreground/65 bg-secondary/20 hover:bg-secondary/30 transition-all duration-500"
          whileTap={{ scale: 0.98 }}
        >
          export as text
        </motion.button>
        <motion.button
          onClick={exportJson}
          className="flex-1 min-h-[44px] rounded-xl text-xs font-thought italic text-foreground/65 bg-secondary/20 hover:bg-secondary/30 transition-all duration-500"
          whileTap={{ scale: 0.98 }}
        >
          export as data
        </motion.button>
      </div>

      <AlertDialog onOpenChange={() => setConfirmWord('')}>
        <AlertDialogTrigger asChild>
          <motion.button
            className="w-full min-h-[44px] rounded-xl text-xs font-thought italic text-destructive-foreground/60 bg-destructive/8 hover:bg-destructive/15 transition-all duration-500"
            whileTap={{ scale: 0.98 }}
          >
            erase everything
          </motion.button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-card/95 backdrop-blur-2xl border-border/30 max-w-sm mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-thought text-foreground/80 text-sm">
              this is the end of them
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[11px] font-thought text-muted-foreground/50 leading-relaxed">
              every thought, every trace of residue, gone from this device and from
              the backup. write <span className="text-foreground/70">forget</span> to
              confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <input
            value={confirmWord}
            onChange={(e) => setConfirmWord(e.target.value)}
            placeholder="forget"
            aria-label="Type forget to confirm"
            className="w-full min-h-[44px] px-3 rounded-xl bg-background/50 border border-border/20 font-thought italic text-sm text-foreground/75 placeholder:text-muted-foreground/25 focus:outline-none focus:border-destructive/40 transition-colors duration-500"
          />

          <AlertDialogFooter className="flex-col sm:flex-col gap-2">
            <AlertDialogAction
              onClick={erase}
              disabled={confirmWord.trim().toLowerCase() !== 'forget'}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full disabled:opacity-30"
            >
              erase everything
            </AlertDialogAction>
            <AlertDialogCancel className="bg-secondary text-secondary-foreground hover:bg-secondary/80 w-full mt-0">
              keep them
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
