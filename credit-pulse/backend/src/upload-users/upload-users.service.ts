import { BadRequestException, Injectable } from '@nestjs/common';

import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { Express } from 'express';
import * as XLSX from 'xlsx';

import { PrismaService } from '../prisma/prisma.service.js';
import { UploadUserExcelRowRequestDto } from './dto/upload-users-request.dto.js';
import { UploadUsersResponseDto } from './dto/upload-users-response.dto.js';

@Injectable()
export class UploadUsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Uploads users from Excel file
   * This function is responsible for uploading users from an Excel file
   * The function first validates the uploaded file, then reads the Excel file
   * and validates each row of the file. If the row is valid, it creates a new user
   * in the database. If the row is invalid, it adds the error to the failures array.
   * The function returns an UploadUsersResponseDto object containing the total number of rows,
   * the number of successful uploads, the number of failed uploads, and arrays of successes and failures.
   * @param file The uploaded Excel file
   * @returns An UploadUsersResponseDto object containing the result of the upload
   */
  async uploadUsersFromExcel(file: Express.Multer.File): Promise<UploadUsersResponseDto> {
    // Validate the uploaded file
    this.validateUploadedFile(file);

    // Read the Excel file
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new BadRequestException('Excel file does not contain any sheet.');
    }

    const worksheet = workbook.Sheets[firstSheetName];
    // Validate the headers of the Excel file
    this.validateHeaders(worksheet);

    // Read the rows of the Excel file
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: '',
      raw: false,
    });

    if (!rows.length) {
      throw new BadRequestException('Excel file does not contain any data rows.');
    }

    const successes: UploadUsersResponseDto['successes'] = [];
    const failures: UploadUsersResponseDto['failures'] = [];

    // Keep track of the emails, phones, and SIN last 4 digits that have been seen
    const seenEmails = new Set<string>();
    const seenPhones = new Set<string>();
    const seenGovtIds = new Set<string>();

    // Get the roles from the database
    const roles = await this.prisma.roles.findMany({
      where: { is_active: true },
      select: { role_id: true, role_code: true },
    });

    // Create a map of role codes to role IDs
    const roleMap = new Map(roles.map((role) => [role.role_code.toUpperCase(), role.role_id]));

    // Iterate over the rows of the Excel file
    for (let index = 0; index < rows.length; index++) {
      const rowNumber = index + 2;
      const rawRow = rows[index];
      const dto = plainToInstance(UploadUserExcelRowRequestDto, rawRow);
      const validationResult = await validate(dto);
      const errors = this.extractValidationErrors(validationResult);

      // Get the role code, first name, last name, email, phone, date of birth, gender, marital status, nationality, and government ID type and number from the row
      const roleCode = dto.role_code;
      const firstName = dto.first_name;
      const lastName = dto.last_name;
      const email = dto.email;
      const phone = dto.phone;
      const dateOfBirthText = dto.date_of_birth;
      const gender = dto.gender;
      const maritalStatus = dto.marital_status;
      const nationality = dto.nationality;
      const governmentIdType = dto.government_id_type;
      const governmentIdNumber = dto.government_id_number;
      const isSystemUser = this.parseBoolean(dto.is_system_user);

      // Validate the role code
      const roleId = roleMap.get(roleCode);
      if (roleCode && !roleId) {
        errors.push('Role code does not exist in the system.');
      }

      // Validate the date of birth
      const dateOfBirth = this.parseDate(dateOfBirthText);
      if (!dateOfBirth) {
        errors.push('Date of birth is invalid.');
      } else {
        if (dateOfBirth > new Date()) {
          errors.push('Date of birth cannot be in the future.');
        }
        if (this.getAge(dateOfBirth) < 18) {
          errors.push('User must be at least 18 years old.');
        }
      }

      // Validate the email, phone, and SIN last 4 digits
      if (isSystemUser === null) {
        errors.push('Is system user must be true or false.');
      }
      if (email) {
        if (seenEmails.has(email)) {
          errors.push('Duplicate email found in Excel file.');
        } else {
          seenEmails.add(email);
        }
      }

      if (phone) {
        const normalizedPhone = this.normalizePhone(phone);
        if (seenPhones.has(normalizedPhone)) {
          errors.push('Duplicate phone found in Excel file.');
        } else {
          seenPhones.add(normalizedPhone);
        }
      }

      if (governmentIdNumber) {
        if (seenGovtIds.has(governmentIdNumber)) {
          errors.push('Duplicate SIN last 4 digits found in Excel file.');
        } else {
          seenGovtIds.add(governmentIdNumber);
        }
      }

      // Validate the email address
      if (email) {
        const existingUser = await this.prisma.users.findUnique({
          where: { email },
          select: { user_id: true },
        });

        if (existingUser) {
          errors.push('Email already exists in the system.');
        }
      }

      // Validate the SIN last 4 digits
      if (governmentIdType === 'SIN' && governmentIdNumber) {
        const existingProfile = await this.prisma.user_profile.findFirst({
          where: {
            government_id_type: 'SIN',
            government_id_number: governmentIdNumber,
            is_active: true,
          },
          select: { profile_id: true },
        });

        if (existingProfile) {
          errors.push('SIN last 4 digits already exists in the system.');
        }
      }

      // If there are any errors, add the row to the failures array
      if (errors.length) {
        failures.push({
          rowNumber,
          email: email || undefined,
          errors,
        });
        continue;
      }

      // Build a password for the user
      const generatedPassword = this.buildPassword(firstName, dateOfBirth!, governmentIdNumber);
      const passwordHash = await bcrypt.hash(generatedPassword, 10);

      // Create the user in the database
      try {
        const createdUser = await this.prisma.$transaction(async (tx) => {
          const user = await tx.users.create({
            data: {
              role_id: roleId!,
              first_name: firstName,
              last_name: lastName,
              email,
              password_hash: passwordHash,
              phone,
              is_email_verified: false,
              is_system_user: isSystemUser!,
              is_active: true,
            },
          });

          await tx.user_profile.create({
            data: {
              user_id: user.user_id,
              date_of_birth: dateOfBirth,
              gender,
              marital_status: maritalStatus,
              nationality,
              government_id_type: 'SIN',
              government_id_number: governmentIdNumber,
              created_by: user.user_id,
              updated_by: user.user_id,
              is_active: true,
            },
          });

          return user;
        });

        successes.push({
          rowNumber,
          email,
          userId: createdUser.user_id,
        });
      } catch {
        failures.push({
          rowNumber,
          email: email || undefined,
          errors: ['Database insert failed for this row.'],
        });
      }
    }

    return {
      message: 'Excel upload processed successfully.',
      totalRows: rows.length,
      successCount: successes.length,
      failureCount: failures.length,
      successes,
      failures,
    };
  }
  private validateUploadedFile(file: Express.Multer.File) {
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only .xlsx or .xls files are allowed.');
    }
  }

  private validateHeaders(worksheet: XLSX.WorkSheet) {
    const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
    const headers = (rows[0] || []).map((value) => String(value).trim());

    const expectedHeaders = [
      'role_code',
      'first_name',
      'last_name',
      'email',
      'phone',
      'date_of_birth',
      'gender',
      'marital_status',
      'nationality',
      'government_id_type',
      'government_id_number',
      'is_system_user',
    ];

    const missingHeaders = expectedHeaders.filter((header) => !headers.includes(header));

    if (missingHeaders.length) {
      throw new BadRequestException(
        `Excel headers are invalid. Missing: ${missingHeaders.join(', ')}`,
      );
    }
  }

  /**
   * This function takes a validation result (an array of objects with constraints)
   * and returns an array of all the validation errors (constraint values).
   * The function is used to extract the validation errors from the validation result
   * when validating a request body.
   *
   * @param validationResult - An array of objects with constraints, which is the result of the validation
   * @returns An array of all the validation errors (constraint values)
   */
  private extractValidationErrors(
    validationResult: Array<{ constraints?: Record<string, string> }>,
  ): string[] {
    // The function uses flatMap to flatten the array of constraints into a single array of errors
    // The constraints object is optional, so we use the nullish coalescing operator (??) to provide a default value of an empty object if it's null
    // Then we use Object.values to get an array of all the values in the constraints object (which are the validation errors)
    // Finally, we use flatMap to flatten the array of arrays of errors into a single array of errors
    return validationResult.flatMap((item) => Object.values(item.constraints ?? {}));
  }
  /**
   * This function takes an unknown value and attempts to parse it into a boolean.
   * The function will return true if the value is a boolean true, the string 'true', the number 1, or the strings 'yes' or 'y' (case-insensitive).
   * The function will return false if the value is a boolean false, the string 'false', the number 0, or the strings 'no' or 'n' (case-insensitive).
   * If the value can't be parsed into a boolean (for example, if it's a string that doesn't match any of the above), the function will return null.
   * @param value - The value to parse
   * @returns A boolean if the value can be parsed, or null if it can't
   */
  private parseBoolean(value: unknown): boolean | null {
    // If the value is a boolean, just return it
    if (typeof value === 'boolean') {
      return value;
    }

    // If the value is a string, normalize it (trim and lowercase)
    // and check if it matches any of the string values that should be parsed to true or false
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();

      if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
      if (['false', '0', 'no', 'n'].includes(normalized)) return false;
    }

    // If the value is a number, check if it's 1 or 0 and return true or false accordingly
    if (typeof value === 'number') {
      if (value === 1) return true;
      if (value === 0) return false;
    }

    // If none of the above conditions are met, return null
    return null;
  }

  /**
   * This function takes a string as an argument and attempts to parse it into a Date object.
   * It first creates a new Date object with the provided string.
   * Then it checks if the resulting Date object is valid by calling the getTime() method on it.
   * If the getTime() method returns NaN (Not a Number), it means that the provided string couldn't be parsed into a Date object,
   * and the function returns null. This is because the getTime() method will return NaN if the Date object is invalid.
   * If the getTime() method returns a valid number, the function returns the parsed Date object.
   * This is because the getTime() method will return the number of milliseconds since January 1, 1970, 00:00:00 UTC
   * if the Date object is valid.
   *
   * @param value - The string to parse into a Date object
   * @returns The parsed Date object or null if the parsing fails
   */
  private parseDate(value: string): Date | null {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      // If the getTime() method returns NaN, it means that the provided string couldn't be parsed into a Date object,
      // so we return null.
      return null;
    }
    // If the getTime() method returns a valid number, we return the parsed Date object.
    return parsed;
  }
  /**
   * Calculates the age of the user based on the provided date of birth.
   * The age calculation takes into account the year difference and the month difference.
   * The logic is as follows:
   * 1. Calculate the year difference between today and the date of birth.
   * 2. Calculate the month difference between today and the date of birth.
   * 3. If the month difference is negative or zero, and the day difference is negative,
   *    the age is decremented by 1.
   * @param dateOfBirth - The date of birth of the user
   * @returns The calculated age of the user
   */
  private getAge(dateOfBirth: Date): number {
    // Get the current date
    const today = new Date();

    // Calculate the year difference between today and the date of birth
    let age = today.getFullYear() - dateOfBirth.getFullYear();

    // Calculate the month difference between today and the date of birth
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();

    // If the month difference is negative or zero, and the day difference is negative,
    // decrement the age by 1
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }

    // Return the calculated age
    return age;
  }

  /**
   * Returns a normalized phone number by removing all non-digit and non-plus characters.
   * @param phone - The phone number to normalize
   * @returns A normalized phone number
   */
  private normalizePhone(phone: string): string {
    return phone.replace(/[^\d+]/g, '');
  }

  /**
   * Builds a password string based on the provided first name, date of birth, and
   * the last 4 digits of the SIN.
   *
   * The password string is formatted as follows:
   * <firstName>@<yyyy><mm><dd>.<sinLast4>
   *
   * Where:
   *   <firstName> is the first name of the user
   *   <yyyy> is the year of birth of the user
   *   <mm> is the month of birth of the user, padded with a leading zero if necessary
   *   <dd> is the day of birth of the user, padded with a leading zero if necessary
   *   <sinLast4> is the last 4 digits of the user's SIN
   *
   * @param {string} firstName - The first name to include in the password
   * @param {Date} dateOfBirth - The date of birth to include in the password
   * @param {string} sinLast4 - The last 4 digits of the SIN to include in the password
   * @returns {string} The built password string
   */
  private buildPassword(firstName: string, dateOfBirth: Date, sinLast4: string): string {
    const yyyy = dateOfBirth.getFullYear();
    const mm = String(dateOfBirth.getMonth() + 1).padStart(2, '0');
    const dd = String(dateOfBirth.getDate()).padStart(2, '0');

    // Construct the password string
    // First name, then year of birth, then month of birth, then day of birth, then SIN last 4 digits
    return `${firstName}@${yyyy}${mm}${dd}.${sinLast4}`;
  }
}
