import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty({ message: 'Lead ID is required' })
  leadId: string;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsNotEmpty({ message: 'Property ID is required' })
  propertyId: string;

  @IsNumber()
  @IsNotEmpty({ message: 'Booking amount is required' })
  bookingAmount: number;

  @IsString()
  @IsOptional()
  bookingDate?: string;

  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateBookingDto {
  @IsNumber()
  @IsOptional()
  bookingAmount?: number;

  @IsString()
  @IsOptional()
  bookingDate?: string;

  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
