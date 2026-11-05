import { readFile } from 'node:fs/promises';
import path from 'node:path';
export async function GET(){
 const data=await readFile(path.join(process.cwd(),'data/extension.zip.b64'),'utf8');
 return new Response(Buffer.from(data.trim(),'base64'),{headers:{'Content-Type':'application/zip','Content-Disposition':'attachment; filename="vazhe-extension.zip"','Cache-Control':'public, max-age=3600'}});
}
