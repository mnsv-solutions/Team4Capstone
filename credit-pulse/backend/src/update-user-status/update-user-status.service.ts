import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateUserStatusRequestDto } from './dto/update-user-status-request.dto.js';
import { UpdateUserStatusResponseDto } from './dto/update-user-status-response.dto.js';

// Service for updating user activity status in the database
@Injectable()
export class UpdateUserStatusService {
  private readonly logger = new Logger(UpdateUserStatusService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Updates a user's status (active, inactive, blocked, unblocked)
   * in the database.
   *
   * @param dto - UpdateUserStatusRequestDto containing the user ID and new status.
   * @returns A promise that resolves to an UpdateUserStatusResponseDto containing a success message and the updated user record.
   */
  async updateUserActivity(dto: UpdateUserStatusRequestDto): Promise<UpdateUserStatusResponseDto> {
    this.logger.log('The user status update process has started.');

    // Find the user in the database
    const existingUser = await this.prisma.users.findUnique({
      where: { user_id: dto.userId },
      select: {
        user_id: true,
        is_active: true,
        is_blocked: true,
      },
    });

    // If the user is not found, throw a NotFoundException
    if (!existingUser) {
      this.logger.warn(
        `The user status update could not continue because user ID ${dto.userId} was not found.`,
      );
      throw new NotFoundException('User not found.');
    }

    this.logger.log(`The user was found successfully for user ID: ${dto.userId}`);

    // Initialize variables to store the update data and success message
    let data: { is_active?: boolean; is_blocked?: boolean } = {};
    let message = '';

    // Switch on the new status to determine what to update
    switch (dto.status) {
      case 'active':
        this.logger.log('The user is being marked as active.');
        // If the new status is "active", set is_active to true
        data = { is_active: true };
        // Set the success message
        message = 'User marked as active successfully.';
        break;
      case 'inactive':
        this.logger.log('The user is being marked as inactive.');
        // If the new status is "inactive", set is_active to false
        data = { is_active: false };
        // Set the success message
        message = 'User marked as inactive successfully.';
        break;
      case 'block':
        this.logger.log('The user is being blocked.');
        // If the new status is "block", set is_blocked to true
        data = { is_blocked: true };
        // Set the success message
        message = 'User blocked successfully.';
        break;
      case 'unblock':
        this.logger.log('The user is being unblocked.');
        // If the new status is "unblock", set is_blocked to false
        data = { is_blocked: false };
        // Set the success message
        message = 'User unblocked successfully.';
        break;
    }

    // Update the user in the database
    const updatedUser = await this.prisma.users.update({
      where: { user_id: dto.userId },
      data,
      select: {
        user_id: true,
        is_active: true,
        is_blocked: true,
      },
    });

    this.logger.log(`The user status was updated successfully for user ID: ${dto.userId}`);

    // Return the success message and updated user record
    return {
      message,
      userId: updatedUser.user_id,
      status: dto.status,
      isActive: updatedUser.is_active,
      isBlocked: updatedUser.is_blocked,
    };
  }
}
