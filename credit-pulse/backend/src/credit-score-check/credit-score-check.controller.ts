import { Body, Controller, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';

import { Request } from 'express';

import { AuthGuard } from '../auth/auth.guard.js';
import { JwtPayload } from '../common/types/jwtpayload.js';
import { CreditScoreCheckService } from './credit-score-check.service.js';
import { CreditScoreCheckRequestDto } from './dto/credit-score-check-request.dto.js';
import { CreditScoreCheckResponseDto } from './dto/credit-score-check-response.dto.js';

/**
 * Type representing an Express Request object with an optional user property.
 * This is used to type-check requests that have been authenticated.
 */
type AuthenticatedRequest = Request & {
  /**
   * The user property is only present if the request has been authenticated.
   * It contains the user's ID and email.
   */
  user?: JwtPayload;
};

/**
 * Controller for the credit score check feature.
 *
 * @remarks
 * This controller is responsible for handling POST requests to /credit-score/check.
 * It will validate the request body and user authentication before delegating to the service.
 */
@Controller('credit-score')
@UseGuards(AuthGuard)
export class CreditScoreCheckController {
  constructor(private readonly creditScoreCheckService: CreditScoreCheckService) {}

  /**
   * Handles POST requests to /credit-score/check.
   *
   * @remarks
   * Validates the request body and user authentication before delegating to the service.
   *
   * @param dto - The request body containing the credit score check request.
   * @param req - The request object containing the authenticated user.
   *
   * @returns A promise that resolves to the credit score check response.
   */
  @Post('check')
  /**
   * Handles POST requests to /credit-score/check.
   *
   * @remarks
   * This function is responsible for validating the request body and user authentication
   * before delegating to the service. It will throw an UnauthorizedException if the user
   * is not authenticated.
   *
   * @param dto - The request body containing the credit score check request.
   * @param req - The request object containing the authenticated user.
   *
   * @returns A promise that resolves to the credit score check response.
   */
  async checkCreditScore(
    @Body() dto: CreditScoreCheckRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<CreditScoreCheckResponseDto> {
    // Get the user ID from the request object
    const userId = req.user?.sub;

    // If the user ID is not present, throw an UnauthorizedException
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Delegate to the service with the validated request body and user ID
    return this.creditScoreCheckService.checkCreditScore(dto, userId);
  }
}
