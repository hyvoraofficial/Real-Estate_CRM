import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { SiteVisitsService } from './site-visits.service';
import { CreateSiteVisitDto, UpdateSiteVisitDto } from './dto/create-site-visit.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('site-visits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SiteVisitsController {
  constructor(private siteVisitsService: SiteVisitsService) {}

  @Get()
  async findAll(
    @Query('period') period?: 'today' | 'upcoming' | 'completed' | 'cancelled' | 'all',
    @Query('status') status?: string,
    @Query('leadId') leadId?: string,
    @Query('propertyId') propertyId?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.siteVisitsService.findAll({
      period,
      status,
      leadId,
      propertyId,
      customerId,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.siteVisitsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateSiteVisitDto) {
    return this.siteVisitsService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSiteVisitDto) {
    return this.siteVisitsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.siteVisitsService.remove(id);
  }
}
