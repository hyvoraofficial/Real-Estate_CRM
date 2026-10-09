import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SiteVisitStatus } from '@prisma/client';

export class CreateSiteVisitDto {
  @IsString()
  @IsNotEmpty({ message: 'Lead ID is required' })
  leadId: string;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsNotEmpty({ message: 'Property ID is required' })
  propertyId: string;

  @IsString()
  @IsNotEmpty({ message: 'Scheduled date and time is required' })
  scheduledAt: string;

  @IsEnum(SiteVisitStatus)
  @IsOptional()
  status?: SiteVisitStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateSiteVisitDto {
  @IsString()
  @IsOptional()
  scheduledAt?: string;

  @IsEnum(SiteVisitStatus)
  @IsOptional()
  status?: SiteVisitStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
