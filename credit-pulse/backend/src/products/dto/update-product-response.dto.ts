export class UpdateProductResponseDataDto {
  // Unique id of the updated product
  productId!: string;

  // Product code saved after the update
  productCode!: string;

  // Updated display name of the product
  productName!: string;

  // Updated minimum amount allowed for this product
  minAmount!: string;

  // Updated maximum amount allowed for this product
  maxAmount!: string;

  // Updated minimum tenure in months
  minTenureMonths!: number;

  // Updated maximum tenure in months
  maxTenureMonths!: number;

  // Updated minimum interest rate for the product
  minInterestRate!: string;

  // Updated maximum interest rate for the product
  maxInterestRate!: string;

  // Updated processing fee percentage
  processingFeePercent!: string;

  // Current status of the product after update
  status!: string;

  // User id of the person who updated the product
  updatedBy!: string;

  // Date and time when the update happened
  updatedAt!: Date;
}

export class UpdateProductResponseDto {
  // Message returned after the product is updated
  message!: string;

  // Updated product details returned in the response
  data!: UpdateProductResponseDataDto;
}
