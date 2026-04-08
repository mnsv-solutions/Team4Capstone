// This DTO is used to send the response after a stage history record is added successfully.
export class PushStageResponseDto {
  // This message tells whether the request was completed successfully.
  message!: string;

  // This object stores the details of the newly created stage history record.
  data!: {
    // This is the unique ID of the action history record.
    actionHistoryId: string;

    // This is the unique ID of the related application.
    applicationId: string;

    // This is the application number linked to the action.
    applicationNumber: string;

    // This shows the action that was performed.
    actionType: string;

    // This stores the previous application status before the action.
    previousStatus: string;

    // This stores the current application status after the action.
    currentStatus: string;

    // This is the ID of the user who performed the action.
    performedByUserId: string;

    // This shows the role of the user who performed the action.
    performerRoleCode: string;

    // This stores the date and time when the action was performed.
    performedAt: Date;

    // This stores the related decision type, if available.
    decisionTypeCode: string | null;

    // This stores any remarks added during the action.
    remarks: string | null;

    // This stores the approved loan amount, if available.
    approvedLoanAmount: number | null;

    // This stores the approved interest rate, if available.
    approvedInterestRate: number | null;

    // This stores the approved loan tenure in months, if available.
    approvedTenureMonths: number | null;

    // This stores the approved EMI amount, if available.
    approvedEmi: number | null;

    // This stores the disbursed amount, if available.
    disbursedAmount: number | null;

    // This stores any extra metadata linked to the action.
    metadataJson: Record<string, unknown> | null;
  };
}
