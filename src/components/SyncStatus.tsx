'use client';
import Link from 'next/link';
import { useApp } from './store';
export function SyncStatus(){
 const {syncStatus,retrySync,state}=useApp();
 const exportBackup=()=>{
  const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:"application/json"}));
  const a=document.createElement("a");a.href=url;a.download="vazhe-personal-backup.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 const labels={loading:'بررسی اتصال…',local:'فقط روی این مرورگر',saved:'ذخیره‌شده روی سرور',saving:'در حال ذخیره…',error:'ذخیرهٔ سروری تأیید نشد',conflict:'تغییر هم‌زمان؛ نسخهٔ محلی محفوظ است'};
 return <div className={`sync-status sync-${syncStatus}`} role="status" aria-live="polite">
  <span className="sync-dot" aria-hidden="true"/>
  <span>{labels[syncStatus]}</span>
  {syncStatus==='error'&&<button type="button" className="sync-retry" onClick={retrySync}>تلاش دوباره</button>}
  {(syncStatus==='error'||syncStatus==='conflict')&&<button type="button" className="sync-retry" onClick={exportBackup}>دریافت نسخهٔ پشتیبان</button>}
  <Link href="/about" aria-label="دربارهٔ ذخیره‌سازی و منابع">جزئیات</Link>
 </div>;
}
