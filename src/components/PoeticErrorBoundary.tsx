import { Component, ReactNode } from 'react';

/**
 * Poetic Error Boundary
 * 
 * All failures should be silent, graceful, or poetic.
 * Never display error messages that break tone.
 */

interface Props {
  children: ReactNode;
  /** If true, render nothing on error instead of fallback */
  silent?: boolean;
}

interface State {
  hasError: boolean;
}

const POETIC_MESSAGES = [
  'a thought dissolved before it could form.',
  'the fog shifted. something was lost.',
  "some things aren't meant to render.",
  'a fragment faded mid-sentence.',
  'the void consumed this briefly.',
];

export class PoeticErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch() {
    // Silent. No crash reporting. No telemetry. Just let it go.
  }

  render() {
    if (this.state.hasError) {
      if (this.props.silent) return null;

      const message = POETIC_MESSAGES[Math.floor(Math.random() * POETIC_MESSAGES.length)];

      return (
        <div className="flex items-center justify-center p-8 min-h-[120px]">
          <p className="text-muted-foreground/20 text-xs font-thought italic tracking-wide text-center">
            {message}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
