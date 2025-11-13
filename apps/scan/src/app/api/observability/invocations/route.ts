import { clickhouse } from '@/services/db/clickhouse/resource-invocations';
import { NextResponse } from 'next/server';

interface InvocationsRequest {
  resourceUrl: string;
  startDate: string;
  endDate: string;
  page?: number;
  pageSize?: number;
}

interface InvocationResponse {
  id: string;
  url: string;
  method: string;
  status_code: number;
  status_text: string;
  duration: number;
  created_at: string;
  request_content_type: string;
  response_content_type: string;
  response_body: string;
  response_headers: string;
}

interface PaginatedResponse {
  data: InvocationResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function POST(
  request: Request
): Promise<NextResponse<PaginatedResponse>> {
  try {
    const {
      resourceUrl,
      startDate,
      endDate,
      page = 1,
      pageSize = 50,
    } = (await request.json()) as InvocationsRequest;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const offset = (page - 1) * pageSize;

    const countQuery = `
      SELECT count() AS total
      FROM resource_invocations
      WHERE created_at >= toDateTime('${start.toISOString().replace('T', ' ').split('.')[0]}')
        AND created_at <= toDateTime('${end.toISOString().replace('T', ' ').split('.')[0]}')
        AND url = '${resourceUrl}'
    `;

    const countResultSet = await clickhouse.query({
      query: countQuery,
      format: 'JSONEachRow',
    });

    const countData = await countResultSet.json();
    const totalStr = (countData as Array<{ total: string }>)[0]?.total ?? '0';
    const total = parseInt(totalStr);

    const dataQuery = `
      SELECT
        id,
        url,
        method,
        status_code,
        status_text,
        duration,
        created_at,
        request_content_type,
        response_content_type,
        response_body,
        response_headers
      FROM resource_invocations
      WHERE created_at >= toDateTime('${start.toISOString().replace('T', ' ').split('.')[0]}')
        AND created_at <= toDateTime('${end.toISOString().replace('T', ' ').split('.')[0]}')
        AND url = '${resourceUrl}'
      ORDER BY created_at DESC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `;

    const dataResultSet = await clickhouse.query({
      query: dataQuery,
      format: 'JSONEachRow',
    });

    const data = await dataResultSet.json();

    return NextResponse.json({
      data: data as InvocationResponse[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('ClickHouse query error:', error);
    return NextResponse.json(
      {
        data: [],
        total: 0,
        page: 1,
        pageSize: 50,
        totalPages: 0,
      },
      { status: 500 }
    );
  }
}
