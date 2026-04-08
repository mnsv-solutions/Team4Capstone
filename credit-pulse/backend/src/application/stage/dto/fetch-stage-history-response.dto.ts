// This DTO defines the response structure for the stage history API.
export class FetchStageHistoryResponseDto {
  // This message shows whether the request was completed successfully.
  message!: string;

  // This array stores all stage history records for the application.
  data!: Array<{
    // This is the unique ID of the action history record.
    actionHistoryId: string;

    // This is the unique ID of the related application.
    applicationId: string;

    // This is the application number shown to users.
    applicationNumber: string;

    // This shows what action was performed in this stage history entry.
    actionType: string;

    // This stores the previous status code before the action happened.
    fromStatusCode: string | null;

    // This stores the new status code after the action happened.
    toStatusCode: string;

    // This is the ID of the user who performed the action.
    performedByUserId: string;

    // This stores the date and time when the action was performed.
    performedAt: Date;

    // This shows the role of the user who performed the action.
    performerRoleCode: string;

    // This stores the related decision type, if any decision was made.
    decisionTypeCode: string | null;

    // This stores any remarks or notes added for the action.
    remarks: string | null;

    // This stores the approved loan amount, if applicable.
    approvedLoanAmount: number | null;

    // This stores the approved interest rate, if applicable.
    approvedInterestRate: number | null;

    // This stores the approved tenure in months, if applicable.
    approvedTenureMonths: number | null;

    // This stores the approved EMI amount, if applicable.
    approvedEmi: number | null;

    // This stores the disbursed amount, if applicable.
    disbursedAmount: number | null;

    // This stores extra metadata related to the stage history record.
    metadataJson: Record<string, unknown> | null;

    // This stores when the record was originally created.
    createdAt: Date;

    // This stores the user who created the record.
    createdBy: string;

    // This stores when the record was last updated.
    updatedAt: Date | null;

    // This stores the user who last updated the record.
    updatedBy: string | null;

    // This shows whether the record is currently active.
    isActive: boolean;
  }>;
}
