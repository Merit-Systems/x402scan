import { ErrorPageContainer } from "./container";
import { NotFoundScreen } from "./screen";

import type { ErrorComponentProps } from "./types";

export const AppGroupNotFound: React.FC<ErrorComponentProps> = (props) => {
  return (
    <ErrorPageContainer>
      <NotFoundScreen {...props} />
    </ErrorPageContainer>
  );
};
