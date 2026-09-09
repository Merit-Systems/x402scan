import { AlertCircle } from "lucide-react";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import type { ErrorComponentProps } from "./types";
import Link from "next/link";
import { Streamdown } from "streamdown";

export const ErrorCard: React.FC<ErrorComponentProps> = ({
  title = "An Error Has Occurred!",
  description,
  errorProps,
  Icon = AlertCircle,
  actions,
}) => {
  return (
    <Card className="flex w-full max-w-md flex-col gap-4 p-4">
      <CardHeader className="flex flex-row items-center gap-2 p-0 text-center">
        <Icon className="size-6 text-primary" />
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        <CardDescription className="hidden text-base" />
      </CardHeader>
      <Streamdown className="text-base">
        {description ??
          errorProps?.error.message ??
          "This error has been reported to our team and will be investigated shortly."}
      </Streamdown>
      <CardFooter className="p-0">
        {actions ?? (
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full">
              Back to Home
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
};

export const NotFoundCard: React.FC<ErrorComponentProps> = ({
  title = "Not Found",
  description = "The page you are looking for does not exist.",
  ...rest
}) => {
  return <ErrorCard title={title} description={description} {...rest} />;
};

export const ForbiddenCard: React.FC<ErrorComponentProps> = ({
  title = "Forbidden",
  description = "You are not authorized to access this resource.",
  ...rest
}) => {
  return <ErrorCard title={title} description={description} {...rest} />;
};
