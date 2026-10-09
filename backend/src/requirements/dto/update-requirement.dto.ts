import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateRequirementDto {
  @IsString()
  @IsOptional()
  propertyType?: string;

  @IsString()
  @IsOptional()
  bhk?: string;

  @IsString()
  @IsOptional()
  preferredLocation?: string;

  @IsNumber()
  @IsOptional()
  minBudget?: number;

  @IsNumber()
  @IsOptional()
  maxBudget?: number;

  @IsNumber()
  @IsOptional()
  minArea?: number;

  @IsNumber()
  @IsOptional()
  maxArea?: number;

  @IsString()
  @IsOptional()
  purpose?: string;

  @IsString()
  @IsOptional()
  possessionPreference?: string;

  @IsString()
  @IsOptional()
  furnishingPreference?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
