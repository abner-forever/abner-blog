import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { Response as ApiResponse } from '../interfaces/response.interface';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as Record<
      string,
      unknown
    >;

    const errorResponse: ApiResponse<null> = {
      success: false,
      code: status,
      message:
        (exceptionResponse.message as string) ||
        exception.message ||
        '服务器错误',
      data: null,
      timestamp: new Date().toLocaleString(),
    };

    response.status(status).json(errorResponse);
  }
}
