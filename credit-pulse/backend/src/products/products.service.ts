import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProductRequestDto } from './dto/create-product-request.dto.js';
import { CreateProductResponseDto } from './dto/create-product-response.dto.js';
import { FetchAllProductsResponseDto } from './dto/fetch-all-products-response.dto.js';
import { UpdateProductRequestDto } from './dto/update-product-request.dto.js';
import { UpdateProductResponseDto } from './dto/update-product-response.dto.js';
import { UpdateProductStatusRequestDto } from './dto/update-product-status-request.dto.js';
import { UpdateProductStatusResponseDto } from './dto/update-product-status-response.dto.js';

// Type definition for a product row
type ProductRow = {
  // Unique id of the product
  productId: string;

  // Product code used to identify the product
  productCode: string;

  // Display name of the product
  productName: string;

  // Minimum allowed amount for this product
  minAmount: string;

  // Maximum allowed amount for this product
  maxAmount: string;

  // Minimum tenure allowed in months
  minTenureMonths: number;

  // Maximum tenure allowed in months
  maxTenureMonths: number;

  // Lowest interest rate configured for this product
  minInterestRate: string;

  // Highest interest rate configured for this product
  maxInterestRate: string;

  // Processing fee percentage for this product
  processingFeePercent: string;

  // Current status of the product
  status: string;

  // Date and time when the product was created
  createdAt: Date;

  // Date and time when the product was last updated
  updatedAt: Date;
};
// Service class for handling product-related operations
@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves all product records from the database.
   *
   * This function is responsible for retrieving all product records from the database.
   * It does this by calling the relevant Prisma client method to perform the database query.
   *
   * The function returns a promise that resolves to a FetchAllProductsResponseDto object,
   * which contains a success message and an array of product records.
   *
   * @returns A promise that resolves to a FetchAllProductsResponseDto object.
   * @remarks The function fetches all product records from the database, ordered by the creation date in descending order.
   * It selects the product ID, code, name, minimum amount, maximum amount, minimum tenure months, maximum tenure months, minimum interest rate, maximum interest rate, processing fee percentage, status, creation date, and update date.
   */
  async fetchAllProducts(): Promise<FetchAllProductsResponseDto> {
    const products = await this.prisma.$queryRaw<ProductRow[]>`
      SELECT
        lt.loan_type_id AS "productId",
        lt.loan_type_code AS "productCode",
        lt.loan_type_name AS "productName",
        lpc.min_amount::text AS "minAmount",
        lpc.max_amount::text AS "maxAmount",
        lpc.min_tenure_months AS "minTenureMonths",
        lpc.max_tenure_months AS "maxTenureMonths",
        lpc.min_interest_rate::text AS "minInterestRate",
        lpc.max_interest_rate::text AS "maxInterestRate",
        lpc.processing_fee_percent::text AS "processingFeePercent",
        CASE WHEN lt.is_active = true THEN 'active' ELSE 'inactive' END AS "status",
        lt.created_at AS "createdAt",
        GREATEST(lt.updated_at, lpc.updated_at) AS "updatedAt"
      FROM loan_types lt
      INNER JOIN loan_product_config lpc
        ON lpc.loan_type_id = lt.loan_type_id
      ORDER BY lt.created_at DESC
    `;

    return {
      message: 'Products fetched successfully.',
      data: products,
    };
  }

  /**
   * Creates a new product record in the database.
   * This function takes a CreateProductRequestDto object as a parameter, which contains the fields to be inserted into the database.
   * It then calls the createProduct method of the ProductsService class to create the product record in the database.
   * The function returns a promise that resolves to a CreateProductResponseDto object, which contains a success message and the created product record.
   *
   * @param createProductRequestDto - A CreateProductRequestDto object containing the fields to be inserted into the database.
   * @returns A promise that resolves to a CreateProductResponseDto object containing a success message and the created product record.
   *
   * This function is used to create a new product record in the database. The CreateProductRequestDto object is used to pass the fields to be inserted into the database.
   * The createProduct method of the ProductsService class is called with the CreateProductRequestDto object as a parameter.
   * The function returns a promise that resolves to a CreateProductResponseDto object containing a success message and the created product record.
   */
  async createProduct(
    createProductRequestDto: CreateProductRequestDto,
  ): Promise<CreateProductResponseDto> {
    // Take all product fields from the request body
    const {
      productCode,
      productName,
      minAmount,
      maxAmount,
      minTenureMonths,
      maxTenureMonths,
      minInterestRate,
      maxInterestRate,
      processingFeePercent,
      createdBy,
    } = createProductRequestDto;

    // Check that amount, tenure, interest, and fee values are valid before saving
    this.validateProductRanges({
      minAmount,
      maxAmount,
      minTenureMonths,
      maxTenureMonths,
      minInterestRate,
      maxInterestRate,
      processingFeePercent,
    });

    // Find the user who is trying to create the product
    const createdByUser = await this.prisma.users.findFirst({
      where: {
        user_id: createdBy,
        is_active: true,
      },
      select: {
        user_id: true,
        role_id: true,
      },
    });

    // Stop if that user does not exist or is inactive
    if (!createdByUser) {
      throw new NotFoundException('Created by user not found.');
    }

    // Get the user's role so only admins can create products
    const creatorRole = await this.prisma.roles.findFirst({
      where: {
        role_id: createdByUser.role_id,
        is_active: true,
      },
      select: {
        role_code: true,
      },
    });

    // Reject the request if the user is not an active admin
    if (!creatorRole || creatorRole.role_code !== 'ADMIN') {
      throw new BadRequestException('Created by must belong to an active admin user.');
    }

    // Check whether this product code is already being used
    const existingProductCode = await this.prisma.loan_types.findFirst({
      where: {
        loan_type_code: productCode,
      },
      select: {
        loan_type_id: true,
      },
    });

    // Do not allow duplicate product codes
    if (existingProductCode) {
      throw new ConflictException('Product code already exists.');
    }

    // Check whether this product name is already being used
    const existingProductName = await this.prisma.loan_types.findFirst({
      where: {
        loan_type_name: productName,
      },
      select: {
        loan_type_id: true,
      },
    });

    // Do not allow duplicate product names
    if (existingProductName) {
      throw new ConflictException('Product name already exists.');
    }

    // Save product master data and config data together in one transaction
    const createdProduct = await this.prisma.$transaction(async (tx) => {
      // Create the main product record
      const loanType = await tx.loan_types.create({
        data: {
          loan_type_code: productCode,
          loan_type_name: productName,
          created_by: createdBy,
          updated_by: createdBy,
          is_active: true,
        },
      });

      // Create the related product configuration record
      const productConfig = await tx.loan_product_config.create({
        data: {
          loan_type_id: loanType.loan_type_id,
          min_amount: minAmount,
          max_amount: maxAmount,
          min_tenure_months: minTenureMonths,
          max_tenure_months: maxTenureMonths,
          min_interest_rate: minInterestRate,
          max_interest_rate: maxInterestRate,
          processing_fee_percent: processingFeePercent ?? '0.00',
          created_by: createdBy,
          updated_by: createdBy,
          is_active: true,
        },
      });

      return { loanType, productConfig };
    });

    // Return the newly created product in response format
    return {
      message: 'Product created successfully.',
      data: {
        productId: createdProduct.loanType.loan_type_id,
        productCode: createdProduct.loanType.loan_type_code,
        productName: createdProduct.loanType.loan_type_name,
        minAmount: createdProduct.productConfig.min_amount.toString(),
        maxAmount: createdProduct.productConfig.max_amount.toString(),
        minTenureMonths: createdProduct.productConfig.min_tenure_months,
        maxTenureMonths: createdProduct.productConfig.max_tenure_months,
        minInterestRate: createdProduct.productConfig.min_interest_rate.toString(),
        maxInterestRate: createdProduct.productConfig.max_interest_rate.toString(),
        processingFeePercent: createdProduct.productConfig.processing_fee_percent.toString(),
        status: 'active',
        createdBy,
        createdAt: createdProduct.loanType.created_at,
      },
    };
  }

  /**
   * Updates a product record in the database with the given updated fields.
   *
   * This function takes an UpdateProductRequestDto object as a parameter, which contains the product ID and the updated fields.
   * It then calls the updateProduct method of the ProductsService class to update the product record in the database.
   * The function returns a promise that resolves to an UpdateProductResponseDto object, which contains a success message and the updated product record.
   *
   * The following steps are taken:
   *   1. Pulls all updated product values from the request.
   *   2. Validates all numeric ranges before updating.
   *   3. Checks whether the updater exists and is active.
   *   4. Fetches the updater's role for permission check.
   *   5. Only active admin users are allowed to update products.
   *   6. Finds the existing product and its related config.
   *   7. Stops the request if the product does not exist.
   *   8. Stops the request if config data is missing for the product.
   *   9. Checks whether another product already uses this code.
   *   10. Prevents duplicate product codes during update.
   *   11. Checks whether another product already uses this name.
   *   12. Prevents duplicate product names during update.
   *   13. Keeps one common timestamp for all update operations.
   *   14. Updates both the main product and its config together.
   *   15. Returns the updated product details in response format.
   *
   * @param updateProductRequestDto - An UpdateProductRequestDto object containing the product ID and the updated fields.
   * @returns A promise that resolves to an UpdateProductResponseDto object containing a success message and the updated product record.
   */
  async updateProduct(
    updateProductRequestDto: UpdateProductRequestDto,
  ): Promise<UpdateProductResponseDto> {
    // Pulls all updated product values from the request
    const {
      productId,
      productCode,
      productName,
      minAmount,
      maxAmount,
      minTenureMonths,
      maxTenureMonths,
      minInterestRate,
      maxInterestRate,
      processingFeePercent,
      updatedBy,
    } = updateProductRequestDto;

    // Validates all numeric ranges before updating
    this.validateProductRanges({
      minAmount,
      maxAmount,
      minTenureMonths,
      maxTenureMonths,
      minInterestRate,
      maxInterestRate,
      processingFeePercent,
    });

    // Checks whether the updater exists and is active
    const updatedByUser = await this.prisma.users.findFirst({
      where: {
        user_id: updatedBy,
        is_active: true,
      },
      select: {
        user_id: true,
        role_id: true,
      },
    });

    // Stops the request if the updater is not found
    if (!updatedByUser) {
      throw new NotFoundException('Updated by user not found.');
    }

    // Fetches the updater's role for permission check
    const updaterRole = await this.prisma.roles.findFirst({
      where: {
        role_id: updatedByUser.role_id,
        is_active: true,
      },
      select: {
        role_code: true,
      },
    });

    // Only active admin users are allowed to update products
    if (!updaterRole || updaterRole.role_code !== 'ADMIN') {
      throw new BadRequestException('Updated by must belong to an active admin user.');
    }

    // Finds the existing product and its related config
    const existingProduct = await this.prisma.loan_types.findFirst({
      where: {
        loan_type_id: productId,
      },
      include: {
        loan_product_config: true,
      },
    });

    // Stops the request if the product does not exist
    if (!existingProduct) {
      throw new NotFoundException('Product not found.');
    }

    // Stops the request if config data is missing for the product
    if (!existingProduct.loan_product_config) {
      throw new NotFoundException('Product configuration not found.');
    }

    // Checks whether another product already uses this code
    const duplicateCode = await this.prisma.loan_types.findFirst({
      where: {
        loan_type_code: productCode,
        NOT: {
          loan_type_id: productId,
        },
      },
      select: {
        loan_type_id: true,
      },
    });

    // Prevents duplicate product codes during update
    if (duplicateCode) {
      throw new ConflictException('Product code already exists.');
    }

    // Checks whether another product already uses this name
    const duplicateName = await this.prisma.loan_types.findFirst({
      where: {
        loan_type_name: productName,
        NOT: {
          loan_type_id: productId,
        },
      },
      select: {
        loan_type_id: true,
      },
    });

    // Prevents duplicate product names during update
    if (duplicateName) {
      throw new ConflictException('Product name already exists.');
    }

    // Keeps one common timestamp for all update operations
    const now = new Date();
    const existingProductConfig = existingProduct.loan_product_config;

    // Updates both the main product and its config together
    const updatedProduct = await this.prisma.$transaction(async (tx) => {
      // Updates the main product details
      const loanType = await tx.loan_types.update({
        where: {
          loan_type_id: productId,
        },
        data: {
          loan_type_code: productCode,
          loan_type_name: productName,
          updated_by: updatedBy,
          updated_at: now,
        },
      });

      // Updates the related product configuration
      const productConfig = await tx.loan_product_config.update({
        where: {
          product_config_id: existingProductConfig.product_config_id,
        },
        data: {
          min_amount: minAmount,
          max_amount: maxAmount,
          min_tenure_months: minTenureMonths,
          max_tenure_months: maxTenureMonths,
          min_interest_rate: minInterestRate,
          max_interest_rate: maxInterestRate,
          processing_fee_percent: processingFeePercent ?? '0.00',
          updated_by: updatedBy,
          updated_at: now,
        },
      });

      return { loanType, productConfig };
    });

    // Returns the updated product details in response format
    return {
      message: 'Product updated successfully.',
      data: {
        productId: updatedProduct.loanType.loan_type_id,
        productCode: updatedProduct.loanType.loan_type_code,
        productName: updatedProduct.loanType.loan_type_name,
        minAmount: updatedProduct.productConfig.min_amount.toString(),
        maxAmount: updatedProduct.productConfig.max_amount.toString(),
        minTenureMonths: updatedProduct.productConfig.min_tenure_months,
        maxTenureMonths: updatedProduct.productConfig.max_tenure_months,
        minInterestRate: updatedProduct.productConfig.min_interest_rate.toString(),
        maxInterestRate: updatedProduct.productConfig.max_interest_rate.toString(),
        processingFeePercent: updatedProduct.productConfig.processing_fee_percent.toString(),
        status: updatedProduct.loanType.is_active ? 'active' : 'inactive',
        updatedBy,
        updatedAt: now,
      },
    };
  }

  /**
   * Updates a product's status (active, inactive) in the database.
   * This function takes an UpdateProductStatusRequestDto object as a parameter, which contains the product ID and the new status.
   * It then calls the updateProductStatus method of the ProductsService class to update the product record in the database.
   * The function returns a promise that resolves to an UpdateProductStatusResponseDto object, which contains a success message and the updated product record.
   *
   * The following steps are taken:
   *   1. Fetch the existing product record with the given product ID.
   *   2. If the product record is not found, throw a NotFoundException.
   *   3. Fetch the existing product configuration record with the given product ID.
   *   4. If the product configuration record is not found, throw a NotFoundException.
   *   5. Update the product and product configuration records with the given status and current date.
   *   6. Return a promise that resolves to an UpdateProductStatusResponseDto object containing a success message and the updated product record.
   *
   * @param updateProductStatusRequestDto - An UpdateProductStatusRequestDto object containing the product ID and the new status.
   * @returns A promise that resolves to an UpdateProductStatusResponseDto object containing a success message and the updated product record.
   */
  async updateProductStatus(
    updateProductStatusRequestDto: UpdateProductStatusRequestDto,
  ): Promise<UpdateProductStatusResponseDto> {
    const { productId, status } = updateProductStatusRequestDto;
    const isActive = status === 'active';

    // Fetch the existing product record
    const existingProduct = await this.prisma.loan_types.findFirst({
      where: {
        loan_type_id: productId,
      },
      select: {
        loan_type_id: true,
        loan_type_code: true,
        loan_type_name: true,
      },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found.');
    }

    // Fetch the existing product configuration record
    const existingProductConfig = await this.prisma.loan_product_config.findFirst({
      where: {
        loan_type_id: productId,
      },
      select: {
        product_config_id: true,
      },
    });

    if (!existingProductConfig) {
      throw new NotFoundException('Product configuration not found.');
    }

    // Update the product and product configuration records
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.loan_types.update({
        where: {
          loan_type_id: productId,
        },
        data: {
          is_active: isActive,
          updated_at: now,
        },
      }),
      this.prisma.loan_product_config.update({
        where: {
          product_config_id: existingProductConfig.product_config_id,
        },
        data: {
          is_active: isActive,
          updated_at: now,
        },
      }),
    ]);

    return {
      message: 'Product status updated successfully.',
      data: {
        productId: existingProduct.loan_type_id,
        productCode: existingProduct.loan_type_code,
        productName: existingProduct.loan_type_name,
        status,
        updatedAt: now,
      },
    };
  }
  /**
   * Validates the product ranges input.
   * This function checks if the input is valid and throws a BadRequestException
   * if the input is invalid.
   * The input is expected to contain the following properties:
   *   - minAmount: The minimum loan amount.
   *   - maxAmount: The maximum loan amount.
   *   - minTenureMonths: The minimum tenure in months.
   *   - maxTenureMonths: The maximum tenure in months.
   *   - minInterestRate: The minimum interest rate.
   *   - maxInterestRate: The maximum interest rate.
   *   - processingFeePercent: The processing fee percent.
   * @param input - The input to validate.
   * @throws BadRequestException - If the input is invalid.
   */
  private validateProductRanges(input: {
    minAmount: string;
    maxAmount: string;
    minTenureMonths: number;
    maxTenureMonths: number;
    minInterestRate: string;
    maxInterestRate: string;
    processingFeePercent?: string;
  }): void {
    // Check if minimum amount is greater than 0
    if (Number(input.minAmount) <= 0) {
      throw new BadRequestException(
        'The minimum amount must be greater than 0. ' +
          'This is to ensure that the loan amount is not zero or negative.',
      );
    }

    // Check if maximum amount is greater than 0
    if (Number(input.maxAmount) <= 0) {
      throw new BadRequestException(
        'The maximum amount must be greater than 0. ' +
          'This is to ensure that the loan amount is not zero or negative.',
      );
    }

    // Check if maximum amount is greater than or equal to minimum amount
    if (Number(input.minAmount) > Number(input.maxAmount)) {
      throw new BadRequestException(
        'The maximum amount must be greater than or equal to the minimum amount. ' +
          'This is to ensure that the loan amount range is valid.',
      );
    }

    // Check if maximum tenure months is greater than or equal to minimum tenure months
    if (input.minTenureMonths > input.maxTenureMonths) {
      throw new BadRequestException(
        'The maximum tenure months must be greater than or equal to the minimum tenure months. ' +
          'This is to ensure that the tenure range is valid.',
      );
    }

    // Check if maximum interest rate is greater than or equal to minimum interest rate
    if (Number(input.minInterestRate) > Number(input.maxInterestRate)) {
      throw new BadRequestException(
        'The maximum interest rate must be greater than or equal to the minimum interest rate. ' +
          'This is to ensure that the interest rate range is valid.',
      );
    }

    // Check if interest rates are not negative
    if (Number(input.minInterestRate) < 0 || Number(input.maxInterestRate) < 0) {
      throw new BadRequestException(
        'Interest rates cannot be negative. ' +
          'This is to ensure that the interest rates are valid.',
      );
    }

    // Check if processing fee percent is not negative
    if (input.processingFeePercent !== undefined && Number(input.processingFeePercent) < 0) {
      throw new BadRequestException(
        'Processing fee percent cannot be negative. ' +
          'This is to ensure that the processing fee percent is valid.',
      );
    }
  }
}
