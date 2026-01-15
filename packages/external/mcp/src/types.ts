export type GlobalFlags<T extends object = object> = {
  dev: boolean;
} & T;

export type Command<Flags extends GlobalFlags = GlobalFlags> = (
  flags: GlobalFlags<Flags>
) => Promise<void>;
