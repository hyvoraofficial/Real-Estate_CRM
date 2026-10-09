import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FollowUpStatus, LeadStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getReports() {
    // 1. Overall Summary
    const [totalLeads, totalSiteVisits, totalBookings, totalLost, bookingSum] = await Promise.all([
      this.prisma.lead.count(),
      this.prisma.siteVisit.count(),
      this.prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      this.prisma.lead.count({ where: { status: LeadStatus.LOST } }),
      this.prisma.booking.aggregate({
        _sum: { bookingAmount: true },
        where: { status: 'CONFIRMED' },
      }),
    ]);

    const conversionRate = totalLeads > 0 ? ((totalBookings / totalLeads) * 100).toFixed(1) : '0';

    // 2. Pipeline Funnel
    const pipelineStages = [
      { status: LeadStatus.NEW, label: 'New Inquiries' },
      { status: LeadStatus.CONTACTED, label: 'Contacted' },
      { status: LeadStatus.REQUIREMENT_COLLECTED, label: 'Requirement Collected' },
      { status: LeadStatus.PROPERTY_SHARED, label: 'Property Shared' },
      { status: LeadStatus.SITE_VISIT, label: 'Site Visit' },
      { status: LeadStatus.NEGOTIATION, label: 'Negotiation' },
      { status: LeadStatus.BOOKED, label: 'Booked' },
    ];

    const pipelineCounts = await this.prisma.lead.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const funnel = pipelineStages.map((st) => {
      const found = pipelineCounts.find((p) => p.status === st.status);
      return {
        stage: st.label,
        status: st.status,
        count: found ? found._count.id : 0,
      };
    });

    // 3. Lead Source Breakdown
    const sourceCounts = await this.prisma.lead.groupBy({
      by: ['source'],
      _count: { id: true },
    });
    const sources = sourceCounts.map((s) => ({
      source: s.source,
      count: s._count.id,
      percentage: totalLeads > 0 ? Math.round((s._count.id / totalLeads) * 100) : 0,
    }));

    // 4. Salesperson Performance
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        role: true,
        assignedLeads: {
          select: {
            id: true,
            status: true,
            siteVisits: { select: { id: true, status: true } },
            bookings: { select: { id: true, bookingAmount: true, status: true } },
          },
        },
        assignedFollowUps: {
          select: { id: true, status: true },
        },
      },
    });

    const salesPerformance = users.map((u) => {
      const assignedCount = u.assignedLeads.length;
      const bookedCount = u.assignedLeads.filter((l) => l.status === LeadStatus.BOOKED).length;
      const siteVisitsCount = u.assignedLeads.reduce(
        (acc, l) => acc + l.siteVisits.filter((sv) => sv.status === 'COMPLETED').length,
        0,
      );
      const totalRevenue = u.assignedLeads.reduce(
        (acc, l) =>
          acc +
          l.bookings
            .filter((b) => b.status === 'CONFIRMED')
            .reduce((bSum, b) => bSum + b.bookingAmount, 0),
        0,
      );
      const completedFollowUps = u.assignedFollowUps.filter(
        (fu) => fu.status === FollowUpStatus.COMPLETED,
      ).length;

      return {
        id: u.id,
        name: u.name,
        role: u.role,
        leadsAssigned: assignedCount,
        siteVisitsCompleted: siteVisitsCount,
        dealsClosed: bookedCount,
        totalRevenue,
        followUpsCompleted: completedFollowUps,
        conversionRate: assignedCount > 0 ? ((bookedCount / assignedCount) * 100).toFixed(1) + '%' : '0%',
      };
    });

    // 5. Follow-Up Completion Health
    const [pendingFollowUps, completedFollowUps, overdueFollowUps] = await Promise.all([
      this.prisma.followUp.count({ where: { status: FollowUpStatus.PENDING } }),
      this.prisma.followUp.count({ where: { status: FollowUpStatus.COMPLETED } }),
      this.prisma.followUp.count({
        where: {
          status: FollowUpStatus.PENDING,
          scheduledAt: { lt: new Date() },
        },
      }),
    ]);

    const followUpStats = [
      { name: 'Completed', value: completedFollowUps, fill: '#10b981' },
      { name: 'Pending (Upcoming)', value: Math.max(0, pendingFollowUps - overdueFollowUps), fill: '#3b82f6' },
      { name: 'Overdue', value: overdueFollowUps, fill: '#ef4444' },
    ];

    // 6. Property Demand Performance
    const propertyPerformance = await this.prisma.property.findMany({
      select: {
        id: true,
        title: true,
        location: true,
        price: true,
        status: true,
        _count: {
          select: {
            siteVisits: true,
            bookings: true,
          },
        },
      },
      orderBy: { siteVisits: { _count: 'desc' } },
      take: 8,
    });

    const propertyStats = propertyPerformance.map((p) => ({
      id: p.id,
      title: p.title,
      location: p.location,
      price: p.price,
      status: p.status,
      siteVisits: p._count.siteVisits,
      bookings: p._count.bookings,
    }));

    return {
      summary: {
        totalLeads,
        totalSiteVisits,
        totalBookings,
        totalLost,
        totalRevenue: bookingSum._sum.bookingAmount || 0,
        conversionRate: `${conversionRate}%`,
      },
      funnel,
      sources,
      salesPerformance,
      followUpStats,
      propertyStats,
    };
  }
}
