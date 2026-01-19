import { Button } from "@/components/ui/button"
import { ClientDemosSection } from "./section"


export const ClaudeDesktopDemo = () => {
    return (
        <ClientDemosSection
            heading="In Claude Desktop"
            description="Claude Desktop is a code editor that uses the Claude Desktop API."
            cta={<Button>Install</Button>}
            graphic={<p>AAA</p>}
            imageSide="left"
        />
    )
}