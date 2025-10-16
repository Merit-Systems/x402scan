'use client';

import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

interface JsonNodeProps {
  data: JsonValue;
  keyName?: string;
  depth?: number;
  defaultCollapsed?: boolean;
}

const JsonNode = ({
  data,
  keyName,
  depth = 0,
  defaultCollapsed = true,
}: JsonNodeProps) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed && depth > 0);

  const getValueType = (value: JsonValue): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };

  const renderPrimitiveValue = (value: JsonValue) => {
    if (value === null) {
      return <span className="text-muted-foreground">null</span>;
    }

    if (typeof value === 'string') {
      return (
        <span className="text-green-600 dark:text-green-400">
          &quot;{value}&quot;
        </span>
      );
    }

    if (typeof value === 'number') {
      return <span className="text-blue-600 dark:text-blue-400">{value}</span>;
    }

    if (typeof value === 'boolean') {
      return (
        <span className="text-purple-600 dark:text-purple-400">
          {value.toString()}
        </span>
      );
    }

    return (
      <span>
        {value !== null && value !== undefined ? JSON.stringify(value) : 'null'}
      </span>
    );
  };

  const renderCollapsedPreview = (value: JsonValue): string => {
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      return `[${value.length}]`;
    }

    if (typeof value === 'object' && value !== null) {
      const keys = Object.keys(value);
      if (keys.length === 0) return '{}';
      return `{${keys.length}}`;
    }

    return '';
  };

  const valueType = getValueType(data);

  if (valueType === 'array' || valueType === 'object') {
    const isArray = Array.isArray(data);
    const items = isArray ? data : Object.entries(data as JsonObject);
    const isEmpty = isArray
      ? data.length === 0
      : Object.keys(data as JsonObject).length === 0;
    const openBracket = isArray ? '[' : '{';
    const closeBracket = isArray ? ']' : '}';

    return (
      <div className={cn('font-mono text-xs', depth > 0 && 'ml-4')}>
        <div className="flex items-start gap-1">
          {!isEmpty && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="mt-0.5 flex-shrink-0 hover:bg-accent rounded p-0.5 transition-colors"
              aria-label={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? (
                <ChevronRightIcon className="size-3" />
              ) : (
                <ChevronDownIcon className="size-3" />
              )}
            </button>
          )}
          {isEmpty && <span className="w-4" />}

          <div className="flex-1">
            <span className="flex items-baseline gap-1">
              {keyName && (
                <>
                  <span className="text-foreground font-medium">{keyName}</span>
                  <span className="text-muted-foreground">:</span>
                </>
              )}
              <span className="text-muted-foreground">{openBracket}</span>
              {isCollapsed && !isEmpty && (
                <span className="text-muted-foreground text-[10px]">
                  {renderCollapsedPreview(data)}
                </span>
              )}
              {(isEmpty || isCollapsed) && (
                <span className="text-muted-foreground">{closeBracket}</span>
              )}
            </span>

            {!isCollapsed && !isEmpty && (
              <div className="mt-1">
                {isArray
                  ? items.map((item, index) => (
                      <JsonNode
                        key={index}
                        data={item}
                        keyName={index.toString()}
                        depth={depth + 1}
                        defaultCollapsed={defaultCollapsed}
                      />
                    ))
                  : (items as [string, JsonValue][]).map(([key, value]) => (
                      <JsonNode
                        key={key}
                        data={value}
                        keyName={key}
                        depth={depth + 1}
                        defaultCollapsed={defaultCollapsed}
                      />
                    ))}
                <div className="text-muted-foreground">{closeBracket}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'font-mono text-xs flex items-baseline gap-1',
        depth > 0 && 'ml-4'
      )}
    >
      <span className="w-4" />
      {keyName && (
        <>
          <span className="text-foreground font-medium">{keyName}</span>
          <span className="text-muted-foreground">:</span>
        </>
      )}
      {renderPrimitiveValue(data)}
    </div>
  );
};

interface JsonViewerProps {
  data: JsonValue;
  defaultCollapsed?: boolean;
  className?: string;
}

export const JsonViewer = ({
  data,
  defaultCollapsed = true,
  className,
}: JsonViewerProps) => {
  return (
    <div className={cn('p-3 overflow-auto', className)}>
      <JsonNode data={data} depth={0} defaultCollapsed={defaultCollapsed} />
    </div>
  );
};
