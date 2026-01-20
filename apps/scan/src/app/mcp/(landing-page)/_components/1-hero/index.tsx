import { HeroBody } from './body';
import { HeroGraphic } from './graphic';

interface Props {
  inviteCode?: string;
}

export const Hero: React.FC<Props> = ({ inviteCode }) => {
  return (
    <div className="flex flex-col md:flex-row gap-16 w-full">
      <div className="flex-1 flex flex-col justify-center">
        <HeroBody inviteCode={inviteCode} />
      </div>
      <div className="flex-1 bg-muted rounded-xl flex items-center justify-center px-4 md:px-16 py-6 md:py-24">
        <HeroGraphic />
      </div>
    </div>
  );
};
