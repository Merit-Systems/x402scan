import { LandingPageSection } from "../lib/section"
import { ClaudeDesktopDemo } from "./claude-desktop"
import { TerminalDemo } from "./terminal"


export const ClientDemos = () => {
    return (
        <LandingPageSection heading={<>Use x402 <span className="text-primary">Everywhere</span></>} description="Bring the power of x402 to your favorite AI agents.">
            <div className="flex flex-col gap-16">
                <ClaudeDesktopDemo />
                <TerminalDemo />
            </div>
        </LandingPageSection>
    )
}