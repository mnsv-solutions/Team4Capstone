import {
  BadRequestException,
  Controller,
  Logger,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import type { Express } from 'express';
import 'multer';

import { AuthGuard } from '../auth/auth.guard.js';
import { CheckIsAdmin } from '../auth/check-is-admin.js';
import { UploadUsersService } from './upload-users.service.js';

// Controller for handling Excel file uploads
/**
 * Controller for handling Excel file uploads
 * This controller is protected by the AuthGuard and the CheckIsAdmin guard.
 * Only authenticated and admin users can access this controller.
 */
@Controller('users')
@UseGuards(AuthGuard, CheckIsAdmin)
export class UploadUsersController {
  private readonly logger = new Logger(UploadUsersController.name);

  // Connects the controller with the service that handles Excel upload logic
  constructor(private readonly uploadUsersService: UploadUsersService) {}

  /**
   * Accepts the uploaded Excel file from the request
   * @param file - The uploaded Excel file
   * @returns A promise that resolves with the result of the Excel upload
   * @throws BadRequestException - If no file was uploaded
   */
  @Post('upload-excel')
  @UseInterceptors(FileInterceptor('file'))
  async uploadExcel(@UploadedFile() file: Express.Multer.File) {
    this.logger.log('A request was received to upload the users Excel file.');

    // Stops the request if no file was uploaded
    if (!file) {
      this.logger.warn('The Excel upload request could not continue because no file was provided.');
      throw new BadRequestException('Excel file is required.');
    }

    this.logger.log('The uploaded Excel file is being sent for processing.');

    // Sends the uploaded file to the service for processing
    return this.uploadUsersService.uploadUsersFromExcel(file);
  }
}
