import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

// Product code must contain only uppercase letters and underscores
const PRODUCT_CODE_REGEX = /^[A-Z_]{3,30}$/;

// Decimal values can have up to 2 digits after the decimal point
const DECIMAL_AMOUNT_REGEX = /^\d+(\.\d{1,2})?$/;

export class CreateProductRequestDto {
  // Converts product code to uppercase and removes extra spaces
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsNotEmpty()
  @IsString()
  @Matches(PRODUCT_CODE_REGEX)
  productCode!: string;

  // Stores the display name of the product
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  productName!: string;

  // Minimum loan amount allowed for this product
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @IsString()
  @Matches(DECIMAL_AMOUNT_REGEX)
  minAmount!: string;

  // Maximum loan amount allowed for this product
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @IsString()
  @Matches(DECIMAL_AMOUNT_REGEX)
  maxAmount!: string;

  // Minimum tenure allowed in months
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(360)
  minTenureMonths!: number;

  // Maximum tenure allowed in months
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(360)
  maxTenureMonths!: number;

  // Lowest interest rate available for this product
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @IsString()
  @Matches(DECIMAL_AMOUNT_REGEX)
  minInterestRate!: string;

  // Highest interest rate available for this product
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @IsString()
  @Matches(DECIMAL_AMOUNT_REGEX)
  maxInterestRate!: string;

  // Optional processing fee percentage for the product
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_AMOUNT_REGEX)
  processingFeePercent?: string;

  // User id of the person creating this product record
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @IsUUID()
  createdBy!: string;
}
