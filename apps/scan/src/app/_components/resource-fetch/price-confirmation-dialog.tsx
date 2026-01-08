import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { formatTokenAmount } from '@/lib/token';

interface Props {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when the dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when user confirms payment at the new price */
  onConfirm: () => void;
  /** The initially quoted price (in token base units) */
  oldPrice: bigint;
  /** The actual price from the 402 response (in token base units) */
  newPrice: bigint;
}

/**
 * Dialog component that prompts users to confirm payment when a resource's
 * actual price exceeds the initial estimate.
 *
 * This provides transparency and user control over dynamic pricing scenarios,
 * ensuring users are aware of and consent to price changes before payment.
 */

export const PriceConfirmationDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  onConfirm,
  oldPrice,
  newPrice,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Price Increased</AlertDialogTitle>
          <AlertDialogDescription>
            The price for this resource has increased from the initial estimate.
            Do you want to proceed with the new price?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2 rounded-md border border-border p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Initial price:</span>
            <span className="font-medium">
              {formatTokenAmount(oldPrice)} USDC
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">New price:</span>
            <span className="font-bold text-primary">
              {formatTokenAmount(newPrice)} USDC
            </span>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Pay {formatTokenAmount(newPrice)} USDC
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
