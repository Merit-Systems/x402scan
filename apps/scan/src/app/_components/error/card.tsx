import { AlertCircle } from 'lucide-react';

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import type { ErrorComponentProps } from './types';
import Link from 'next/link';
import { Streamdown } from 'streamdown';

import { SITE_URL } from '@/lib/site';

export const ErrorCard: React.FC<ErrorComponentProps> = ({
  title = 'An Error Has Occurred!',
  description,
  errorProps,
  Icon = AlertCircle,
  actions,
}) => {
  return (
    <Card className="flex flex-col max-w-md w-full gap-4 p-4">
      <CardHeader className="flex flex-row items-center text-center gap-2 p-0">
        <Icon className="size-6 text-primary" />
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        <CardDescription className="text-base hidden" />
      </CardHeader>
      <Streamdown className="text-base">
        {description ??
          errorProps?.error.message ??
          'This error has been reported to our team and will be investigated shortly.'}
      </Streamdown>
      <CardFooter className="p-0">
        {actions ?? (
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full">
              Back to Home
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
};

/**
 * Rendered as Markdown by `ErrorCard`, so the 404 body doubles as a short
 * site map for agents and crawlers landing on a dead URL (the same links are
 * served as `text/markdown` via content negotiation).
 */
const NOT_FOUND_DESCRIPTION = `The page you are looking for does not exist.

Where to look next: [Home](${SITE_URL}/) · [Marketplace](${SITE_URL}/resources) · [API docs](${SITE_URL}/docs) · [OpenAPI](${SITE_URL}/openapi.json) · [llms.txt](${SITE_URL}/llms.txt) · [Sitemap](${SITE_URL}/sitemap.xml)`;

export const NotFoundCard: React.FC<ErrorComponentProps> = ({
  title = 'Not Found',
  description = NOT_FOUND_DESCRIPTION,
  ...rest
}) => {
  return <ErrorCard title={title} description={description} {...rest} />;
};

export const ForbiddenCard: React.FC<ErrorComponentProps> = ({
  title = 'Forbidden',
  description = 'You are not authorized to access this resource.',
  ...rest
}) => {
  return <ErrorCard title={title} description={description} {...rest} />;
};
