import * as THREE from 'three';
import {OrbitControls} from '/node_modules/three/examples/jsm/controls/OrbitControls.js';
import {RealityField} from '../reality-field.js';
import {createRealityController} from '../reality-controller.js';
import {buildRealityFieldScene} from '../reality-field-scene.js';

const canvas=document.querySelector('#scene');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setClearColor(0x050812,1);

const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0x050812,.035);

const camera=new THREE.PerspectiveCamera(42,1,.1,100);
camera.position.set(9,7,11);

const controls=new OrbitControls(camera,canvas);
controls.enableDamping=true;
controls.dampingFactor=.06;
controls.minDistance=7;
controls.maxDistance=22;

scene.add(new THREE.AmbientLight(0x7696cc,.55));
const key=new THREE.PointLight(0x93d5ff,90,30,2);
key.position.set(4,6,7);
scene.add(key);
const gold=new THREE.PointLight(0xffc86a,65,26,2);
gold.position.set(-4,-2,3);
scene.add(gold);

const field=new RealityField();
const controller=createRealityController(field);

// Seed a living topology. These are real graph edges, not nucleus routing.
field.connect('R01','R07');
field.connect('R07','R15');
field.connect('R15','R18');
field.connect('R02','R10');
field.connect('R10','R16');
field.connect('R05','R11');
field.fold('R01','R18');

const projection=buildRealityFieldScene({THREE,parent:scene,field,radius:4.6});
projection.selectReality('NUCLEUS');

const raycaster=new THREE.Raycaster();
const pointer=new THREE.Vector2();
let selected='NUCLEUS';
let lastStep=performance.now();

const stats=document.querySelector('#stats');
const list=document.querySelector('#reality-list');
const mode=document.querySelector('#mode');
const path=document.querySelector('#path');
const selection=document.querySelector('#selection');
const selectionSub=document.querySelector('#selection-sub');
const output=document.querySelector('#output');

function resize(){
  const rect=canvas.getBoundingClientRect();
  renderer.setSize(rect.width,rect.height,false);
  camera.aspect=rect.width/Math.max(1,rect.height);
  camera.updateProjectionMatrix();
}
addEventListener('resize',resize);
resize();

function pretty(value){
  return JSON.stringify(value,null,2);
}

function renderRealityList(){
  list.innerHTML='';
  for(const reality of field.realties.values()){
    const item=document.createElement('button');
    item.className='reality-item'+(selected===reality.id?' active':'');
    item.innerHTML='<strong>'+reality.id+'</strong><span>'+reality.address.branch+' · '+reality.localState.status+'</span>';
    item.addEventListener('click',()=>select(reality.id));
    list.appendChild(item);
  }
}

function updateStats(){
  const s=field.stats();
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
  projection.selectReality(id);
  renderRealityList();
  if(id==='NUCLEUS'){
    mode.textContent='NUCLEUS';
    path.textContent='shared origin · '+field.stats().activeConnections+' live links';
    selection.textContent='Central Nucleus';
    selectionSub.textContent='Reference anchor — not a routing hub.';
  }else{
    const reality=field.getReality(id);
    const neighbours=field.activeNeighbors(id);
    mode.textContent=id;
    path.textContent=reality.address.vector.join(',')+' · '+neighbours.length+' direct connections';
    selection.textContent=id+' · '+reality.address.branch+' branch';
    selectionSub.textContent='activity '+Number(reality.localState.activity).toFixed(2)+' · tick '+reality.timeline.tick.toFixed(0)+' · '+reality.events.length+' events';
  }
}

function run(command){
  try{
    const result=controller.run(command);
    output.textContent=typeof result.result==='string'?result.result:pretty(result.result);
    if(command.startsWith('SELECT ')) select(command.split(/\s+/)[1]);
    if(command.startsWith('ENTER ')) select(command.split(/\s+/)[1]);
    if(command==='RETURN TO NUCLEUS') select('NUCLEUS');
    if(['CONNECT ','DISCONNECT ','FOLD '].some(prefix=>command.startsWith(prefix))) projection.update();
    if(command.startsWith('EMIT ')||command.startsWith('SET ')||command.startsWith('STEP ')) updateStats();
    updateStats();
    return result;
  }catch(error){
    output.textContent='ERROR: '+error.message;
    return null;
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

canvas.addEventListener('pointerdown',event=>{
  const rect=canvas.getBoundingClientRect();
  pointer.x=((event.clientX-rect.left)/rect.width)*2-1;
  pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;
  raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects([...projection.nodes.values(),projection.nucleus],false);
  const hit=hits[0];
  if(hit?.object?.userData?.realityId) select(hit.object.userData.realityId);
});

renderRealityList();
select('NUCLEUS');
run('SHOW FIELD');

function frame(time){
  const elapsed=time/1000;
  if(time-lastStep>250){
    field.step(.25);
    lastStep=time;
    updateStats();
  }
  projection.animate(elapsed);
  controls.update();
  renderer.render(scene,camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
