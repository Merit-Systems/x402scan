interface Props<T> {
  value: T | undefined;
  isLoading: boolean;
  component: (value: T) => React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
}

export const Loading = <T,>({
  value,
  isLoading,
  component,
  loadingComponent,
  errorComponent,
}: Props<T>) => {
  if (isLoading) {
    return loadingComponent ?? null;
  }
  if (value === undefined) {
    return errorComponent ?? null;
  }
  return component(value);
};
