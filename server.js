import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.join(__dirname,'public');

const types=new Map([
  ['.html','text/html; charset=utf-8'],
  ['.js','text/javascript; charset=utf-8'],
  ['.css','text/css; charset=utf-8'],
  ['.json','application/json; charset=utf-8'],
  ['.svg','image/svg+xml'],
]);

function safePath(urlPath){
  const pathname=decodeURIComponent((urlPath.split('?')[0]||'/'));
  const requested=pathname==='/'?'/index.html':pathname;
  const full=path.normalize(path.join(__dirname,requested.startsWith('/node_modules/')?requested:'public'+requested));
  const allowedRoot=requested.startsWith('/node_modules/')?path.join(__dirname,'node_modules'):root;
  if(full!==allowedRoot && !full.startsWith(allowedRoot+path.sep)) return null;
  return full;
}

const server=http.createServer((req,res)=>{
  try{
    const file=safePath(req.url||'/');
    if(!file){res.writeHead(403);res.end('Forbidden');return;}
    if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end('Not found');return;}
    const ext=path.extname(file);
    res.writeHead(200,{'Content-Type':types.get(ext)||'application/octet-stream','Cache-Control':'no-store'});
    fs.createReadStream(file).pipe(res);
  }catch(error){
    res.writeHead(500);
    res.end('Server error: '+error.message);
  }
});

const port=Number(process.env.PORT||4173);
server.listen(port,()=>console.log('Reality .25 running at http://localhost:'+port));
