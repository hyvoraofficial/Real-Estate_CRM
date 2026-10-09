import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('notes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotesController {
  constructor(private notesService: NotesService) {}

  @Get()
  async findAll(@Query('customerId') customerId?: string, @Query('leadId') leadId?: string) {
    return this.notesService.findAll({ customerId, leadId });
  }

  @Post()
  async create(@Body() dto: CreateNoteDto, @CurrentUser('id') userId: string) {
    return this.notesService.create(dto, userId);
  }
}
