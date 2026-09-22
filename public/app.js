const canvas = document.querySelector('#scene');
const output = document.querySelector('#output');
const stats = document.querySelector('#stats');
const list = document.querySelector('#reality-list');
const mode = document.querySelector('#mode');
const pathLabel = document.querySelector('#path');
const selection = document.querySelector('#selection');
const selectionSub = document.querySelector('#selection-sub');

const ctx = canvas.getContext('2d');
let engine = null;
let controller = null;
let projection = null;
let three = null;
let controls = null;
let renderer = null;
let camera = null;
let selected = 'NUCLEUS';
let lastStep = performance.now();
let useFallback2D = true;

function resizeCanvas2D(){
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  ctx.setTransform(dpr,0,0,dpr,0,0);
}

function fallbackPosition(vector, width, height, radius){
  const [x,y,z] = vector;
  const len = Math.hypot(x,y,z) || 1;
  const scale = radius / len;
  const sx = x * scale;
  const sy = y * scale - z * scale * .55;
  return [width/2 + sx, height/2 - sy];
}

function drawFallback(){
  resizeCanvas2D();
  const rect = canvas.getBoundingClientRect();
  const w=rect.width,h=rect.height;
  ctx.clearRect(0,0,w,h);

  const gradient=ctx.createRadialGradient(w*.5,h*.48,20,w*.5,h*.48,Math.max(w,h)*.65);
  gradient.addColorStop(0,'#0d1a32');
  gradient.addColorStop(1,'#050812');
  ctx.fillStyle=gradient;
  ctx.fillRect(0,0,w,h);

  const center=[w/2,h/2];
  const radius=Math.min(w,h)*.31;

  ctx.lineWidth=1;
  for(let i=0;i<18;i++){
    const reality=[...engine.realties.values()][i];
    const [x,y]=fallbackPosition(reality.address.vector,w,h,radius);
    ctx.strokeStyle='rgba(99,160,215,.18)';
    ctx.beginPath();
    ctx.moveTo(center[0],center[1]);
    ctx.lineTo(x,y);
    ctx.stroke();
  }

  for(const edge of engine.edges.values()){
    if(!edge.active) continue;
    const a=engine.getReality(edge.from).address.vector;
    const b=engine.getReality(edge.to).address.vector;
    const pa=fallbackPosition(a,w,h,radius);
    const pb=fallbackPosition(b,w,h,radius);
    ctx.strokeStyle=edge.type==='fold'?'rgba(242,198,111,.9)':'rgba(99,200,255,.65)';
    ctx.setLineDash(edge.type==='fold'?[7,5]:[]);
    ctx.lineWidth=edge.type==='fold'?2:1.5;
    ctx.beginPath();
    ctx.moveTo(pa[0],pa[1]);
    ctx.lineTo(pb[0],pb[1]);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  for(const reality of engine.realties.values()){
    const [x,y]=fallbackPosition(reality.address.vector,w,h,radius);
    const active=selected===reality.id;
    const activity=Number(reality.localState.activity||0);
    const r=6+activity*8+(active?5:0);
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fillStyle=reality.address.vector.filter(Boolean).length===1?'#4ca8ff':'#9b7cff';
    if(active) ctx.shadowBlur=18,ctx.shadowColor='#ffffff';
    ctx.fill();
    ctx.shadowBlur=0;
    ctx.fillStyle='#dcecff';
    ctx.font='11px system-ui';
    ctx.textAlign='center';
    ctx.fillText(reality.id,x,y-12-r);
  }

  ctx.save();
  ctx.translate(center[0],center[1]);
  const s=20;
  ctx.fillStyle='#f3cf73';
  ctx.fillRect(-s/2,-s/2,s,s);
  ctx.strokeStyle='#fff4cd';
  ctx.strokeRect(-s/2,-s/2,s,s);
  ctx.fillStyle='#fff';
  ctx.font='10px system-ui';
  ctx.textAlign='center';
  ctx.fillText('NUCLEUS',0,36);
  ctx.restore();
}

function pretty(value){
  return JSON.stringify(value,null,2);
}

function renderRealityList(){
  list.innerHTML='';
  for(const reality of engine.realties.values()){
    const item=document.createElement('button');
    item.className='reality-item'+(selected===reality.id?' active':'');
    item.innerHTML='<strong>'+reality.id+'</strong><span>'+reality.address.label+' · '+reality.localState.status+'</span>';
    item.addEventListener('click',()=>select(reality.id));
    list.appendChild(item);
  }
}

function updateStats(){
  const s=engine.stats();
  stats.innerHTML=[
    ['18','primary'],
    [s.activeConnections,'links'],
    [s.folds,'folds'],
    [s.branches,'branches'],
    [s.events,'events'],
    [s.totalTicks.toFixed(0),'ticks'],
  ].map(([v,l])=>'<div class="stat"><b>'+v+'</b><span>'+l+'</span></div>').join('');
}

function select(id){
  selected=id;
  if(projection) projection.selectReality(id);
  renderRealityList();

  if(id==='NUCLEUS'){
    mode.textContent='NUCLEUS';
    pathLabel.textContent='shared origin · '+engine.stats().activeConnections+' live links';
    selection.textContent='Central Nucleus';
    selectionSub.textContent='Reference anchor — direct graph traffic never has to pass through it.';
  }else{
    const reality=engine.getReality(id);
    const neighbours=engine.activeNeighbors(id);
    mode.textContent=id;
    pathLabel.textContent=reality.address.vector.join(',')+' · '+neighbours.length+' direct connections · '+reality.address.direction.map(v=>v.toFixed(2)).join(',');
    selection.textContent=id+' · '+reality.address.label;
    selectionSub.textContent='activity '+Number(reality.localState.activity).toFixed(2)+' · tick '+reality.timeline.tick.toFixed(0)+' · '+reality.events.length+' events';
  }
  drawFallback();
}

function run(command){
  try{
    const result=controller.run(command);
    output.textContent=typeof result.result==='string'?result.result:pretty(result.result);
    if(/^SELECT\s+/i.test(command)) select(command.trim().split(/\s+/)[1].toUpperCase());
    if(/^ENTER\s+/i.test(command)) select(command.trim().split(/\s+/)[1].toUpperCase());
    if(command.toUpperCase()==='RETURN TO NUCLEUS') select('NUCLEUS');
    if(['CONNECT ','DISCONNECT ','FOLD '].some(prefix=>command.toUpperCase().startsWith(prefix))){
      projection?.update();
    }
    updateStats();
    drawFallback();
    return result;
  }catch(error){
    output.textContent='ERROR: '+error.message;
    return null;
  }
}

async function start(){
  try{
    const [
      threeModule,
      controlsModule,
      latticeModule,
      controllerModule,
      sceneModule
    ]=await Promise.all([
      import('three'),
      import('./node_modules/three/examples/jsm/controls/OrbitControls.js'),
      import('./reality-field.js'),
      import('./reality-controller.js'),
      import('./reality-field-scene.js'),
    ]);

    three=threeModule;
    const {OrbitControls}=controlsModule;
    const {RealityField}=latticeModule;
    const {createRealityController}=controllerModule;
    const {buildRealityFieldScene}=sceneModule;

    engine=new RealityField();
    controller=createRealityController(engine);

    engine.connect('R01','R07');
    engine.connect('R07','R15');
    engine.connect('R15','R18');
    engine.connect('R02','R10');
    engine.connect('R10','R16');
    engine.connect('R05','R11');
    engine.fold('R01','R18');

    try{
      renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1,2));
      renderer.setClearColor(0x050812,1);

      const scene=new THREE.Scene();
      scene.fog=new THREE.FogExp2(0x050812,.035);
      camera=new THREE.PerspectiveCamera(42,1,.1,100);
      camera.position.set(9,7,11);
      camera.lookAt(0,0,0);

      controls=new OrbitControls(camera,canvas);
      controls.target.set(0,0,0);
      controls.enableDamping=true;
      controls.dampingFactor=.06;
      controls.minDistance=7;
      controls.maxDistance=22;
      controls.update();

      scene.add(new THREE.AmbientLight(0x7696cc,.7));
      const key=new THREE.PointLight(0x93d5ff,110,32,2);
      key.position.set(4,6,7);
      scene.add(key);
      const gold=new THREE.PointLight(0xffc86a,75,26,2);
      gold.position.set(-4,-2,3);
      scene.add(gold);

      projection=buildRealityFieldScene({THREE,parent:scene,field:engine,radius:4.6});
      projection.selectReality('NUCLEUS');
      useFallback2D=false;

      function resize3D(){
        const rect=canvas.getBoundingClientRect();
        renderer.setSize(Math.max(1,rect.width),Math.max(1,rect.height),false);
        camera.aspect=Math.max(1,rect.width)/Math.max(1,rect.height);
        camera.updateProjectionMatrix();
      }
      addEventListener('resize',resize3D);
      resize3D();

      function frame(time){
        const elapsed=time/1000;
        if(time-lastStep>250){
          engine.step(.25);
          lastStep=time;
          updateStats();
        }
        projection.animate(elapsed);
        controls.update();
        renderer.render(scene,camera);
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }catch(webglError){
      useFallback2D=true;
      output.textContent='3D renderer unavailable — showing the same engine through the 2D field fallback.\n'+webglError.message;
    }

    renderRealityList();
    select('NUCLEUS');
    run('SHOW FIELD');
  }catch(error){
    output.textContent='ENGINE START ERROR: '+error.message;
    canvas.replaceWith(canvas);
  }
}

document.querySelector('#command-form').addEventListener('submit',event=>{
  event.preventDefault();
  const input=document.querySelector('#command');
  run(input.value);
  input.select();
});

document.querySelectorAll('[data-command]').forEach(button=>{
  button.addEventListener('click',()=>run(button.dataset.command));
});

window.addEventListener('resize',()=>{if(useFallback2D)drawFallback()});
resizeCanvas2D();
ctx.fillStyle='#93a9c7';
ctx.font='14px system-ui';
ctx.textAlign='center';
ctx.fillText('Starting Reality .25 engine…',canvas.clientWidth/2,canvas.clientHeight/2);

start();
