import { ClaudeDesktopDemo } from "./claude-desktop"


export const ClientDemos = () => {
    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-bold">Use x402 <span className="text-primary">Everywhere</span></h1>
            <ClaudeDesktopDemo />
        </div>
    )
}