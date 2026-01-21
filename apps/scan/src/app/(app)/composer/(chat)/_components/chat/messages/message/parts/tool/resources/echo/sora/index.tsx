import { SoraInput } from './input';
import { SoraOutput } from './output';

import type { ResourceComponent } from '../../types';

export const echoSoraComponents: ResourceComponent = {
  input: SoraInput,
  output: SoraOutput,
};
