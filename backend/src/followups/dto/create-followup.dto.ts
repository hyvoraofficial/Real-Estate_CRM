import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { FollowUpStatus, FollowUpType } from '@prisma/client';

export class CreateFollowUpDto {
  @IsString()
  @IsNotEmpty({ message: 'Lead ID is required' })
  leadId: string;

  @IsString()
  @IsOptional()
  assignedUserId?: string;

  @IsString()
  @IsNotEmpty({ message: 'Scheduled date and time is required' })
  scheduledAt: string; // ISO date or string

  @IsEnum(FollowUpType)
  @IsOptional()
  type?: FollowUpType;

  @IsEnum(FollowUpStatus)
  @IsOptional()
  status?: FollowUpStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateFollowUpDto {
  @IsString()
  @IsOptional()
  scheduledAt?: string;

  @IsEnum(FollowUpType)
  @IsOptional()
  type?: FollowUpType;

  @IsEnum(FollowUpStatus)
  @IsOptional()
  status?: FollowUpStatus;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  assignedUserId?: string;
}
