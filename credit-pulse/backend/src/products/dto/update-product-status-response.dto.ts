export class UpdateProductStatusResponseDataDto {
  // Product id of the record whose status was updated
  productId!: string;

  // Product code of the updated record
  productCode!: string;

  // Product name of the updated record
  productName!: string;

  // Latest status after the update
  status!: string;

  // Date and time when the status change was saved
  updatedAt!: Date;
}

export class UpdateProductStatusResponseDto {
  // Message returned after updating product status
  message!: string;

  // Updated product status details
  data!: UpdateProductStatusResponseDataDto;
}
