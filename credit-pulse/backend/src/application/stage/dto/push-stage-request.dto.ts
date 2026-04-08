import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

// These are the allowed stage action values for the request.
export const stageActionTypes = [
  'CREDIT_CHECK_COMPLETED',
  'SUBMITTED',
  'UNDER_REVIEW',
  'UNDERWRITER_APPROVED',
  'UNDERWRITER_REJECTED',
  'UNDERWRITER_REFERRED',
  'DISBURSAL_COMPLETED',
  'DISBURSAL_REJECTED',
] as const;

// This type is created from the allowed stage action values above.
export type StageActionType = (typeof stageActionTypes)[number];

// This DTO is used to validate the request for pushing stage history data.
export class PushStageRequestDto {
  // This takes the application number, trims it, and converts it to uppercase.
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toUpperCase(),
  )
  @IsString()
  @Matches(/^APPL\d{10}$/)
  applicationNumber!: string;

  // This takes the action type, trims it, and converts it to uppercase.
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toUpperCase(),
  )
  @IsEnum(stageActionTypes)
  actionType!: StageActionType;

  // This keeps remarks optional and removes blank values.
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return String(value).trim();
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;

  // This converts the approved loan amount to a number when provided.
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return Number(value);
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  approvedLoanAmount?: number;

  // This converts the approved interest rate to a number when provided.
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return Number(value);
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  approvedInterestRate?: number;

  // This converts the approved tenure into months when a value is given.
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return Number(value);
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(1)
  approvedTenureMonths?: number;

  // This converts the approved EMI value to a number when provided.
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return Number(value);
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  approvedEmi?: number;

  // This converts the disbursed amount to a number when provided.
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return Number(value);
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  disbursedAmount?: number;

  // This allows extra metadata to be passed as an optional object.
  @IsOptional()
  @IsObject()
  metadataJson?: Record<string, unknown>;
}
