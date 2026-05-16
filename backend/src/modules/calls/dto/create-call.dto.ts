import { IsOptional, IsString, Matches } from 'class-validator';

export class CreateCallDto {
  @IsString()
  @Matches(/^[0-9]{3,10}$/)
  from!: string;

  @IsString()
  @Matches(/^[0-9]{3,10}$/)
  to!: string;

  @IsOptional()
  @IsString()
  callerId?: string;
}
