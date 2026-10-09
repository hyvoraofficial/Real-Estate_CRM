import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: {
    search?: string;
    location?: string;
    propertyType?: string;
    status?: string;
    assignedUserId?: string;
    page?: number;
    limit?: number;
  }) {
    const pageNum = Number(query?.page) > 0 ? Number(query?.page) : 1;
    const limitNum = Number(query?.limit) > 0 ? Number(query?.limit) : 50;
    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

    const { search, location, propertyType, status, assignedUserId } = query || {};

    const where: any = {};

    if (search) {
      const cleanSearch = search.trim();
      where.OR = [
        { name: { contains: cleanSearch, mode: 'insensitive' } },
        { phone: { contains: cleanSearch, mode: 'insensitive' } },
        { alternatePhone: { contains: cleanSearch, mode: 'insensitive' } },
        { whatsappNumber: { contains: cleanSearch, mode: 'insensitive' } },
        { email: { contains: cleanSearch, mode: 'insensitive' } },
      ];
    }

    if (location || propertyType || status || assignedUserId) {
      where.leads = {
        some: {
          ...(status ? { status: status as any } : {}),
          ...(assignedUserId ? { assignedUserId } : {}),
          ...(location || propertyType
            ? {
                requirement: {
                  ...(location ? { preferredLocation: { contains: location, mode: 'insensitive' } } : {}),
                  ...(propertyType ? { propertyType: { equals: propertyType, mode: 'insensitive' } } : {}),
                },
              }
            : {}),
        },
      };
    }

    const [total, customers] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        include: {
          leads: {
            orderBy: { createdAt: 'desc' },
            include: {
              requirement: true,
              assignedUser: { select: { id: true, name: true, email: true } },
              followUps: {
                orderBy: { scheduledAt: 'asc' },
                where: { status: 'PENDING' },
                take: 1,
              },
            },
          },
          callLogs: {
            orderBy: { startedAt: 'desc' },
            take: 1,
          },
          notesList: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
    ]);

    // Format customers with latest lead, requirement, next follow-up and last interaction
    const formatted = customers.map((c) => {
      const latestLead = c.leads[0] || null;
      const nextFollowUp = latestLead?.followUps[0] || null;
      const lastCall = c.callLogs[0]?.startedAt || null;
      const lastNote = c.notesList[0]?.createdAt || null;
      const lastLeadDate = latestLead?.updatedAt || null;

      const timestamps = [c.createdAt, lastCall, lastNote, lastLeadDate].filter(Boolean) as Date[];
      const lastInteraction = timestamps.length > 0 ? new Date(Math.max(...timestamps.map((t) => new Date(t).getTime()))) : c.updatedAt;

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        alternatePhone: c.alternatePhone,
        whatsappNumber: c.whatsappNumber,
        email: c.email,
        source: c.source,
        notes: c.notes,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        latestLead: latestLead
          ? {
              id: latestLead.id,
              status: latestLead.status,
              priority: latestLead.priority,
              assignedUser: latestLead.assignedUser,
              requirement: latestLead.requirement,
            }
          : null,
        nextFollowUp: nextFollowUp
          ? {
              id: nextFollowUp.id,
              scheduledAt: nextFollowUp.scheduledAt,
              type: nextFollowUp.type,
              status: nextFollowUp.status,
              notes: nextFollowUp.notes,
            }
          : null,
        lastInteraction,
        totalLeads: c.leads.length,
      };
    });

    return {
      data: formatted,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async checkDuplicate(phone: string) {
    if (!phone) return { exists: false, customer: null };

    // Standardize phone number comparison (e.g. trim whitespace and extract digits)
    const cleaned = phone.replace(/[^0-9]/g, '');
    const searchCondition = cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;

    const customer = await this.prisma.customer.findFirst({
      where: {
        OR: [
          { phone: { contains: searchCondition } },
          { alternatePhone: { contains: searchCondition } },
          { whatsappNumber: { contains: searchCondition } },
        ],
      },
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
        },
        callLogs: {
          orderBy: { startedAt: 'desc' },
          take: 3,
        },
        notesList: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    });

    if (!customer) {
      return { exists: false, customer: null };
    }

    const latestLead = customer.leads[0] || null;
    return {
      exists: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        alternatePhone: customer.alternatePhone,
        whatsappNumber: customer.whatsappNumber,
        email: customer.email,
        source: customer.source,
        notes: customer.notes,
        createdAt: customer.createdAt,
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
        totalLeads: customer.leads.length,
        leads: customer.leads.map((l) => ({
          id: l.id,
          status: l.status,
          priority: l.priority,
          source: l.source,
          createdAt: l.createdAt,
          requirement: l.requirement,
        })),
        recentCalls: customer.callLogs,
        recentNotes: customer.notesList,
      },
    };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        leads: {
          orderBy: { createdAt: 'desc' },
          include: {
            requirement: true,
            assignedUser: { select: { id: true, name: true, email: true } },
            followUps: { orderBy: { scheduledAt: 'asc' } },
            callLogs: { orderBy: { startedAt: 'desc' } },
            notes: {
              orderBy: { createdAt: 'desc' },
              include: { user: { select: { id: true, name: true } } },
            },
            siteVisits: {
              orderBy: { scheduledAt: 'desc' },
              include: { property: true },
            },
            bookings: {
              orderBy: { bookingDate: 'desc' },
              include: { property: true },
            },
          },
        },
        callLogs: {
          orderBy: { startedAt: 'desc' },
        },
        notesList: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true } } },
        },
        siteVisits: {
          orderBy: { scheduledAt: 'desc' },
          include: { property: true },
        },
        bookings: {
          orderBy: { bookingDate: 'desc' },
          include: { property: true },
        },
      },
    });

    if (!customer) throw new NotFoundException('Customer not found');

    // Build Chronological Timeline from actual database records
    const timelineEvents: Array<{
      id: string;
      type: 'CALL' | 'NOTE' | 'FOLLOW_UP' | 'SITE_VISIT' | 'BOOKING' | 'LEAD_CREATED' | 'STATUS_CHANGE';
      title: string;
      description?: string;
      timestamp: Date;
      metadata?: any;
    }> = [];

    // Customer created event
    timelineEvents.push({
      id: `cust-created-${customer.id}`,
      type: 'LEAD_CREATED',
      title: 'Customer Added to HYVORA CRM',
      description: `Source: ${customer.source}`,
      timestamp: customer.createdAt,
    });

    // Leads created
    for (const l of customer.leads) {
      timelineEvents.push({
        id: `lead-created-${l.id}`,
        type: 'LEAD_CREATED',
        title: `New Lead Created (${l.status})`,
        description: l.requirement
          ? `${l.requirement.bhk || ''} ${l.requirement.propertyType} in ${l.requirement.preferredLocation} • ₹${(
              (l.requirement.minBudget || 0) / 100000
            ).toFixed(0)}L - ₹${((l.requirement.maxBudget || 0) / 100000).toFixed(0)}L`
          : undefined,
        timestamp: l.createdAt,
        metadata: { leadId: l.id, status: l.status },
      });
    }

    // Call logs
    for (const call of customer.callLogs) {
      timelineEvents.push({
        id: `call-${call.id}`,
        type: 'CALL',
        title: `${call.direction === 'INCOMING' ? 'Incoming' : 'Outgoing'} Call Logged (${Math.floor(
          call.duration / 60,
        )}m ${call.duration % 60}s)`,
        description: call.notes || call.summary || undefined,
        timestamp: call.startedAt,
        metadata: { duration: call.duration, direction: call.direction },
      });
    }

    // Notes
    for (const note of customer.notesList) {
      timelineEvents.push({
        id: `note-${note.id}`,
        type: 'NOTE',
        title: `Note added by ${note.user?.name || 'Team Member'}`,
        description: note.content,
        timestamp: note.createdAt,
        metadata: { user: note.user?.name },
      });
    }

    // Follow-ups
    for (const lead of customer.leads) {
      for (const fu of lead.followUps) {
        timelineEvents.push({
          id: `followup-${fu.id}`,
          type: 'FOLLOW_UP',
          title: `Follow-up ${fu.status === 'COMPLETED' ? 'Completed' : 'Scheduled'} (${fu.type})`,
          description: fu.notes || undefined,
          timestamp: fu.completedAt || fu.scheduledAt,
          metadata: { type: fu.type, status: fu.status, scheduledAt: fu.scheduledAt },
        });
      }
    }

    // Site visits
    for (const sv of customer.siteVisits) {
      timelineEvents.push({
        id: `sv-${sv.id}`,
        type: 'SITE_VISIT',
        title: `Site Visit ${sv.status.toLowerCase()} for ${sv.property.title}`,
        description: sv.notes || `Location: ${sv.property.location}`,
        timestamp: sv.scheduledAt,
        metadata: { property: sv.property.title, status: sv.status },
      });
    }

    // Bookings
    for (const b of customer.bookings) {
      timelineEvents.push({
        id: `booking-${b.id}`,
        type: 'BOOKING',
        title: `Booking ${b.status}: ${b.property.title}`,
        description: `Booking Amount: ₹${b.bookingAmount.toLocaleString('en-IN')}`,
        timestamp: b.bookingDate,
        metadata: { amount: b.bookingAmount, status: b.status },
      });
    }

    // Sort timeline newest first
    timelineEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      ...customer,
      timeline: timelineEvents,
    };
  }

  async create(dto: CreateCustomerDto) {
    const existing = await this.prisma.customer.findUnique({
      where: { phone: dto.phone.trim() },
    });
    if (existing) {
      throw new ConflictException(`Customer with phone number ${dto.phone} already exists`);
    }

    return this.prisma.customer.create({
      data: {
        name: dto.name.trim(),
        phone: dto.phone.trim(),
        alternatePhone: dto.alternatePhone?.trim() || null,
        whatsappNumber: dto.whatsappNumber?.trim() || null,
        email: dto.email?.toLowerCase().trim() || null,
        source: dto.source || 'Phone',
        notes: dto.notes || null,
      },
    });
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');

    if (dto.phone && dto.phone.trim() !== customer.phone) {
      const existing = await this.prisma.customer.findUnique({
        where: { phone: dto.phone.trim() },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Phone ${dto.phone} is already used by customer ${existing.name}`);
      }
    }

    return this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.phone ? { phone: dto.phone.trim() } : {}),
        ...(dto.alternatePhone !== undefined ? { alternatePhone: dto.alternatePhone?.trim() || null } : {}),
        ...(dto.whatsappNumber !== undefined ? { whatsappNumber: dto.whatsappNumber?.trim() || null } : {}),
        ...(dto.email !== undefined ? { email: dto.email?.toLowerCase().trim() || null } : {}),
        ...(dto.source ? { source: dto.source } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });
  }

  async remove(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');
    return this.prisma.customer.delete({ where: { id } });
  }
}
