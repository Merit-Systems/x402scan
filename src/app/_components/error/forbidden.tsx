import { ForbiddenScreen } from './screen';

import { ErrorPageContainer } from './container';

import type { ErrorComponentProps } from './types';

export const AppGroupForbidden: React.FC<ErrorComponentProps> = props => {
  return (
    <ErrorPageContainer>
      <ForbiddenScreen {...props} />
    </ErrorPageContainer>
  );
};
