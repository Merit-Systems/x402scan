import { HeroBody } from "./body"
import { HeroGraphic } from "./graphic"

export const Hero = () => {
    return (
        <div className="flex gap-16 h-[calc(100vh-24rem)] container mx-auto">
            <div className="flex-1 flex flex-col justify-center">
                <HeroBody />
            </div>
            <div className="flex-1 bg-muted rounded-xl flex items-center justify-center">
                <HeroGraphic />
            </div>
        </div>
    )
}