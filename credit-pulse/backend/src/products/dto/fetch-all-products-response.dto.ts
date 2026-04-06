export class ProductDto {
  // Unique id of the product
  productId!: string;

  // Product code used for identification
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

  // Processing fee percentage for the product
  processingFeePercent!: string;

  // Current status of the product
  status!: string;

  // Date and time when the product was created
  createdAt!: Date;

  // Date and time when the product was last updated
  updatedAt!: Date;
}

export class FetchAllProductsResponseDto {
  // Message returned after fetching product records
  message!: string;

  // List of products returned from the API
  data!: ProductDto[];
}
