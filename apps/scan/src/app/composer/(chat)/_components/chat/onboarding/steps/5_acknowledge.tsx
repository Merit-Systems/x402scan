import Link from 'next/link';

export const AcknowledgeStep = () => {
  return (
    <div className="flex flex-col justify-center h-full">
      <ul className="list-disc list-inside text-xs md:text-sm">
        <li>
          Composer wallets run in a server that has full control over funds
          added to them
        </li>
        <li>Do not add funds you are not willing to lose</li>
        <li>
          By continuing, you agree to the{' '}
          <Link href="/tos" className="underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </li>
      </ul>
    </div>
  );
};
