import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import type { ZodSchema } from 'zod';
import { errorResponse } from '../utils/response.js';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Middleware factory to validate request data against a Zod schema
 * @param schema - Zod schema to validate against
 * @param target - Which part of the request to validate (body, query, or params)
 */
export const validate = (schema: ZodSchema, target: ValidationTarget = 'body') => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            // Get the data to validate based on target
            const dataToValidate = req[target];

            // Validate and parse the data
            const validatedData = schema.parse(dataToValidate);

            // Replace the original data with validated/transformed data
            req[target] = validatedData;

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                // Format Zod errors into a readable structure
                const formattedErrors = error.issues.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));

                return errorResponse(
                    res,
                    'Validation failed',
                    {
                        errors: formattedErrors,
                        details: error.issues,
                    },
                    400
                );
            }

            // Handle unexpected errors
            return errorResponse(res, 'Validation error', error, 500);
        }
    };
};
