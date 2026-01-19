import { Logo } from "@/components/logo"
import { AnimatedSpan, Terminal, TypingAnimation } from "@/components/magicui/terminal"
import { CircleDot } from "lucide-react"
import { Clients } from "../lib/clients/data"
import { CopyCommandButton } from "../lib/copy-button"
import { ClientDemosSection } from "./section"

export const TerminalDemo = () => {
    return (
        <ClientDemosSection
            heading="In Your Terminal"
            description="Use powerful APIs to build agents for knowledge work."
            cta={<CopyCommandButton />}
            graphic={<TerminalGraphic />}
            imageSide="right"
            clients={[Clients.ClaudeCode, Clients.Codex]}
            clientIconClassName="size-8"
        />
    )
}

const TerminalGraphic = () => {
    return (
        <div className="flex flex-col gap-4 items-center p-4 w-full">
            <Terminal className="h-64 w-full">
                <TypingAnimation duration={10} className="border px-4 py-2 rounded-sm">
                    Create a logo for my app and add it to the site
                </TypingAnimation>
                <AnimatedSpan className="pl-4 pt-2">
                    <div className="flex items-center">
                        <Logo className="mr-1 inline-block size-3" /> Creating Image with x402
                    </div>
                </AnimatedSpan>
                <Step text="Calling Stable Studio Nano Banana 3.0" />
                <Step text="Waiting for response" />
                <Step text="Fetching image with authentication" />
                <AnimatedSpan className="pl-4 pt-2">
                    <div className="flex items-center">
                        <CircleDot className="size-3 shrink-0 inline-block" /> Updating UI
                    </div>
                </AnimatedSpan>
                <Step text="Updating logo.tsx" />
                <Step text="Converting image to .ico" />
                <Step text="Updating layout.tsx" />
                <TypingAnimation duration={10} className="text-green-600">
                    ✓ I&apos;ve created a logo for my app and added it to the site. What would you like to do next?
                </TypingAnimation>
            </Terminal>
        </div>
    )
}

const Step = ({ text }: { text: string }) => {
    return (
        <AnimatedSpan delay={200}>
            <span className="pl-12 text-muted-foreground/60">
                {`⎿ ${text}...`}
            </span>
        </AnimatedSpan>
    )
}

