import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';

import type { Request } from 'express';

import { AuthGuard } from '../auth/auth.guard.js';
import { JwtPayload } from '../types/jwtpayload.js';
import { ApplicationService } from './application.service.js';
import { CreateApplicationDto } from './dto/createApplication.dto.js';

@Controller('application')
@UseGuards(AuthGuard)
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createApplication(@Body() createApplicationDto: CreateApplicationDto, @Req() req: Request) {
    return await this.applicationService.createApplication(
      createApplicationDto,
      req.user as JwtPayload,
    );
  }
}
