import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsUUID } from 'class-validator';

export class UpdateProductStatusRequestDto {
  // Product id of the record whose status needs to be changed
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @IsUUID()
  productId!: string;

  // Normalizes the status value and allows only active or inactive
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsNotEmpty()
  @IsIn(['active', 'inactive'])
  status!: string;
}
