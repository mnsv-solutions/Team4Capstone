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

import { AuthGuard } from '../auth/auth.guard.js';
import { JwtPayload } from '../common/types/jwtpayload.js';
import { CalculateEligibilityService } from './calculate-eligibility.service.js';
import { CalculateEligibilityRequestDto } from './dto/calculate-eligibility-request.dto.js';
import { CalculateEligibilityResponseDto } from './dto/calculate-eligibility-response.dto.js';

// Type representing a request with an optional user property that is used to type-check requests that have been authenticated
type AuthenticatedRequest = Request & {
  user?: JwtPayload;
};

// Controller for the calculate-eligibility endpoint
@Controller('calculate-eligibility')
@UseGuards(AuthGuard)
export class CalculateEligibilityController {
  private readonly logger = new Logger(CalculateEligibilityController.name);

  constructor(private readonly calculateEligibilityService: CalculateEligibilityService) {}

  @Post()
  /**
   * Calculates eligibility for a given loan application.
   * The function takes in the request body, which should contain the necessary information
   * for calculating the eligibility. It then takes in the request object, which should contain the
   * authenticated user.
   * The function first extracts the user ID from the request object. If the user ID is not present,
   * it throws an UnauthorizedException, as the user is not authenticated.
   * If the user ID is present, the function then calls the calculateEligibility function of the
   * CalculateEligibilityService, passing in the request body and user ID. The result of this function call
   * is then returned as a promise.
   * @param dto - The request body containing the calculate eligibility request.
   * @param req - The request object containing the authenticated user.
   * @returns A promise that resolves to the calculate eligibility response.
   */
  async calculateEligibility(
    @Body() dto: CalculateEligibilityRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<CalculateEligibilityResponseDto> {
    this.logger.log('A request was received to calculate eligibility.');

    const userId = req.user?.sub;

    // If the user ID is not present, throw an UnauthorizedException
    if (!userId) {
      this.logger.warn(
        'The eligibility request could not continue because the user was not authenticated.',
      );
      throw new UnauthorizedException('User not authenticated');
    }

    this.logger.log(`The eligibility request is being processed for user ID: ${userId}.`);

    // Call the calculateEligibility function of the CalculateEligibilityService with the request body and user ID
    return this.calculateEligibilityService.calculateEligibility(dto, userId);
  }
}
