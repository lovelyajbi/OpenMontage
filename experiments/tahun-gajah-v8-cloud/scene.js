import * as THREE from './node_modules/three/build/three.module.js';

// Original code-built scene: no images, external meshes, or AI media.
// This is an engineering smoke test, not a photorealism claim.
const W=innerWidth,H=innerHeight;
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,alpha:false});
renderer.setSize(W,H,false);
renderer.setPixelRatio(1);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.36;
renderer.outputColorSpace=THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene=new THREE.Scene();
scene.background=new THREE.Color(0xc6a88f);
scene.fog=new THREE.FogExp2(0xc6a88f,0.019);
const camera=new THREE.PerspectiveCamera(46,W/H,.15,100);
const hemi=new THREE.HemisphereLight(0xe1ebf0,0x8b5b37,2.0);
scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffd6a5,3.1);
sun.position.set(-6,12,8);
sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.left=-18;
sun.shadow.camera.right=18;
sun.shadow.camera.top=18;
sun.shadow.camera.bottom=-18;
sun.shadow.camera.near=0.5;
sun.shadow.camera.far=60;
sun.shadow.bias=-0.0003;
scene.add(sun);

let seed=54993;
const rng=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
const rand=(a,b)=>a+(b-a)*rng();
const mat=(color,roughness=0.9,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const sand=mat(0xb9a17f),stone=mat(0xbca78e),adobe=[mat(0xa68b71),mat(0xb79b80),mat(0xc9b096),mat(0x987964)];
const skin=mat(0x777269),skinDark=mat(0x686259),ivory=mat(0xe2d6bd,.62);
const cloth=mat(0x703f30),clothTrim=mat(0xb59465),hood=mat(0x6a5541),plantmat=mat(0x83795b);
const cube=new THREE.BoxGeometry(1,1,1);
const ball=new THREE.SphereGeometry(1,20,14);
function mesh(geo,material,parent,pos,scale,shadow=true){
  const ob=new THREE.Mesh(geo,material);
  if(pos)ob.position.set(...pos);
  if(scale)ob.scale.set(...scale);
  ob.castShadow=shadow;ob.receiveShadow=true;
  parent.add(ob);return ob;
}
function ell(parent,name,p,s,material){
  const o=mesh(ball,material,parent,p,s);o.name=name;return o;
}
function cyl(parent,name,r1,r2,height,p,material,rot){
  const o=mesh(new THREE.CylinderGeometry(r1,r2,height,12),material,parent,p);
  o.name=name;if(rot)o.rotation.set(...rot);return o;
}
const terrainGeo=new THREE.PlaneGeometry(95,95,80,80);
terrainGeo.rotateX(-Math.PI/2);
const pts=terrainGeo.attributes.position;
for(let i=0;i<pts.count;i++){
  const x=pts.getX(i),z=pts.getZ(i);
  pts.setY(i,0.065*Math.sin(x*0.42)*Math.cos(z*.31)+0.045*Math.sin(x*1.31+z*.8));
}
pts.needsUpdate=true;terrainGeo.computeVertexNormals();
mesh(terrainGeo,sand,scene,[0,-.09,0],null,false).receiveShadow=true;

// Ancient settlement: actual nested wall meshes, recessed doors, parapets, and clutter.
const city=new THREE.Group();
scene.add(city);
for(let i=0;i<98;i++){
  const x=6+rand(0,32),z=rand(-25,15);
  if(z>0 && x<14)continue;
  const w=rand(.85,2.65),d=rand(.8,2.5),h=rand(1.4,4.6);
  const group=new THREE.Group();group.position.set(x,0,z);
  city.add(group);
  const tone=adobe[Math.floor(rng()*adobe.length)];
  mesh(cube,tone,group,[0,h/2,0],[w,h,d]);
  mesh(cube,tone,group,[0,h+.13,0],[w+.22,.25,d+.21]);
  if(rng()<.38){
    const cap=mat(0x8c7059);
    mesh(cube,cap,group,[0,h+.28,0],[w+.2,.07,d+.2]);
  }
  const black=mat(0x544638);
  mesh(cube,black,group,[0,.64,d/2+.015],[.46,1.27,.035]);
  if(rng()>.24)mesh(cube,black,group,[w/4,h*.63,d/2+.02],[.24,.37,.05]);
  for(let p=0;p<4;p++){
    const rx=(p-1.5)*w/4;
    mesh(cube,tone,group,[rx,h+.35,d/2],[w/8,.17,.19]);
  }
}
// Procedural stone detail: instanced for low render overhead.
const rockGeo=new THREE.DodecahedronGeometry(.12,0);
const rocks=new THREE.InstancedMesh(rockGeo,stone,950);
const tmp=new THREE.Object3D();
for(let i=0;i<950;i++){
  const x=rand(-18,24),z=rand(-14,17);
  const s=rand(.22,1.7);
  tmp.position.set(x,-.01,z);tmp.rotation.set(rand(0,3),rand(0,3),rand(0,3));
  tmp.scale.set(s,s*.48,s*rand(.8,2));tmp.updateMatrix();rocks.setMatrixAt(i,tmp.matrix);
}
rocks.instanceMatrix.needsUpdate=true;rocks.receiveShadow=true;scene.add(rocks);
const twigGeo=new THREE.ConeGeometry(.055,.45,4);
const twigs=new THREE.InstancedMesh(twigGeo,plantmat,480);
for(let i=0;i<480;i++){
  const x=rand(-22,15),z=rand(-14,15),s=rand(.45,1.5);
  tmp.position.set(x,.22*s,z);tmp.rotation.set(0,rand(0,6.28),rand(-.14,.14));
  tmp.scale.set(s,s,s);tmp.updateMatrix();twigs.setMatrixAt(i,tmp.matrix);
}
twigs.instanceMatrix.needsUpdate=true;scene.add(twigs);

function taper(parent,material,points,radii){
  const verts=[],inds=[],rings=points.length,radial=11;
  for(let i=0;i<rings;i++){
    const p=points[i],r=radii[i];
    for(let j=0;j<radial;j++){
      const theta=2*Math.PI*j/radial;
      const dx=(i<rings-1?points[i+1].x-p.x:p.x-points[i-1].x);
      const dy=(i<rings-1?points[i+1].y-p.y:p.y-points[i-1].y);
      const tangent=new THREE.Vector3(dx,dy,0).normalize();
      let perp=new THREE.Vector3(-tangent.y,tangent.x,0).normalize();
      verts.push(p.x+perp.x*r*Math.cos(theta),p.y+perp.y*r*Math.cos(theta),p.z+r*Math.sin(theta));
    }
  }
  for(let i=0;i<rings-1;i++)for(let j=0;j<radial;j++){
    const a=i*radial+j,b=i*radial+(j+1)%radial,c=(i+1)*radial+j,d=(i+1)*radial+(j+1)%radial;
    inds.push(a,b,d,a,d,c);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
  g.setIndex(inds);g.computeVertexNormals();return mesh(g,material,parent);
}
function elephant(tag,pos,scale,phase){
  const root=new THREE.Group();root.position.set(...pos);root.scale.setScalar(scale);scene.add(root);
  const rig=new THREE.Group();root.add(rig);
  ell(rig,tag+'_organic_torso',[-.26,2.55,0],[1.95,1.23,1.09],skin);
  ell(rig,tag+'_shoulder',[.84,2.68,0],[1.15,1.24,1.05],skin);
  ell(rig,tag+'_skull',[1.7,2.8,0],[.83,.92,.85],skin);
  ell(rig,tag+'_jaw',[2.10,2.31,0],[.53,.46,.58],skinDark);
  for(const side of [-1,1]){
    const ear=ell(rig,tag+'_ear',[1.04,3.04,side*.91],[.17,.79,.70],skin);
    ear.rotation.x=side*.22;
    ell(rig,tag+'_earfold',[1.09,2.99,side*1.01],[.095,.57,.45],skinDark);
    ell(rig,tag+'_eye',[2.10,3.09,side*.66],[.10,.10,.05],skinDark);
    taper(rig,ivory,[
      new THREE.Vector3(2.08,2.32,side*.5),
      new THREE.Vector3(2.66,2.15,side*.65),
      new THREE.Vector3(3.02,2.31,side*.7),
      new THREE.Vector3(3.19,2.62,side*.73)],
      [.17,.155,.12,.045]);
  }
  const trunkPivot=new THREE.Group();trunkPivot.position.set(2.32,2.50,0);rig.add(trunkPivot);
  taper(trunkPivot,skin,[
    new THREE.Vector3(0,0,0),new THREE.Vector3(.21,-.34,0),
    new THREE.Vector3(.33,-.82,0),new THREE.Vector3(.30,-1.36,0),
    new THREE.Vector3(.50,-1.63,0),new THREE.Vector3(.73,-1.55,0)],
    [.38,.34,.27,.20,.16,.11]);
  const saddle=mesh(cube,cloth,rig,[-.54,3.73,0],[1.65,.12,1.62]);
  saddle.rotation.z=.05;
  mesh(cube,clothTrim,rig,[-.54,3.81,0],[1.70,.045,1.70]);
  mesh(cube,cloth,rig,[-.80,3.27,.93],[1.1,.95,.065]);
  mesh(cube,cloth,rig,[-.80,3.27,-.93],[1.1,.95,.065]);

  const legs=[];
  for(const rear of [true,false])for(const side of [-1,1]){
    const pivot=new THREE.Group();
    pivot.position.set(rear?-1.33:1.12,1.91,side*.76);
    rig.add(pivot);
    ell(pivot,tag+'_upper_leg',[0,-.49,0],[.41,.65,.44],skin);
    ell(pivot,tag+'_lower_leg',[.015,-1.11,0],[.335,.52,.33],skin);
    const foot=ell(pivot,tag+'_foot',[.13,-1.63,.015],[.49,.31,.40],skinDark);
    for(let k=0;k<3;k++)ell(pivot,tag+'_nail',[.45+(k===1?.045:0),-1.80,(k-1)*.2],[.12,.065,.075],ivory);
    legs.push({pivot,phase:phase+(rear?1.5:0)+(side===1?Math.PI:0)});
  }
  const rider=new THREE.Group();rider.position.set(-.49,3.75,0);rig.add(rider);
  cyl(rider,'faceless_robed_torso',.31,.49,1.0,[0,.60,0],hood);
  ell(rider,'featureless_head',[0,1.22,0],[.26,.31,.25],hood);
  ell(rider,'hood',[0,1.28,0],[.34,.35,.30],hood);
  mesh(cube,cloth,rider,[0,1.16,.27],[.45,.39,.08]);
  for(const side of [-1,1]){
    ell(rider,'sleeve',[0,.76,side*.40],[.23,.51,.22],hood);
    ell(rider,'leg',[.19,.16,side*.32],[.16,.48,.21],hood);
  }
  return {root,rig,trunkPivot,rider,legs,pos:[...pos],phase};
}
const herd=[
 elephant('HERO',[-2.3,.06,.38],1,0.35),
 elephant('FOLLOWER_1',[-7.5,.05,-4.1],.81,2.6),
 elephant('FOLLOWER_2',[-12,.04,2.9],.68,1.7)
];
const people=[];
function soldier(x,z,offset){
 const r=new THREE.Group();r.position.set(x,0,z);scene.add(r);
 cyl(r,'faceless_soldier_robe',.21,.35,1.25,[0,.85,0],hood);
 ell(r,'featureless_soldier_head',[0,1.78,0],[.22,.28,.22],hood);
 ell(r,'face_veil',[.17,1.77,0],[.05,.17,.18],cloth);
 for(let side of [-1,1]){
   const limb=new THREE.Group();limb.position.set(0,1.06,side*.22);r.add(limb);
   ell(limb,'sleeve',[0,-.22,side*.1],[.16,.37,.18],hood);
   const foot=new THREE.Group();foot.position.set(0,.41,side*.16);r.add(foot);
   ell(foot,'leg',[0,-.21,0],[.17,.43,.18],hood);
   people.push({root:foot,phase:offset+(side===1?0:Math.PI),kind:'foot'});
   people.push({root:limb,phase:offset+(side===-1?0:Math.PI),kind:'arm'});
 }
 r.rotation.y=0;
 people.push({root:r,phase:offset,kind:'person',startX:x});
}
soldier(-3.8,3.2,.2);soldier(-.9,4.1,2.5);soldier(-7.2,2.4,1.9);soldier(-9,-1.7,3.5);
const dust=[];
const dustMat=new THREE.MeshBasicMaterial({color:0xd7bb98,transparent:true,opacity:.12,depthWrite:false});
for(let i=0;i<28;i++){
  const ob=ell(scene,'dust',[-2,0,0],[.15,.13,.15],dustMat);
  ob.castShadow=false;dust.push({ob,phase:rand(0,6.28),life:rand(.3,1.2),angle:rand(0,6.28)});
}

const path=new THREE.Vector3();
function renderAt(time){
  const cycle=time*2.5;
  for(const e of herd){
    e.root.position.x=e.pos[0]+time*.53;
    e.rig.position.y=.045*Math.cos(cycle*2+e.phase);
    e.rig.rotation.z=.018*Math.sin(cycle+e.phase);
    e.trunkPivot.rotation.z=.07*Math.sin(cycle*.7+e.phase);
    e.rider.rotation.z=.028*Math.sin(cycle+e.phase+0.6);
    for(const leg of e.legs){
      const v=cycle+leg.phase;
      const swing=Math.sin(v);
      leg.pivot.rotation.z=.22*swing;
    }
  }
  for(const p of people){
    if(p.kind==='person')p.root.position.x=p.startX+time*.48;
    else p.root.rotation.z=Math.sin(cycle*1.4+p.phase)*(p.kind==='arm'?.23:.18);
  }
  for(let i=0;i<dust.length;i++){
    const p=dust[i],age=(time*.57+p.life)%1;
    p.ob.position.set(-2.6+Math.cos(p.angle)*age*1.5+time*.54,age*.65,-.2+Math.sin(p.angle)*age*.9);
    const a=.03+age*.56;p.ob.scale.set(a,a*.62,a);
    p.ob.material.opacity=.1*(1-age);
  }
  camera.position.set(9.0+time*.18,6.3,18.3+time*.17);
  path.set(0.65+time*.17,2.4,-0.6);
  camera.lookAt(path);
  renderer.render(scene,camera);
  return true;
}
window.renderAt=renderAt;
window.__V8_RENDERER__='Three.js WebGL2 — procedural V8';
window.__V8_READY__=true;
renderAt(0);
