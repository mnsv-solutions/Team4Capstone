import { Body, Controller, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';

import { Request } from 'express';

import { AuthGuard } from '../auth/auth.guard.js';
import { JwtPayload } from '../common/types/jwtpayload.js';
import { GenerateRepaymentScheduleRequestDto } from './dto/generate-repayment-schedule-request.dto.js';
import { GenerateRepaymentScheduleResponseDto } from './dto/generate-repayment-schedule-response.dto.js';
import { GenerateRepaymentScheduleService } from './generate-repayment-schedule.service.js';

/**
 * Type representing an Express Request object with an optional user property.
 * This is used to type-check requests that have been authenticated.
 * The 'user' property contains the user ID, which is used to identify the communications created by the user.
 */
type AuthenticatedRequest = Request & {
  user?: JwtPayload;
};

/**
 * Controller for generating a payment schedule for a given loan application.
 *
 * This controller is responsible for handling POST requests to /repayment-schedule/generate.
 * It will validate the request body and user authentication before delegating to the service.
 * It will throw an UnauthorizedException if the user is not authenticated.
 *
 * @remarks
 * The controller will first extract the user ID from the request object. If the user ID is not present,
 * it will throw an UnauthorizedException. Otherwise, it will call the generateSchedule function of the
 * GenerateRepaymentScheduleService with the request body and user ID, and return the result of the function call.
 */
@Controller('repayment-schedule')
@UseGuards(AuthGuard)
export class GenerateRepaymentScheduleController {
  constructor(private readonly repaymentScheduleService: GenerateRepaymentScheduleService) {}

  @Post('generate')
  /**
   * Generates a payment schedule for a given loan application.
   *
   * This function is responsible for validating the request body and user authentication
   * before delegating to the service. It will throw an UnauthorizedException if the user
   * is not authenticated.
   *
   * @param dto - The request body containing the generate payment schedule request.
   * @param req - The request object containing the authenticated user.
   *
   * @returns A promise that resolves to the generate payment schedule response.
   *
   * The function first extracts the user ID from the request object. If the user ID is
   * not present, it throws an UnauthorizedException. Otherwise, it calls the
   * generateSchedule function of the GenerateRepaymentScheduleService with the request body
   * and user ID, and returns the result of the function call.
   */
  async generate(
    @Body() dto: GenerateRepaymentScheduleRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<GenerateRepaymentScheduleResponseDto> {
    const userId = req.user?.sub;

    // Check if the user is authenticated
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Delegate to the service with the validated request body and user ID
    return this.repaymentScheduleService.generateSchedule(dto, userId);
  }
}
