import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import type { Express } from 'express';

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
    // Stops the request if no file was uploaded
    if (!file) {
      throw new BadRequestException('Excel file is required.');
    }

    // Sends the uploaded file to the service for processing
    return this.uploadUsersService.uploadUsersFromExcel(file);
  }
}
