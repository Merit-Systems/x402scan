import { forbidden } from "next/navigation";

import { Body, Heading } from "@/app/_components/layout/page-utils";
import { auth } from "@/auth";

import { ComposerBalancesTable } from "./_components/table";

export default async function ComposerBalancesPage() {
  const session = await auth();
  if (session?.user.role !== "admin") {
    forbidden();
  }

  return (
    <div>
      <Heading
        title="Composer Wallet Balances"
        description="Users still holding USDC in a Composer wallet — both CDP server wallets and the earlier embedded wallets — with whatever identity we hold for them."
      />
      <Body>
        <ComposerBalancesTable />
      </Body>
    </div>
  );
}
