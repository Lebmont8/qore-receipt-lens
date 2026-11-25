import http from 'node:http';import fs from 'node:fs';import {fileURLToPath} from 'node:url';
const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'};
const allowed=['index.html','main.mjs','lens.mjs','client.mjs','style.css','example.json'];
export function start(port=0){
 const s=http.createServer((req,res)=>{
 res.setHeader('Content-Security-Policy',"default-src 'self'; connect-src 'self' https://rpc-testnet.qore.host; script-src 'self'; style-src 'self'; form-action 'self'; worker-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
 const path=new URL(req.url,'http://localhost').pathname;const file=path==='/'?'index.html':path.slice(1);
 if(!allowed.includes(file)){res.writeHead(404);res.end();return;}
 try{const bytes=fs.readFileSync(new URL('./app/'+file,import.meta.url));res.setHeader('Content-Type',types[file.slice(file.lastIndexOf('.'))]);res.writeHead(200);res.end(req.method==='HEAD'?undefined:bytes);}catch{res.writeHead(404);res.end();}
 });return new Promise(resolve=>s.listen(port,'127.0.0.1',()=>resolve(s)));
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const s=await start(Number(process.env.PORT||4173));console.log('Qore Receipt Lens http://127.0.0.1:'+s.address().port);}
