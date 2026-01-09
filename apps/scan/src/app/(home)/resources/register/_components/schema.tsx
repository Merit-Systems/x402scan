import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Code } from '@/components/ui/code';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle } from 'lucide-react';

export const OutputSchema = () => {
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
        <Tabs defaultValue="v2">
          <TabsList>
            <TabsTrigger value="v2">V2 Schema</TabsTrigger>
            <TabsTrigger value="v1">V1 Schema (legacy)</TabsTrigger>
          </TabsList>
          <TabsContent value="v2" className="mt-4">
            <div className="bg-muted rounded-md">
              <Code value={schemaV2} lang="ts" />
            </div>
          </TabsContent>
          <TabsContent value="v1" className="mt-4 space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-md border border-destructive/50 bg-destructive/10 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                V1 is legacy and will be deprecated. We highly recommend using
                V2 for new resources.
              </span>
            </div>
            <div className="bg-muted rounded-md">
              <Code value={schemaV1} lang="ts" />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const schemaV1 = `type X402Response = {
    x402Version: 1,
    error?: string,
    accepts?: Array<Accepts>,
    payer?: string
}

type Accepts = {
    scheme: "exact",
    network: "base" | "base-sepolia" | "solana" | ...,  // Named network
    maxAmountRequired: string,  // V1 uses maxAmountRequired
    resource: string,
    description: string,
    mimeType: string,
    payTo: string,
    maxTimeoutSeconds: number,
    asset: string,
    outputSchema?: OutputSchema,  // Schema is per-accept in V1
    extra?: Record<string, any>
}

type OutputSchema = {
    input: {
        type: "http",
        method: "GET" | "POST",
        bodyType?: "json" | "form-data" | "multipart-form-data" | "text" | "binary",
        queryParams?: Record<string, FieldDef>,
        bodyFields?: Record<string, FieldDef>,
        headerFields?: Record<string, FieldDef>
    },
    output?: Record<string, any>
}

type FieldDef = {
    type?: string,
    required?: boolean | string[],
    description?: string,
    enum?: string[],
    properties?: Record<string, FieldDef>,
    items?: FieldDef
}
`;

const schemaV2 = `type X402Response = {
    x402Version: 2,
    error?: string,
    accepts?: Array<Accepts>,
    payer?: string,
    resource?: Resource
}

type Accepts = {
    scheme: "exact",
    network: string,  // Chain ID Example for Base: "eip155:8453"
    amount: string,   // V2 uses "amount" instead of "maxAmountRequired"
    payTo: string,
    maxTimeoutSeconds: number,
    asset: string,
    extra?: Record<string, any>
}

type Resource = {
    url: string,
    description?: string,
    mimeType?: string,
    outputSchema?: OutputSchema  // x402scan extension for UI invocation
}

type OutputSchema = {
    input: {
        type: "http",
        method: "GET" | "POST",
        bodyType?: "json" | "form-data" | "multipart-form-data" | "text" | "binary",
        queryParams?: Record<string, FieldDef>,
        bodyFields?: Record<string, FieldDef>,
        headerFields?: Record<string, FieldDef>
    },
    output?: Record<string, any>
}

type FieldDef = {
    type?: string,
    required?: boolean | string[],
    description?: string,
    enum?: string[],
    properties?: Record<string, FieldDef>,
    items?: FieldDef
}
`;
