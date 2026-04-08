import { ApiProperty } from '@nestjs/swagger';

export class AIConfigPublicKeyResponseDto {
  @ApiProperty({ example: 'RSA-OAEP-256' })
  algorithm: string;

  @ApiProperty({ description: 'DER 格式公钥（Base64）' })
  publicKeyDerBase64: string;
}
