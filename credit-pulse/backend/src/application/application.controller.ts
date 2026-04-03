import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

import type { Request } from 'express';

import { AuthGuard } from '../auth/auth.guard.js';
import { JwtPayload } from '../common/types/jwtpayload.js';
import { ApplicationService } from './application.service.js';
import { CreateApplicationRequestDto } from './dto/createApplicationRequest.dto.js';
import { GetContactDetailsRequestDto } from './dto/getContactDetailsRequest.dto.js';
import { GetEducationDetailsRequestDto } from './dto/getEducationDetailsRequest.dto.js';
import { GetFinancialDetailsRequestDto } from './dto/getFinancialDetailsRequest.dto.js';
import { GetPersonalInformationRequestDto } from './dto/getPersonalInformationRequest.dto.js';
import { GetDocumentDetailsRequestDto } from './dto/getDocumentDetailsRequest.dto.js';

@Controller('application')
@UseGuards(AuthGuard)
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post('files')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'governmentIdProof', maxCount: 1 },
        { name: 'incomeProof', maxCount: 1 },
        { name: 'bankStatement', maxCount: 1 },
      ],
      { limits: { fileSize: 100 * 1024 * 1024 } },
    ),
  )
  async uploadFiles(
    @UploadedFiles()
    files: {
      governmentIdProof?: any[];
      incomeProof?: any[];
      bankStatement?: any[];
    },
    @Body('application_id') applicationId: string,
  ) {
    if (!applicationId) {
      throw new BadRequestException('Application ID is required.');
    }
    if (!files?.governmentIdProof || files.governmentIdProof.length === 0) {
      throw new BadRequestException('Government ID Proof file is required.');
    }
    if (!files?.incomeProof || files.incomeProof.length === 0) {
      throw new BadRequestException('Income Proof file is required.');
    }
    if (!files?.bankStatement || files.bankStatement.length === 0) {
      throw new BadRequestException('Bank Statement file is required.');
    }

    return this.applicationService.uploadFiles(applicationId, files);
  }

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

  @Get('personal-information')
  @HttpCode(HttpStatus.OK)
  async getPersonalInformation(@Query() dto: GetPersonalInformationRequestDto) {
    return await this.applicationService.getPersonalInformation(dto);
  }

  @Get('contact-details')
  @HttpCode(HttpStatus.OK)
  async getContactDetails(@Query() dto: GetContactDetailsRequestDto) {
    return await this.applicationService.getContactDetails(dto);
  }

  @Get('education-details')
  @HttpCode(HttpStatus.OK)
  async getEducationDetails(@Query() dto: GetEducationDetailsRequestDto) {
    return await this.applicationService.getEducationDetails(dto);
  }

  @Get('financial-details')
  @HttpCode(HttpStatus.OK)
  async getFinancialDetails(@Body() dto: GetFinancialDetailsRequestDto) {
    return await this.applicationService.getFinancialDetails(dto);
  }
}
