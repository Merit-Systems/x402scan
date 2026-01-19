
interface Props {
    heading: string | React.ReactNode;
    description: string;
    children: React.ReactNode;
}

export const LandingPageSection: React.FC<Props> = ({ heading, description, children }) => {
    return (
        <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-4">
                <h1 className="text-4xl font-bold">
                    {heading}
                </h1>
                <p className="font-mono text-muted-foreground/60 text-lg">
                    {description}
                </p>
            </div>
            {children}
        </div>
    )
}