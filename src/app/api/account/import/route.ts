import { accountRoutes } from '@/server/account-route-dependencies';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const GET=accountRoutes.getImport;
export const POST=accountRoutes.postImport;
