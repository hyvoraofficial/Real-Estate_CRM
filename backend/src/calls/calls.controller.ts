import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { CallsService } from './calls.service';
import { CreateCallDto } from './dto/create-call.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('calls')
export class CallsController {
  constructor(private callsService: CallsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async findAll(
    @Query('customerId') customerId?: string,
    @Query('leadId') leadId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.callsService.findAll({ customerId, leadId, page, limit });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  async create(@Body() dto: CreateCallDto) {
    return this.callsService.create(dto);
  }

  // Webhook endpoint ready for future cloud telephony integrations
  @Post('webhook')
  async telephonyWebhook(
    @Body()
    payload: {
      callerNumber: string;
      direction: 'INCOMING' | 'OUTGOING';
      duration?: number;
      recordingUrl?: string;
    },
  ) {
    return this.callsService.handleTelephonyWebhook(payload);
  }
}
