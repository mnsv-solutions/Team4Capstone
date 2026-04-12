import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';

import { ApplicationStatusService } from './application-status.service.js';
import { ApplicationStatusDto } from './dto/application-status.dto.js';

/**
 * The Application Status Controller.
 *
 * This controller handles requests related to the application status.
 */
@Controller('application-status')
export class ApplicationStatusController {
  /**
   * The constructor of the Application Status Controller.
   *
   * @param service - The Application Status Service.
   */
  constructor(private readonly service: ApplicationStatusService) {}

  /**
   * Retrieves the application status for the given application number and date of birth.
   *
   * @param dto - The request body containing the application number and date of birth.
   * @param req - The HTTP request object, used to extract IP and User-Agent for audit logging.
   *
   * @returns A promise resolving to the application status of the given application number and date of birth.
   */
  @Post()
  async getStatus(@Body() dto: ApplicationStatusDto, @Req() req: Request) {
    // Note: x-forwarded-for is used for audit logging only, not for security decisions.
    // Trust level depends on the deployment proxy configuration.
    const ipAddress =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
      req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.service.getApplicationStatus(dto, { ipAddress, userAgent });
  }
}
