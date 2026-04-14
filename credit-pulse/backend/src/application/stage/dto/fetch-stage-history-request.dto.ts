import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

//  DTO for fetching stage history
export class FetchStageHistoryRequestDto {
  /**
   * Application number for which stage history needs to be fetched
   * Must be a string and trimmed before validation
   * Must match the regex pattern /^APPL\d{10}$/
   */
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toUpperCase(),
  )
  @IsString()
  @Matches(/^APPL\d{10}$/)
  applicationNumber!: string;

  /**
   * Sort order of the stage history
   * Must be a string and trimmed before validation
   * Must be either 'asc' or 'desc'
   * If not provided, it defaults to 'asc'
   */
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return String(value).trim().toLowerCase();
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';
}
