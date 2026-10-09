import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSiteVisitDto, UpdateSiteVisitDto } from './dto/create-site-visit.dto';
import { SiteVisitStatus, LeadStatus } from '@prisma/client';

@Injectable()
export class SiteVisitsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: {
    period?: 'today' | 'upcoming' | 'completed' | 'cancelled' | 'all';
    status?: string;
    leadId?: string;
    propertyId?: string;
    customerId?: string;
  }) {
    const { period = 'all', status, leadId, propertyId, customerId } = query || {};

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const where: any = {};
    if (leadId) where.leadId = leadId;
    if (propertyId) where.propertyId = propertyId;
    if (customerId) where.customerId = customerId;

    if (period === 'today') {
      where.scheduledAt = { gte: startOfToday, lte: endOfToday };
    } else if (period === 'upcoming') {
      where.scheduledAt = { gt: endOfToday };
      where.status = SiteVisitStatus.SCHEDULED;
    } else if (period === 'completed') {
      where.status = SiteVisitStatus.COMPLETED;
    } else if (period === 'cancelled') {
      where.status = SiteVisitStatus.CANCELLED;
    } else if (status) {
      where.status = status as SiteVisitStatus;
    }

    return this.prisma.siteVisit.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      include: {
        customer: true,
        property: {
          include: { images: { take: 1 } },
        },
        lead: {
          include: {
            requirement: true,
            assignedUser: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const sv = await this.prisma.siteVisit.findUnique({
      where: { id },
      include: {
        customer: true,
        property: { include: { images: true } },
        lead: { include: { requirement: true, assignedUser: true } },
      },
    });
    if (!sv) throw new NotFoundException('Site Visit not found');
    return sv;
  }

  async create(dto: CreateSiteVisitDto) {
    const lead = await this.prisma.lead.findUnique({ where: { id: dto.leadId } });
    if (!lead) throw new NotFoundException('Lead not found');

    const customerId = dto.customerId || lead.customerId;

    // Automatically update lead status to SITE_VISIT if it was earlier in pipeline
    if (lead.status === LeadStatus.NEW || lead.status === LeadStatus.CONTACTED || lead.status === LeadStatus.REQUIREMENT_COLLECTED || lead.status === LeadStatus.PROPERTY_SHARED) {
      await this.prisma.lead.update({
        where: { id: lead.id },
        data: { status: LeadStatus.SITE_VISIT },
      });
    }

    return this.prisma.siteVisit.create({
      data: {
        leadId: dto.leadId,
        customerId,
        propertyId: dto.propertyId,
        scheduledAt: new Date(dto.scheduledAt),
        status: dto.status || SiteVisitStatus.SCHEDULED,
        notes: dto.notes,
      },
      include: {
        customer: true,
        property: true,
        lead: true,
      },
    });
  }

  async update(id: string, dto: UpdateSiteVisitDto) {
    const sv = await this.prisma.siteVisit.findUnique({ where: { id } });
    if (!sv) throw new NotFoundException('Site Visit not found');

    return this.prisma.siteVisit.update({
      where: { id },
      data: {
        ...(dto.scheduledAt ? { scheduledAt: new Date(dto.scheduledAt) } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
      include: {
        customer: true,
        property: true,
        lead: true,
      },
    });
  }

  async remove(id: string) {
    const sv = await this.prisma.siteVisit.findUnique({ where: { id } });
    if (!sv) throw new NotFoundException('Site Visit not found');
    return this.prisma.siteVisit.delete({ where: { id } });
  }
}
