import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThoughtStore } from '@/stores/thoughtStore';

interface ExitInterviewOverlayProps {
  isOpen: boolean;
  onComplete: (answers: Record<string, string>) => void;
  onDismiss: () => void;
}

const QUESTIONS = [
  {
    id: 'helped',
    text: 'did this help you think?',
    options: ['yes', 'sometimes', 'no', 'uncertain'],
  },
  {
    id: 'replaced',
    text: 'did it ever replace thinking?',
    options: ['never', 'occasionally', 'yes'],
  },
  {
    id: 'keep',
    text: 'do you want to continue?',
    options: ['yes', 'not sure', 'no, help me leave'],
  },
];

export function ExitInterviewOverlay({ isOpen, onComplete, onDismiss }: ExitInterviewOverlayProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const { dissolveEverything } = useThoughtStore();

  const handleAnswer = useCallback((questionId: string, answer: string) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);

    if (currentQuestion < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(c => c + 1), 800);
    } else {
      setTimeout(() => {
        if (answer === 'no, help me leave') {
          dissolveEverything();
          localStorage.clear();
        }
        onComplete(newAnswers);
      }, 1500);
    }
  }, [answers, currentQuestion, onComplete, dissolveEverything]);

  const question = QUESTIONS[currentQuestion];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
        >
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm" />

          <div className="relative z-10 max-w-sm w-full text-center">
            <motion.div
              className="w-8 h-[1px] mx-auto bg-muted-foreground/10 mb-8"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 2 }}
            />

            <div className="flex justify-center gap-2 mb-10">
              {QUESTIONS.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-700 ${
                    i === currentQuestion
                      ? 'bg-foreground/40 scale-125'
                      : i < currentQuestion
                      ? 'bg-foreground/15'
                      : 'bg-muted-foreground/10'
                  }`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8 }}
              >
                <p className="text-foreground/70 font-thought text-lg tracking-wide mb-8">
                  {question.text}
                </p>

                <div className="space-y-3">
                  {question.options.map((option) => (
                    <motion.button
                      key={option}
                      onClick={() => handleAnswer(question.id, option)}
                      className="w-full px-4 py-3 rounded-xl text-sm font-thought
                        bg-secondary/10 text-foreground/50 border border-border/10
                        hover:bg-secondary/20 hover:text-foreground/70 hover:border-border/20
                        transition-all duration-500"
                      whileTap={{ scale: 0.97 }}
                    >
                      {option}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            <motion.button
              onClick={onDismiss}
              className="mt-10 text-[10px] text-muted-foreground/15 hover:text-muted-foreground/30 transition-colors"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3 }}
            >
              not now
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
