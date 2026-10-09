import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFollowUpDto, UpdateFollowUpDto } from './dto/create-followup.dto';
import { FollowUpStatus, FollowUpType } from '@prisma/client';

@Injectable()
export class FollowupsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: {
    period?: 'today' | 'upcoming' | 'overdue' | 'completed' | 'all';
    status?: string;
    type?: string;
    assignedUserId?: string;
    leadId?: string;
  }) {
    const { period = 'all', status, type, assignedUserId, leadId } = query || {};

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const where: any = {};

    if (assignedUserId) {
      where.assignedUserId = assignedUserId;
    }
    if (leadId) {
      where.leadId = leadId;
    }
    if (type) {
      where.type = type as FollowUpType;
    }

    if (period === 'today') {
      where.scheduledAt = { gte: startOfToday, lte: endOfToday };
      where.status = FollowUpStatus.PENDING;
    } else if (period === 'overdue') {
      where.scheduledAt = { lt: startOfToday };
      where.status = FollowUpStatus.PENDING;
    } else if (period === 'upcoming') {
      where.scheduledAt = { gt: endOfToday };
      where.status = FollowUpStatus.PENDING;
    } else if (period === 'completed') {
      where.status = FollowUpStatus.COMPLETED;
    } else if (status) {
      where.status = status as FollowUpStatus;
    }

    const followUps = await this.prisma.followUp.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        lead: {
          include: {
            customer: true,
            requirement: true,
          },
        },
        assignedUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return followUps;
  }

  async findOne(id: string) {
    const fu = await this.prisma.followUp.findUnique({
      where: { id },
      include: {
        lead: {
          include: {
            customer: true,
            requirement: true,
          },
        },
        assignedUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    if (!fu) throw new NotFoundException('Follow-up not found');
    return fu;
  }

  async create(dto: CreateFollowUpDto, currentUserId?: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id: dto.leadId } });
    if (!lead) throw new NotFoundException('Lead not found');

    const scheduledDate = new Date(dto.scheduledAt);

    return this.prisma.followUp.create({
      data: {
        leadId: dto.leadId,
        assignedUserId: dto.assignedUserId || lead.assignedUserId || currentUserId,
        scheduledAt: scheduledDate,
        type: dto.type || FollowUpType.CALL,
        status: dto.status || FollowUpStatus.PENDING,
        notes: dto.notes,
      },
      include: {
        lead: {
          include: { customer: true, requirement: true },
        },
        assignedUser: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, dto: UpdateFollowUpDto) {
    const fu = await this.prisma.followUp.findUnique({ where: { id } });
    if (!fu) throw new NotFoundException('Follow-up not found');

    const isCompleting = dto.status === FollowUpStatus.COMPLETED && fu.status !== FollowUpStatus.COMPLETED;

    return this.prisma.followUp.update({
      where: { id },
      data: {
        ...(dto.scheduledAt ? { scheduledAt: new Date(dto.scheduledAt) } : {}),
        ...(dto.type ? { type: dto.type } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.assignedUserId !== undefined ? { assignedUserId: dto.assignedUserId } : {}),
        ...(isCompleting ? { completedAt: new Date() } : {}),
      },
      include: {
        lead: {
          include: { customer: true, requirement: true },
        },
        assignedUser: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: string) {
    const fu = await this.prisma.followUp.findUnique({ where: { id } });
    if (!fu) throw new NotFoundException('Follow-up not found');
    return this.prisma.followUp.delete({ where: { id } });
  }
}
