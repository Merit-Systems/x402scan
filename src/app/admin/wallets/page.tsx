import { auth } from "@/auth";
import { forbidden } from "next/navigation";
import { Heading, Body } from "@/app/_components/layout/page-utils";

export default async function WalletsPage() {
    const session = await auth();

    if (session?.user.role !== 'admin') {
        return forbidden();
    }

    return (
        <div>
            <Heading title="Agent Wallets Dashboard" description="View Server Wallet information and snapshots" />
            <Body>
                <h1>Wallets</h1>
            </Body>
        </div>
    );
}