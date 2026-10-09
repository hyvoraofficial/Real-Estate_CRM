import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AiProcessVoiceTextDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  assignedUserId?: string;
}

export class AiProcessImageDto {
  @IsString()
  @IsNotEmpty()
  imageData: string; // Base64 or image text/URL

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  assignedUserId?: string;
}
