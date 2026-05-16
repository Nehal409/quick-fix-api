import * as boom from '@hapi/boom';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
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
            this.handleHttpException(exception, response);
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
        const exceptionResponse = exception.getResponse();
        const error =
            typeof exceptionResponse === 'object' && exceptionResponse !== null
                ? (exceptionResponse as { error?: string }).error
                : undefined;
        const validationMessage =
            typeof exceptionResponse === 'object' && exceptionResponse !== null
                ? (exceptionResponse as { message?: string | string[] }).message
                : undefined;
        const message = Array.isArray(validationMessage)
            ? validationMessage[0]
            : validationMessage || exception.message;
        const responseBody = this.createErrorResponse(message, error);
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
