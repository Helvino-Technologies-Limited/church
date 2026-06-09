import { Router } from 'express';
import { authenticate, requireSuperAdmin, checkTenantActive } from '../middleware/auth';
import authRoutes from './auth';
import superAdminTenantsRoutes from './superadmin/tenants';
import superAdminDashboardRoutes from './superadmin/dashboard';
import superAdminAnalyticsRoutes from './superadmin/analytics';
import superAdminSupportRoutes from './superadmin/support';
import superAdminAuditLogsRoutes from './superadmin/auditLogs';
import tenantDashboardRoutes from './tenant/dashboard';
import tenantMembersRoutes from './tenant/members';
import tenantDonationsRoutes from './tenant/donations';
import tenantExpensesRoutes from './tenant/expenses';
import tenantEmployeesRoutes from './tenant/employees';
import tenantAssetsRoutes from './tenant/assets';
import tenantParishesRoutes from './tenant/parishes';
import tenantMinistriesRoutes from './tenant/ministries';
import tenantEventsRoutes from './tenant/events';
import tenantAttendanceRoutes from './tenant/attendance';
import tenantPayrollRoutes from './tenant/payroll';
import tenantReportsRoutes from './tenant/reports';
import tenantSettingsRoutes from './tenant/settings';
import tenantNotificationsRoutes from './tenant/notifications';
import tenantVisitorsRoutes from './tenant/visitors';
import tenantBaptismsRoutes from './tenant/baptisms';
import tenantFundCategoriesRoutes from './tenant/fundCategories';

const router = Router();

router.use('/auth', authRoutes);

// SuperAdmin routes
const sa = [authenticate, requireSuperAdmin];
router.use('/superadmin/tenants', sa, superAdminTenantsRoutes);
router.use('/superadmin/dashboard', sa, superAdminDashboardRoutes);
router.use('/superadmin/analytics', sa, superAdminAnalyticsRoutes);
router.use('/superadmin/support', sa, superAdminSupportRoutes);
router.use('/superadmin/audit-logs', sa, superAdminAuditLogsRoutes);

// Tenant routes — authenticate + verify tenant is active/within trial
const ta = [authenticate, checkTenantActive];
router.use('/tenant/dashboard', ta, tenantDashboardRoutes);
router.use('/tenant/members', ta, tenantMembersRoutes);
router.use('/tenant/donations', ta, tenantDonationsRoutes);
router.use('/tenant/expenses', ta, tenantExpensesRoutes);
router.use('/tenant/employees', ta, tenantEmployeesRoutes);
router.use('/tenant/assets', ta, tenantAssetsRoutes);
router.use('/tenant/parishes', ta, tenantParishesRoutes);
router.use('/tenant/ministries', ta, tenantMinistriesRoutes);
router.use('/tenant/events', ta, tenantEventsRoutes);
router.use('/tenant/attendance', ta, tenantAttendanceRoutes);
router.use('/tenant/payroll', ta, tenantPayrollRoutes);
router.use('/tenant/reports', ta, tenantReportsRoutes);
router.use('/tenant/settings', ta, tenantSettingsRoutes);
router.use('/tenant/notifications', ta, tenantNotificationsRoutes);
router.use('/tenant/visitors', ta, tenantVisitorsRoutes);
router.use('/tenant/baptisms', ta, tenantBaptismsRoutes);
router.use('/tenant/fund-categories', ta, tenantFundCategoriesRoutes);

export default router;
