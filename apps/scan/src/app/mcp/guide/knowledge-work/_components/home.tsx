import { ArrowRight } from 'lucide-react';
import { Icon } from '../../_components/icon';
import { knowledgeWorkGuide } from '../_content/data';
import Link from 'next/link';

export const KnowledgeWorkHome = async () => {
  const guide = await knowledgeWorkGuide;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {guide.items
        .filter(item => item.type === 'section')
        .map(section => (
          <Link
            key={section.slug}
            className="border rounded-xl p-4 flex flex-col gap-2 hover:border-primary transition-all cursor-pointer group"
            href={`/mcp/guide/knowledge-work/${section.slug}`}
          >
            <div className="flex gap-2 justify-between items-center">
              <div className="flex items-center gap-2">
                <Icon icon={section.icon} className="size-4.5" />
                <h2 className="text-lg font-semibold">{section.title}</h2>
              </div>
              <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-all group-hover:text-primary" />
            </div>
            <p className="text-muted-foreground">{section.description}</p>
          </Link>
        ))}
    </div>
  );
};
