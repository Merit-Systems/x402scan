import { AlertTriangle, Info } from 'lucide-react';

type RegistrationAlertProps = {
  registeredCount: number;
  filteredCount: number;
  totalCount: number;
};

export function RegistrationAlert({
  registeredCount,
  filteredCount,
  totalCount,
}: RegistrationAlertProps) {
  if (registeredCount === 0 && filteredCount > 0) {
    // Critical: No accepts registered at all
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="size-4 text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1 text-red-900 dark:text-red-100">
              Resource won&apos;t appear in search
            </h3>
            <p className="text-sm text-red-800 dark:text-red-200">
              Only Base and Solana networks are supported. Add accepts for these networks to make your resource discoverable.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (filteredCount > 0) {
    // Some accepts filtered
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900 p-4">
        <div className="flex gap-3">
          <Info className="size-4 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1.5 text-yellow-900 dark:text-yellow-100">
              Some Payment Addresses Filtered
            </h3>
            <div className="text-sm space-y-1.5 text-yellow-800 dark:text-yellow-200">
              <p>
                {registeredCount} of {totalCount} payment address
                {totalCount > 1 ? 'es were' : ' was'} registered. {filteredCount}{' '}
                {filteredCount > 1 ? 'were' : 'was'} filtered out because{' '}
                {filteredCount > 1 ? 'they use' : 'it uses'} unsupported networks.
              </p>
              <p className="text-xs opacity-80">
                Only Base and Solana are supported.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // All accepts registered successfully - no alert needed
  return null;
}
