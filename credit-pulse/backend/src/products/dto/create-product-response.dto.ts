export class CreateProductResponseDataDto {
  // Unique id created for the product
  productId!: string;

  // Saved product code in the system
  productCode!: string;

  // Display name of the product
  productName!: string;

  // Minimum amount allowed for this product
  minAmount!: string;

  // Maximum amount allowed for this product
  maxAmount!: string;

  // Minimum tenure supported in months
  minTenureMonths!: number;

  // Maximum tenure supported in months
  maxTenureMonths!: number;

  // Lowest interest rate configured for the product
  minInterestRate!: string;

  // Highest interest rate configured for the product
  maxInterestRate!: string;

  // Processing fee percentage saved for the product
  processingFeePercent!: string;

  // Current status of the product record
  status!: string;

  // User id of the person who created the product
  createdBy!: string;

  // Date and time when the product was created
  createdAt!: Date;
}

export class CreateProductResponseDto {
  // Message returned after product creation
  message!: string;

  // Product details returned in the response
  data!: CreateProductResponseDataDto;
}
