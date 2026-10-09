import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCallDto } from './dto/create-call.dto';
import { CallDirection } from '@prisma/client';

@Injectable()
export class CallsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { customerId?: string; leadId?: string; page?: number; limit?: number }) {
    const pageNum = Number(query?.page) > 0 ? Number(query?.page) : 1;
    const limitNum = Number(query?.limit) > 0 ? Number(query?.limit) : 50;
    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

    const { customerId, leadId } = query || {};

    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (leadId) where.leadId = leadId;

    const [total, calls] = await Promise.all([
      this.prisma.callLog.count({ where }),
      this.prisma.callLog.findMany({
        where,
        skip,
        take,
        orderBy: { startedAt: 'desc' },
        include: {
          customer: true,
          lead: {
            include: { requirement: true },
          },
        },
      }),
    ]);

    return {
      data: calls,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async create(dto: CreateCallDto) {
    const cleanPhone = dto.phoneNumber.trim();
    let customerId = dto.customerId;
    let leadId = dto.leadId;

    if (!customerId) {
      const cleanDigits = cleanPhone.replace(/[^0-9]/g, '');
      const searchCondition = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;

      let customer = await this.prisma.customer.findFirst({
        where: {
          OR: [
            { phone: { contains: searchCondition } },
            { alternatePhone: { contains: searchCondition } },
            { whatsappNumber: { contains: searchCondition } },
          ],
        },
        include: {
          leads: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });

      if (!customer) {
        customer = await this.prisma.customer.create({
          data: {
            name: dto.customerName?.trim() || `Caller ${cleanDigits.slice(-4) || 'Client'}`,
            phone: cleanPhone,
            source: 'Phone',
          },
          include: {
            leads: true,
          },
        });
      }

      customerId = customer.id;
      if (!leadId && customer.leads.length > 0) {
        leadId = customer.leads[0].id;
      }
    }

    return this.prisma.callLog.create({
      data: {
        customerId,
        leadId: leadId || null,
        phoneNumber: cleanPhone,
        direction: dto.direction || CallDirection.INCOMING,
        startedAt: new Date(),
        duration: dto.duration || 0,
        notes: dto.notes,
        summary: dto.summary || (dto.notes ? dto.notes.slice(0, 100) : 'Call recorded'),
      },
      include: {
        customer: true,
        lead: true,
      },
    });
  }

  // Future Telephony Webhook Interface
  async handleTelephonyWebhook(payload: {
    callerNumber: string;
    direction: 'INCOMING' | 'OUTGOING';
    duration?: number;
    recordingUrl?: string;
  }) {
    const cleanNumber = payload.callerNumber.replace(/[^0-9]/g, '');
    const searchCondition = cleanNumber.length >= 10 ? cleanNumber.slice(-10) : cleanNumber;

    let customer = await this.prisma.customer.findFirst({
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
          take: 1,
        },
      },
    });

    let isNewCustomer = false;

    if (!customer) {
      isNewCustomer = true;
      customer = await this.prisma.customer.create({
        data: {
          name: `Caller ${cleanNumber.slice(-4)}`,
          phone: payload.callerNumber,
          source: 'Phone',
        },
        include: {
          leads: true,
        },
      });
    }

    const latestLead = customer.leads[0] || null;

    const callLog = await this.prisma.callLog.create({
      data: {
        customerId: customer.id,
        leadId: latestLead?.id || null,
        phoneNumber: payload.callerNumber,
        direction: payload.direction === 'OUTGOING' ? CallDirection.OUTGOING : CallDirection.INCOMING,
        startedAt: new Date(),
        duration: payload.duration || 0,
        recordingUrl: payload.recordingUrl || null,
      },
    });

    return {
      success: true,
      isNewCustomer,
      customerId: customer.id,
      customerName: customer.name,
      callLogId: callLog.id,
    };
  }
}
