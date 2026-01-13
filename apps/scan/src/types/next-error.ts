type NextError = Error & { digest?: string };

export interface NextErrorProps {
  error: NextError;
  reset: () => void;
}
