import { Body, Controller, Get, Logger, Patch, Post, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard.js';
import { CheckIsAdmin } from '../auth/check-is-admin.js';
import { CreateProductRequestDto } from './dto/create-product-request.dto.js';
import { CreateProductResponseDto } from './dto/create-product-response.dto.js';
import { FetchAllProductsResponseDto } from './dto/fetch-all-products-response.dto.js';
import { UpdateProductRequestDto } from './dto/update-product-request.dto.js';
import { UpdateProductResponseDto } from './dto/update-product-response.dto.js';
import { UpdateProductStatusRequestDto } from './dto/update-product-status-request.dto.js';
import { UpdateProductStatusResponseDto } from './dto/update-product-status-response.dto.js';
import { ProductsService } from './products.service.js';

// Controller for handling product-related requests
@Controller('products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(AuthGuard)
  @Get('all')
  /**
   * Retrieves all product records from the database.
   *
   * This function is responsible for retrieving all product records from the database.
   * It does this by calling the fetchAllProducts method of the ProductsService class,
   * which in turn calls the relevant Prisma client method to perform the database query.
   *
   * The function returns a promise that resolves to a FetchAllProductsResponseDto object,
   * which contains a success message and an array of product records.
   *
   * @returns A promise that resolves to a FetchAllProductsResponseDto object.
   */
  async fetchAllProducts(): Promise<FetchAllProductsResponseDto> {
    this.logger.log('A request was received to fetch all products.');

    // Call the fetchAllProducts method of the ProductsService class to retrieve all product records from the database.
    // This will return a promise that resolves to a FetchAllProductsResponseDto object,
    // which contains a success message and an array of product records.
    return this.productsService.fetchAllProducts();
  }

  @UseGuards(AuthGuard, CheckIsAdmin)
  @Post('add')
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
  async addNewProduct(
    @Body() createProductRequestDto: CreateProductRequestDto,
  ): Promise<CreateProductResponseDto> {
    this.logger.log('A request was received to add a new product.');
    return this.productsService.createProduct(createProductRequestDto);
  }

  @UseGuards(AuthGuard, CheckIsAdmin)
  @Patch('update-product')
  /**
   * Updates a product record in the database with the given updated fields.
   * This function takes an UpdateProductRequestDto object as a parameter, which contains the product ID and the updated fields.
   * It then calls the updateProduct method of the ProductsService class to update the product record in the database.
   * The function returns a promise that resolves to an UpdateProductResponseDto object, which contains a success message and the updated product record.
   *
   * @param updateProductRequestDto - An UpdateProductRequestDto object containing the product ID and the updated fields.
   * @returns A promise that resolves to an UpdateProductResponseDto object containing a success message and the updated product record.
   */
  async updateProduct(
    @Body() updateProductRequestDto: UpdateProductRequestDto,
  ): Promise<UpdateProductResponseDto> {
    this.logger.log('A request was received to update a product.');

    // Call the updateProduct method of the ProductsService class to update the product record in the database.
    return this.productsService.updateProduct(updateProductRequestDto);
  }

  @UseGuards(AuthGuard, CheckIsAdmin)
  @Patch('update-status')
  /**
   * Updates a product's status (active, inactive) in the database.
   * This function takes a product ID and a new status, and updates the product record
   * in the database. It returns a promise that resolves to an UpdateProductStatusResponseDto
   * containing a success message and the updated product record.
   *
   * @param updateProductStatusRequestDto - UpdateProductStatusRequestDto containing the product ID and new status.
   * @returns A promise that resolves to an UpdateProductStatusResponseDto containing a success message and the updated product record.
   */
  async updateProductStatus(
    @Body() updateProductStatusRequestDto: UpdateProductStatusRequestDto,
  ): Promise<UpdateProductStatusResponseDto> {
    this.logger.log('A request was received to update the product status.');

    // Updates a product's status (active, inactive) in the database.
    return this.productsService.updateProductStatus(updateProductStatusRequestDto);
  }
}
