import { cn } from "@/lib/utils";


interface Props {
    heading: string;
    description: string;
    cta: React.ReactNode;
    graphic: React.ReactNode;
    imageSide: 'left' | 'right';
}


export const ClientDemosSection = ({ heading, description, cta, graphic, imageSide }: Props) => {
    return (
        <div className={cn('flex gap-4', imageSide === 'right' ? 'flex-row-reverse' : 'flex-row')}>
            <div className="flex-1 bg-muted rounded-xl p-4">
                {graphic}
            </div>
            <div className="flex-1">
                <h2 className="text-2xl font-bold">{heading}</h2>
                <p className="text-muted-foreground">{description}</p>
                {cta}
            </div>
        </div>
    )
}