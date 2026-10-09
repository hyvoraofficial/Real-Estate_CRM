import { PrismaClient, UserRole, LeadStatus, LeadPriority, CallDirection, FollowUpType, FollowUpStatus, PropertyStatus, SiteVisitStatus, BookingStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting HYVORA Real Estate CRM Seed...');

  // Clean existing records in reverse dependency order
  await prisma.booking.deleteMany();
  await prisma.siteVisit.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.callLog.deleteMany();
  await prisma.note.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.propertyImage.deleteMany();
  await prisma.property.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'Rajesh Sharma',
      email: 'admin@hyvora.com',
      phone: '+91 9845012345',
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const sales1 = await prisma.user.create({
    data: {
      name: 'Vikram Reddy',
      email: 'vikram@hyvora.com',
      phone: '+91 9845023456',
      passwordHash,
      role: UserRole.SALES_EXECUTIVE,
      isActive: true,
    },
  });

  const sales2 = await prisma.user.create({
    data: {
      name: 'Sneha Patil',
      email: 'sneha@hyvora.com',
      phone: '+91 9845034567',
      passwordHash,
      role: UserRole.SALES_EXECUTIVE,
      isActive: true,
    },
  });

  const sales3 = await prisma.user.create({
    data: {
      name: 'Kiran Rao',
      email: 'kiran@hyvora.com',
      phone: '+91 9845045678',
      passwordHash,
      role: UserRole.SALES_EXECUTIVE,
      isActive: true,
    },
  });

  const usersList = [admin, sales1, sales2, sales3];

  console.log('✅ Users created: Admin + 3 Sales Executives');

  // 2. Create 15 Properties
  const propertiesData = [
    {
      title: 'Prestige Lakeside Habitat - Premium 2 BHK',
      propertyType: 'Apartment',
      bhk: '2 BHK',
      location: 'Whitefield',
      address: 'Varthur Main Road, Near Prestige Lake, Whitefield, Bengaluru',
      price: 7800000,
      area: 1215,
      furnishing: 'Semi Furnished',
      possession: 'Ready to Move',
      description: 'Stunning pool-facing 2 BHK flat on 12th floor with modular kitchen, premium fittings and covered car parking.',
      status: PropertyStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Sobha Dream Acres - Compact 2 BHK',
      propertyType: 'Apartment',
      bhk: '2 BHK',
      location: 'Electronic City',
      address: 'Phase 1, Doddathogur, Electronic City, Bengaluru',
      price: 6800000,
      area: 1010,
      furnishing: 'Ready to Move',
      possession: 'Ready to Move',
      description: 'Well-ventilated unit near major IT tech parks (Infosys, Wipro). Clubhouse and sports facilities.',
      status: PropertyStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Brigade Cornerstone Utopia - Luxury 3 BHK',
      propertyType: 'Apartment',
      bhk: '3 BHK',
      location: 'Sarjapur Road',
      address: 'Varthur Road, Gunjur, Bengaluru',
      price: 13500000,
      area: 1680,
      furnishing: 'Unfurnished',
      possession: 'Within 3 Months',
      description: 'Integrated smart-township apartment with world-class amenities, high floor garden view.',
      status: PropertyStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Godrej Palm Retreat - 3 BHK Luxury Villa',
      propertyType: 'Villa',
      bhk: '3 BHK',
      location: 'Sarjapur Road',
      address: 'Hadosiddapura, Sarjapur Main Road, Bengaluru',
      price: 24500000,
      area: 2800,
      furnishing: 'Semi Furnished',
      possession: 'Ready to Move',
      description: 'Gated community triplex villa with private terrace, personal lawn, and 2-car garage.',
      status: PropertyStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Assetz Marq 3.0 - High Rise 3 BHK',
      propertyType: 'Apartment',
      bhk: '3 BHK',
      location: 'Whitefield',
      address: 'Kannamangala, Whitefield Hoskote Road, Bengaluru',
      price: 11500000,
      area: 1560,
      furnishing: 'Semi Furnished',
      possession: 'Ready to Move',
      description: 'Modern open layout with expansive balconies overlooking central park greenery.',
      status: PropertyStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Salarpuria Sattva Greenage - 3 BHK',
      propertyType: 'Apartment',
      bhk: '3 BHK',
      location: 'Electronic City',
      address: 'Hosur Road, Bommanahalli / EC Gateway, Bengaluru',
      price: 14000000,
      area: 1850,
      furnishing: 'Fully Furnished',
      possession: 'Ready to Move',
      description: 'Fully furnished luxury apartment with Italian marble, home theater setup, premium clubhouse.',
      status: PropertyStatus.RESERVED,
      imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Puravankara Atmosphere - 2 BHK',
      propertyType: 'Apartment',
      bhk: '2 BHK',
      location: 'Hebbal',
      address: 'Near Bellary Road, Thanisandra Main Rd, Bengaluru',
      price: 9200000,
      area: 1300,
      furnishing: 'Semi Furnished',
      possession: 'Within 6 Months',
      description: 'Direct connectivity to Bangalore International Airport and Manyata Tech Park.',
      status: PropertyStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Total Environment Windmills - 4 BHK Duplex Villa',
      propertyType: 'Villa',
      bhk: '4 BHK',
      location: 'Whitefield',
      address: 'EPIP Zone, Whitefield, Bengaluru',
      price: 45000000,
      area: 4200,
      furnishing: 'Fully Furnished',
      possession: 'Ready to Move',
      description: 'Iconic earth-sheltered architecture with private heated pool, landscaped terrace garden, and bespoke woodwork.',
      status: PropertyStatus.SOLD,
      imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'HSR Serenity Suites - 1 BHK Executive',
      propertyType: 'Apartment',
      bhk: '1 BHK',
      location: 'HSR Layout',
      address: 'Sector 2, HSR Layout, Bengaluru',
      price: 4800000,
      area: 650,
      furnishing: 'Fully Furnished',
      possession: 'Ready to Move',
      description: 'Ideal high-rental-yield 1 BHK in prime startup hub with high rental demand and low maintenance.',
      status: PropertyStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1502005229762-ae1b460020e2?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Adarsh Palm Retreat - 4 BHK Independent Villa',
      propertyType: 'Villa',
      bhk: '4 BHK',
      location: 'Bellandur',
      address: 'Outer Ring Road, Devarabisanahalli, Bengaluru',
      price: 52000000,
      area: 4600,
      furnishing: 'Semi Furnished',
      possession: 'Ready to Move',
      description: 'Victorian style villa with private garden, servant quarters, high ceiling living room.',
      status: PropertyStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Indiranagar Urban Loft - 3 BHK Penthouse',
      propertyType: 'Apartment',
      bhk: '3 BHK',
      location: 'Indiranagar',
      address: '100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru',
      price: 31000000,
      area: 2750,
      furnishing: 'Fully Furnished',
      possession: 'Ready to Move',
      description: 'Ultra-luxurious penthouse with private jacuzzi on rooftop terrace in Bengaluru’s premier dining and shopping district.',
      status: PropertyStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Mantri Alpyne - 2 BHK High Floor',
      propertyType: 'Apartment',
      bhk: '2 BHK',
      location: 'Bannerghatta Road',
      address: 'Uttarahalli Main Road, Bengaluru',
      price: 6200000,
      area: 1100,
      furnishing: 'Semi Furnished',
      possession: 'Ready to Move',
      description: 'Panoramic mountain view unit, close to metro station and reputed international schools.',
      status: PropertyStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Century Ethos - 3 BHK Ultra Luxury',
      propertyType: 'Apartment',
      bhk: '3 BHK',
      location: 'Hebbal',
      address: 'Bellary Road, Opp. Columbia Asia Hospital, Hebbal, Bengaluru',
      price: 26000000,
      area: 2900,
      furnishing: 'Semi Furnished',
      possession: 'Ready to Move',
      description: 'Grand 50,000 sq ft clubhouse, 2 indoor heated swimming pools, marble flooring throughout.',
      status: PropertyStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Goyal Orchid Whitefield - 2.5 BHK',
      propertyType: 'Apartment',
      bhk: '2 BHK',
      location: 'Whitefield',
      address: 'Channasandra Main Road, Whitefield, Bengaluru',
      price: 7200000,
      area: 1250,
      furnishing: 'Unfurnished',
      possession: 'Within 3 Months',
      description: 'Well-planned layout with zero wasted space, close to ITPL and upcoming metro station.',
      status: PropertyStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Shanders Springdale - Gated Villa Plot',
      propertyType: 'Plot',
      bhk: 'Plot',
      location: 'Electronic City',
      address: 'Chandapura Anekal Road, Near Electronic City, Bengaluru',
      price: 4200000,
      area: 1500,
      furnishing: 'Unfurnished',
      possession: 'Ready to Move',
      description: 'BMRDA approved villa plot with underground electricity, tar roads, and 24x7 security.',
      status: PropertyStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const createdProperties = [];
  for (const p of propertiesData) {
    const { imageUrl, ...rest } = p;
    const prop = await prisma.property.create({
      data: {
        ...rest,
        images: {
          create: [
            { imageUrl, sortOrder: 0 },
            { imageUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80', sortOrder: 1 },
          ],
        },
      },
    });
    createdProperties.push(prop);
  }

  console.log(`✅ Created ${createdProperties.length} Properties with images`);

  // 3. Create 20 Realistic Indian Customers
  const customersData = [
    { name: 'Rahul Kumar', phone: '9876500001', alternatePhone: '9876500101', whatsappNumber: '9876500001', email: 'rahul.kumar@gmail.com', source: 'Phone', notes: 'Tech Lead at Infosys EC. Looking for ready to move apartment.' },
    { name: 'Arun Sharma', phone: '9876500002', alternatePhone: '9876500102', whatsappNumber: '9876500002', email: 'arun.sharma@outlook.com', source: 'Phone', notes: 'Product Manager at Wipro. Wants 1 or 2 BHK in Whitefield.' },
    { name: 'Priya Nair', phone: '9876500003', alternatePhone: null, whatsappNumber: '9876500003', email: 'priya.nair@tcs.com', source: 'WhatsApp', notes: 'Interested in luxury villas in Sarjapur or Bellandur.' },
    { name: 'Kiran Rao', phone: '9876500004', alternatePhone: '9876500104', whatsappNumber: '9876500004', email: 'kiran.rao99@yahoo.com', source: 'Website', notes: 'Looking for 3 BHK under 1.5 Cr near HSR Layout.' },
    { name: 'Sneha Patil', phone: '9876500005', alternatePhone: null, whatsappNumber: '9876500005', email: 'sneha.patil@flipkart.com', source: 'Instagram', notes: 'Wants modern 2 BHK with balcony in Electronic City.' },
    { name: 'Amitabh Sen', phone: '9876500006', alternatePhone: '9876500106', whatsappNumber: '9876500006', email: 'amitabh.sen@amazon.com', source: 'Referral', notes: 'Executive at Amazon. High budget investor looking for Indiranagar penthouse.' },
    { name: 'Deepika Iyer', phone: '9876500007', alternatePhone: null, whatsappNumber: '9876500007', email: 'deepika.iyer@gmail.com', source: 'Phone', notes: 'First time home buyer looking for 2 BHK near Hebbal/Airport.' },
    { name: 'Manish Verma', phone: '9876500008', alternatePhone: '9876500108', whatsappNumber: '9876500008', email: 'manish.verma@swiggy.com', source: 'Facebook', notes: 'Looking for investment plot or 2 BHK in Electronic City.' },
    { name: 'Ananya Deshmukh', phone: '9876500009', alternatePhone: null, whatsappNumber: '9876500009', email: 'ananya.d@gmail.com', source: 'Walk-in', notes: 'Visited office directly with family. Wants 3 BHK in Whitefield.' },
    { name: 'Suresh Menon', phone: '9876500010', alternatePhone: '9876500110', whatsappNumber: '9876500010', email: 'suresh.menon@cisco.com', source: 'Phone', notes: 'Relocating from Chennai. Needs ready to move 3 BHK in Sarjapur.' },
    { name: 'Pooja Agarwal', phone: '9876500011', alternatePhone: null, whatsappNumber: '9876500011', email: 'pooja.agarwal@gmail.com', source: 'WhatsApp', notes: 'Interested in gated villa plots around Electronic City.' },
    { name: 'Rohan Gupta', phone: '9876500012', alternatePhone: '9876500112', whatsappNumber: '9876500012', email: 'rohan.gupta@deloitte.com', source: 'Website', notes: 'Wants 2 BHK in Electronic City Phase 1. Budget strictly 70L.' },
    { name: 'Kavita Joshi', phone: '9876500013', alternatePhone: null, whatsappNumber: '9876500013', email: 'kavita.j@accenture.com', source: 'Phone', notes: 'Followed up after seeing hoardings in Whitefield.' },
    { name: 'Naveen Hegde', phone: '9876500014', alternatePhone: '9876500114', whatsappNumber: '9876500014', email: 'naveen.hegde@sap.com', source: 'Referral', notes: 'Referred by colleague Rajesh. Wants luxury 4 BHK in Bellandur.' },
    { name: 'Meera Nambiar', phone: '9876500015', alternatePhone: null, whatsappNumber: '9876500015', email: 'meera.nambiar@gmail.com', source: 'Instagram', notes: 'Looking for rental / buying option in Indiranagar.' },
    { name: 'Aditya Kulkarni', phone: '9876500016', alternatePhone: '9876500116', whatsappNumber: '9876500016', email: 'aditya.k@oracle.com', source: 'Phone', notes: 'Wants ready 3 BHK in Bannerghatta Road.' },
    { name: 'Divya Sundaram', phone: '9876500017', alternatePhone: null, whatsappNumber: '9876500017', email: 'divya.sundaram@gmail.com', source: 'Phone', notes: 'Looking for 2 BHK near Whitefield metro.' },
    { name: 'Gaurav Bhatia', phone: '9876500018', alternatePhone: '9876500118', whatsappNumber: '9876500018', email: 'gaurav.bhatia@ey.com', source: 'WhatsApp', notes: 'Investment buyer with ₹1.5 Cr budget.' },
    { name: 'Swati Venkatesh', phone: '9876500019', alternatePhone: null, whatsappNumber: '9876500019', email: 'swati.v@gmail.com', source: 'Website', notes: 'Needs 3 BHK in Hebbal near Manyata.' },
    { name: 'Harish Chawla', phone: '9876500020', alternatePhone: '9876500120', whatsappNumber: '9876500020', email: 'harish.chawla@gmail.com', source: 'Walk-in', notes: 'Looking for 4 BHK villa in Sarjapur Road.' },
  ];

  const createdCustomers = [];
  for (const c of customersData) {
    const cust = await prisma.customer.create({ data: c });
    createdCustomers.push(cust);
  }

  console.log(`✅ Created ${createdCustomers.length} Customers`);

  // 4. Create 30 Leads with Requirements across stages
  const now = new Date();
  const today11AM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0);
  const tomorrow11AM = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 11, 0, 0);
  const yesterday2PM = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 14, 0, 0);
  const twoDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 10, 30, 0);
  const threeDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3, 16, 0, 0);

  const leadsConfig = [
    // 0: Rahul Kumar - Benchmark Case
    {
      custIdx: 0,
      userIdx: 1, // Vikram
      status: LeadStatus.REQUIREMENT_COLLECTED,
      priority: LeadPriority.HIGH,
      source: 'Phone',
      req: {
        propertyType: 'Apartment',
        bhk: '2 BHK',
        preferredLocation: 'Electronic City',
        minBudget: 6500000,
        maxBudget: 7500000,
        minArea: 1000,
        maxArea: 1250,
        purpose: 'Buying',
        possessionPreference: 'Ready to Move',
        furnishingPreference: 'Semi Furnished',
        notes: 'Customer wants ready-to-move property in Electronic City. Will discuss with family on weekend.',
      },
    },
    // 1: Arun Sharma
    {
      custIdx: 1,
      userIdx: 2, // Sneha
      status: LeadStatus.PROPERTY_SHARED,
      priority: LeadPriority.HIGH,
      source: 'Phone',
      req: {
        propertyType: 'Apartment',
        bhk: '1 BHK',
        preferredLocation: 'Whitefield',
        minBudget: 4500000,
        maxBudget: 5500000,
        minArea: 600,
        maxArea: 800,
        purpose: 'Buying',
        possessionPreference: 'Ready to Move',
        furnishingPreference: 'Fully Furnished',
        notes: 'Shared Prestige Lakeside brochure via WhatsApp.',
      },
    },
    // 2: Priya Nair
    {
      custIdx: 2,
      userIdx: 1, // Vikram
      status: LeadStatus.SITE_VISIT,
      priority: LeadPriority.URGENT,
      source: 'WhatsApp',
      req: {
        propertyType: 'Villa',
        bhk: '3 BHK',
        preferredLocation: 'Sarjapur Road',
        minBudget: 22000000,
        maxBudget: 26000000,
        minArea: 2500,
        maxArea: 3200,
        purpose: 'Buying',
        possessionPreference: 'Ready to Move',
        furnishingPreference: 'Semi Furnished',
        notes: 'Site visit scheduled for Godrej Palm Retreat villa.',
      },
    },
    // 3: Kiran Rao
    {
      custIdx: 3,
      userIdx: 3, // Kiran
      status: LeadStatus.NEGOTIATION,
      priority: LeadPriority.HIGH,
      source: 'Website',
      req: {
        propertyType: 'Apartment',
        bhk: '3 BHK',
        preferredLocation: 'Sarjapur Road',
        minBudget: 13000000,
        maxBudget: 14000000,
        minArea: 1600,
        maxArea: 1800,
        purpose: 'Buying',
        possessionPreference: 'Within 3 Months',
        furnishingPreference: 'Unfurnished',
        notes: 'Brigade Utopia 3 BHK. Price discussion ongoing at 1.32 Cr.',
      },
    },
    // 4: Sneha Patil
    {
      custIdx: 4,
      userIdx: 1,
      status: LeadStatus.BOOKED,
      priority: LeadPriority.HIGH,
      source: 'Instagram',
      req: {
        propertyType: 'Apartment',
        bhk: '2 BHK',
        preferredLocation: 'Electronic City',
        minBudget: 6500000,
        maxBudget: 7000000,
        minArea: 1000,
        maxArea: 1100,
        purpose: 'Buying',
        possessionPreference: 'Ready to Move',
        furnishingPreference: 'Ready to Move',
        notes: 'Token booking of ₹2,00,000 received for Sobha Dream Acres.',
      },
    },
    // 5: Amitabh Sen
    {
      custIdx: 5,
      userIdx: 0, // Admin Rajesh
      status: LeadStatus.NEGOTIATION,
      priority: LeadPriority.URGENT,
      source: 'Referral',
      req: {
        propertyType: 'Apartment',
        bhk: '3 BHK',
        preferredLocation: 'Indiranagar',
        minBudget: 30000000,
        maxBudget: 35000000,
        minArea: 2600,
        maxArea: 3000,
        purpose: 'Buying',
        possessionPreference: 'Ready to Move',
        furnishingPreference: 'Fully Furnished',
        notes: 'Indiranagar Urban Loft penthouse discussion.',
      },
    },
    // 6: Deepika Iyer
    {
      custIdx: 6,
      userIdx: 2,
      status: LeadStatus.CONTACTED,
      priority: LeadPriority.MEDIUM,
      source: 'Phone',
      req: {
        propertyType: 'Apartment',
        bhk: '2 BHK',
        preferredLocation: 'Hebbal',
        minBudget: 8500000,
        maxBudget: 9500000,
        minArea: 1200,
        maxArea: 1400,
        purpose: 'Buying',
        possessionPreference: 'Within 6 Months',
        furnishingPreference: 'Semi Furnished',
        notes: 'Initial call made. Explained Puravankara Atmosphere project.',
      },
    },
    // 7: Manish Verma
    {
      custIdx: 7,
      userIdx: 3,
      status: LeadStatus.NEW,
      priority: LeadPriority.MEDIUM,
      source: 'Facebook',
      req: {
        propertyType: 'Plot',
        bhk: 'Plot',
        preferredLocation: 'Electronic City',
        minBudget: 4000000,
        maxBudget: 4500000,
        minArea: 1200,
        maxArea: 1600,
        purpose: 'Investment',
        possessionPreference: 'Ready to Move',
        furnishingPreference: 'Unfurnished',
        notes: 'Looking for gated villa plot for 3-5 year investment horizon.',
      },
    },
    // 8: Ananya Deshmukh
    {
      custIdx: 8,
      userIdx: 2,
      status: LeadStatus.SITE_VISIT,
      priority: LeadPriority.HIGH,
      source: 'Walk-in',
      req: {
        propertyType: 'Apartment',
        bhk: '3 BHK',
        preferredLocation: 'Whitefield',
        minBudget: 11000000,
        maxBudget: 12000000,
        minArea: 1500,
        maxArea: 1700,
        purpose: 'Buying',
        possessionPreference: 'Ready to Move',
        furnishingPreference: 'Semi Furnished',
        notes: 'Assetz Marq 3.0 site visit completed on Saturday.',
      },
    },
    // 9: Suresh Menon
    {
      custIdx: 9,
      userIdx: 1,
      status: LeadStatus.PROPERTY_SHARED,
      priority: LeadPriority.MEDIUM,
      source: 'Phone',
      req: {
        propertyType: 'Apartment',
        bhk: '3 BHK',
        preferredLocation: 'Sarjapur Road',
        minBudget: 12000000,
        maxBudget: 14000000,
        minArea: 1600,
        maxArea: 1900,
        purpose: 'Buying',
        possessionPreference: 'Ready to Move',
        furnishingPreference: 'Semi Furnished',
        notes: 'Relocating next month, needs fast possession.',
      },
    },
    // 10: Pooja Agarwal
    {
      custIdx: 10,
      userIdx: 3,
      status: LeadStatus.NEW,
      priority: LeadPriority.LOW,
      source: 'WhatsApp',
      req: {
        propertyType: 'Plot',
        bhk: 'Plot',
        preferredLocation: 'Electronic City',
        minBudget: 3500000,
        maxBudget: 4500000,
        minArea: 1200,
        maxArea: 1500,
        purpose: 'Investment',
        possessionPreference: 'Ready to Move',
        furnishingPreference: 'Unfurnished',
        notes: 'Inquired via WhatsApp catalog about Shanders Springdale.',
      },
    },
    // 11: Rohan Gupta
    {
      custIdx: 11,
      userIdx: 1,
      status: LeadStatus.REQUIREMENT_COLLECTED,
      priority: LeadPriority.HIGH,
      source: 'Website',
      req: {
        propertyType: 'Apartment',
        bhk: '2 BHK',
        preferredLocation: 'Electronic City',
        minBudget: 6500000,
        maxBudget: 7200000,
        minArea: 1000,
        maxArea: 1200,
        purpose: 'Buying',
        possessionPreference: 'Ready to Move',
        furnishingPreference: 'Semi Furnished',
        notes: 'Needs bank loan assistance from SBI/HDFC.',
      },
    },
    // 12: Kavita Joshi
    {
      custIdx: 12,
      userIdx: 2,
      status: LeadStatus.LOST,
      priority: LeadPriority.LOW,
      source: 'Phone',
      req: {
        propertyType: 'Apartment',
        bhk: '2 BHK',
        preferredLocation: 'Whitefield',
        minBudget: 5000000,
        maxBudget: 5500000,
        minArea: 900,
        maxArea: 1100,
        purpose: 'Buying',
        possessionPreference: 'Ready to Move',
        furnishingPreference: 'Semi Furnished',
        notes: 'Budget too low for requested Whitefield location. Bought in Hoskote.',
      },
    },
    // 13: Naveen Hegde
    {
      custIdx: 13,
      userIdx: 0,
      status: LeadStatus.BOOKED,
      priority: LeadPriority.URGENT,
      source: 'Referral',
      req: {
        propertyType: 'Villa',
        bhk: '4 BHK',
        preferredLocation: 'Bellandur',
        minBudget: 50000000,
        maxBudget: 55000000,
        minArea: 4400,
        maxArea: 4800,
        purpose: 'Buying',
        possessionPreference: 'Ready to Move',
        furnishingPreference: 'Semi Furnished',
        notes: 'Adarsh Palm Retreat 4 BHK booked. ₹10,00,000 token given.',
      },
    },
    // 14: Meera Nambiar
    {
      custIdx: 14,
      userIdx: 3,
      status: LeadStatus.CONTACTED,
      priority: LeadPriority.MEDIUM,
      source: 'Instagram',
      req: {
        propertyType: 'Apartment',
        bhk: '2 BHK',
        preferredLocation: 'Indiranagar',
        minBudget: 80000,
        maxBudget: 100000,
        minArea: 1200,
        maxArea: 1400,
        purpose: 'Renting',
        possessionPreference: 'Ready to Move',
        furnishingPreference: 'Fully Furnished',
        notes: 'Looking for luxury rental in Indiranagar.',
      },
    },
    // 15: Aditya Kulkarni
    {
      custIdx: 15,
      userIdx: 1,
      status: LeadStatus.PROPERTY_SHARED,
      priority: LeadPriority.HIGH,
      source: 'Phone',
      req: {
        propertyType: 'Apartment',
        bhk: '2 BHK',
        preferredLocation: 'Bannerghatta Road',
        minBudget: 6000000,
        maxBudget: 6500000,
        minArea: 1050,
        maxArea: 1150,
        purpose: 'Buying',
        possessionPreference: 'Ready to Move',
        furnishingPreference: 'Semi Furnished',
        notes: 'Shared Mantri Alpyne details and floor plans.',
      },
    },
    // 16: Divya Sundaram
    {
      custIdx: 16,
      userIdx: 2,
      status: LeadStatus.SITE_VISIT,
      priority: LeadPriority.HIGH,
      source: 'Phone',
      req: {
        propertyType: 'Apartment',
        bhk: '2 BHK',
        preferredLocation: 'Whitefield',
        minBudget: 7000000,
        maxBudget: 7500000,
        minArea: 1150,
        maxArea: 1300,
        purpose: 'Buying',
        possessionPreference: 'Within 3 Months',
        furnishingPreference: 'Unfurnished',
        notes: 'Goyal Orchid Whitefield site visit booked for Sunday 11 AM.',
      },
    },
    // 17: Gaurav Bhatia
    {
      custIdx: 17,
      userIdx: 0,
      status: LeadStatus.REQUIREMENT_COLLECTED,
      priority: LeadPriority.MEDIUM,
      source: 'WhatsApp',
      req: {
        propertyType: 'Apartment',
        bhk: '3 BHK',
        preferredLocation: 'Hebbal',
        minBudget: 24000000,
        maxBudget: 28000000,
        minArea: 2700,
        maxArea: 3100,
        purpose: 'Investment',
        possessionPreference: 'Ready to Move',
        furnishingPreference: 'Semi Furnished',
        notes: 'HNWI investor exploring Century Ethos.',
      },
    },
    // 18: Swati Venkatesh
    {
      custIdx: 18,
      userIdx: 3,
      status: LeadStatus.NEW,
      priority: LeadPriority.MEDIUM,
      source: 'Website',
      req: {
        propertyType: 'Apartment',
        bhk: '3 BHK',
        preferredLocation: 'Hebbal',
        minBudget: 9000000,
        maxBudget: 9500000,
        minArea: 1300,
        maxArea: 1450,
        purpose: 'Buying',
        possessionPreference: 'Within 6 Months',
        furnishingPreference: 'Semi Furnished',
        notes: 'Inquiry via website form for Puravankara Atmosphere.',
      },
    },
    // 19: Harish Chawla
    {
      custIdx: 19,
      userIdx: 1,
      status: LeadStatus.BOOKED,
      priority: LeadPriority.URGENT,
      source: 'Walk-in',
      req: {
        propertyType: 'Villa',
        bhk: '4 BHK',
        preferredLocation: 'Whitefield',
        minBudget: 42000000,
        maxBudget: 48000000,
        minArea: 4000,
        maxArea: 4500,
        purpose: 'Buying',
        possessionPreference: 'Ready to Move',
        furnishingPreference: 'Fully Furnished',
        notes: 'Total Environment Windmills villa booking finalized.',
      },
    },
    // Additional leads for customers with multiple leads over time (testing duplicate customer scenario)
    // 20: Rahul Kumar (2nd lead - Investment plot)
    {
      custIdx: 0,
      userIdx: 1,
      status: LeadStatus.NEW,
      priority: LeadPriority.MEDIUM,
      source: 'Phone',
      req: {
        propertyType: 'Plot',
        bhk: 'Plot',
        preferredLocation: 'Electronic City',
        minBudget: 3800000,
        maxBudget: 4500000,
        minArea: 1200,
        maxArea: 1500,
        purpose: 'Investment',
        possessionPreference: 'Ready to Move',
        furnishingPreference: 'Unfurnished',
        notes: 'Second requirement: Asked about plot investments near Jigani / Chandapura.',
      },
    },
    // 21: Arun Sharma (2nd lead)
    {
      custIdx: 1,
      userIdx: 2,
      status: LeadStatus.REQUIREMENT_COLLECTED,
      priority: LeadPriority.LOW,
      source: 'WhatsApp',
      req: {
        propertyType: 'Apartment',
        bhk: '2 BHK',
        preferredLocation: 'HSR Layout',
        minBudget: 5000000,
        maxBudget: 6000000,
        minArea: 800,
        maxArea: 1000,
        purpose: 'Renting',
        possessionPreference: 'Ready to Move',
        furnishingPreference: 'Fully Furnished',
        notes: 'Temporary rental requirement before purchasing.',
      },
    },
    // 22: Priya Nair (2nd lead)
    {
      custIdx: 2,
      userIdx: 1,
      status: LeadStatus.CONTACTED,
      priority: LeadPriority.HIGH,
      source: 'Phone',
      req: {
        propertyType: 'Commercial',
        bhk: 'Office',
        preferredLocation: 'Sarjapur Road',
        minBudget: 15000000,
        maxBudget: 20000000,
        minArea: 1500,
        maxArea: 2200,
        purpose: 'Investment',
        possessionPreference: 'Ready to Move',
        furnishingPreference: 'Semi Furnished',
        notes: 'Looking for commercial office space with 8% rental yield.',
      },
    },
    // 23: Kiran Rao (2nd lead)
    {
      custIdx: 3,
      userIdx: 3,
      status: LeadStatus.NEW,
      priority: LeadPriority.LOW,
      source: 'Other',
      req: {
        propertyType: 'Apartment',
        bhk: '1 BHK',
        preferredLocation: 'HSR Layout',
        minBudget: 4500000,
        maxBudget: 5000000,
        minArea: 600,
        maxArea: 700,
        purpose: 'Investment',
        possessionPreference: 'Ready to Move',
        furnishingPreference: 'Fully Furnished',
        notes: 'HSR Serenity Suites rental yield analysis requested.',
      },
    },
    // 24: Deepika Iyer (2nd lead)
    {
      custIdx: 6,
      userIdx: 2,
      status: LeadStatus.LOST,
      priority: LeadPriority.LOW,
      source: 'Website',
      req: {
        propertyType: 'Apartment',
        bhk: '1 BHK',
        preferredLocation: 'Hebbal',
        minBudget: 3500000,
        maxBudget: 4000000,
        minArea: 550,
        maxArea: 650,
        purpose: 'Buying',
        possessionPreference: 'Ready to Move',
        furnishingPreference: 'Unfurnished',
        notes: 'Dropped out due to interest rates.',
      },
    },
    // 25: Manish Verma (2nd lead)
    {
      custIdx: 7,
      userIdx: 3,
      status: LeadStatus.PROPERTY_SHARED,
      priority: LeadPriority.MEDIUM,
      source: 'Phone',
      req: {
        propertyType: 'Apartment',
        bhk: '2 BHK',
        preferredLocation: 'Electronic City',
        minBudget: 6500000,
        maxBudget: 7000000,
        minArea: 1000,
        maxArea: 1100,
        purpose: 'Buying',
        possessionPreference: 'Ready to Move',
        furnishingPreference: 'Semi Furnished',
        notes: 'Shared Sobha Dream Acres floor plans.',
      },
    },
    // 26: Suresh Menon (2nd lead)
    {
      custIdx: 9,
      userIdx: 1,
      status: LeadStatus.NEGOTIATION,
      priority: LeadPriority.HIGH,
      source: 'Phone',
      req: {
        propertyType: 'Villa',
        bhk: '3 BHK',
        preferredLocation: 'Sarjapur Road',
        minBudget: 23000000,
        maxBudget: 25000000,
        minArea: 2700,
        maxArea: 3000,
        purpose: 'Buying',
        possessionPreference: 'Ready to Move',
        furnishingPreference: 'Semi Furnished',
        notes: 'Negotiating final discount on Godrej Palm Retreat Villa.',
      },
    },
    // 27: Aditya Kulkarni (2nd lead)
    {
      custIdx: 15,
      userIdx: 1,
      status: LeadStatus.CONTACTED,
      priority: LeadPriority.MEDIUM,
      source: 'Phone',
      req: {
        propertyType: 'Apartment',
        bhk: '3 BHK',
        preferredLocation: 'Bannerghatta Road',
        minBudget: 8500000,
        maxBudget: 9500000,
        minArea: 1400,
        maxArea: 1600,
        purpose: 'Buying',
        possessionPreference: 'Within 3 Months',
        furnishingPreference: 'Semi Furnished',
        notes: 'Wants larger 3 BHK option in South Bangalore.',
      },
    },
    // 28: Divya Sundaram (2nd lead)
    {
      custIdx: 16,
      userIdx: 2,
      status: LeadStatus.NEW,
      priority: LeadPriority.MEDIUM,
      source: 'Phone',
      req: {
        propertyType: 'Apartment',
        bhk: '2 BHK',
        preferredLocation: 'Whitefield',
        minBudget: 7500000,
        maxBudget: 8000000,
        minArea: 1200,
        maxArea: 1250,
        purpose: 'Buying',
        possessionPreference: 'Ready to Move',
        furnishingPreference: 'Semi Furnished',
        notes: 'Looking for Prestige Lakeside Habitat.',
      },
    },
    // 29: Gaurav Bhatia (2nd lead)
    {
      custIdx: 17,
      userIdx: 0,
      status: LeadStatus.NEGOTIATION,
      priority: LeadPriority.URGENT,
      source: 'WhatsApp',
      req: {
        propertyType: 'Apartment',
        bhk: '3 BHK',
        preferredLocation: 'Indiranagar',
        minBudget: 28000000,
        maxBudget: 32000000,
        minArea: 2500,
        maxArea: 2800,
        purpose: 'Buying',
        possessionPreference: 'Ready to Move',
        furnishingPreference: 'Fully Furnished',
        notes: 'Comparing Indiranagar Penthouse vs Century Ethos.',
      },
    },
  ];

  const createdLeads = [];
  for (const cfg of leadsConfig) {
    const customer = createdCustomers[cfg.custIdx];
    const user = usersList[cfg.userIdx];

    const lead = await prisma.lead.create({
      data: {
        customerId: customer.id,
        assignedUserId: user.id,
        status: cfg.status,
        priority: cfg.priority,
        source: cfg.source,
        requirement: {
          create: cfg.req,
        },
      },
      include: {
        requirement: true,
      },
    });
    createdLeads.push(lead);
  }

  console.log(`✅ Created ${createdLeads.length} Leads with full Requirements`);

  // 5. Create Call Logs for Key Customers and Leads
  const callLogsData = [
    {
      customerId: createdCustomers[0].id,
      leadId: createdLeads[0].id,
      phoneNumber: '9876500001',
      direction: CallDirection.INCOMING,
      startedAt: twoDaysAgo,
      endedAt: new Date(twoDaysAgo.getTime() + 180000),
      duration: 180,
      notes: 'Customer called inquiring about 2 BHK in Electronic City. Mentioned budget 65-75L and family preference for ready-to-move.',
      summary: 'Inquired for 2 BHK in Electronic City with ₹65-75L budget.',
    },
    {
      customerId: createdCustomers[0].id,
      leadId: createdLeads[0].id,
      phoneNumber: '9876500001',
      direction: CallDirection.OUTGOING,
      startedAt: yesterday2PM,
      endedAt: new Date(yesterday2PM.getTime() + 240000),
      duration: 240,
      notes: 'Shared details of Sobha Dream Acres & Sattva Greenage. Customer agreed for follow up call tomorrow 11 AM.',
      summary: 'Discussed Sobha Dream Acres. Scheduled follow up.',
    },
    {
      customerId: createdCustomers[1].id,
      leadId: createdLeads[1].id,
      phoneNumber: '9876500002',
      direction: CallDirection.INCOMING,
      startedAt: yesterday2PM,
      endedAt: new Date(yesterday2PM.getTime() + 150000),
      duration: 150,
      notes: 'Arun inquired about Prestige Lakeside Habitat 1 BHK. Requested brochure on WhatsApp.',
      summary: 'Brochure requested for Prestige Lakeside 1 BHK.',
    },
    {
      customerId: createdCustomers[2].id,
      leadId: createdLeads[2].id,
      phoneNumber: '9876500003',
      direction: CallDirection.OUTGOING,
      startedAt: threeDaysAgo,
      endedAt: new Date(threeDaysAgo.getTime() + 320000),
      duration: 320,
      notes: 'Discussed Godrej Palm Retreat villa project specs and clubhouse amenities.',
      summary: 'Villa specs discussion with Priya Nair.',
    },
    {
      customerId: createdCustomers[3].id,
      leadId: createdLeads[3].id,
      phoneNumber: '9876500004',
      direction: CallDirection.INCOMING,
      startedAt: yesterday2PM,
      endedAt: new Date(yesterday2PM.getTime() + 410000),
      duration: 410,
      notes: 'Kiran called for price negotiation on Brigade Utopia. Requested final on-road price inclusive of parking and club fees.',
      summary: 'Price negotiation on Brigade Utopia 3 BHK.',
    },
  ];

  for (const cl of callLogsData) {
    await prisma.callLog.create({ data: cl });
  }

  console.log(`✅ Created Call Logs`);

  // 6. Create Notes
  const notesData = [
    {
      customerId: createdCustomers[0].id,
      leadId: createdLeads[0].id,
      userId: sales1.id,
      content: 'Rahul is very keen on Electronic City Phase 1 as his office is in Infosys Campus. Preferred move-in by next quarter.',
      createdAt: twoDaysAgo,
    },
    {
      customerId: createdCustomers[0].id,
      leadId: createdLeads[0].id,
      userId: sales1.id,
      content: 'Follow-up scheduled with Rahul for tomorrow at 11:00 AM to finalize site visit dates.',
      createdAt: yesterday2PM,
    },
    {
      customerId: createdCustomers[1].id,
      leadId: createdLeads[1].id,
      userId: sales2.id,
      content: 'Arun requested floor plans with East facing entrance. Sending over WhatsApp.',
      createdAt: yesterday2PM,
    },
    {
      customerId: createdCustomers[2].id,
      leadId: createdLeads[2].id,
      userId: sales1.id,
      content: 'Priya will visit with her architect husband this Sunday morning at 11:30 AM.',
      createdAt: threeDaysAgo,
    },
    {
      customerId: createdCustomers[3].id,
      leadId: createdLeads[3].id,
      userId: sales3.id,
      content: 'Offered 2% spot booking discount on Brigade Utopia. Awaiting customer confirmation.',
      createdAt: yesterday2PM,
    },
  ];

  for (const n of notesData) {
    await prisma.note.create({ data: n });
  }

  console.log(`✅ Created Notes`);

  // 7. Create 15 Follow-ups (Today, Upcoming, Overdue, Completed)
  const followUpsData = [
    // Today's Follow-ups
    {
      leadId: createdLeads[0].id, // Rahul Kumar - Benchmark Case
      assignedUserId: sales1.id,
      scheduledAt: tomorrow11AM, // Tomorrow 11:00 AM as per prompt benchmark!
      type: FollowUpType.CALL,
      status: FollowUpStatus.PENDING,
      notes: 'Call Rahul Kumar to confirm site visit for Sobha Dream Acres (2 BHK ₹65-75L Electronic City).',
    },
    {
      leadId: createdLeads[1].id, // Arun Sharma
      assignedUserId: sales2.id,
      scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 30, 0),
      type: FollowUpType.WHATSAPP,
      status: FollowUpStatus.PENDING,
      notes: 'Send Prestige Lakeside 1 BHK brochure & cost sheet over WhatsApp.',
    },
    {
      leadId: createdLeads[2].id, // Priya Nair
      assignedUserId: sales1.id,
      scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0, 0),
      type: FollowUpType.SITE_VISIT,
      status: FollowUpStatus.PENDING,
      notes: 'Site visit for Godrej Palm Retreat Luxury Villa (₹2.45 Cr, Sarjapur Road).',
    },
    {
      leadId: createdLeads[3].id, // Kiran Rao
      assignedUserId: sales3.id,
      scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 30, 0),
      type: FollowUpType.CALL,
      status: FollowUpStatus.PENDING,
      notes: 'Call regarding builder discount approval for Brigade Utopia.',
    },
    {
      leadId: createdLeads[6].id, // Deepika Iyer
      assignedUserId: sales2.id,
      scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0, 0),
      type: FollowUpType.CALL,
      status: FollowUpStatus.PENDING,
      notes: 'Follow up on Puravankara Atmosphere Hebbal 2 BHK project.',
    },
    // Overdue Follow-ups (scheduled in the past, still PENDING)
    {
      leadId: createdLeads[7].id, // Manish Verma
      assignedUserId: sales3.id,
      scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 10, 0, 0),
      type: FollowUpType.CALL,
      status: FollowUpStatus.PENDING,
      notes: 'OVERDUE: Call Manish to share Shanders Springdale villa plot details.',
    },
    {
      leadId: createdLeads[8].id, // Ananya Deshmukh
      assignedUserId: sales2.id,
      scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 14, 0, 0),
      type: FollowUpType.MEETING,
      status: FollowUpStatus.PENDING,
      notes: 'OVERDUE: Follow up on Assetz Marq 3 BHK site visit feedback.',
    },
    {
      leadId: createdLeads[9].id, // Suresh Menon
      assignedUserId: sales1.id,
      scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 16, 0, 0),
      type: FollowUpType.CALL,
      status: FollowUpStatus.PENDING,
      notes: 'OVERDUE: Call Suresh regarding relocation date and quick registration.',
    },
    // Upcoming Follow-ups (future dates)
    {
      leadId: createdLeads[5].id, // Amitabh Sen
      assignedUserId: admin.id,
      scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 15, 0, 0),
      type: FollowUpType.MEETING,
      status: FollowUpStatus.PENDING,
      notes: 'VIP meeting with Amitabh Sen at Indiranagar Loft.',
    },
    {
      leadId: createdLeads[11].id, // Rohan Gupta
      assignedUserId: sales1.id,
      scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 11, 0, 0),
      type: FollowUpType.CALL,
      status: FollowUpStatus.PENDING,
      notes: 'Bank loan eligibility check with HDFC loan officer.',
    },
    {
      leadId: createdLeads[16].id, // Divya Sundaram
      assignedUserId: sales2.id,
      scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4, 11, 0, 0),
      type: FollowUpType.SITE_VISIT,
      status: FollowUpStatus.PENDING,
      notes: 'Site visit for Goyal Orchid Whitefield 2 BHK.',
    },
    // Completed Follow-ups
    {
      leadId: createdLeads[0].id, // Rahul Kumar
      assignedUserId: sales1.id,
      scheduledAt: yesterday2PM,
      type: FollowUpType.CALL,
      status: FollowUpStatus.COMPLETED,
      notes: 'Initial requirement discussion call with Rahul Kumar.',
      completedAt: yesterday2PM,
    },
    {
      leadId: createdLeads[4].id, // Sneha Patil
      assignedUserId: sales1.id,
      scheduledAt: twoDaysAgo,
      type: FollowUpType.MEETING,
      status: FollowUpStatus.COMPLETED,
      notes: 'Booking token collection from Sneha Patil.',
      completedAt: twoDaysAgo,
    },
    {
      leadId: createdLeads[13].id, // Naveen Hegde
      assignedUserId: admin.id,
      scheduledAt: threeDaysAgo,
      type: FollowUpType.MEETING,
      status: FollowUpStatus.COMPLETED,
      notes: 'Finalized Adarsh Palm Retreat villa contract.',
      completedAt: threeDaysAgo,
    },
    {
      leadId: createdLeads[19].id, // Harish Chawla
      assignedUserId: sales1.id,
      scheduledAt: threeDaysAgo,
      type: FollowUpType.SITE_VISIT,
      status: FollowUpStatus.COMPLETED,
      notes: 'Total Environment Windmills villa walkthrough done.',
      completedAt: threeDaysAgo,
    },
  ];

  for (const fu of followUpsData) {
    await prisma.followUp.create({ data: fu });
  }

  console.log(`✅ Created ${followUpsData.length} Follow-ups`);

  // 8. Create Site Visits
  const siteVisitsData = [
    {
      leadId: createdLeads[2].id, // Priya Nair
      customerId: createdCustomers[2].id,
      propertyId: createdProperties[3].id, // Godrej Palm Retreat Villa
      scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0, 0),
      status: SiteVisitStatus.SCHEDULED,
      notes: 'Customer visiting with family to inspect master bedroom and garden space.',
    },
    {
      leadId: createdLeads[8].id, // Ananya Deshmukh
      customerId: createdCustomers[8].id,
      propertyId: createdProperties[4].id, // Assetz Marq 3.0
      scheduledAt: yesterday2PM,
      status: SiteVisitStatus.COMPLETED,
      notes: 'Client liked 14th floor garden view. Requested final cost sheet.',
    },
    {
      leadId: createdLeads[16].id, // Divya Sundaram
      customerId: createdCustomers[16].id,
      propertyId: createdProperties[13].id, // Goyal Orchid
      scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 11, 0, 0),
      status: SiteVisitStatus.SCHEDULED,
      notes: 'Weekend morning site visit arranged with sales team.',
    },
    {
      leadId: createdLeads[4].id, // Sneha Patil
      customerId: createdCustomers[4].id,
      propertyId: createdProperties[1].id, // Sobha Dream Acres
      scheduledAt: threeDaysAgo,
      status: SiteVisitStatus.COMPLETED,
      notes: 'Showed 2 BHK model flat and clubhouse. Client decided to book.',
    },
    {
      leadId: createdLeads[13].id, // Naveen Hegde
      customerId: createdCustomers[13].id,
      propertyId: createdProperties[9].id, // Adarsh Palm Retreat
      scheduledAt: threeDaysAgo,
      status: SiteVisitStatus.COMPLETED,
      notes: 'Walkthrough of Victorian Villa. Booked successfully.',
    },
  ];

  for (const sv of siteVisitsData) {
    await prisma.siteVisit.create({ data: sv });
  }

  console.log(`✅ Created ${siteVisitsData.length} Site Visits`);

  // 9. Create 3 Bookings
  const bookingsData = [
    {
      leadId: createdLeads[4].id, // Sneha Patil
      customerId: createdCustomers[4].id,
      propertyId: createdProperties[1].id, // Sobha Dream Acres
      bookingAmount: 200000,
      bookingDate: twoDaysAgo,
      status: BookingStatus.CONFIRMED,
      notes: 'Sobha Dream Acres 2 BHK unit 1204 booked. Cheque #449210 received.',
    },
    {
      leadId: createdLeads[13].id, // Naveen Hegde
      customerId: createdCustomers[13].id,
      propertyId: createdProperties[9].id, // Adarsh Palm Retreat
      bookingAmount: 1000000,
      bookingDate: threeDaysAgo,
      status: BookingStatus.CONFIRMED,
      notes: 'Adarsh Palm Retreat 4 BHK Villa 42 booked. Agreement scheduled next week.',
    },
    {
      leadId: createdLeads[19].id, // Harish Chawla
      customerId: createdCustomers[19].id,
      propertyId: createdProperties[7].id, // Total Environment Windmills
      bookingAmount: 1500000,
      bookingDate: yesterday2PM,
      status: BookingStatus.CONFIRMED,
      notes: 'Total Environment Windmills Villa booked with customization requests.',
    },
  ];

  for (const b of bookingsData) {
    await prisma.booking.create({ data: b });
  }

  console.log(`✅ Created ${bookingsData.length} Bookings`);

  console.log('🎉 Seed completed successfully! Demo accounts ready:');
  console.log('   Admin: admin@hyvora.com / password123');
  console.log('   Sales: vikram@hyvora.com / password123');
  console.log('   Sales: sneha@hyvora.com  / password123');
  console.log('   Sales: kiran@hyvora.com  / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
