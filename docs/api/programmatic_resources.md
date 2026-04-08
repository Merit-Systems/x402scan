# Programmatic Resource Registration API

This API enables resource providers to programmatically register new resources or trigger a refresh of existing resource information within the system. This ensures that your offerings are always up-to-date and correctly displayed without manual intervention.

## Endpoint

`POST /api/v1/resources`

## Purpose

To provide a public API endpoint for resource providers to submit or update their resource details. This endpoint directly leverages the existing internal TRPC `resource.register` procedure, ensuring consistency with internal resource management logic.

## Request

**Method:** `POST`
**URL:** `/api/v1/resources`
**Content-Type:** `application/json`

### Request Body

The request body should be a JSON object containing the details of the resource to be registered or updated. The structure should mirror the expected input for the internal `resource.register` procedure.

| Field       | Type       | Description                                                    | Required |
| :---------- | :--------- | :------------------------------------------------------------- | :------- |
| `name`      | `string`   | The display name of the resource.                              | Yes      |
| `description` | `string`   | A brief description of the resource.                           | Yes      |
| `url`       | `string`   | The URL where the resource can be accessed or found.           | Yes      |
| `category`  | `string`   | The primary category the resource belongs to (e.g., 'Tool', 'Service', 'Dataset'). | Yes      |
| `providerId`| `string`   | (Optional) A unique identifier for the resource provider. Useful for updating existing resources. | No       |
| `tags`      | `string[]` | (Optional) An array of keywords or tags associated with the resource. | No       |
| `metadata`  | `object`   | (Optional) An object for arbitrary key-value pairs of additional resource data. | No       |

### Example Request

