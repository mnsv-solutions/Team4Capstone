export class UploadUsersResponseDto {
  // Overall result message for the upload process
  message: string;

  // Total number of rows read from the uploaded file
  totalRows: number;

  // Number of rows that were uploaded successfully
  successCount: number;

  // Number of rows that failed validation or processing
  failureCount: number;

  // List of rows that were created successfully
  successes: Array<{
    // Excel row number for quick reference
    rowNumber: number;

    // Email of the user created from that row
    email: string;

    // Generated user id after successful creation
    userId: string;
  }>;

  // List of rows that could not be processed
  failures: Array<{
    // Excel row number where the issue happened
    rowNumber: number;

    // Email from the failed row, if available
    email?: string;

    // All validation or processing errors for that row
    errors: string[];
  }>;
}
