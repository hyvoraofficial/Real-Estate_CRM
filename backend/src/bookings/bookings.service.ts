import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto, UpdateBookingDto } from './dto/create-booking.dto';
import { BookingStatus, LeadStatus, PropertyStatus } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { status?: string; leadId?: string; propertyId?: string; customerId?: string }) {
    const { status, leadId, propertyId, customerId } = query || {};
    const where: any = {};
    if (status) where.status = status as BookingStatus;
    if (leadId) where.leadId = leadId;
    if (propertyId) where.propertyId = propertyId;
    if (customerId) where.customerId = customerId;

    return this.prisma.booking.findMany({
      where,
      orderBy: { bookingDate: 'desc' },
      include: {
        customer: true,
        property: true,
        lead: {
          include: {
            assignedUser: { select: { id: true, name: true } },
            requirement: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        property: { include: { images: true } },
        lead: {
          include: {
            assignedUser: { select: { id: true, name: true, email: true } },
            requirement: true,
          },
        },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async create(dto: CreateBookingDto) {
    const lead = await this.prisma.lead.findUnique({ where: { id: dto.leadId } });
    if (!lead) throw new NotFoundException('Lead not found');

    const customerId = dto.customerId || lead.customerId;
    const status = dto.status || BookingStatus.CONFIRMED;

    // Create booking
    const booking = await this.prisma.booking.create({
      data: {
        leadId: dto.leadId,
        customerId,
        propertyId: dto.propertyId,
        bookingAmount: Number(dto.bookingAmount),
        bookingDate: dto.bookingDate ? new Date(dto.bookingDate) : new Date(),
        status,
        notes: dto.notes,
      },
      include: {
        customer: true,
        property: true,
        lead: true,
      },
    });

    // If confirmed, update Lead status to BOOKED and Property status to RESERVED
    if (status === BookingStatus.CONFIRMED) {
      await this.prisma.lead.update({
        where: { id: dto.leadId },
        data: { status: LeadStatus.BOOKED },
      });
      await this.prisma.property.update({
        where: { id: dto.propertyId },
        data: { status: PropertyStatus.RESERVED },
      });
    }

    return booking;
  }

  async update(id: string, dto: UpdateBookingDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        ...(dto.bookingAmount !== undefined ? { bookingAmount: Number(dto.bookingAmount) } : {}),
        ...(dto.bookingDate ? { bookingDate: new Date(dto.bookingDate) } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
      include: {
        customer: true,
        property: true,
        lead: true,
      },
    });

    if (dto.status === BookingStatus.CONFIRMED) {
      await this.prisma.lead.update({
        where: { id: booking.leadId },
        data: { status: LeadStatus.BOOKED },
      });
    }

    return updated;
  }
}
