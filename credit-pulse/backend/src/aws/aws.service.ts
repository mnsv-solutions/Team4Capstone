import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AwsService {
  private readonly client: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.client = new S3Client({
      region: this.configService.get<string>('aws.region'),
      profile: this.configService.get<string>('aws.profile'),
    });
  }

  async uploadToS3(bucket: string, key: string, body: Buffer): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
      }),
    );
  }

  async getFileFromS3(bucket: string, key: string): Promise<Buffer> {
    const { Body } = await this.client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );

    return Body as unknown as Buffer;
  }
}
