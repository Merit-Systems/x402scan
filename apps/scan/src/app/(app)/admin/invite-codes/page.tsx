import { forbidden } from "next/navigation";

import { Body, Heading } from "@/app/(app)/_components/deferred/page-utils";
import { auth } from "@/auth";

import { CreateInviteCodeButton } from "./_components/create-modal";
import { InviteCodesTable } from "./_components/table";
import { WalletInfo } from "./_components/wallet-info";

export default async function InviteCodesPage() {
  const session = await auth();

  if (session?.user.role !== "admin") {
    forbidden();
  }

  return (
    <div>
      <Heading
        title="Invite Codes"
        description="Create and manage invite codes that reward users with USDC."
        actions={<CreateInviteCodeButton />}
      />
      <Body>
        <WalletInfo />
        <InviteCodesTable />
      </Body>
    </div>
  );
}
