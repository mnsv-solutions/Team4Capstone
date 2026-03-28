import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';

import type { Request } from 'express';

import { AuthGuard } from '../auth/auth.guard.js';
import { JwtPayload } from '../common/types/jwtpayload.js';
import { ApplicationService } from './application.service.js';
import { CreateApplicationRequestDto } from './dto/createApplicationRequest.dto.js';

@Controller('application')
@UseGuards(AuthGuard)
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createApplication(
    @Body() createApplicationDto: CreateApplicationRequestDto,
    @Req() req: Request,
  ) {
    return await this.applicationService.createApplication(
      createApplicationDto,
      req.user as JwtPayload,
    );
  }
}
