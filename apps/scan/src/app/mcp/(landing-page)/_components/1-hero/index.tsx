import { HeroBody } from './body';
import { HeroGraphic } from './graphic';

interface Props {
  inviteCode?: string;
}

export const Hero: React.FC<Props> = ({ inviteCode }) => {
  return (
    <div className="flex gap-16 w-full">
      <div className="flex-1 flex flex-col justify-center">
        <HeroBody inviteCode={inviteCode} />
      </div>
      <div className="flex-1 bg-muted rounded-xl flex items-center justify-center py-24 px-16">
        <HeroGraphic />
      </div>
    </div>
  );
};
