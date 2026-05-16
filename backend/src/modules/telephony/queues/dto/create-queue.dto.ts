import { IsOptional, IsString, Matches } from 'class-validator';

export class CreateQueueDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{2,64}$/)
  name!: string;

  @IsOptional()
  @IsString()
  tenantSlug?: string;

  @IsOptional()
  @IsString()
  strategy?: string;
}
