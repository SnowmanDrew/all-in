// Runs on every Vercel deploy: stamps the build with its commit and date so testers can say which build they played.
import {writeFileSync} from 'node:fs';
const sha=(process.env.VERCEL_GIT_COMMIT_SHA||'dev').slice(0,7);
const d=new Date();const date=d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Europe/London'});
writeFileSync('version.js',`window.ALLIN_BUILD=${JSON.stringify({sha,date,env:process.env.VERCEL_ENV||'local'})};\n`);
console.log('build',sha,date);
