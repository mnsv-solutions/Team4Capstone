import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { AuthGuard } from '../../auth/auth.guard.js';
import { AssignApplicationService } from './application-assignment.service.js';
import { AssignApplicationRequestDto } from './dto/assign-application-request.dto.js';
import { AssignApplicationResponseDto } from './dto/assign-application-response.dto.js';

// This type stores the basic user information coming from the JWT token.
type JwtPayload = {
  sub?: string;
};

// This type is used for requests that include authenticated user details.
type AuthenticatedRequest = Request & {
  user?: JwtPayload;
};

// This controller handles application assignment related APIs.
@Controller('application')
@UseGuards(AuthGuard)
export class AssignApplicationController {
  constructor(private readonly applicationAssignmentService: AssignApplicationService) {}

  // This API assigns an application to a team or user.
  @Post('assign')
  @HttpCode(HttpStatus.OK)
  async assignApplication(
    @Body() dto: AssignApplicationRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<AssignApplicationResponseDto> {
    // This gets the logged-in user ID from the token.
    const userId = req.user?.sub;

    // This checks whether the user ID is available in the token.
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found in token.');
    }

    // This sends the request to the service layer to complete the assignment.
    return this.applicationAssignmentService.assign(dto, userId);
  }
}
