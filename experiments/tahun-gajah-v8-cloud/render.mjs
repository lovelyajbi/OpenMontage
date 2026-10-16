import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const base = path.resolve(process.cwd());
const width = Number(process.env.RENDER_WIDTH ?? 360);
const height = Number(process.env.RENDER_HEIGHT ?? 640);
const fps = Number(process.env.RENDER_FPS ?? 24);
const duration = Number(process.env.RENDER_SECONDS ?? 2);
const count = Math.round(fps * duration);
const outputDir = path.join(base, 'output');
const framesDir = path.join(outputDir, 'frames');
const videoPath = path.join(outputDir, 'TAHUN_GAJAH_V8_CLOUD_SMOKE.mp4');
await fs.mkdir(framesDir, {recursive:true});

const mime = (f) => {
  if(f.endsWith('.js')||f.endsWith('.mjs')) return 'text/javascript; charset=utf-8';
  if(f.endsWith('.html')) return 'text/html; charset=utf-8';
  if(f.endsWith('.css')) return 'text/css; charset=utf-8';
  if(f.endsWith('.json')) return 'application/json; charset=utf-8';
  return 'application/octet-stream';
};
const server = http.createServer(async (req,res) => {
  try {
    const u = new URL(req.url, 'http://localhost');
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '');
    const filename = path.resolve(base, rel || 'index.html');
    if (!(filename === base || filename.startsWith(base+path.sep))) {
      res.writeHead(403); res.end('Forbidden');return;
    }
    const data=await fs.readFile(filename);
    res.writeHead(200,{'Content-Type':mime(filename),'Cache-Control':'no-store'});
    res.end(data);
  } catch (err) {res.writeHead(404);res.end(String(err.message));}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port;

let browser;
try {
  const candidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser','/opt/google/chrome/chrome'].filter(Boolean);
  const chrome=candidates.find(x=>existsSync(x));
  if(!chrome) throw new Error('No Chrome/Chromium binary found on GitHub runner');
  console.log('CHROME_BIN:',chrome);
  browser=await puppeteer.launch({
    executablePath:chrome,
    headless:true,
    args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--ignore-gpu-blocklist','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox']
  });
  const page=await browser.newPage();
  await page.setViewport({width,height,deviceScaleFactor:1});
  page.on('console', m=>{if(m.type()==='error')console.error('BROWSER:',m.text());});
  page.on('pageerror',err=>console.error('PAGEERROR:',err.message));
  await page.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'networkidle0',timeout:120000});
  await page.waitForFunction(()=>window.__V8_READY__===true,{timeout:120000});
  const webgl=await page.evaluate(()=>({renderer:window.__V8_RENDERER__,size:[innerWidth,innerHeight]}));
  console.log('WEBGL_READY:',JSON.stringify(webgl));
  for(let i=0;i<count;i++){
    const time=i/fps;
    const result=await page.evaluate((t)=>window.renderAt(t),time);
    if(result!==true)throw new Error('renderAt returned false for frame '+i);
    const file=path.join(framesDir,'f_'+String(i).padStart(5,'0')+'.png');
    await page.screenshot({path:file,type:'png',captureBeyondViewport:false});
    if(i%12===0||i===count-1)console.log('rendered',i+1,'/',count);
  }
  await new Promise((resolve,reject)=>{
    const p=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate',String(fps),'-i',path.join(framesDir,'f_%05d.png'),'-c:v','libx264','-pix_fmt','yuv420p','-crf','19','-movflags','+faststart',videoPath],{stdio:'inherit'});
    p.on('close',code=>code===0?resolve():reject(new Error('ffmpeg failed '+code)));
    p.on('error',reject);
  });
  const probe=spawnSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height,nb_frames,r_frame_rate','-show_entries','format=duration','-of','json',videoPath],{encoding:'utf8'});
  if(probe.status!==0)throw new Error('ffprobe failed '+probe.stderr);
  const metadata=JSON.parse(probe.stdout);
  console.log('MP4_VERIFIED:',JSON.stringify(metadata));
  if(!existsSync(videoPath))throw new Error('Missing MP4 output');
} finally {
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
