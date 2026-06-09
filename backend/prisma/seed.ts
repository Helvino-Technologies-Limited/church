import { PrismaClient, UserRole, TenantStatus, SubscriptionPlan } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ── SuperAdmin ──────────────────────────────────────────────
  const superAdminEmail = process.env.SUPERADMIN_EMAIL || 'helvinotechltd@gmail.com';
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD || 'Mycat@95';

  const existingSuperAdmin = await prisma.user.findUnique({ where: { email: superAdminEmail } });
  if (!existingSuperAdmin) {
    await prisma.user.create({
      data: {
        fullname: 'Helvino Technologies',
        email: superAdminEmail,
        passwordHash: await bcrypt.hash(superAdminPassword, 12),
        role: UserRole.SUPERADMIN,
        tenantId: null,
      },
    });
    console.log(`✅ SuperAdmin created: ${superAdminEmail}`);
  } else {
    console.log(`ℹ️  SuperAdmin already exists: ${superAdminEmail}`);
  }

  // ── Demo Tenant ─────────────────────────────────────────────
  const demoSlug = 'grace-community-church';
  let demoTenant = await prisma.tenant.findUnique({ where: { slug: demoSlug } });

  if (!demoTenant) {
    demoTenant = await prisma.tenant.create({
      data: {
        name: 'Grace Community Church',
        slug: demoSlug,
        email: 'admin@gracechurch.demo',
        phone: '+254700000000',
        website: 'https://gracechurch.demo',
        address: '123 Faith Avenue',
        city: 'Nairobi',
        state: 'Nairobi County',
        country: 'Kenya',
        churchType: 'Single Church',
        churchSize: 'MEDIUM',
        numberOfBranches: 3,
        numberOfMembers: 450,
        subscriptionPlan: SubscriptionPlan.STANDARD,
        status: TenantStatus.ACTIVE,
        isVerified: true,
        verifiedAt: new Date(),
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subscriptionEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
    console.log(`✅ Demo tenant created: ${demoTenant.name}`);
  } else {
    console.log(`ℹ️  Demo tenant already exists: ${demoTenant.name}`);
  }

  // ── Demo Tenant Admin ────────────────────────────────────────
  const demoAdminEmail = 'admin@gracechurch.demo';
  const demoAdminPassword = 'Demo@2024';

  const existingDemoAdmin = await prisma.user.findUnique({ where: { email: demoAdminEmail } });
  if (!existingDemoAdmin) {
    await prisma.user.create({
      data: {
        fullname: 'Pastor John Kamau',
        email: demoAdminEmail,
        phone: '+254711000001',
        passwordHash: await bcrypt.hash(demoAdminPassword, 12),
        role: UserRole.TENANT_ADMIN,
        tenantId: demoTenant.id,
      },
    });
    console.log(`✅ Demo admin created: ${demoAdminEmail} / ${demoAdminPassword}`);
  }

  // ── Demo Parishes ────────────────────────────────────────────
  const existingParishes = await prisma.parish.count({ where: { tenantId: demoTenant.id } });
  if (existingParishes === 0) {
    await prisma.parish.createMany({
      data: [
        { tenantId: demoTenant.id, name: 'Main Campus', address: '123 Faith Avenue', city: 'Nairobi', phone: '+254700000001' },
        { tenantId: demoTenant.id, name: 'Westlands Branch', address: '45 Westlands Rd', city: 'Nairobi', phone: '+254700000002' },
        { tenantId: demoTenant.id, name: 'Karen Branch', address: '78 Karen Road', city: 'Nairobi', phone: '+254700000003' },
      ],
    });
    console.log('✅ Demo parishes created');
  }

  // ── Demo Ministries ──────────────────────────────────────────
  const existingMinistries = await prisma.ministry.count({ where: { tenantId: demoTenant.id } });
  if (existingMinistries === 0) {
    await prisma.ministry.createMany({
      data: [
        { tenantId: demoTenant.id, name: 'Worship Ministry', description: 'Praise and worship team' },
        { tenantId: demoTenant.id, name: "Children's Ministry", description: 'Sunday school and youth programs' },
        { tenantId: demoTenant.id, name: 'Evangelism Ministry', description: 'Outreach and missions' },
        { tenantId: demoTenant.id, name: "Women's Fellowship", description: "Women's prayer and discipleship" },
        { tenantId: demoTenant.id, name: "Men's Fellowship", description: "Men's prayer and accountability" },
        { tenantId: demoTenant.id, name: 'Ushering Ministry', description: 'Hospitality and ushering team' },
      ],
    });
    console.log('✅ Demo ministries created');
  }

  // ── Demo Members ─────────────────────────────────────────────
  const existingMembers = await prisma.member.count({ where: { tenantId: demoTenant.id } });
  if (existingMembers === 0) {
    const parish = await prisma.parish.findFirst({ where: { tenantId: demoTenant.id } });
    const sampleMembers = [
      { memberNo: 'GCC-001', fullname: 'John Kamau Mwangi', email: 'john.kamau@email.com', phone: '+254711000010', gender: 'MALE' as const, maritalStatus: 'MARRIED' as const },
      { memberNo: 'GCC-002', fullname: 'Mary Wanjiku Kariuki', email: 'mary.wanjiku@email.com', phone: '+254711000011', gender: 'FEMALE' as const, maritalStatus: 'MARRIED' as const },
      { memberNo: 'GCC-003', fullname: 'Peter Otieno Odhiambo', email: 'peter.otieno@email.com', phone: '+254711000012', gender: 'MALE' as const, maritalStatus: 'SINGLE' as const },
      { memberNo: 'GCC-004', fullname: 'Grace Njeri Gitau', email: 'grace.njeri@email.com', phone: '+254711000013', gender: 'FEMALE' as const, maritalStatus: 'SINGLE' as const },
      { memberNo: 'GCC-005', fullname: 'Samuel Kipchoge Keter', email: 'samuel.keter@email.com', phone: '+254711000014', gender: 'MALE' as const, maritalStatus: 'MARRIED' as const },
      { memberNo: 'GCC-006', fullname: 'Esther Wairimu Mugo', email: 'esther.mugo@email.com', phone: '+254711000015', gender: 'FEMALE' as const, maritalStatus: 'WIDOWED' as const },
      { memberNo: 'GCC-007', fullname: 'David Muthoni Karanja', email: 'david.karanja@email.com', phone: '+254711000016', gender: 'MALE' as const, maritalStatus: 'MARRIED' as const },
      { memberNo: 'GCC-008', fullname: 'Ruth Akinyi Ochieng', email: 'ruth.ochieng@email.com', phone: '+254711000017', gender: 'FEMALE' as const, maritalStatus: 'SINGLE' as const },
      { memberNo: 'GCC-009', fullname: 'James Njoroge Mbugua', email: 'james.mbugua@email.com', phone: '+254711000018', gender: 'MALE' as const, maritalStatus: 'MARRIED' as const },
      { memberNo: 'GCC-010', fullname: 'Lydia Chebet Rotich', email: 'lydia.rotich@email.com', phone: '+254711000019', gender: 'FEMALE' as const, maritalStatus: 'MARRIED' as const },
    ];

    for (const m of sampleMembers) {
      await prisma.member.create({
        data: {
          tenantId: demoTenant.id,
          memberNo: m.memberNo,
          fullname: m.fullname,
          email: m.email,
          phone: m.phone,
          gender: m.gender,
          maritalStatus: m.maritalStatus,
          parishId: parish?.id,
          joinedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        },
      });
    }
    console.log('✅ Demo members created');
  }

  // ── Demo Donations ───────────────────────────────────────────
  const existingDonations = await prisma.donation.count({ where: { tenantId: demoTenant.id } });
  if (existingDonations === 0) {
    const donationCategories = ['Tithe', 'Offering', 'Building Fund', 'Missions', 'Special'];
    const methods = ['CASH', 'MPESA', 'BANK_TRANSFER'] as const;
    for (let i = 0; i < 20; i++) {
      await prisma.donation.create({
        data: {
          tenantId: demoTenant.id,
          memberName: `Donor ${i + 1}`,
          amount: Math.floor(Math.random() * 10000) + 500,
          currency: 'KES',
          paymentMethod: methods[Math.floor(Math.random() * methods.length)],
          category: donationCategories[Math.floor(Math.random() * donationCategories.length)],
          donatedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        },
      });
    }
    console.log('✅ Demo donations created');
  }

  // ── Demo Assets ──────────────────────────────────────────────
  const existingAssets = await prisma.asset.count({ where: { tenantId: demoTenant.id } });
  if (existingAssets === 0) {
    await prisma.asset.createMany({
      data: [
        { tenantId: demoTenant.id, assetName: 'Church Van', assetCode: 'VEH-001', category: 'Vehicle', assetValue: 2500000, location: 'Main Campus', status: 'ACTIVE' },
        { tenantId: demoTenant.id, assetName: 'Sound System', assetCode: 'EQP-001', category: 'Equipment', assetValue: 350000, location: 'Sanctuary', status: 'ACTIVE' },
        { tenantId: demoTenant.id, assetName: 'Projector', assetCode: 'EQP-002', category: 'Equipment', assetValue: 85000, location: 'Main Hall', status: 'ACTIVE' },
        { tenantId: demoTenant.id, assetName: 'Piano', assetCode: 'EQP-003', category: 'Musical Instrument', assetValue: 450000, location: 'Sanctuary', status: 'ACTIVE' },
      ],
    });
    console.log('✅ Demo assets created');
  }

  // ── Second Demo Tenant (Calvary) ─────────────────────────────
  let calvaryTenant = await prisma.tenant.findUnique({ where: { slug: 'calvary-fellowship' } });
  if (!calvaryTenant) {
    calvaryTenant = await prisma.tenant.create({
      data: {
        name: 'Calvary Fellowship',
        slug: 'calvary-fellowship',
        email: 'admin@calvary.demo',
        phone: '+254722000000',
        address: '456 Gospel Street',
        city: 'Mombasa',
        state: 'Mombasa County',
        country: 'Kenya',
        churchType: 'Multi-Branch',
        churchSize: 'LARGE',
        numberOfBranches: 5,
        numberOfMembers: 1200,
        subscriptionPlan: SubscriptionPlan.PROFESSIONAL,
        status: TenantStatus.ACTIVE,
        isVerified: true,
        verifiedAt: new Date(),
        subscriptionEndsAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.user.create({
      data: {
        fullname: 'Bishop Samuel Omondi',
        email: 'admin@calvary.demo',
        passwordHash: await bcrypt.hash('Demo@2024', 12),
        role: UserRole.TENANT_ADMIN,
        tenantId: calvaryTenant.id,
      },
    });
    console.log('✅ Calvary Fellowship created');
  }

  // ── Third Tenant (Trial) ─────────────────────────────────────
  let trialTenant = await prisma.tenant.findUnique({ where: { slug: 'hope-chapel' } });
  if (!trialTenant) {
    trialTenant = await prisma.tenant.create({
      data: {
        name: 'Hope Chapel',
        slug: 'hope-chapel',
        email: 'admin@hopechapel.demo',
        phone: '+254733000000',
        address: '789 Blessing Road',
        city: 'Kisumu',
        country: 'Kenya',
        churchSize: 'SMALL',
        numberOfBranches: 1,
        numberOfMembers: 120,
        subscriptionPlan: SubscriptionPlan.STARTER,
        status: TenantStatus.TRIAL,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.user.create({
      data: {
        fullname: 'Reverend Alice Waweru',
        email: 'admin@hopechapel.demo',
        passwordHash: await bcrypt.hash('Demo@2024', 12),
        role: UserRole.TENANT_ADMIN,
        tenantId: trialTenant.id,
      },
    });
    console.log('✅ Hope Chapel (trial) created');
  }

  console.log('\n🎉 Database seeded successfully!');
  console.log('─'.repeat(50));
  console.log('SuperAdmin Login:');
  console.log(`  Email:    ${superAdminEmail}`);
  console.log(`  Password: ${superAdminPassword}`);
  console.log('\nDemo Tenant Login:');
  console.log('  Email:    admin@gracechurch.demo');
  console.log('  Password: Demo@2024');
  console.log('─'.repeat(50));
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
