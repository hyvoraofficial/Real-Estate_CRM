import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { CallDirection } from '@prisma/client';

export class CreateCallDto {
  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  phoneNumber: string;

  @IsString()
  @IsOptional()
  leadId?: string;

  @IsEnum(CallDirection)
  @IsOptional()
  direction?: CallDirection;

  @IsNumber()
  @IsOptional()
  duration?: number; // seconds

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  summary?: string;
}
