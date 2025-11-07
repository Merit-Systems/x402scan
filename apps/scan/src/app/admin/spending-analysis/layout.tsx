import { WalletSpendingSortingProvider } from '@/app/_contexts/sorting/wallet-spending/provider';
import { defaultWalletSpendingSorting } from '@/app/_contexts/sorting/wallet-spending/default';
import { ToolSpendingSortingProvider } from '@/app/_contexts/sorting/tool-spending/provider';
import { defaultToolSpendingSorting } from '@/app/_contexts/sorting/tool-spending/default';

export default function SpendingAnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WalletSpendingSortingProvider
      initialSorting={defaultWalletSpendingSorting}
    >
      <ToolSpendingSortingProvider initialSorting={defaultToolSpendingSorting}>
        {children}
      </ToolSpendingSortingProvider>
    </WalletSpendingSortingProvider>
  );
}
