import { Body, Controller, Post } from '@nestjs/common';

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
   *
   * @returns A promise resolving to the application status of the given application number and date of birth.
   */
  @Post()
  async getStatus(@Body() dto: ApplicationStatusDto) {
    return this.service.getApplicationStatus(dto);
  }
}
