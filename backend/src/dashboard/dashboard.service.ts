import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FollowUpStatus, LeadStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(assignedUserId?: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const leadWhere: any = assignedUserId ? { assignedUserId } : {};
    const followUpWhere: any = assignedUserId ? { assignedUserId } : {};

    // 1. Core KPIs
    const [
      totalLeads,
      newLeadsToday,
      callsToday,
      followUpsToday,
      overdueFollowUps,
      siteVisitsToday,
      activeOpportunities,
      bookingsCount,
      bookingsSum,
      lostLeads,
    ] = await Promise.all([
      this.prisma.lead.count({ where: leadWhere }),
      this.prisma.lead.count({
        where: { ...leadWhere, createdAt: { gte: startOfToday, lte: endOfToday } },
      }),
      this.prisma.callLog.count({
        where: {
          startedAt: { gte: startOfToday, lte: endOfToday },
          ...(assignedUserId ? { lead: { assignedUserId } } : {}),
        },
      }),
      this.prisma.followUp.count({
        where: {
          ...followUpWhere,
          scheduledAt: { gte: startOfToday, lte: endOfToday },
          status: FollowUpStatus.PENDING,
        },
      }),
      this.prisma.followUp.count({
        where: {
          ...followUpWhere,
          scheduledAt: { lt: startOfToday },
          status: FollowUpStatus.PENDING,
        },
      }),
      this.prisma.siteVisit.count({
        where: {
          scheduledAt: { gte: startOfToday, lte: endOfToday },
          ...(assignedUserId ? { lead: { assignedUserId } } : {}),
        },
      }),
      this.prisma.lead.count({
        where: {
          ...leadWhere,
          status: {
            in: [
              LeadStatus.CONTACTED,
              LeadStatus.REQUIREMENT_COLLECTED,
              LeadStatus.PROPERTY_SHARED,
              LeadStatus.SITE_VISIT,
              LeadStatus.NEGOTIATION,
            ],
          },
        },
      }),
      this.prisma.booking.count({
        where: assignedUserId ? { lead: { assignedUserId } } : {},
      }),
      this.prisma.booking.aggregate({
        _sum: { bookingAmount: true },
        where: assignedUserId ? { lead: { assignedUserId } } : {},
      }),
      this.prisma.lead.count({
        where: { ...leadWhere, status: LeadStatus.LOST },
      }),
    ]);

    const bookedLeads = await this.prisma.lead.count({
      where: { ...leadWhere, status: LeadStatus.BOOKED },
    });

    const conversionRate = totalLeads > 0 ? ((bookedLeads / totalLeads) * 100).toFixed(1) : '0';

    // 2. Pipeline Breakdown
    const pipelineCounts = await this.prisma.lead.groupBy({
      by: ['status'],
      where: leadWhere,
      _count: { id: true },
    });

    const pipelineOrder: LeadStatus[] = [
      LeadStatus.NEW,
      LeadStatus.CONTACTED,
      LeadStatus.REQUIREMENT_COLLECTED,
      LeadStatus.PROPERTY_SHARED,
      LeadStatus.SITE_VISIT,
      LeadStatus.NEGOTIATION,
      LeadStatus.BOOKED,
      LeadStatus.LOST,
    ];

    const pipelineData = pipelineOrder.map((status) => {
      const found = pipelineCounts.find((p) => p.status === status);
      return {
        status,
        count: found ? found._count.id : 0,
      };
    });

    // 3. Lead Source Breakdown
    const sourceCounts = await this.prisma.lead.groupBy({
      by: ['source'],
      where: leadWhere,
      _count: { id: true },
    });

    const sourceData = sourceCounts.map((s) => ({
      source: s.source,
      count: s._count.id,
    }));

    // 4. Leads Over Time (Last 7 Days)
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0);
    const leadsLast7Days = await this.prisma.lead.findMany({
      where: {
        ...leadWhere,
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true },
    });

    const trendMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      trendMap.set(label, 0);
    }

    leadsLast7Days.forEach((l) => {
      const label = new Date(l.createdAt).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      if (trendMap.has(label)) {
        trendMap.set(label, (trendMap.get(label) || 0) + 1);
      }
    });

    const trendData = Array.from(trendMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    // 5. Today's Follow-ups List
    const todayFollowUpsList = await this.prisma.followUp.findMany({
      where: {
        ...followUpWhere,
        scheduledAt: { gte: startOfToday, lte: endOfToday },
        status: FollowUpStatus.PENDING,
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        lead: {
          include: {
            customer: true,
            requirement: true,
          },
        },
        assignedUser: { select: { id: true, name: true } },
      },
      take: 10,
    });

    // 6. Overdue Follow-ups List (Prominent)
    const overdueFollowUpsList = await this.prisma.followUp.findMany({
      where: {
        ...followUpWhere,
        scheduledAt: { lt: startOfToday },
        status: FollowUpStatus.PENDING,
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        lead: {
          include: {
            customer: true,
            requirement: true,
          },
        },
        assignedUser: { select: { id: true, name: true } },
      },
      take: 5,
    });

    // 7. Recent Leads
    const recentLeadsList = await this.prisma.lead.findMany({
      where: leadWhere,
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        customer: true,
        requirement: true,
        assignedUser: { select: { id: true, name: true } },
        followUps: {
          where: { status: FollowUpStatus.PENDING },
          orderBy: { scheduledAt: 'asc' },
          take: 1,
        },
      },
    });

    return {
      kpis: {
        totalLeads,
        newLeadsToday,
        callsToday,
        followUpsToday,
        overdueFollowUps,
        siteVisitsToday,
        activeOpportunities,
        bookingsCount,
        totalBookingValue: bookingsSum._sum.bookingAmount || 0,
        lostLeads,
        conversionRate: `${conversionRate}%`,
      },
      charts: {
        pipeline: pipelineData,
        sources: sourceData,
        trend: trendData,
      },
      todayFollowUps: todayFollowUpsList,
      overdueFollowUps: overdueFollowUpsList,
      recentLeads: recentLeadsList.map((l) => ({
        id: l.id,
        status: l.status,
        priority: l.priority,
        source: l.source,
        createdAt: l.createdAt,
        customer: {
          id: l.customer.id,
          name: l.customer.name,
          phone: l.customer.phone,
        },
        requirement: l.requirement,
        assignedUser: l.assignedUser,
        nextFollowUp: l.followUps[0] || null,
      })),
    };
  }
}
