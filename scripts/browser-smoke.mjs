// Dependency-free browser smoke check using Chromium's DevTools protocol.
// Set BROWSER_PATH if Chrome/Edge is installed elsewhere.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const browserPath = process.env.BROWSER_PATH || ['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
if (!browserPath) throw new Error('Set BROWSER_PATH to an installed Chromium executable.');
const temp = mkdtempSync(path.join(tmpdir(),'inkline-browser-'));
const server = spawn(process.execPath,['server.mjs'],{windowsHide:true,env:{...process.env,PORT:'0',DATABASE_PATH:path.join(temp,'studio.sqlite'),ADMIN_PASSWORD:'browser-test-password'},stdio:['ignore','pipe','pipe']});
let browser, ws, nextId = 0, pending = new Map(), errors = [];
const pause = ms => new Promise(resolve=>setTimeout(resolve,ms));
async function stop(child) { if (child && child.exitCode === null && child.signalCode === null) { const done = new Promise(resolve=>child.once('exit',resolve)); child.kill(); await Promise.race([done,pause(3000)]); } }
try {
  const base = await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Server did not start')),10000);server.stdout.on('data',chunk=>{const m=String(chunk).match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);resolve(m[0]);}});server.once('exit',()=>reject(new Error('Server exited')));});
  browser = spawn(browserPath,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${path.join(temp,'profile')}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
  let port;
  for(let i=0;i<100;i++){try{port=readFileSync(path.join(temp,'profile','DevToolsActivePort'),'utf8').split('\n')[0];break;}catch{await pause(100);}}
  if(!port) throw new Error('Browser did not expose DevTools.');
  const targets=await (await fetch(`http://127.0.0.1:${port}/json/list`,{signal:AbortSignal.timeout(5000)})).json();
  ws=new WebSocket(targets.find(x=>x.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('DevTools connection timeout')),5000);ws.onopen=()=>{clearTimeout(timer);resolve();};ws.onerror=e=>{clearTimeout(timer);reject(e);};});
  ws.onmessage=event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text+': '+m.params.exceptionDetails.exception?.description);};
  const command=(method,params={})=>new Promise((resolve,reject)=>{const id=++nextId;const timer=setTimeout(()=>{pending.delete(id);reject(new Error('DevTools timeout: '+method));},10000);pending.set(id,{resolve:value=>{clearTimeout(timer);resolve(value);},reject:error=>{clearTimeout(timer);reject(error);}});ws.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const result=await command('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);return result.result.value;};
  const wait=async expression=>{for(let i=0;i<100;i++){if(await evaluate(expression))return;await pause(100);}throw new Error('Timed out: '+expression);};
  const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  const fill=(selector,value)=>evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await command('Runtime.enable');await command('Page.enable');
  await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await command('Page.navigate',{url:base});
  await wait('!!document.querySelector("#artistGrid .card")');
  assert.equal(await evaluate('document.querySelectorAll("#artistGrid .card").length'),3);
  await click('[data-artist="artist-linh"]');await wait('document.querySelector("#detailDialog").open');await click('[data-choose-artist="artist-linh"]');
  assert.equal(await evaluate('document.querySelector("#bookingArtist").value'),'artist-linh');
  await fill('#bookingService','small');await fill('#bookingForm [name=date]','2099-10-06');await wait('document.querySelector("#bookingTime").options.length > 1');
  for(const [name,value] of Object.entries({customerName:'Khách trình duyệt',phone:'0901234567',placement:'Vai',notes:'Bông hoa nét mảnh',time:'10:00'}))await fill(`#bookingForm [name=${name}]`,value);
  await evaluate('document.querySelector("#bookingForm").requestSubmit()');await wait('document.querySelector("#bookingMessage").textContent.includes("Mã lịch hẹn")');
  await fill('#loginForm [name=password]','browser-test-password');await evaluate('document.querySelector("#loginForm").requestSubmit()');await wait('!!document.querySelector("#bookingRows tr [data-booking]")');
  await click('[data-booking]');await click('[data-status="Confirmed"]');await wait('!!document.querySelector("[data-status=Completed]")');
  await click('[data-reschedule]');await wait('document.querySelector("#rescheduleForm [name=time]").options.length>1');await fill('#rescheduleForm [name=time]','13:00');await evaluate('document.querySelector("#rescheduleForm").requestSubmit()');await wait('document.querySelector("#dialogContent").textContent.includes("13:00") && !document.querySelector("#rescheduleForm")');await click('.dialog-close');
  // CRUD dialogs, accented text and safe rendering of input that looks like HTML.
  await click('[data-tab="styles"]');await click('[data-edit="styles"]');await fill('#editorForm [name=name]','Phong cách <img src=x onerror=alert(1)>');await fill('#editorForm [name=description]','Mô tả có dấu');await evaluate('document.querySelector("#editorForm").requestSubmit()');await wait('!document.querySelector("#detailDialog").open');
  assert.equal(await evaluate('document.querySelectorAll("#styleList img").length'),0);
  await click('[data-tab="portfolio"]');await click('[data-edit="portfolio"][data-id="p1"]');await fill('#editorForm [name=title]','Tác phẩm đã sửa');
  const imagePath=path.join(temp,'upload.png');writeFileSync(imagePath,Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7KsAAAAASUVORK5CYII=','base64'));
  const dom=await command('DOM.getDocument');const fileNode=await command('DOM.querySelector',{nodeId:dom.root.nodeId,selector:'#editorForm input[type=file]'});await command('DOM.setFileInputFiles',{nodeId:fileNode.nodeId,files:[imagePath]});
  await evaluate('document.querySelector("#editorForm").requestSubmit()');await wait('!document.querySelector("#detailDialog").open');assert.ok(await evaluate('document.querySelector("#portfolioGrid").textContent.includes("Tác phẩm đã sửa")'));assert.ok(await evaluate('document.querySelector("#portfolioGrid img").src.startsWith("data:image/png;base64,")'));
  await click('[data-tab="settings"]');await fill('#settingsForm [name=name]','Inkline · Studio kiểm thử');await evaluate('document.querySelector("#settingsForm").requestSubmit()');await wait('document.querySelector(".brand strong").textContent === "Inkline · Studio kiểm thử"');
  await click('[data-tab="artists"]');await click('[data-toggle="artists"][data-id="artist-minh"]');await wait('document.querySelectorAll("#artistGrid .card").length === 2');await click('[data-toggle="artists"][data-id="artist-kai"]');await wait('document.querySelectorAll("#artistGrid .card").length === 1');assert.ok(await evaluate('document.querySelector("#artistField").classList.contains("hidden")'));
  await click('[data-toggle="artists"][data-id="artist-linh"]');await wait('document.querySelectorAll("#artistGrid .card").length === 0');assert.ok(await evaluate('document.querySelector("#bookingForm button[type=submit]").disabled'));
  for(const id of ['artist-minh','artist-linh','artist-kai']){await click(`[data-toggle="artists"][data-id="${id}"]`);await wait(`document.querySelector('#bookingArtist option[value="${id}"]') !== null`);}
  await click('[data-logout]');await wait('!!document.querySelector("#loginForm")');
  await evaluate('document.querySelector("#toast").classList.remove("show"); window.scrollTo({top:0,behavior:"instant"})');await pause(300);
  mkdirSync('artifacts',{recursive:true});
  let shot=await command('Page.captureScreenshot',{format:'png'});writeFileSync('artifacts/desktop.png',Buffer.from(shot.data,'base64'));
  await command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await pause(300);
  assert.ok(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'),'mobile layout must not overflow');
  await click('.nav-toggle');assert.equal(await evaluate('document.querySelector(".nav-toggle").getAttribute("aria-expanded")'),'true');await click('.main-nav a[href="#booking"]');assert.equal(await evaluate('document.querySelector(".nav-toggle").getAttribute("aria-expanded")'),'false');
  await evaluate('document.querySelector("#bookingForm").scrollIntoView({behavior:"instant",block:"start"})');await pause(300);
  shot=await command('Page.captureScreenshot',{format:'png'});writeFileSync('artifacts/mobile-booking.png',Buffer.from(shot.data,'base64'));
  assert.deepEqual(errors,[]);
  console.log('PASS: desktop + mobile; artist selection; booking; login; confirm/reschedule; CRUD; settings; XSS escaping; single/no artist; logout; no JS exceptions.');
} finally { ws?.close();await stop(browser);await stop(server);for(let i=0;i<10;i++){try{rmSync(temp,{recursive:true,force:true});break;}catch{await pause(200);}} }
