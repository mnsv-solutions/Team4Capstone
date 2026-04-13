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
import { FetchLoanParametersRequestDto } from './dto/fetch-loan-parameters-request.dto.js';
import { FetchLoanParametersResponseDto } from './dto/fetch-loan-parameters-response.dto.js';
import { FetchLoanParametersService } from './fetch-loan-parameters.service.js';

// This type stores the logged-in user ID coming from the JWT token.
type JwtPayload = {
  sub?: string;
};

// This request type is used when authenticated user details are attached to the request.
type AuthenticatedRequest = Request & {
  user?: JwtPayload;
};

// This controller handles the API for fetching complete loan parameter details.
@Controller('application')
@UseGuards(AuthGuard)
export class FetchLoanParametersController {
  private readonly logger = new Logger(FetchLoanParametersController.name);

  constructor(private readonly fetchLoanParametersService: FetchLoanParametersService) {}

  // This API gets repayment schedule, ratios, and eligibility details together.
  @Post('fetch-loan-parameters')
  @HttpCode(HttpStatus.OK)
  async fetchLoanParameters(
    @Body() dto: FetchLoanParametersRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<FetchLoanParametersResponseDto> {
    this.logger.log('A request was received to fetch loan parameter details.');

    // This gets the logged-in user ID from the token.
    const userId = req.user?.sub;

    // This checks whether the user ID is available in the token.
    if (!userId) {
      this.logger.warn(
        'The loan parameter request could not continue because the authenticated user was not found in the token.',
      );
      throw new UnauthorizedException('Authenticated user not found in token.');
    }

    this.logger.log(`The loan parameter request is being processed for user ID: ${userId}.`);

    // This sends the request to the service layer to fetch all loan parameter details.
    return this.fetchLoanParametersService.fetchLoanParameters(dto, userId);
  }
}
