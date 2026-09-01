"use client";

import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray;
interface JsonObject {
  [key: string]: JsonValue;
}
export type JsonArray = JsonValue[];

/** JSON objects are the only non-null, non-array containers in the domain. */
function isJsonObject(value: JsonValue): value is JsonObject {
  return value instanceof Object && !Array.isArray(value);
}

/** JSON numbers are always finite; strings and booleans never are. */
function isJsonNumber(value: string | number | boolean): value is number {
  return Number.isFinite(value);
}

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

  const renderPrimitiveValue = (value: string | number | boolean | null) => {
    if (value === null) {
      return <span className="text-muted-foreground">null</span>;
    }

    if (value === true || value === false) {
      return (
        <span className="text-purple-600 dark:text-purple-400">
          {value.toString()}
        </span>
      );
    }

    if (isJsonNumber(value)) {
      return <span className="text-blue-600 dark:text-blue-400">{value}</span>;
    }

    return (
      <span className="text-green-600 dark:text-green-400">
        &quot;{value}&quot;
      </span>
    );
  };

  const renderCollapsedPreview = (value: JsonArray | JsonObject): string => {
    if (Array.isArray(value)) {
      if (value.length === 0) return "[]";
      return `[${value.length}]`;
    }

    const keys = Object.keys(value);
    if (keys.length === 0) return "{}";
    return `{${keys.length}}`;
  };

  if (data !== null && (Array.isArray(data) || isJsonObject(data))) {
    const isArray = Array.isArray(data);
    const items = isArray ? data : Object.entries(data);
    const isEmpty = isArray
      ? data.length === 0
      : Object.keys(data).length === 0;
    const openBracket = isArray ? "[" : "{";
    const closeBracket = isArray ? "]" : "}";

    return (
      <div className={cn("font-mono text-xs", depth > 0 && "ml-4")}>
        <div className="flex items-start gap-1">
          {!isEmpty && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="mt-0.5 flex-shrink-0 rounded p-0.5 transition-colors hover:bg-accent"
              aria-label={isCollapsed ? "Expand" : "Collapse"}
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
                  <span className="font-medium text-foreground">{keyName}</span>
                  <span className="text-muted-foreground">:</span>
                </>
              )}
              <span className="text-muted-foreground">{openBracket}</span>
              {isCollapsed && !isEmpty && (
                <span className="text-[10px] text-muted-foreground">
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
        "font-mono text-xs flex items-baseline gap-1",
        depth > 0 && "ml-4"
      )}
    >
      <span className="w-4" />
      {keyName && (
        <>
          <span className="font-medium text-foreground">{keyName}</span>
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
    <div className={cn("p-3 overflow-auto", className)}>
      <JsonNode data={data} depth={0} defaultCollapsed={defaultCollapsed} />
    </div>
  );
};
