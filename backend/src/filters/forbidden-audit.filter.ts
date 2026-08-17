import { ExceptionFilter, Catch, ArgumentsHost, ForbiddenException } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Catch(ForbiddenException)
export class ForbiddenAuditFilter implements ExceptionFilter {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  async catch(exception: ForbiddenException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const user = (request as any).user;
    
    // Log the forbidden access attempt if the user is authenticated
    if (user && user._id) {
      try {
        await this.auditLogsService.log(
          user._id.toString(),
          'SECURITY_DENIAL',
          user._id.toString(), // The target is technically the user themselves attempting an action
          'Security',
          '',
          '',
          undefined,
          'SECURITY',
          {
            path: request.url,
            method: request.method,
            reason: exception.message,
          },
          request.ip,
        );
      } catch (err) {
        console.error('Failed to log SECURITY_DENIAL:', err);
      }
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message || 'Forbidden resource',
    });
  }
}
