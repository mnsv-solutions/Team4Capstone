import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

/**
 * Trim string input
 *
 * This function takes an object with a single property 'value' which is the input to be trimmed.
 * If the input value is a string, it trims the whitespace from the beginning and end of the string and returns the trimmed value.
 * If the input value is not a string, it returns the original value unchanged.
 */
const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/**
 * Converts a value to a boolean.
 *
 * This function takes an object with a single property 'value' which is the input to be converted.
 * If the input value is true or the string 'true', it returns true.
 * If the input value is false or the string 'false', it returns false.
 * If the input value is anything else, it returns the original value unchanged.
 *
 * This function is used to handle cases where a value may be a string that represents a boolean value,
 * or it may be a boolean itself.
 */
const toBoolean = ({ value }: { value: unknown }): boolean | unknown => {
  if (value === true || value === 'true') {
    return true;
  }

  if (value === false || value === 'false') {
    return false;
  }

  return value;
};

//Communication Attachment DTO
export class ApplicationCommunicationAttachmentDto {
  /**
   * Stored document name
   *
   * @memberof ApplicationCommunicationAttachmentDto
   * @property {string} documentName - Stored document name
   */
  @Transform(trimString)
  @IsString({ message: 'Document Name must be a string.' })
  @IsNotEmpty({ message: 'Document Name is required.' })
  @MaxLength(255, { message: 'Document Name must not exceed 255 characters.' })
  documentName: string;

  /**
   * Original uploaded file name
   *
   * @memberof ApplicationCommunicationAttachmentDto
   * @property {string} originalFileName - Original uploaded file name
   */
  @Transform(trimString)
  @IsString({ message: 'Original File Name must be a string.' })
  @IsNotEmpty({ message: 'Original File Name is required.' })
  @MaxLength(255, { message: 'Original File Name must not exceed 255 characters.' })
  originalFileName: string;

  /**
   * S3 key or document path
   *
   * @memberof ApplicationCommunicationAttachmentDto
   * @property {string} documentPath - S3 key or document path
   */
  @Transform(trimString)
  @IsString({ message: 'Document Path must be a string.' })
  @IsNotEmpty({ message: 'Document Path is required.' })
  @MaxLength(500, { message: 'Document Path must not exceed 500 characters.' })
  documentPath: string;

  /**
   * MIME type
   *
   * @memberof ApplicationCommunicationAttachmentDto
   * @property {string} mimeType - File MIME type
   */
  @IsOptional()
  @Transform(trimString)
  @IsString({ message: 'MIME Type must be a string.' })
  @IsNotEmpty({ message: 'MIME Type cannot be empty.' })
  @MaxLength(100, { message: 'MIME Type must not exceed 100 characters.' })
  @Matches(/^[a-z]+\/[a-z0-9.+-]+$/i, {
    message: 'MIME Type must be a valid MIME type.',
  })
  mimeType?: string;

  /**
   * File size in bytes
   *
   * @memberof ApplicationCommunicationAttachmentDto
   * @property {number} fileSizeBytes - File size in bytes
   */
  @IsOptional()
  @Min(1, { message: 'File Size Bytes must be greater than 0.' })
  @Max(10 * 1024 * 1024, {
    message: 'File Size Bytes must not exceed 10485760 bytes.',
  })
  fileSizeBytes?: number;
}

// Send Application Communication DTO
export class SendApplicationCommunicationDto {
  /**
   * Application Number
   *
   * @memberof SendApplicationCommunicationDto
   * @property {string} applicationNumber - Application Number
   * @description APPL followed by exactly 10 digits
   */
  @Transform(trimString)
  @IsString({ message: 'Application Number must be a string.' })
  @IsNotEmpty({ message: 'Application Number is required.' })
  @Matches(/^APPL\d{10}$/, {
    message: 'Application Number must start with APPL followed by exactly 10 digits',
  })
  applicationNumber: string;

  /**
   * Sender type
   *
   * @memberof SendApplicationCommunicationDto
   * @property {string} senderType - Sender type
   * @description One of CUSTOMER, SOURCING_OFFICER, UNDERWRITER, DISBURSAL_OFFICER
   */
  @Transform(trimString)
  @IsString({ message: 'Sender Type must be a string.' })
  @IsNotEmpty({ message: 'Sender Type is required.' })
  @Matches(/^(CUSTOMER|SOURCING_OFFICER|UNDERWRITER|DISBURSAL_OFFICER)$/, {
    message:
      'Sender Type must be one of CUSTOMER, SOURCING_OFFICER, UNDERWRITER, DISBURSAL_OFFICER',
  })
  senderType: string;

  /**
   * Recipient user id
   *
   * @memberof SendApplicationCommunicationDto
   * @property {string} recipientUserId - Recipient user id
   * @description Optional, required when Recipient Type is provided
   */
  @IsOptional()
  @IsUUID('4', { message: 'Recipient User Id must be a valid UUID.' })
  recipientUserId?: string;

  /**
   * Recipient type
   *
   * @memberof SendApplicationCommunicationDto
   * @property {string} recipientType - Recipient type
   * @description One of CUSTOMER, SOURCING_OFFICER, UNDERWRITER, DISBURSAL_OFFICER, required when Recipient User Id is provided
   */
  @ValidateIf((o) => !!o.recipientUserId)
  @Transform(trimString)
  @IsString({ message: 'Recipient Type must be a string.' })
  @IsNotEmpty({ message: 'Recipient Type is required when Recipient User Id is provided.' })
  @Matches(/^(CUSTOMER|SOURCING_OFFICER|UNDERWRITER|DISBURSAL_OFFICER)$/, {
    message:
      'Recipient Type must be one of CUSTOMER, SOURCING_OFFICER, UNDERWRITER, DISBURSAL_OFFICER',
  })
  recipientType?: string;

  /**
   * Communication message
   *
   * @memberof SendApplicationCommunicationDto
   * @property {string} messageText - Communication message
   * @description Required, must not exceed 5000 characters
   */
  @Transform(trimString)
  @IsString({ message: 'Message Text must be a string.' })
  @IsNotEmpty({ message: 'Message Text is required.' })
  @MaxLength(5000, { message: 'Message Text must not exceed 5000 characters.' })
  messageText: string;

  /**
   * Message category
   *
   * @memberof SendApplicationCommunicationDto
   * @property {string} messageCategory - Message category
   * @description One of QUERY, DOCUMENT_REQUEST, STATUS_UPDATE, INTERNAL_NOTE
   */
  @Transform(trimString)
  @IsString({ message: 'Message Category must be a string.' })
  @IsNotEmpty({ message: 'Message Category is required.' })
  @Matches(/^(QUERY|DOCUMENT_REQUEST|STATUS_UPDATE|INTERNAL_NOTE)$/, {
    message:
      'Message Category must be one of QUERY, DOCUMENT_REQUEST, STATUS_UPDATE, INTERNAL_NOTE',
  })
  messageCategory: string;

  /**
   * Internal communication flag
   *
   * @memberof SendApplicationCommunicationDto
   * @property {boolean} isInternal - Internal communication flag
   * @description Optional, default false
   */
  @Transform(toBoolean)
  @IsBoolean({ message: 'isInternal must be a boolean value.' })
  isInternal: boolean;

  /**
   * Email notification flag
   *
   * @memberof SendApplicationCommunicationDto
   * @property {boolean} sendEmail - Email notification flag
   * @description Optional, default false
   */
  @Transform(toBoolean)
  @IsBoolean({ message: 'sendEmail must be a boolean value.' })
  sendEmail: boolean;

  /**
   * SMS notification flag
   *
   * @memberof SendApplicationCommunicationDto
   * @property {boolean} sendSms - SMS notification flag
   * @description Optional, default false
   */
  @Transform(toBoolean)
  @IsBoolean({ message: 'sendSms must be a boolean value.' })
  sendSms: boolean;

  /**
   * Attachments
   *
   * @memberof SendApplicationCommunicationDto
   * @property {ApplicationCommunicationAttachmentDto[]} attachments - Attachments
   * @description Optional, must contain at least 1 item and at most 10 items
   */
  @IsOptional()
  @IsArray({ message: 'Attachments must be an array.' })
  @ArrayMinSize(1, { message: 'Attachments must contain at least 1 item.' })
  @ArrayMaxSize(10, { message: 'Attachments must not contain more than 10 items.' })
  @ArrayUnique((attachment: ApplicationCommunicationAttachmentDto) => attachment.documentPath, {
    message: 'Duplicate attachments are not allowed.',
  })
  @ValidateNested({ each: true })
  @Type(() => ApplicationCommunicationAttachmentDto)
  attachments?: ApplicationCommunicationAttachmentDto[];
}
