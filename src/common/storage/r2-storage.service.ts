import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as crypto from 'crypto';
import * as path from 'path';

export interface UploadedFileResponse {
  url: string;
  key: string;
  bucket: string;
}

@Injectable()
export class R2StorageService {
  private readonly logger = new Logger(R2StorageService.name);
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl?: string;
  private accountId: string;

  constructor(private configService: ConfigService) {
    this.accountId = this.configService.get<string>('R2_ACCOUNT_ID') || '';
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID') || '';
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY') || '';
    this.bucketName = this.configService.get<string>('R2_BUCKET_NAME') || 'vc-app-media';
    this.publicUrl = this.configService.get<string>('R2_MEDIA_URL') || this.configService.get<string>('R2_PUBLIC_URL');

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  getMediaUrl(keyOrUrl?: string | null): string | null {
    if (!keyOrUrl) return null;
    const trimmed = keyOrUrl.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    if (this.publicUrl) {
      const cleanPublicUrl = this.publicUrl.replace(/\/$/, '');
      const cleanKey = trimmed.replace(/^\//, '');
      return `${cleanPublicUrl}/${cleanKey}`;
    }

    return trimmed;
  }

  async uploadFile(
    file: { buffer: Buffer; originalname: string; mimetype: string },
    folder: string = 'profiles',
  ): Promise<UploadedFileResponse> {
    const ext = path.extname(file.originalname) || '.jpg';
    const randomHash = crypto.randomBytes(16).toString('hex');
    const key = `${folder}/${Date.now()}-${randomHash}${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);

    let fileUrl = '';
    if (this.publicUrl) {
      const cleanPublicUrl = this.publicUrl.replace(/\/$/, '');
      fileUrl = `${cleanPublicUrl}/${key}`;
    } else {
      fileUrl = `https://${this.bucketName}.${this.accountId}.r2.cloudflarestorage.com/${key}`;
    }

    this.logger.log(`File uploaded successfully to R2: key=${key}`);

    return {
      url: fileUrl,
      key,
      bucket: this.bucketName,
    };
  }
}
