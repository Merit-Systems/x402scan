import { Spinner } from "@/components/ui/spinner";

/** Authentication must resolve before any protected content is rendered. */
export function LoadingAccess() {
  return (
    <output className="flex flex-1 items-center justify-center gap-2 py-12">
      <Spinner />
      <span className="sr-only">Checking access</span>
    </output>
  );
}
