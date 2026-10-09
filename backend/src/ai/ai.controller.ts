import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AiProcessVoiceTextDto, AiProcessImageDto } from './dto/ai-process.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('process-voice-text')
  @ApiOperation({ summary: 'Process voice transcript, raw text, or pasted phone number into automated Lead creation' })
  async processVoiceText(@Body() dto: AiProcessVoiceTextDto, @Request() req: any) {
    const userId = req.user?.id || dto.assignedUserId;
    return this.aiService.processVoiceOrText(dto.text, dto.phoneNumber, userId);
  }

  @Post('process-image')
  @ApiOperation({ summary: 'Process image or screenshot for automated Lead creation' })
  async processImage(@Body() dto: AiProcessImageDto, @Request() req: any) {
    const userId = req.user?.id || dto.assignedUserId;
    return this.aiService.processImage(dto.imageData, dto.notes, userId);
  }
}
