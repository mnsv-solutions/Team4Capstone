-- AlterTable
ALTER TABLE "loan_application" ADD COLUMN     "approved_emi" DECIMAL(14,2),
ADD COLUMN     "approved_interest_rate" DECIMAL(5,2),
ADD COLUMN     "approved_loan_amount" DECIMAL(14,2),
ADD COLUMN     "approved_tenure_months" INTEGER;
