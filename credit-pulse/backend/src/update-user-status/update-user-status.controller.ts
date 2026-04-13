import { Body, Controller, Logger, Patch, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard.js';
import { CheckIsAdmin } from '../auth/check-is-admin.js';
import { UpdateUserStatusRequestDto } from './dto/update-user-status-request.dto.js';
import { UpdateUserStatusResponseDto } from './dto/update-user-status-response.dto.js';
import { UpdateUserStatusService } from './update-user-status.service.js';

// Controller for updating user activity status in the database.
@Controller('user')
export class UpdateUserStatusController {
  private readonly logger = new Logger(UpdateUserStatusController.name);

  constructor(private readonly usersService: UpdateUserStatusService) {}

  /**
   * Updates the activity status of a user in the database.
   *
   * @param dto - The request body containing the user ID and activity status.
   * @returns A promise resolving to an API-friendly response containing the updated user.
   *
   * This function takes in a request body containing the user ID and activity status.
   * It then calls the updateUserActivity function of the UpdateUserStatusService with the request body,
   * and returns the result of the function call.
   */
  @UseGuards(AuthGuard, CheckIsAdmin)
  @Patch('update-status')
  async updateUserActivity(
    // The request body containing the user ID and activity status.
    @Body() dto: UpdateUserStatusRequestDto,
  ): Promise<UpdateUserStatusResponseDto> {
    this.logger.log('A request was received to update the user status.');
    return this.usersService.updateUserActivity(dto);
  }
}
