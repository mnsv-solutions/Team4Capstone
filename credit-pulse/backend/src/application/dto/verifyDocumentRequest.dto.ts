import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNotEmpty, IsString, Matches, ValidateNested } from 'class-validator';

export class DocumentVerifyItemDto {
  @IsString()
  @IsNotEmpty()
  documentType: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsIn(['VERIFIED', 'NOT_VERIFIED'])
  verificationStatus: 'VERIFIED' | 'NOT_VERIFIED';
}

export class VerifyDocumentRequestDto {
  @IsString({ message: 'Application Number must be a string.' })
  @IsNotEmpty({ message: 'Application Number is required.' })
  @Matches(/^APPL\d{10}$/, {
    message: 'Application Number must be in format APPL0000000001.',
  })
  applicationNumber: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentVerifyItemDto)
  documents: DocumentVerifyItemDto[];
}
