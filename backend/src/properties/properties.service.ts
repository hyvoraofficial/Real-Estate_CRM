import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto, UpdatePropertyDto } from './dto/create-property.dto';
import { PropertyStatus } from '@prisma/client';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: {
    search?: string;
    propertyType?: string;
    bhk?: string;
    location?: string;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) {
    const pageNum = Number(query?.page) > 0 ? Number(query?.page) : 1;
    const limitNum = Number(query?.limit) > 0 ? Number(query?.limit) : 50;
    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

    const {
      search,
      propertyType,
      bhk,
      location,
      status,
      minPrice,
      maxPrice,
      sortBy = 'createdAt_desc',
    } = query || {};

    const where: any = {};

    if (status) {
      where.status = status as PropertyStatus;
    }
    if (propertyType) {
      where.propertyType = { equals: propertyType, mode: 'insensitive' };
    }
    if (bhk) {
      where.bhk = { contains: bhk, mode: 'insensitive' };
    }
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }
    if (minPrice || maxPrice) {
      where.price = {
        ...(minPrice ? { gte: Number(minPrice) } : {}),
        ...(maxPrice ? { lte: Number(maxPrice) } : {}),
      };
    }

    if (search) {
      const clean = search.trim();
      where.OR = [
        { title: { contains: clean, mode: 'insensitive' } },
        { location: { contains: clean, mode: 'insensitive' } },
        { address: { contains: clean, mode: 'insensitive' } },
        { description: { contains: clean, mode: 'insensitive' } },
        { bhk: { contains: clean, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'price_asc') orderBy = { price: 'asc' };
    if (sortBy === 'price_desc') orderBy = { price: 'desc' };
    if (sortBy === 'area_asc') orderBy = { area: 'asc' };
    if (sortBy === 'area_desc') orderBy = { area: 'desc' };

    const [total, properties] = await Promise.all([
      this.prisma.property.count({ where }),
      this.prisma.property.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          images: {
            orderBy: { sortOrder: 'asc' },
          },
          _count: {
            select: {
              siteVisits: true,
              bookings: true,
            },
          },
        },
      }),
    ]);

    return {
      data: properties,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        siteVisits: {
          orderBy: { scheduledAt: 'desc' },
          include: {
            customer: true,
            lead: true,
          },
        },
        bookings: {
          orderBy: { bookingDate: 'desc' },
          include: {
            customer: true,
            lead: true,
          },
        },
      },
    });

    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async create(dto: CreatePropertyDto) {
    const { images, ...rest } = dto;
    return this.prisma.property.create({
      data: {
        ...rest,
        images: images && images.length > 0
          ? {
              create: images.map((url, idx) => ({ imageUrl: url, sortOrder: idx })),
            }
          : undefined,
      },
      include: {
        images: true,
      },
    });
  }

  async update(id: string, dto: UpdatePropertyDto) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');

    const { images, ...rest } = dto;

    if (images !== undefined) {
      // Re-assign images
      await this.prisma.propertyImage.deleteMany({ where: { propertyId: id } });
      if (images.length > 0) {
        await this.prisma.propertyImage.createMany({
          data: images.map((url, idx) => ({ propertyId: id, imageUrl: url, sortOrder: idx })),
        });
      }
    }

    return this.prisma.property.update({
      where: { id },
      data: rest,
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async remove(id: string) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');
    return this.prisma.property.delete({ where: { id } });
  }

  // Deterministic Matching against a specific Lead's Requirement
  async matchForLead(leadId: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: { requirement: true },
    });
    if (!lead || !lead.requirement) {
      throw new NotFoundException('Lead or Requirement not found');
    }

    const req = lead.requirement;
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
        score += 20;
      }

      // 3. Property Type match (20 points)
      if (req.propertyType && prop.propertyType) {
        const reqType = req.propertyType.toLowerCase().trim();
        const propType = prop.propertyType.toLowerCase().trim();
        if (reqType === propType) {
          score += 20;
          matchFactors.push(`Matching Type (${prop.propertyType})`);
        } else if (
          (reqType !== 'other' && propType !== 'other') &&
          (propType.includes(reqType) || reqType.includes(propType))
        ) {
          score += 15;
          matchFactors.push(`Compatible Type (${prop.propertyType})`);
        }
      }

      // 4. Budget fit (15 points)
      if (req.maxBudget) {
        const min = req.minBudget || req.maxBudget * 0.7;
        const max = req.maxBudget * 1.15;
        if (prop.price >= min && prop.price <= req.maxBudget) {
          score += 15;
          matchFactors.push(`Within Budget Range`);
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

      return {
        ...prop,
        matchPercentage: Math.min(100, Math.max(0, score)),
        matchFactors,
      };
    });

    return scored
      .filter((p) => p.matchPercentage >= 30)
      .sort((a, b) => b.matchPercentage - a.matchPercentage);
  }
}
