import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { PropertyStatus } from '@prisma/client';

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty({ message: 'Property title is required' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Property type is required' })
  propertyType: string;

  @IsString()
  @IsOptional()
  bhk?: string;

  @IsString()
  @IsNotEmpty({ message: 'Location is required' })
  location: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  mapUrl?: string;

  @IsNumber()
  @IsNotEmpty({ message: 'Price is required' })
  price: number;

  @IsNumber()
  @IsNotEmpty({ message: 'Area is required' })
  area: number;

  @IsString()
  @IsOptional()
  furnishing?: string;

  @IsString()
  @IsOptional()
  possession?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(PropertyStatus)
  @IsOptional()
  status?: PropertyStatus;

  @IsArray()
  @IsOptional()
  images?: string[];
}

export class UpdatePropertyDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  propertyType?: string;

  @IsString()
  @IsOptional()
  bhk?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  mapUrl?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsNumber()
  @IsOptional()
  area?: number;

  @IsString()
  @IsOptional()
  furnishing?: string;

  @IsString()
  @IsOptional()
  possession?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(PropertyStatus)
  @IsOptional()
  status?: PropertyStatus;

  @IsArray()
  @IsOptional()
  images?: string[];
}
