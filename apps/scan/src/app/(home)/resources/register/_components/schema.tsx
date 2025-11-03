import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Code } from '@/components/ui/code';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export const OutputSchema = ({
  collapsible = false,
}: {
  collapsible?: boolean;
}) => {
  return (
    <Card className="">
      <CardHeader className="border-b">
        <CardTitle>Validation Schema Definition</CardTitle>
        <CardDescription>
          In order to be listed on x402scan, we check against a stricter schema
          than the default x402 schema. This allows us to present users with a
          UI that allows them to invoke the resources from within the app.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {collapsible ? (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="px-0">
                Show schema
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="bg-muted rounded-md">
                <Code value={schema} lang="ts" />
              </div>
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <div className="bg-muted rounded-md">
            <Code value={schema} lang="ts" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const schema = `type X402Response = {
    x402Version: number,
    error?: string,
    accepts?: Array<Accepts>,
    payer?: string
}
  
type Accepts = {
    scheme: "exact",
    network: "base",
    maxAmountRequired: string,
    resource: string,
    description: string,
    mimeType: string,
    payTo: string,
    maxTimeoutSeconds: number,
    asset: string,

    // Optionally, schema describing the input and output expectations for the paid endpoint.
    outputSchema?: {
        input: {
        type: "http",
        method: "GET" | "POST",
        bodyType?: "json" | "form-data" | "multipart-form-data" | "text" | "binary",
        queryParams?: Record<string, FieldDef>,
        bodyFields?: Record<string, FieldDef>,
        headerFields?: Record<string, FieldDef>
        },
        output?: Record<string, any>
    },

    // Optionally, additional custom data the provider wants to include.
    extra?: Record<string, any>
}
    
type FieldDef = {
    type?: string,
    required?: boolean | string[],
    description?: string,
    enum?: string[],
    properties?: Record<string, FieldDef> // for nested objects
}
`;
