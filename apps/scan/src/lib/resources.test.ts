import { describe, it, expect } from "vitest";
import { outputSchemaV1 } from "@/lib/x402/v1";
import { convertOpenApiSchemaToV1 } from "./openapi-to-v1";

function requireDefined<T>(value: T | undefined): T {
  if (value === undefined) {
    throw new Error("Expected test value to be defined");
  }
  return value;
}

describe("convertOpenApiSchemaToV1", () => {
  it("converts a bare JSON Schema (POST requestBody) to v1 format", () => {
    const schema = {
      type: "object",
      properties: {
        publicationSlug: {
          type: "string",
          description: "The publication slug",
        },
        postSlug: { type: "string", description: "The post slug" },
      },
      required: ["publicationSlug", "postSlug"],
    };

    const result = requireDefined(convertOpenApiSchemaToV1(schema, "GET"));
    const bodyFields = requireDefined(result.input.bodyFields);
    expect(result.input.method).toBe("POST");
    expect(bodyFields.publicationSlug).toEqual({
      type: "string",
      required: true,
      description: "The publication slug",
    });
    expect(bodyFields.postSlug).toEqual({
      type: "string",
      required: true,
      description: "The post slug",
    });
  });

  it("converts query parameters to v1 queryParams", () => {
    const schema = {
      parameters: [
        {
          name: "q",
          in: "query",
          schema: { type: "string" },
          required: true,
          description: "Search query",
        },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer" },
          required: false,
        },
      ],
    };

    const result = requireDefined(convertOpenApiSchemaToV1(schema, "GET"));
    const queryParams = requireDefined(result.input.queryParams);
    expect(result.input.method).toBe("GET");
    expect(queryParams.q).toEqual({
      type: "string",
      required: true,
      description: "Search query",
    });
    expect(queryParams.limit).toEqual({
      type: "integer",
    });
  });

  it("converts mixed requestBody + parameters", () => {
    const schema = {
      requestBody: {
        type: "object",
        properties: {
          name: { type: "string" },
        },
      },
      parameters: [
        {
          name: "X-Api-Version",
          in: "header",
          schema: { type: "string" },
          required: true,
        },
      ],
    };

    const result = requireDefined(convertOpenApiSchemaToV1(schema, "POST"));
    expect(result.input.method).toBe("POST");
    expect(requireDefined(result.input.bodyFields).name).toEqual({
      type: "string",
    });
    expect(requireDefined(result.input.headerFields)["X-Api-Version"]).toEqual({
      type: "string",
      required: true,
    });
  });

  it("returns undefined for empty schema", () => {
    const result = convertOpenApiSchemaToV1({}, "GET");
    expect(result).toBeUndefined();
  });

  it("preserves the specified method for POST with body", () => {
    const schema = {
      requestBody: {
        type: "object",
        properties: { data: { type: "string" } },
      },
    };

    const result = requireDefined(convertOpenApiSchemaToV1(schema, "PUT"));
    expect(result.input.method).toBe("PUT");
  });

  it("overrides GET to POST when body fields exist", () => {
    const schema = {
      type: "object",
      properties: { data: { type: "string" } },
    };

    const result = requireDefined(convertOpenApiSchemaToV1(schema, "GET"));
    expect(result.input.method).toBe("POST");
  });

  it("handles enum fields in properties", () => {
    const schema = {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["active", "inactive"],
          description: "Filter by status",
        },
      },
    };

    const result = requireDefined(convertOpenApiSchemaToV1(schema, "POST"));
    expect(requireDefined(result.input.bodyFields).status).toEqual({
      type: "string",
      enum: ["active", "inactive"],
      description: "Filter by status",
    });
  });

  it("passes output schema through to the result", () => {
    const inputSchema = {
      type: "object",
      properties: { q: { type: "string" } },
    };
    const outputSchema = {
      type: "object",
      properties: { result: { type: "string" } },
    };

    const result = requireDefined(
      convertOpenApiSchemaToV1(inputSchema, "POST", outputSchema)
    );
    expect(result.output).toEqual(outputSchema);
  });

  it("produces output that passes outputSchemaV1 validation", () => {
    const schema = {
      parameters: [
        {
          name: "address",
          in: "query",
          schema: { type: "string" },
          required: true,
          description: "Wallet address",
        },
      ],
    };

    const result = convertOpenApiSchemaToV1(schema, "GET");
    expect(result).toBeDefined();

    const validation = outputSchemaV1.safeParse(result);
    expect(validation.success).toBe(true);
  });

  it("skips parameters with no name", () => {
    const schema = {
      parameters: [
        { in: "query", schema: { type: "string" } },
        {
          name: "valid",
          in: "query",
          schema: { type: "string" },
          required: true,
        },
      ],
    };

    const result = requireDefined(convertOpenApiSchemaToV1(schema, "GET"));
    expect(Object.keys(requireDefined(result.input.queryParams))).toEqual([
      "valid",
    ]);
  });
});
