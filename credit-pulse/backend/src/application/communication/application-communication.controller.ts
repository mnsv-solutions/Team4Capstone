import {
  Body,
  Controller,
  Logger,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { Request } from 'express';

import { AuthGuard } from '../../auth/auth.guard.js';
import { JwtPayload } from '../../common/types/jwtpayload.js';
import { ApplicationCommunicationService } from './application-communication.service.js';
import { GetApplicationCommunicationHistoryDto } from './dto/get-application-communication-history.dto.js';
import { SendApplicationCommunicationDto } from './dto/send-application-communication.dto.js';

// Extends the normal request so the logged-in user can be accessed safely
/**
 * Extends the normal request so the logged-in user can be accessed safely.
 * This type is used by the AuthGuard to add a 'user' property to the request object if the user is successfully authenticated.
 * The 'user' property contains the user ID, which is used to identify the communications created by the user.
 */
type AuthenticatedRequest = Request & {
  user?: JwtPayload;
};

@Controller()
@UseGuards(AuthGuard)
export class ApplicationCommunicationController {
  private readonly logger = new Logger(ApplicationCommunicationController.name);

  /**
   * Handles the communication logic for an application.
   * This controller is protected by the AuthGuard, so only authenticated users can access it.
   */
  constructor(private readonly applicationCommunicationService: ApplicationCommunicationService) {}

  /**
   * Creates a new communication entry for an application.
   *
   * This endpoint is protected by the AuthGuard, so only authenticated users can access it.
   * The request object contains a 'user' property, which is populated by the AuthGuard if the user is successfully authenticated.
   * The 'user' property contains the user ID, which is used to identify the communications created by the user.
   * @param dto - The request data for creating a communication entry.
   * @param req - The authenticated request.
   * @returns The created communication entry.
   */
  @Post('push-communication')
  async createCommunication(
    @Body() dto: SendApplicationCommunicationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    this.logger.log('A request was received to create application communication.');

    // Reads the logged-in user id from the JWT payload
    const userId = req.user?.sub;

    // Stops the request if the user is not properly authenticated
    if (!userId) {
      this.logger.warn(
        'The communication request could not continue because the user was not authenticated.',
      );
      throw new UnauthorizedException('User not authenticated');
    }

    this.logger.log(`The communication request is being processed for user ID: ${userId}.`);

    // Passes the request data and user id to the service layer
    return this.applicationCommunicationService.createCommunication(dto, userId);
  }

  /**
   * Retrieves the communication history for a given application.
   * This endpoint is protected by the AuthGuard, so only authenticated users can access it.
   * @param dto - The request data for fetching communication history.
   * @param req - The authenticated request.
   * The request object contains a 'user' property, which is populated by the AuthGuard if the user is successfully authenticated.
   * The 'user' property contains the user ID, which is used to identify the communications created by the user.
   * @returns An array of Dashboard Dto objects, representing the communications
   * created by the user.
   */
  @Post('fetch-communication-history')
  async getCommunicationHistory(
    @Body() dto: GetApplicationCommunicationHistoryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    this.logger.log('A request was received to fetch application communication history.');

    // Reads the logged-in user id from the JWT payload
    const userId = req.user?.sub;

    // Stops the request if the user is not properly authenticated
    if (!userId) {
      this.logger.warn(
        'The communication history request could not continue because the user was not authenticated.',
      );
      throw new UnauthorizedException('User not authenticated');
    }

    this.logger.log(`The communication history request is being processed for user ID: ${userId}.`);

    // Returns the communication history from the service
    return this.applicationCommunicationService.getCommunicationHistory(dto, userId);
  }
}
