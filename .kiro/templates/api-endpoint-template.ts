/**
 * @file {{ENDPOINT_NAME}}.controller.ts
 * @description Controller for {{RESOURCE_NAME}} endpoints
 * @created {{DATE}}
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { {{SERVICE_NAME}} } from '../services/{{service-file}}';

// Request validation schemas
const {{ENDPOINT_NAME}}RequestSchema = z.object({
  // Define request body schema
});

const {{ENDPOINT_NAME}}ParamsSchema = z.object({
  // Define URL params schema
});

type {{ENDPOINT_NAME}}Request = z.infer<typeof {{ENDPOINT_NAME}}RequestSchema>;
type {{ENDPOINT_NAME}}Params = z.infer<typeof {{ENDPOINT_NAME}}ParamsSchema>;

/**
 * {{METHOD}} {{ENDPOINT_PATH}}
 * {{DESCRIPTION}}
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export async function {{ENDPOINT_NAME}}(
  req: Request<{{ENDPOINT_NAME}}Params, any, {{ENDPOINT_NAME}}Request>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate request
    const params = {{ENDPOINT_NAME}}ParamsSchema.parse(req.params);
    const body = {{ENDPOINT_NAME}}RequestSchema.parse(req.body);

    // Call service
    const result = await {{SERVICE_NAME}}.{{serviceMethod}}(params, body);

    // Send response
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

