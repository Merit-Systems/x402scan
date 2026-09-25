"use client";

import * as React from "react";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

interface ResponsiveViewProps {
  desktop: React.ReactNode;
  mobile: React.ReactNode;
  desktopClassName?: string;
  mobileClassName?: string;
}

function ResponsiveView({
  desktop,
  mobile,
  desktopClassName,
  mobileClassName,
}: ResponsiveViewProps) {
  return (
    <>
      <div className={cn("md:hidden", mobileClassName)}>{mobile}</div>
      <div className={cn("hidden md:block", desktopClassName)}>{desktop}</div>
    </>
  );
}

interface ResponsiveDataViewConfig<TProps extends object> {
  component: React.ComponentType<TProps>;
  loading: React.ComponentType<TProps>;
}

interface ResponsiveDataViewProps<TProps extends object> {
  desktop: ResponsiveDataViewConfig<TProps>;
  mobile: ResponsiveDataViewConfig<TProps>;
  props: TProps;
  desktopClassName?: string;
  mobileClassName?: string;
}

const mobileMediaQuery = "(max-width: 767px)";

function subscribeToMobileViewport(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(mobileMediaQuery);
  mediaQuery.addEventListener("change", onStoreChange);

  return () => {
    mediaQuery.removeEventListener("change", onStoreChange);
  };
}

function getMobileSnapshot(): boolean | null {
  return window.matchMedia(mobileMediaQuery).matches;
}

function getServerMobileSnapshot(): boolean | null {
  return null;
}

function ResponsiveDataView<TProps extends object>({
  desktop,
  mobile,
  props,
  desktopClassName,
  mobileClassName,
}: ResponsiveDataViewProps<TProps>) {
  const isMobile = useSyncExternalStore(
    subscribeToMobileViewport,
    getMobileSnapshot,
    getServerMobileSnapshot
  );

  if (isMobile === null) {
    const DesktopLoading = desktop.loading;
    const MobileLoading = mobile.loading;

    return (
      <ResponsiveView
        desktop={<DesktopLoading {...props} />}
        mobile={<MobileLoading {...props} />}
        desktopClassName={desktopClassName}
        mobileClassName={mobileClassName}
      />
    );
  }

  if (isMobile) {
    const Mobile = mobile.component;
    return (
      <div className={mobileClassName}>
        <Mobile {...props} />
      </div>
    );
  }

  const Desktop = desktop.component;
  return (
    <div className={desktopClassName}>
      <Desktop {...props} />
    </div>
  );
}

export { ResponsiveDataView, ResponsiveView };
export type {
  ResponsiveDataViewConfig,
  ResponsiveDataViewProps,
  ResponsiveViewProps,
};
