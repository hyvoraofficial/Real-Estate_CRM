import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateRequirementDto } from './dto/update-requirement.dto';

@Injectable()
export class RequirementsService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const req = await this.prisma.requirement.findUnique({
      where: { id },
      include: {
        lead: {
          include: { customer: true },
        },
      },
    });
    if (!req) throw new NotFoundException('Requirement not found');
    return req;
  }

  async update(id: string, dto: UpdateRequirementDto) {
    const req = await this.prisma.requirement.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Requirement not found');

    return this.prisma.requirement.update({
      where: { id },
      data: {
        ...(dto.propertyType ? { propertyType: dto.propertyType } : {}),
        ...(dto.bhk !== undefined ? { bhk: dto.bhk } : {}),
        ...(dto.preferredLocation ? { preferredLocation: dto.preferredLocation.trim() } : {}),
        ...(dto.minBudget !== undefined ? { minBudget: dto.minBudget ? Number(dto.minBudget) : null } : {}),
        ...(dto.maxBudget !== undefined ? { maxBudget: dto.maxBudget ? Number(dto.maxBudget) : null } : {}),
        ...(dto.minArea !== undefined ? { minArea: dto.minArea ? Number(dto.minArea) : null } : {}),
        ...(dto.maxArea !== undefined ? { maxArea: dto.maxArea ? Number(dto.maxArea) : null } : {}),
        ...(dto.purpose ? { purpose: dto.purpose } : {}),
        ...(dto.possessionPreference !== undefined ? { possessionPreference: dto.possessionPreference } : {}),
        ...(dto.furnishingPreference !== undefined ? { furnishingPreference: dto.furnishingPreference } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });
  }
}
