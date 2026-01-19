import { ClaudeDesktopDemo } from "./claude-desktop"


export const ClientDemos = () => {
    return (
        <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-4">
                <h1 className="text-4xl font-bold">Use x402 <span className="text-primary">Everywhere</span></h1>
                <p className="font-mono text-muted-foreground/60 text-lg">
                    Bring the power of x402 to your favorite AI agents.
                </p>
            </div>
            <ClaudeDesktopDemo />
        </div>
    )
}