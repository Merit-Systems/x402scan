import { z } from "zod";

export const webSocketMessageDataSchema = z.union([
  z.string(),
  z.instanceof(ArrayBuffer),
]);
