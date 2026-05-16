import { IsNumber, IsOptional, IsString, Matches } from 'class-validator';

export class AddQueueMemberDto {
  @IsString()
  @Matches(/^[0-9]{3,10}$/)
  extension!: string;

  @IsOptional()
  @IsNumber()
  penalty?: number;
}
