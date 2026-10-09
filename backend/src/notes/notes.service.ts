import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { customerId?: string; leadId?: string }) {
    const { customerId, leadId } = query || {};
    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (leadId) where.leadId = leadId;

    return this.prisma.note.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async create(dto: CreateNoteDto, userId?: string) {
    if (!dto.customerId && !dto.leadId) {
      throw new BadRequestException('Either customerId or leadId must be provided');
    }

    let customerId = dto.customerId;
    if (!customerId && dto.leadId) {
      const lead = await this.prisma.lead.findUnique({
        where: { id: dto.leadId },
        select: { customerId: true },
      });
      customerId = lead?.customerId;
    }

    return this.prisma.note.create({
      data: {
        customerId,
        leadId: dto.leadId || null,
        userId: userId || null,
        content: dto.content,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }
}
