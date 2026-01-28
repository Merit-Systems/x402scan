import { isValidElement, type ReactElement } from 'react';

import { PromptTemplate } from '@/components/prompt-template';

import type { MDXComponents } from 'mdx/types';

const components: MDXComponents = {
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold mt-12 mb-4 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-bold mt-8 mb-4 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-semibold mt-6 mb-3 first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-base font-medium mt-4 mb-2 first:mt-0">{children}</h4>
  ),
  h5: ({ children }) => (
    <h5 className="text-sm font-medium mt-2 mb-1 first:mt-0">{children}</h5>
  ),
  h6: ({ children }) => <h6 className="text-xs font-medium">{children}</h6>,
  p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
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
        return <div className="my-8">{childElement}</div>;
      }
    }
    return (
      <pre {...rest} className="mb-4">
        {children}
      </pre>
    );
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
  hr: () => <hr className="my-8" />,
  ul: ({ children }) => (
    <ul className="list-disc list-outside pl-4 mb-4 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside pl-4 mb-4 last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="mb-2 last:mb-0 pl-2">{children}</li>,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
