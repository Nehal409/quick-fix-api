import * as boom from '@hapi/boom';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ZodValidationException } from 'nestjs-zod';
import { QueryFailedError } from 'typeorm';
import { ErrorResponse } from './error-response.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        console.error('🚨 Error:', { path: request.url, exception });

        if (exception instanceof HttpException) {
            // Handle ZodValidationException separately from HttpException
            if (exception instanceof ZodValidationException) {
                this.handleZodError(exception, response);
            } else {
                this.handleHttpException(exception, response);
            }
        } else if (boom.isBoom(exception)) {
            this.handleBoomError(exception, response);
        } else if (exception instanceof QueryFailedError) {
            this.handleDatabaseError(exception, response);
        } else {
            this.handleDefaultError(exception, response);
        }
    }

    private handleHttpException(exception: HttpException, response: any): void {
        const status = exception.getStatus();
        const error = (exception.getResponse() as { errors?: string })?.errors;
        const responseBody = this.createErrorResponse(exception.message, error);
        response.status(status).json(responseBody);
    }

    private handleBoomError(exception: boom.Boom, response: any): void {
        const status = exception.output.statusCode;
        const responseBody = this.createErrorResponse(exception.message);
        response.status(status).json(responseBody);
    }

    private handleDatabaseError(exception: QueryFailedError, response: any): void {
        const status = HttpStatus.INTERNAL_SERVER_ERROR;
        const responseBody =
            process.env.NODE_ENV === 'development'
                ? this.createErrorResponse(exception.message)
                : this.createErrorResponse(exception.name);
        response.status(status).json(responseBody);
    }

    private handleZodError(exception: ZodValidationException, response: any): void {
        const status = HttpStatus.BAD_REQUEST;
        const zodErrors = exception?.getZodError()?.formErrors?.fieldErrors;

        if (Object.keys(zodErrors).length === 0) {
            return response.status(status).json(this.createErrorResponse('Invalid request data'));
        }

        const errors = Object.keys(zodErrors).map((field) => ({
            field,
            messages: zodErrors[field],
        }));

        const errorKey = errors[0]?.field || 'unknown_field';
        const firstErrorMessage = errors[0]?.messages?.[0];
        const errorMessage = firstErrorMessage
            ? firstErrorMessage.toLowerCase()
            : 'validation error';
        const message =
            process.env.NODE_ENV === 'development'
                ? `${errorKey}, ${errorMessage}`
                : `${errorMessage}`;

        response.status(status).json(this.createErrorResponse(message));
    }

    private handleDefaultError(exception: any, response: any): void {
        const status = HttpStatus.INTERNAL_SERVER_ERROR;
        const message = (exception as { message?: string })?.message || 'Internal server error';
        response.status(status).json(this.createErrorResponse(message));
    }

    private createErrorResponse(message: string, error?: string): ErrorResponse {
        return {
            data: [],
            message,
            success: false,
            error,
        };
    }
}
