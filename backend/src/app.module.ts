import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CustomersModule } from './customers/customers.module';
import { LeadsModule } from './leads/leads.module';
import { RequirementsModule } from './requirements/requirements.module';
import { PropertiesModule } from './properties/properties.module';
import { FollowupsModule } from './followups/followups.module';
import { CallsModule } from './calls/calls.module';
import { NotesModule } from './notes/notes.module';
import { SiteVisitsModule } from './site-visits/site-visits.module';
import { BookingsModule } from './bookings/bookings.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { SearchModule } from './search/search.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CustomersModule,
    LeadsModule,
    RequirementsModule,
    PropertiesModule,
    FollowupsModule,
    CallsModule,
    NotesModule,
    SiteVisitsModule,
    BookingsModule,
    DashboardModule,
    ReportsModule,
    SearchModule,
    AiModule,
  ],
})
export class AppModule {}
