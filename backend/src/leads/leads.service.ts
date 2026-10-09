import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto, UpdateLeadDto } from './dto/create-lead.dto';
import { FollowUpStatus, FollowUpType, LeadPriority, LeadStatus } from '@prisma/client';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: {
    search?: string;
    status?: string;
    priority?: string;
    source?: string;
    assignedUserId?: string;
    location?: string;
    page?: number;
    limit?: number;
  }) {
    const pageNum = Number(query?.page) > 0 ? Number(query?.page) : 1;
    const limitNum = Number(query?.limit) > 0 ? Number(query?.limit) : 50;
    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

    const { search, status, priority, source, assignedUserId, location } = query || {};

    const where: any = {};

    if (status) {
      where.status = status as LeadStatus;
    }
    if (priority) {
      where.priority = priority as LeadPriority;
    }
    if (source) {
      where.source = { equals: source, mode: 'insensitive' };
    }
    if (assignedUserId) {
      where.assignedUserId = assignedUserId;
    }

    if (search) {
      const cleanSearch = search.trim();
      where.OR = [
        { customer: { name: { contains: cleanSearch, mode: 'insensitive' } } },
        { customer: { phone: { contains: cleanSearch, mode: 'insensitive' } } },
        { customer: { email: { contains: cleanSearch, mode: 'insensitive' } } },
        { requirement: { preferredLocation: { contains: cleanSearch, mode: 'insensitive' } } },
        { requirement: { bhk: { contains: cleanSearch, mode: 'insensitive' } } },
        { requirement: { propertyType: { contains: cleanSearch, mode: 'insensitive' } } },
      ];
    }

    if (location) {
      where.requirement = {
        ...where.requirement,
        preferredLocation: { contains: location, mode: 'insensitive' },
      };
    }

    const [total, leads] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        include: {
          customer: true,
          requirement: true,
          assignedUser: {
            select: { id: true, name: true, email: true },
          },
          followUps: {
            where: { status: 'PENDING' },
            orderBy: { scheduledAt: 'asc' },
            take: 1,
          },
          _count: {
            select: {
              callLogs: true,
              notes: true,
              siteVisits: true,
            },
          },
        },
      }),
    ]);

    const formatted = leads.map((l) => ({
      id: l.id,
      status: l.status,
      priority: l.priority,
      source: l.source,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
      customer: l.customer,
      requirement: l.requirement,
      assignedUser: l.assignedUser,
      nextFollowUp: l.followUps[0] || null,
      stats: {
        calls: l._count.callLogs,
        notes: l._count.notes,
        siteVisits: l._count.siteVisits,
      },
    }));

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

  async getPipeline(assignedUserId?: string) {
    const statuses: LeadStatus[] = [
      LeadStatus.NEW,
      LeadStatus.CONTACTED,
      LeadStatus.REQUIREMENT_COLLECTED,
      LeadStatus.PROPERTY_SHARED,
      LeadStatus.SITE_VISIT,
      LeadStatus.NEGOTIATION,
      LeadStatus.BOOKED,
      LeadStatus.LOST,
    ];

    const where: any = {};
    if (assignedUserId) {
      where.assignedUserId = assignedUserId;
    }

    const allLeads = await this.prisma.lead.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
      include: {
        customer: true,
        requirement: true,
        assignedUser: {
          select: { id: true, name: true },
        },
        followUps: {
          where: { status: 'PENDING' },
          orderBy: { scheduledAt: 'asc' },
          take: 1,
        },
      },
    });

    const pipeline: Record<
      LeadStatus,
      {
        leads: any[];
        count: number;
        totalPotentialValue: number;
      }
    > = {} as any;

    for (const s of statuses) {
      pipeline[s] = { leads: [], count: 0, totalPotentialValue: 0 };
    }

    for (const lead of allLeads) {
      if (pipeline[lead.status]) {
        const item = {
          id: lead.id,
          status: lead.status,
          priority: lead.priority,
          source: lead.source,
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt,
          customer: {
            id: lead.customer.id,
            name: lead.customer.name,
            phone: lead.customer.phone,
          },
          requirement: lead.requirement,
          assignedUser: lead.assignedUser,
          nextFollowUp: lead.followUps[0] || null,
        };
        pipeline[lead.status].leads.push(item);
        pipeline[lead.status].count += 1;
        if (lead.requirement?.maxBudget) {
          pipeline[lead.status].totalPotentialValue += lead.requirement.maxBudget;
        }
      }
    }

    return pipeline;
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            leads: {
              where: { NOT: { id } },
              include: { requirement: true },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        requirement: true,
        assignedUser: {
          select: { id: true, name: true, email: true, phone: true },
        },
        followUps: {
          orderBy: { scheduledAt: 'asc' },
          include: {
            assignedUser: { select: { id: true, name: true } },
          },
        },
        callLogs: {
          orderBy: { startedAt: 'desc' },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        siteVisits: {
          orderBy: { scheduledAt: 'desc' },
          include: {
            property: true,
          },
        },
        bookings: {
          orderBy: { bookingDate: 'desc' },
          include: {
            property: true,
          },
        },
      },
    });

    if (!lead) throw new NotFoundException('Lead not found');

    // Deterministic Property Matching for this Lead
    let matchedProperties: any[] = [];
    if (lead.requirement) {
      matchedProperties = await this.matchPropertiesForRequirement(lead.requirement);
    }

    // Build Chronological Timeline for this lead from real database events
    const timelineEvents: Array<{
      id: string;
      type: 'CALL' | 'NOTE' | 'FOLLOW_UP' | 'SITE_VISIT' | 'BOOKING' | 'LEAD_CREATED' | 'REQUIREMENT_RECORDED';
      title: string;
      description?: string;
      timestamp: Date;
      metadata?: any;
    }> = [];

    // Lead created event
    timelineEvents.push({
      id: `lead-created-${lead.id}`,
      type: 'LEAD_CREATED',
      title: `Lead Created (${lead.status})`,
      description: `Source: ${lead.source} • Assigned to ${lead.assignedUser?.name || 'Unassigned'}`,
      timestamp: lead.createdAt,
    });

    // Requirement recorded
    if (lead.requirement) {
      timelineEvents.push({
        id: `req-${lead.requirement.id}`,
        type: 'REQUIREMENT_RECORDED',
        title: 'Property Requirement Recorded',
        description: `${lead.requirement.bhk || ''} ${lead.requirement.propertyType} in ${
          lead.requirement.preferredLocation
        } • ₹${((lead.requirement.minBudget || 0) / 100000).toFixed(0)}L - ₹${(
          (lead.requirement.maxBudget || 0) / 100000
        ).toFixed(0)}L (${lead.requirement.purpose})`,
        timestamp: lead.requirement.createdAt,
      });
    }

    // Call logs
    for (const call of lead.callLogs) {
      timelineEvents.push({
        id: `call-${call.id}`,
        type: 'CALL',
        title: `${call.direction === 'INCOMING' ? 'Incoming' : 'Outgoing'} Call (${Math.floor(
          call.duration / 60,
        )}m ${call.duration % 60}s)`,
        description: call.notes || call.summary || undefined,
        timestamp: call.startedAt,
        metadata: { duration: call.duration, direction: call.direction },
      });
    }

    // Notes
    for (const note of lead.notes) {
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
    for (const fu of lead.followUps) {
      timelineEvents.push({
        id: `fu-${fu.id}`,
        type: 'FOLLOW_UP',
        title: `Follow-up ${fu.status === 'COMPLETED' ? 'Completed' : 'Scheduled'} (${fu.type})`,
        description: fu.notes || undefined,
        timestamp: fu.completedAt || fu.scheduledAt,
        metadata: { type: fu.type, status: fu.status, scheduledAt: fu.scheduledAt },
      });
    }

    // Site Visits
    for (const sv of lead.siteVisits) {
      timelineEvents.push({
        id: `sv-${sv.id}`,
        type: 'SITE_VISIT',
        title: `Site Visit ${sv.status.toLowerCase()} for ${sv.property.title}`,
        description: sv.notes || undefined,
        timestamp: sv.scheduledAt,
        metadata: { property: sv.property.title, status: sv.status },
      });
    }

    // Bookings
    for (const b of lead.bookings) {
      timelineEvents.push({
        id: `b-${b.id}`,
        type: 'BOOKING',
        title: `Booking ${b.status}: ${b.property.title}`,
        description: `Booking Amount: ₹${b.bookingAmount.toLocaleString('en-IN')}`,
        timestamp: b.bookingDate,
        metadata: { amount: b.bookingAmount, status: b.status },
      });
    }

    timelineEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      ...lead,
      matchedProperties,
      timeline: timelineEvents,
    };
  }

  // Quick Add Lead (Feature #19) - Super-fast lead ingestion in 20-30 seconds
  async create(dto: CreateLeadDto, currentUserId?: string) {
    const cleanPhone = dto.phone.trim();
    if (!cleanPhone) {
      throw new BadRequestException('Phone number is required');
    }

    // 1. Find or create Customer
    let customer = await this.prisma.customer.findUnique({
      where: { phone: cleanPhone },
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          name: dto.customerName.trim(),
          phone: cleanPhone,
          alternatePhone: dto.alternatePhone?.trim() || null,
          whatsappNumber: dto.whatsappNumber?.trim() || cleanPhone,
          email: dto.email?.toLowerCase().trim() || null,
          source: dto.source || 'Phone',
          notes: dto.notes || null,
        },
      });
    } else {
      // Update customer name/details if missing
      await this.prisma.customer.update({
        where: { id: customer.id },
        data: {
          ...(dto.alternatePhone && !customer.alternatePhone ? { alternatePhone: dto.alternatePhone.trim() } : {}),
          ...(dto.whatsappNumber && !customer.whatsappNumber ? { whatsappNumber: dto.whatsappNumber.trim() } : {}),
          ...(dto.email && !customer.email ? { email: dto.email.toLowerCase().trim() } : {}),
        },
      });
    }

    // 2. Determine assigned salesperson
    const assignedUserId = dto.assignedUserId || currentUserId || null;

    // 3. Create Lead with Requirement
    const lead = await this.prisma.lead.create({
      data: {
        customerId: customer.id,
        assignedUserId,
        status: dto.status || LeadStatus.REQUIREMENT_COLLECTED,
        priority: dto.priority || LeadPriority.HIGH,
        source: dto.source || 'Phone',
        requirement: {
          create: {
            propertyType: dto.propertyType || 'Apartment',
            bhk: dto.bhk || null,
            preferredLocation: dto.preferredLocation.trim(),
            minBudget: dto.minBudget ? Number(dto.minBudget) : null,
            maxBudget: dto.maxBudget ? Number(dto.maxBudget) : null,
            minArea: dto.minArea ? Number(dto.minArea) : null,
            maxArea: dto.maxArea ? Number(dto.maxArea) : null,
            purpose: dto.purpose || 'Buying',
            possessionPreference: dto.possessionPreference || null,
            furnishingPreference: dto.furnishingPreference || null,
            notes: dto.notes || null,
          },
        },
      },
      include: {
        customer: true,
        requirement: true,
        assignedUser: { select: { id: true, name: true } },
      },
    });

    // 4. If follow-up date is provided, create initial Follow-up
    if (dto.followUpDate) {
      let scheduledAt: Date;
      if (dto.followUpTime) {
        scheduledAt = new Date(`${dto.followUpDate}T${dto.followUpTime}:00`);
      } else {
        scheduledAt = new Date(`${dto.followUpDate}T11:00:00`);
      }

      if (!isNaN(scheduledAt.getTime())) {
        await this.prisma.followUp.create({
          data: {
            leadId: lead.id,
            assignedUserId,
            scheduledAt,
            type: (dto.followUpType as FollowUpType) || FollowUpType.CALL,
            status: FollowUpStatus.PENDING,
            notes:
              dto.followUpNotes ||
              `Follow-up call with ${dto.customerName} regarding ${dto.bhk || ''} ${dto.propertyType} in ${dto.preferredLocation}`,
          },
        });
      }
    }

    // 5. If notes provided, record note and initial incoming call log
    if (dto.notes) {
      await this.prisma.note.create({
        data: {
          customerId: customer.id,
          leadId: lead.id,
          userId: currentUserId || assignedUserId,
          content: dto.notes,
        },
      });

      // Log initial incoming call record
      await this.prisma.callLog.create({
        data: {
          customerId: customer.id,
          leadId: lead.id,
          phoneNumber: cleanPhone,
          direction: 'INCOMING',
          duration: 120, // default estimate 2 mins
          notes: dto.notes,
          summary: `Initial call: ${dto.bhk || ''} ${dto.propertyType} in ${dto.preferredLocation}`,
        },
      });
    }

    return lead;
  }

  async update(id: string, dto: UpdateLeadDto) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: { requirement: true },
    });
    if (!lead) throw new NotFoundException('Lead not found');

    // Update customer info if passed
    if (dto.customerName || dto.phone || dto.whatsappNumber !== undefined || dto.email !== undefined) {
      await this.prisma.customer.update({
        where: { id: lead.customerId },
        data: {
          ...(dto.customerName ? { name: dto.customerName.trim() } : {}),
          ...(dto.phone ? { phone: dto.phone.trim() } : {}),
          ...(dto.whatsappNumber !== undefined ? { whatsappNumber: dto.whatsappNumber?.trim() || null } : {}),
          ...(dto.email !== undefined ? { email: dto.email?.trim() || null } : {}),
        },
      });
    }

    const updatedLead = await this.prisma.lead.update({
      where: { id },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.priority ? { priority: dto.priority } : {}),
        ...(dto.source ? { source: dto.source } : {}),
        ...(dto.assignedUserId !== undefined ? { assignedUserId: dto.assignedUserId } : {}),
      },
      include: {
        customer: true,
        requirement: true,
        assignedUser: { select: { id: true, name: true } },
      },
    });

    if (dto.requirement) {
      if (lead.requirement) {
        await this.prisma.requirement.update({
          where: { id: lead.requirement.id },
          data: {
            ...(dto.requirement.propertyType ? { propertyType: dto.requirement.propertyType } : {}),
            ...(dto.requirement.bhk !== undefined ? { bhk: dto.requirement.bhk } : {}),
            ...(dto.requirement.preferredLocation ? { preferredLocation: dto.requirement.preferredLocation } : {}),
            ...(dto.requirement.minBudget !== undefined ? { minBudget: dto.requirement.minBudget ? Number(dto.requirement.minBudget) : null } : {}),
            ...(dto.requirement.maxBudget !== undefined ? { maxBudget: dto.requirement.maxBudget ? Number(dto.requirement.maxBudget) : null } : {}),
            ...(dto.requirement.minArea !== undefined ? { minArea: dto.requirement.minArea ? Number(dto.requirement.minArea) : null } : {}),
            ...(dto.requirement.maxArea !== undefined ? { maxArea: dto.requirement.maxArea ? Number(dto.requirement.maxArea) : null } : {}),
            ...(dto.requirement.purpose ? { purpose: dto.requirement.purpose } : {}),
            ...(dto.requirement.possessionPreference !== undefined ? { possessionPreference: dto.requirement.possessionPreference } : {}),
            ...(dto.requirement.furnishingPreference !== undefined ? { furnishingPreference: dto.requirement.furnishingPreference } : {}),
            ...(dto.requirement.notes !== undefined ? { notes: dto.requirement.notes } : {}),
          },
        });
      } else if (dto.requirement.preferredLocation || dto.requirement.propertyType) {
        await this.prisma.requirement.create({
          data: {
            leadId: lead.id,
            propertyType: dto.requirement.propertyType || 'Apartment',
            bhk: dto.requirement.bhk || null,
            preferredLocation: dto.requirement.preferredLocation || 'Any',
            minBudget: dto.requirement.minBudget ? Number(dto.requirement.minBudget) : null,
            maxBudget: dto.requirement.maxBudget ? Number(dto.requirement.maxBudget) : null,
            minArea: dto.requirement.minArea ? Number(dto.requirement.minArea) : null,
            maxArea: dto.requirement.maxArea ? Number(dto.requirement.maxArea) : null,
            purpose: dto.requirement.purpose || 'Buying',
            possessionPreference: dto.requirement.possessionPreference || null,
            furnishingPreference: dto.requirement.furnishingPreference || null,
            notes: dto.requirement.notes || null,
          },
        });
      }
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');
    return this.prisma.lead.delete({ where: { id } });
  }

  async bulkRemove(ids: string[]) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('No lead IDs provided for deletion');
    }
    const result = await this.prisma.lead.deleteMany({
      where: {
        id: { in: ids },
      },
    });
    return { deletedCount: result.count };
  }

  // Deterministic Property Matching Engine
  async matchPropertiesForRequirement(req: {
    propertyType: string;
    bhk?: string | null;
    preferredLocation: string;
    minBudget?: number | null;
    maxBudget?: number | null;
    possessionPreference?: string | null;
  }) {
    const properties = await this.prisma.property.findMany({
      where: {
        status: { in: ['AVAILABLE', 'RESERVED'] },
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
      },
    });

    const scored = properties.map((prop) => {
      let score = 0;
      const matchFactors: string[] = [];

      // 1. Location match (35 points)
      const reqLoc = (req.preferredLocation || '').toLowerCase().trim();
      const propLoc = (prop.location || '').toLowerCase().trim();
      const propAddr = (prop.address || '').toLowerCase();

      if (propLoc.includes(reqLoc) || reqLoc.includes(propLoc)) {
        score += 35;
        matchFactors.push(`Direct Location Match (${prop.location})`);
      } else if (propAddr.includes(reqLoc)) {
        score += 25;
        matchFactors.push(`Near Preferred Location`);
      }

      // 2. BHK match (25 points)
      if (req.bhk && prop.bhk) {
        const reqBhk = req.bhk.toLowerCase().replace(/\s/g, '');
        const propBhk = prop.bhk.toLowerCase().replace(/\s/g, '');
        if (reqBhk === propBhk) {
          score += 25;
          matchFactors.push(`Exact BHK (${prop.bhk})`);
        } else if (
          (reqBhk.includes('2') && propBhk.includes('2.5')) ||
          (reqBhk.includes('3') && propBhk.includes('2.5'))
        ) {
          score += 15;
          matchFactors.push(`Compatible BHK (${prop.bhk})`);
        }
      } else if (!req.bhk) {
        score += 20; // no specific BHK requirement
      }

      // 3. Property Type match (20 points)
      if (req.propertyType && prop.propertyType) {
        if (req.propertyType.toLowerCase() === prop.propertyType.toLowerCase()) {
          score += 20;
          matchFactors.push(`Matching Type (${prop.propertyType})`);
        }
      }

      // 4. Budget fit (15 points)
      if (req.maxBudget) {
        const min = req.minBudget || req.maxBudget * 0.7;
        const max = req.maxBudget * 1.15; // 15% buffer
        if (prop.price >= min && prop.price <= req.maxBudget) {
          score += 15;
          matchFactors.push(`Within Exact Budget Range`);
        } else if (prop.price > req.maxBudget && prop.price <= max) {
          score += 8;
          matchFactors.push(`Slightly Above Budget (<15%)`);
        }
      } else {
        score += 10;
      }

      // 5. Possession match (5 points)
      if (req.possessionPreference && prop.possession) {
        if (req.possessionPreference.toLowerCase() === prop.possession.toLowerCase()) {
          score += 5;
          matchFactors.push(`Matching Possession (${prop.possession})`);
        }
      }

      const matchPercentage = Math.min(100, Math.max(0, score));

      return {
        ...prop,
        matchPercentage,
        matchFactors,
      };
    });

    // Sort by match score descending and return only items with >= 30% score
    return scored
      .filter((p) => p.matchPercentage >= 30)
      .sort((a, b) => b.matchPercentage - a.matchPercentage);
  }
}
