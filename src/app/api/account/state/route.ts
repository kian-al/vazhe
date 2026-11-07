import { accountRoutes } from '@/server/account-route-dependencies';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const GET=accountRoutes.getState;
export const PUT=accountRoutes.putState;
