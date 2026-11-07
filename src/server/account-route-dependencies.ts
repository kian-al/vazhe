import 'server-only';
import { verifiedAccount } from './auth';
import { database } from './db';
import { guest, sameOrigin } from './guest';
import { logEvent } from './events';
import { makeAccountRoutes } from './account-routes';

export const accountRoutes=makeAccountRoutes({
  account:verifiedAccount,
  guest:()=>guest(),
  sameOrigin,
  log:logEvent,
  database:()=>{
    const sql=database();
    return sql ? {query:async(query,params)=>sql.query(query,params)} : null;
  },
});
