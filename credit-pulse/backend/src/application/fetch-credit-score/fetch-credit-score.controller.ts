import { Body, Controller, HttpCode, HttpStatus, Logger, Post, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../../auth/auth.guard.js';
import { FetchCreditScoreRequestDto } from './dto/fetch-credit-score-request.dto.js';
import { FetchCreditScoreResponseDto } from './dto/fetch-credit-score-response.dto.js';
import { FetchCreditScoreService } from './fetch-credit-score.service.js';

// This controller handles the API used to fetch credit score details for an application.
@Controller('application')
@UseGuards(AuthGuard)
export class FetchCreditScoreController {
  private readonly logger = new Logger(FetchCreditScoreController.name);

  constructor(private readonly fetchCreditScoreService: FetchCreditScoreService) {}

  // This method gets the latest credit score details and sends them back to the frontend.
  @Post('fetch-credit-details')
  @HttpCode(HttpStatus.OK)
  async fetchCreditScore(
    @Body() dto: FetchCreditScoreRequestDto,
  ): Promise<FetchCreditScoreResponseDto> {
    this.logger.log('A request was received to fetch credit score details.');
    return this.fetchCreditScoreService.fetchCreditScore(dto);
  }
}
