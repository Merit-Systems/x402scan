import { NotFoundScreen } from './screen';

import { ErrorPageContainer } from './container';

import type { ErrorComponentProps } from './types';

export const AppGroupNotFound: React.FC<ErrorComponentProps> = props => {
  return (
    <ErrorPageContainer>
      <NotFoundScreen {...props} />
    </ErrorPageContainer>
  );
};
