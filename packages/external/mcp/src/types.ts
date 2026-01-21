export type GlobalFlags<T extends object = object> = {
  dev: boolean;
  invite?: string;
} & T;

export type Command<Flags extends GlobalFlags = GlobalFlags> = (
  flags: GlobalFlags<Flags>
) => Promise<void>;
