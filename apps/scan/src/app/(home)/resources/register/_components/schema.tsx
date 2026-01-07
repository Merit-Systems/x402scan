import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Code } from '@/components/ui/code';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
        <Tabs defaultValue="v1">
          <TabsList>
            <TabsTrigger value="v1">V1 Schema</TabsTrigger>
            <TabsTrigger value="v2">V2 Schema</TabsTrigger>
          </TabsList>
          <TabsContent value="v1" className="mt-4">
            <div className="bg-muted rounded-md">
              <Code value={schemaV1} lang="ts" />
            </div>
          </TabsContent>
          <TabsContent value="v2" className="mt-4">
            <div className="bg-muted rounded-md">
              <Code value={schemaV2} lang="ts" />
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
    resourceInfo?: ResourceInfo  // V2 has resourceInfo at top level
}

type Accepts = {
    scheme: "exact",
    network: string,  // Chain ID format: "eip155:8453" for Base
    amount: string,   // V2 uses "amount" instead of "maxAmountRequired"
    payTo: string,
    maxTimeoutSeconds: number,
    asset: string,
    extra?: Record<string, any>
    // Note: No outputSchema here - it's in resourceInfo
}

type ResourceInfo = {
    resource: string,
    description?: string,
    mimeType?: string,
    outputSchema?: OutputSchema
}

type OutputSchema = {
    input: {
        type: "http",
        method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD",
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
