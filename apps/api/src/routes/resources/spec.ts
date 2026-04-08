import { Request, Response } from 'express'; // Assuming Express.js framework for API routes
import { resourceSpecService } from '../../services/resourceSpecService';

/**
 * API route handler for submitting an OpenAPI specification for a resource.
 * This endpoint accepts a resource ID and the raw OpenAPI spec content (JSON or YAML string).
 * It delegates the parsing and processing to the `resourceSpecService`.
 *
 * @param req The Express request object.
 *            Expected `req.body`: `{ resourceId: string, specContent: string }`
 * @param res The Express response object.
 */
export async function submitResourceOpenAPISpec(req: Request, res: Response) {
  const { resourceId, specContent } = req.body;

  if (!resourceId || typeof resourceId !== 'string' || resourceId.trim() === '') {
    return res.status(400).json({ success: false, message: 'Invalid or missing "resourceId" in request body.' });
  }
  if (!specContent || typeof specContent !== 'string' || specContent.trim() === '') {
    return res.status(400).json({ success: false, message: 'Invalid or missing "specContent" (OpenAPI spec string) in request body.' });
  }

  try {
    const result = await resourceSpecService.processAndStoreOpenAPISpec(resourceId, specContent);

    if (result.success) {
      // Upon successful processing, you might return:
      // - A confirmation message.
      // - The ID of the updated resource.
      // - A URL or endpoint for the user to test their newly defined schema.
      // - Optionally, a subset of the parsed schema for immediate feedback.
      return res.status(200).json({
        success: true,
        message: `OpenAPI spec successfully processed and linked to resource "${resourceId}".`,
        parsedSchemaSummary: { // Provide a summary rather than the full schema for response brevity
          title: result.schema.title,
          version: result.schema.version,
          pathsCount: Object.keys(result.schema.paths).length,
        },
        // For the "test the schema" part of the issue, a dedicated endpoint would be needed:
        // testSchemaUrl: `/api/resources/${resourceId}/schema/test`,
      });
    } else {
      // If parsing or processing failed, return detailed errors.
      return res.status(400).json({
        success: false,
        message: 'Failed to parse or process the provided OpenAPI spec.',
        errors: result.errors,
      });
    }
  } catch (error: any) {
    // Catch any unexpected server-side errors
    console.error(`[API Error] Failed to submit OpenAPI spec for resource "${resourceId}":`, error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred while processing your OpenAPI spec.',
      error: error.message,
    });
  }
}

// Example of how this route could be registered in an Express application:
/*
import express from 'express';
const router = express.Router();

// Define a POST endpoint for submitting OpenAPI specs
router.post('/resources/:resourceId/spec', submitResourceOpenAPISpec);

// In your main app file (e.g., app.ts or server.ts):
// app.use('/api', router); // Mount the router under the /api path
*/
