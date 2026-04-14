import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { AuthGuard } from '../../auth/auth.guard.js';
import { JwtPayload } from '../../common/types/jwtpayload.js';
import { ApplicationStageService } from './application-stage.service.js';
import { FetchStageHistoryRequestDto } from './dto/fetch-stage-history-request.dto.js';
import { FetchStageHistoryResponseDto } from './dto/fetch-stage-history-response.dto.js';
import { PushStageRequestDto } from './dto/push-stage-request.dto.js';
import { PushStageResponseDto } from './dto/push-stage-response.dto.js';

/**
 * Type representing an Express Request object with an optional user property.
 * This is used to type-check requests that have been authenticated.
 * The 'user' property contains the user ID, which is used to identify the communications created by the user.
 */
type AuthenticatedRequest = Request & {
  user?: JwtPayload;
};

// Controller for handling application stages
@Controller('application')
export class ApplicationStageController {
  private readonly logger = new Logger(ApplicationStageController.name);

  constructor(private readonly applicationStageService: ApplicationStageService) {}

  @UseGuards(AuthGuard)
  @Post('push-stage')
  @HttpCode(HttpStatus.OK)
  /**
   * Pushes a stage to the application history.
   * @param request The express request object
   * @param pushStageRequestDto The request data transfer object
   * @returns A promise that resolves to the response data transfer object
   */
  async pushStage(
    @Req() request: AuthenticatedRequest,
    @Body() pushStageRequestDto: PushStageRequestDto,
  ): Promise<PushStageResponseDto> {
    this.logger.log('A request was received to push a new application stage.');

    // Get the actor user ID from the request
    const actorUserId = request.user?.sub;

    // Check if the actor user ID is present
    if (!actorUserId) {
      this.logger.warn(
        'The stage push request could not continue because the authenticated user was not found in the token.',
      );
      throw new UnauthorizedException('Authenticated user not found in token.');
    }

    this.logger.log(`The stage push request is being processed for user ID: ${actorUserId}.`);

    // Call the push stage service
    return this.applicationStageService.pushStage(actorUserId, pushStageRequestDto);
  }

  @UseGuards(AuthGuard)
  @Post('fetch-stage-history')
  @HttpCode(HttpStatus.OK)
  /**
   * Fetches the stage history for a given application.
   * @param fetchStageHistoryRequestDto The request data transfer object
   * @returns A promise that resolves to the response data transfer object
   */
  async fetchStageHistory(
    @Body() fetchStageHistoryRequestDto: FetchStageHistoryRequestDto,
  ): Promise<FetchStageHistoryResponseDto> {
    this.logger.log('A request was received to fetch application stage history.');

    // Calls the service function to fetch the stage history
    return this.applicationStageService.fetchStageHistory(fetchStageHistoryRequestDto);
  }
}
