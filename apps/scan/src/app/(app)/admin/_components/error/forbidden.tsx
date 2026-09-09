import { ErrorPageContainer } from "@/app/_components/error/container";
import { ForbiddenScreen } from "@/app/_components/error/screen";

import type { ErrorComponentProps } from "@/app/_components/error/types";

export const AppGroupForbidden: React.FC<ErrorComponentProps> = (props) => {
  return (
    <ErrorPageContainer>
      <ForbiddenScreen {...props} />
    </ErrorPageContainer>
  );
};
