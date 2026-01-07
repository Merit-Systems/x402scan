import type { z } from 'zod3';

export interface NormalizedAccept {
    scheme: 'exact',
    network: string,
    amount: string;
    payTo: string;
    maxTimeoutSeconds: number;
    asset: string;
    extra?: Record<string, unknown>;
}

export interface NormalizedResourceInfo {
    resource: string;
    description?: string;
    mimeType?: string;
    outputSchema?: {
        input: {
            type: string;
            method?: string;
            bodyType?: string;
            queryParams?: Record<string, unknown>;
            bodyFields?: Record<string, unknown>;
            headerFields?: Record<string, unknown>;
        }
        output?: Record<string, unknown>;
    }
}

export type X402Version = 1 | 2;

export interface NormalizedX402Response {
    version: X402Version;
    error?: string;
    payer?: string;
    accepts?: NormalizedAccept[];
    resourceInof?: NormalizedResourceInfo;
}

export type ParseResult<T> = | { success: true; data: T; version: X402Version } | { success: false; errors: string[] };