import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async globalSearch(query: string) {
    if (!query || query.trim().length === 0) {
      return { customers: [], leads: [], properties: [] };
    }

    const q = query.trim();
    const cleanDigits = q.replace(/[^0-9]/g, '');

    // 1. Search Customers (by phone, alternatePhone, whatsapp, name, email)
    const customerWhere: any = {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ],
    };

    if (cleanDigits.length >= 3) {
      customerWhere.OR.push(
        { phone: { contains: cleanDigits } },
        { alternatePhone: { contains: cleanDigits } },
        { whatsappNumber: { contains: cleanDigits } },
      );
    }

    const customers = await this.prisma.customer.findMany({
      where: customerWhere,
      take: 6,
      include: {
        leads: {
          orderBy: { createdAt: 'desc' },
          include: {
            requirement: true,
            assignedUser: { select: { id: true, name: true } },
            followUps: {
              where: { status: 'PENDING' },
              orderBy: { scheduledAt: 'asc' },
              take: 1,
            },
          },
          take: 1,
        },
      },
    });

    const formattedCustomers = customers.map((c) => {
      const latestLead = c.leads[0] || null;
      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        alternatePhone: c.alternatePhone,
        whatsappNumber: c.whatsappNumber,
        email: c.email,
        latestLead: latestLead
          ? {
              id: latestLead.id,
              status: latestLead.status,
              priority: latestLead.priority,
              assignedUser: latestLead.assignedUser,
              requirement: latestLead.requirement,
              nextFollowUp: latestLead.followUps[0] || null,
            }
          : null,
      };
    });

    // 2. Search Leads directly
    const leads = await this.prisma.lead.findMany({
      where: {
        OR: [
          { id: { contains: q, mode: 'insensitive' } },
          { customer: { name: { contains: q, mode: 'insensitive' } } },
          { customer: { phone: { contains: cleanDigits.length >= 3 ? cleanDigits : q } } },
          { requirement: { preferredLocation: { contains: q, mode: 'insensitive' } } },
          { requirement: { propertyType: { contains: q, mode: 'insensitive' } } },
          { requirement: { bhk: { contains: q, mode: 'insensitive' } } },
        ],
      },
      take: 6,
      include: {
        customer: true,
        requirement: true,
        assignedUser: { select: { id: true, name: true } },
        followUps: {
          where: { status: 'PENDING' },
          orderBy: { scheduledAt: 'asc' },
          take: 1,
        },
      },
    });

    const formattedLeads = leads.map((l) => ({
      id: l.id,
      status: l.status,
      priority: l.priority,
      customer: {
        id: l.customer.id,
        name: l.customer.name,
        phone: l.customer.phone,
      },
      requirement: l.requirement,
      assignedUser: l.assignedUser,
      nextFollowUp: l.followUps[0] || null,
    }));

    // 3. Search Properties
    const properties = await this.prisma.property.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { location: { contains: q, mode: 'insensitive' } },
          { address: { contains: q, mode: 'insensitive' } },
          { bhk: { contains: q, mode: 'insensitive' } },
          { propertyType: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 6,
      include: {
        images: { take: 1 },
      },
    });

    return {
      customers: formattedCustomers,
      leads: formattedLeads,
      properties,
    };
  }
}
