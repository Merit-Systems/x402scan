export interface UseBalanceReturnType {
  data: number | undefined;
  isLoading: boolean;
  isError: boolean;
  invalidate: () => void;
  isFetching: boolean;
  isSuccess: boolean;
  isPending: boolean;
}
