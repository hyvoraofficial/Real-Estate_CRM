import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { LeadPriority, LeadStatus } from '@prisma/client';

export class CreateLeadDto {
  // Customer info (for new or existing customer)
  @IsString()
  @IsNotEmpty({ message: 'Customer name is required' })
  customerName: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  phone: string;

  @IsString()
  @IsOptional()
  alternatePhone?: string;

  @IsString()
  @IsOptional()
  whatsappNumber?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  customerId?: string; // Optional: If explicitly selecting an existing customer

  // Lead metadata
  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;

  @IsEnum(LeadPriority)
  @IsOptional()
  priority?: LeadPriority;

  @IsString()
  @IsOptional()
  source?: string;

  @IsString()
  @IsOptional()
  assignedUserId?: string;

  // Requirement fields
  @IsString()
  @IsNotEmpty({ message: 'Property type is required' })
  propertyType: string;

  @IsString()
  @IsOptional()
  bhk?: string;

  @IsString()
  @IsNotEmpty({ message: 'Preferred location is required' })
  preferredLocation: string;

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
  purpose?: string; // Buying, Renting, Investment

  @IsString()
  @IsOptional()
  possessionPreference?: string; // Ready to Move, Under Construction, etc.

  @IsString()
  @IsOptional()
  furnishingPreference?: string; // Fully Furnished, Semi Furnished, Unfurnished

  @IsString()
  @IsOptional()
  notes?: string;

  // Optional initial follow-up scheduling
  @IsString()
  @IsOptional()
  followUpDate?: string; // ISO date string or YYYY-MM-DD

  @IsString()
  @IsOptional()
  followUpTime?: string; // HH:mm

  @IsString()
  @IsOptional()
  followUpType?: string; // CALL, WHATSAPP, MEETING, SITE_VISIT

  @IsString()
  @IsOptional()
  followUpNotes?: string;
}

export class UpdateLeadDto {
  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  whatsappNumber?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;

  @IsEnum(LeadPriority)
  @IsOptional()
  priority?: LeadPriority;

  @IsString()
  @IsOptional()
  source?: string;

  @IsString()
  @IsOptional()
  assignedUserId?: string;

  // Requirement updates if passed
  @IsOptional()
  requirement?: {
    propertyType?: string;
    bhk?: string;
    preferredLocation?: string;
    minBudget?: number;
    maxBudget?: number;
    minArea?: number;
    maxArea?: number;
    purpose?: string;
    possessionPreference?: string;
    furnishingPreference?: string;
    notes?: string;
  };
}
