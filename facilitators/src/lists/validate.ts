import type { Facilitator } from '../types';

// NOTE(shafu): CHAT GPT GENERATED crap, don't ask me how it works

// Find duplicate IDs
type FindDuplicateId<
  T extends readonly Facilitator[],
  Seen extends string = never,
> = T extends readonly [
  infer First extends Facilitator,
  ...infer Rest extends readonly Facilitator[],
]
  ? First['id'] extends Seen
    ? First['id'] // Found a duplicate ID
    : FindDuplicateId<Rest, Seen | First['id']>
  : never;

// Find duplicate address+token pairs within the same id:chain
type ExtractAddressTokenPairs<F extends Facilitator> =
  F['addresses'] extends Record<infer C, infer Addrs>
    ? Addrs extends readonly [
        infer A extends { address: string; token: { address: string } },
        ...infer RestAddrs,
      ]
      ?
          | `${F['id']}:${C & string}:${A['address']}:${A['token']['address']}`
          | ExtractAddressTokenPairs<
              { id: F['id']; addresses: Record<C, RestAddrs> } & Facilitator
            >
      : never
    : never;

type FindDuplicateAddressToken<
  T extends readonly Facilitator[],
  Seen extends string = never,
> = T extends readonly [
  infer First extends Facilitator,
  ...infer Rest extends readonly Facilitator[],
]
  ? ExtractAddressTokenPairs<First> extends infer CurrentPairs extends string
    ? CurrentPairs extends Seen
      ? CurrentPairs // Found a duplicate
      : FindDuplicateAddressToken<Rest, Seen | CurrentPairs>
    : FindDuplicateAddressToken<Rest, Seen>
  : never;

export function validateUniqueFacilitators<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const T extends readonly Facilitator<any>[],
>(
  facilitators: FindDuplicateId<T> extends never
    ? FindDuplicateAddressToken<T> extends never
      ? T
      : `❌ COMPILE ERROR: Duplicate address/token pair: '${FindDuplicateAddressToken<T>}' (format: id:chain:address:token)`
    : `❌ COMPILE ERROR: Duplicate facilitator ID: '${FindDuplicateId<T>}' - each ID must appear only once!`
): T {
  return facilitators;
}
