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
import { CalculateRatiosService } from './calculate-ratios.service.js';
import { CalculateRatiosRequestDto } from './dto/calculate-ratios-request.dto.js';
import { CalculateRatiosResponseDto } from './dto/calculate-ratios-response.dto.js';

/**
 * Type representing an Express Request object with an optional user property.
 * This is used to type-check requests that have been authenticated.
 * The 'user' property contains the user ID, which is used to identify the communications created by the user.
 */
type AuthenticatedRequest = Request & {
  user?: JwtPayload;
};

@Controller('calculate-ratios')
@UseGuards(AuthGuard)
export class CalculateRatiosController {
  private readonly logger = new Logger(CalculateRatiosController.name);

  constructor(private readonly calculateRatiosService: CalculateRatiosService) {}

  @Post('/')
  /**
   * This function is responsible for calculating various ratios for a given loan application.
   *
   * The function first takes in the request body, which should contain the necessary information
   * for calculating the ratios. It then takes in the request object, which should contain the
   * authenticated user.
   *
   * The function first extracts the user ID from the request object. If the user ID is not present,
   * it throws an UnauthorizedException, as the user is not authenticated.
   *
   * If the user ID is present, the function then calls the calculateRatios function of the
   * CalculateRatiosService, passing in the request body and user ID. The result of this function call
   * is then returned as a promise.
   *
   * @param dto - The request body containing the calculate ratios request.
   * @param req - The request object containing the authenticated user.
   *
   * @returns A promise that resolves to the calculate ratios response.
   */
  async calculateRatios(
    @Body() dto: CalculateRatiosRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<CalculateRatiosResponseDto> {
    this.logger.log('A request was received to calculate financial ratios.');

    // Get the user ID from the request object
    const userId = req.user?.sub;

    // If the user ID is not present, throw an UnauthorizedException
    if (!userId) {
      this.logger.warn(
        'The ratio calculation request could not continue because the user was not authenticated.',
      );
      throw new UnauthorizedException('User not authenticated');
    }

    this.logger.log(`The ratio calculation request is being processed for user ID: ${userId}.`);

    // Call the calculateRatios function of the CalculateRatiosService with the request body and user ID
    return this.calculateRatiosService.calculateRatios(dto, userId);
  }
}
