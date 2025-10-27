import { auth } from "@/auth";
import { forbidden } from "next/navigation";
import { Heading, Body } from "@/app/_components/layout/page-utils";
import { WalletCharts } from "./_components/wallet-charts";
import { Suspense } from "react";

export default async function WalletsPage() {
    const session = await auth();

    if (session?.user.role !== 'admin') {
        return forbidden();
    }

    return (
        <div>
            <Heading 
                title="Agent Wallets Dashboard" 
                description="View server wallet USDC balances and snapshots over time" 
            />
            <Body>
                <div className="grid gap-4 md:grid-cols-2">
                    <Suspense fallback={<div>Loading...</div>}>
                        <WalletCharts days={7} />
                    </Suspense>
                </div>
            </Body>
        </div>
    );
}