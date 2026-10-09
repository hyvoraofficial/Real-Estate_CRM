import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { FollowupsService } from './followups.service';
import { CreateFollowUpDto, UpdateFollowUpDto } from './dto/create-followup.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('followups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FollowupsController {
  constructor(private followupsService: FollowupsService) {}

  @Get()
  async findAll(
    @Query('period') period?: 'today' | 'upcoming' | 'overdue' | 'completed' | 'all',
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('assignedUserId') assignedUserId?: string,
    @Query('leadId') leadId?: string,
  ) {
    return this.followupsService.findAll({
      period,
      status,
      type,
      assignedUserId,
      leadId,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.followupsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateFollowUpDto, @CurrentUser('id') currentUserId: string) {
    return this.followupsService.create(dto, currentUserId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateFollowUpDto) {
    return this.followupsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.followupsService.remove(id);
  }
}
