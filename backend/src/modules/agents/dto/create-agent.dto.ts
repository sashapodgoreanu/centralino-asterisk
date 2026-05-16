import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreateAgentDto {
  @IsString()
  @Matches(/^[0-9]{3,10}$/)
  extension!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  displayName!: string;

  @IsOptional()
  @IsString()
  tenantSlug?: string;
}
