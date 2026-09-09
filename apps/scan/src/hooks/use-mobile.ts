import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const MOBILE_QUERY = `(max-width: ${String(MOBILE_BREAKPOINT - 1)}px)`;

const subscribe = (onStoreChange: () => void) => {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener("change", onStoreChange);
  return () => {
    query.removeEventListener("change", onStoreChange);
  };
};

const getSnapshot = () => window.matchMedia(MOBILE_QUERY).matches;

export function useIsMobile(defaultValue = false) {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => defaultValue);
}
