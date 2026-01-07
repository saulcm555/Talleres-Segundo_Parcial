import { IsString, IsOptional } from 'class-validator';

export class ProcessRequestDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  context?: string;
}
