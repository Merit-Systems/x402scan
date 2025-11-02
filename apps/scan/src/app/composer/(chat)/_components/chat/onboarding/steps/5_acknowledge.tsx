import Link from 'next/link';

export const AcknowledgeStep = () => {
  return (
    <div className="flex flex-col justify-center h-full">
      <ul className="list-disc list-inside text-xs md:text-sm border rounded-lg p-4 bg-muted">
        <li>Composer wallets run in a server that fully controls funds</li>
        <li>Do not add funds you are not willing to lose</li>
        <li>
          <span className="inline-block">By continuing, you agree to the</span>
          <ul className="list-disc list-inside pl-6">
            <li>
              <Link href="/tos" className="underline">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="underline">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  );
};
