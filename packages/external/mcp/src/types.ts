export type GlobalFlags<T extends object = object> = {
  dev: boolean;
  yes?: boolean;
  invite?: string;
  sessionId?: string;
  provider?: string;
} & T;

export type Command<Flags extends GlobalFlags = GlobalFlags> = (
  flags: GlobalFlags<Flags>
) => Promise<void>;
