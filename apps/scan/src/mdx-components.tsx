import { isValidElement, type ReactElement } from 'react';

import { PromptTemplate } from '@/components/prompt-template';

import type { MDXComponents } from 'mdx/types';

const components: MDXComponents = {
  h1: ({ children }) => <h1 className="text-2xl font-bold">{children}</h1>,
  h2: ({ children }) => <h2 className="text-xl font-bold">{children}</h2>,
  h3: ({ children }) => <h3 className="text-lg font-semibold">{children}</h3>,
  h4: ({ children }) => <h4 className="text-base font-medium">{children}</h4>,
  h5: ({ children }) => <h5 className="text-sm font-medium">{children}</h5>,
  h6: ({ children }) => <h6 className="text-xs font-medium">{children}</h6>,
  pre: ({ children, ...rest }) => {
    if (
      typeof children === 'object' &&
      children !== null &&
      isValidElement(children as unknown)
    ) {
      const childElement = children as ReactElement;
      if (
        typeof childElement.props === 'object' &&
        childElement.props !== null &&
        'className' in childElement.props &&
        typeof childElement.props.className === 'string' &&
        childElement.props.className.includes('prompt')
      ) {
        return childElement;
      }
    }
    return <pre {...rest}>{children}</pre>;
  },
  code: ({ children, className, ...rest }) => {
    if (
      typeof className === 'string' &&
      className.includes('prompt') &&
      typeof children === 'string'
    ) {
      return <PromptTemplate templateString={children} />;
    }
    return (
      <pre>
        <code {...rest}>{children}</code>
      </pre>
    );
  },
};

export function useMDXComponents(): MDXComponents {
  return components;
}
