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

// Product code must use uppercase letters and underscores only
const PRODUCT_CODE_REGEX = /^[A-Z_]{3,30}$/;

// Decimal fields can have up to 2 digits after the decimal point
const DECIMAL_AMOUNT_REGEX = /^\d+(\.\d{1,2})?$/;

export class UpdateProductRequestDto {
  // Product id of the record that needs to be updated
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @IsUUID()
  productId!: string;

  // Cleans and uppercases the product code before validation
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsNotEmpty()
  @IsString()
  @Matches(PRODUCT_CODE_REGEX)
  productCode!: string;

  // Updated display name of the product
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  productName!: string;

  // Updated minimum amount allowed for this product
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @IsString()
  @Matches(DECIMAL_AMOUNT_REGEX)
  minAmount!: string;

  // Updated maximum amount allowed for this product
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @IsString()
  @Matches(DECIMAL_AMOUNT_REGEX)
  maxAmount!: string;

  // Updated minimum tenure in months
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(360)
  minTenureMonths!: number;

  // Updated maximum tenure in months
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(360)
  maxTenureMonths!: number;

  // Updated minimum interest rate for the product
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @IsString()
  @Matches(DECIMAL_AMOUNT_REGEX)
  minInterestRate!: string;

  // Updated maximum interest rate for the product
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @IsString()
  @Matches(DECIMAL_AMOUNT_REGEX)
  maxInterestRate!: string;

  // Optional updated processing fee percentage
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_AMOUNT_REGEX)
  processingFeePercent?: string;

  // User id of the person making the update
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @IsUUID()
  updatedBy!: string;
}
