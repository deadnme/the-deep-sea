import * as THREE from './vendor/three.module.js';
import { FLOOR, K, yAt, layout, creatures } from './journey.js?v=10';

// ---------- detailed hero creatures (from the original Below the Surface build) ----------
const sphere = new THREE.SphereGeometry(1, 36, 24);
const animations = [];
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: .55, metalness: .08, ...extra });
function ellipsoid(parent, material, position, scale) {
  const mesh = new THREE.Mesh(sphere, material);
  mesh.position.set(...position); mesh.scale.set(...scale); parent.add(mesh); return mesh;
}
function tube(parent, points, radius, material, segments = 32) {
  const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, segments, radius, 6, false), material);
  parent.add(mesh); return mesh;
}
function fin(parent, coords, material) {
  const shape = new THREE.Shape(); shape.moveTo(...coords[0]);
  for (let i = 1; i < coords.length; i++) shape.lineTo(...coords[i]);
  shape.closePath(); const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), material); parent.add(mesh); return mesh;
}
function glow(parent, position, size, color) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d'); const gradient = ctx.createRadialGradient(32,32,0,32,32,32);
  gradient.addColorStop(0,'rgba(210,255,249,1)'); gradient.addColorStop(.12,'rgba(140,235,216,.8)'); gradient.addColorStop(.4,'rgba(78,207,190,.2)'); gradient.addColorStop(1,'rgba(78,207,190,0)');
  ctx.fillStyle = gradient; ctx.fillRect(0,0,64,64);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }));
  sprite.position.set(...position); sprite.scale.set(size,size,1); parent.add(sprite); return sprite;
}
function manta() {
  const group = new THREE.Group();
  const skin = mat('#386b77', { roughness: .38, metalness: .18, side: THREE.DoubleSide });
  const pale = mat('#73989a', { roughness: .7 });
  ellipsoid(group, skin, [0,0,0], [1.05,2.1,.28]);
  for (const side of [-1,1]) {
    const positions = [], indices = [], segments = 30;
    for (let u = 0; u <= segments; u++) for (let v = 0; v <= segments; v++) {
      const fraction = u / segments, t = v / segments;
      const x = side * (.45 + fraction * 5.8);
      const leading = 1.4 - 2.2 * fraction ** 2.5;
      const trailing = -1.8 + 1.1 * Math.sin(fraction * Math.PI / 2);
      positions.push(x, THREE.MathUtils.lerp(trailing,leading,t), .23 * Math.sin(t*Math.PI) * (1-fraction));
      if(u<segments && v<segments) { const a=u*(segments+1)+v; indices.push(a,a+1,a+segments+1,a+1,a+segments+2,a+segments+1); }
    }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3)); geometry.setIndex(indices); geometry.computeVertexNormals();
    const wing = new THREE.Mesh(geometry,skin); group.add(wing);
    animations.push(t => { const p=geometry.attributes.position; for(let i=0;i<p.count;i++){const u=Math.abs(p.getX(i))/6.25; p.setZ(i,positions[i*3+2] + Math.sin(t*.85-u*2.7)*u*u*1.0);} p.needsUpdate=true; geometry.computeVertexNormals(); });
    ellipsoid(group, skin, [side*.82,1.28,.05], [.22,.4,.15]);
    ellipsoid(group,mat('#050f17'),[side*.93,1.4,.16],[.075,.09,.05]);
    tube(group,[[side*.45,1.85,.1],[side*.46,2.42,.28],[side*.23,2.6,.2],[side*.14,2.25,.1]],.11,skin);
    for(let i=0;i<4;i++) tube(group,[[side*.36,.65-i*.3,.405],[side*.68,.58-i*.3,.29]],.025,mat('#17323a'),6);
  }
  tube(group,[[0,-1.9,0],[.05,-3.2,-.12],[.18,-5,-.05],[.5,-7,.2],[1,-8,.5]],.045,skin,50);
  group.rotation.set(-.35,-.15,-.23); return group;
}
function jelly() {
  const group=new THREE.Group();
  const bellMat=mat('#abd9d7',{transparent:true,opacity:.24,side:THREE.DoubleSide,emissive:'#298e9a',emissiveIntensity:.35,depthWrite:false});
  const bell=new THREE.Mesh(new THREE.SphereGeometry(1.6,40,24,0,Math.PI*2,0,Math.PI*.58),bellMat); bell.scale.y=.72; group.add(bell);
  const tentacleMat=mat('#85c3c6',{emissive:'#448e93',emissiveIntensity:.35,transparent:true,opacity:.6});
  const rim=new THREE.Mesh(new THREE.TorusGeometry(1.54,.036,6,64),tentacleMat);rim.rotation.x=Math.PI/2;rim.position.y=-.27;group.add(rim);
  for(let i=0;i<16;i++){
    const angle=i*Math.PI/8,r=1.5;
    const points=[];for(let n=0;n<14;n++)points.push([Math.cos(angle)*r+Math.sin(n*.6+i)*.22,-.27-n*.36,Math.sin(angle)*r+Math.cos(n*.7+i)*.24]);
    const strand=tube(group,points,.014,tentacleMat,40);
    animations.push(t=>{strand.rotation.y=Math.sin(t*.65+i)*.05;strand.rotation.z=Math.sin(t*.8+i)*.035;});
  }
  for(let i=0;i<4;i++){
    const a=i*Math.PI/2; const arm=tube(group,[[Math.cos(a)*.35,.15,Math.sin(a)*.35],[Math.cos(a)*.6,-1,Math.sin(a)*.6],[Math.cos(a+.4)*.55,-2,Math.sin(a+.4)*.55],[Math.cos(a-.3)*.35,-3.2,Math.sin(a-.3)*.35]],.12,bellMat);
    animations.push(t=>arm.rotation.y=Math.sin(t*.6)*.15);
  }
  for(let i=0;i<8;i++){const a=i*Math.PI/4;tube(group,[[0,1.1,0],[Math.cos(a)*1.1,.75,Math.sin(a)*1.1],[Math.cos(a)*1.55,-.15,Math.sin(a)*1.55]],.012,tentacleMat,20);}
  ellipsoid(group,mat('#84cabf',{emissive:'#69d0bf',emissiveIntensity:.6,transparent:true,opacity:.4}),[0,.2,0],[.35,.5,.35]);
  glow(group,[0,.4,0],3,'#9bdacf');
  animations.push(t=>{bell.scale.y=.72+Math.sin(t*1.1)*.055;});return group;
}
function angler() {
  const group=new THREE.Group(),skin=mat('#514e50',{roughness:.75}),black=mat('#04050a'),toothMat=mat('#c1c3ad');
  ellipsoid(group,skin,[0,0,0],[2,1.6,1.2]);
  ellipsoid(group,skin,[0,-.8,.5],[1.6,.6,1]);
  ellipsoid(group,black,[0,-.3,1.11],[1.23,1.02,.22]);
  const lip=new THREE.Mesh(new THREE.TorusGeometry(1,.095,10,60),skin);lip.scale.set(1.25,1.04,1);lip.position.set(0,-.3,1.14);group.add(lip);
  for(let side of [-1,1]) for(let i=0;i<11;i++){
    const a=.22+(i/10)*2.7;const x=Math.cos(a)*1.14,y=side*Math.sin(a)*.87-.3;
    const length=.35+(Math.sin(i*2.4)*.5+.5)*.45;
    const tooth=new THREE.Mesh(new THREE.ConeGeometry(.043,length,7),toothMat);tooth.position.set(x,y-side*length/2,1.28);tooth.rotation.z=side<0?-.13:Math.PI+.13;group.add(tooth);
  }
  for(let side of [-1,1]) {
    ellipsoid(group,skin,[side*1.1,.9,.8],[.38,.35,.3]);
    ellipsoid(group,black,[side*1.14,.93,1.06],[.17,.19,.07]);
    ellipsoid(group,mat('#94aaa6'),[side*1.16,1.01,1.13],[.035,.045,.02]);
    const f=fin(group,[[side*1.5,0],[side*3,-.7],[side*1.8,-1]],skin); f.rotation.y=side*.4;
  }
  tube(group,[[0,1.45,0],[.05,2.5,.2],[.15,3.4,.6],[.55,3.65,1],[1.1,3.15,1.25]],.065,skin);
  ellipsoid(group,mat('#a5ffe0',{emissive:'#a5ffe0',emissiveIntensity:2,fog:false,toneMapped:false}),[1.1,3.15,1.25],[.15,.2,.15]);glow(group,[1.1,3.15,1.25],1.8,'#b4ffd9');
  const lureLight=new THREE.PointLight('#9be9c9',5,9);lureLight.position.set(1.1,3,1.8);group.add(lureLight);
  const tail=fin(group,[[-.7,0],[-2.2,1],[-2.2,-1]],skin);tail.rotation.y=Math.PI/2;tail.position.z=-1.2;
  group.rotation.y=-.3;group.rotation.z=-.12;return group;
}
function dumbo() {
  const group=new THREE.Group(),skin=mat('#b8938b',{roughness:.6,side:THREE.DoubleSide});
  ellipsoid(group,skin,[0,.7,0],[1.4,1.85,1.1]);
  for(let side of [-1,1]){
    const ear=ellipsoid(group,skin,[side*1.65,1.7,-.1],[1.1,.55,.3]);ear.rotation.z=side*.55;
    animations.push(t=>ear.rotation.z=side*(.5+Math.sin(t*1.3)*.35));
    ellipsoid(group,mat('#172024'),[side*.72,.7,.92],[.23,.27,.17]);
    ellipsoid(group,mat('#c4c4b5'),[side*.76,.79,1.05],[.06,.08,.03]);
  }
  const webPositions=[],webIndices=[];
  for(let i=0;i<=64;i++){
    const a=i/64*Math.PI*2; const r=2+Math.cos(a*8)*.16;
    webPositions.push(Math.cos(a)*.75,-.2,Math.sin(a)*.75,Math.cos(a)*r,-1.8,Math.sin(a)*r);
    if(i<64){const n=i*2;webIndices.push(n,n+1,n+2,n+1,n+3,n+2);}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(webPositions,3));geometry.setIndex(webIndices);geometry.computeVertexNormals();group.add(new THREE.Mesh(geometry,skin));
  for(let i=0;i<8;i++){
    const a=i/8*Math.PI*2;
    const arm=tube(group,[[Math.cos(a)*.75,-.2,Math.sin(a)*.75],[Math.cos(a)*1.5,-1.2,Math.sin(a)*1.5],[Math.cos(a)*2.15,-1.8,Math.sin(a)*2.15],[Math.cos(a+.15)*2.2,-2.1,Math.sin(a+.15)*2.2]],.13,skin);
    animations.push(t=>arm.rotation.y=Math.sin(t*.6+i)*.045);
    for(let j=0;j<5;j++)ellipsoid(group,mat('#d3bfb2'),[Math.cos(a)*(1+j*.22),-.55-j*.28,Math.sin(a)*(1+j*.22)+.09],[.045,.065,.045]);
  }
  group.rotation.set(.15,-.3,-.14);return group;
}
function snailfish() {
  const group=new THREE.Group(),skin=mat('#d7bfc0',{roughness:.42,transparent:true,opacity:.88,side:THREE.DoubleSide});
  ellipsoid(group,skin,[-1,0,0],[1.65,.95,.85]);ellipsoid(group,skin,[.8,-.05,-.08],[2.2,.55,.55]);
  const tail=fin(group,[[.3,.65],[2.1,.45],[4.3,.6],[4.1,-.5],[2,-.35],[.3,-.7]],skin);tail.position.z=-.2;
  for(let i=0;i<16;i++)tube(group,[[.5+i*.22,0,-.15],[.5+i*.22,.52-i*.005,-.15]],.008,mat('#b69caa'),6);
  for(let side of [-1,1]){
    ellipsoid(group,mat('#1c2630'),[-1.6,.27,side*.69],[.16,.18,.075]);
    const p=ellipsoid(group,skin,[-.4,-.7,side*.7],[.7,.6,.075]);p.rotation.z=-.5;p.rotation.y=side*.4;
    animations.push(t=>p.rotation.y=side*(.4+Math.sin(t*1.4)*.2));
  }
  tube(group,[[-2.5,-.19,.25],[-2.1,-.25,.65],[-1.8,-.22,.75]],.025,mat('#847585'));
  group.rotation.y=-.45;group.rotation.z=.1;return group;
}
function amphipod() {
  const group=new THREE.Group(),shell=mat('#bca491',{roughness:.6}),joint=mat('#786d66');
  for(let i=0;i<9;i++){
    const x=(i-4)*.45,y=-.06*(i-3)**2;
    const seg=ellipsoid(group,shell,[x,y,0],[.34,.53-i*.025,.4]);seg.rotation.z=(i-3)*-.12;
    for(let s of [-1,1]){
      const leg=tube(group,[[x,y-.2,s*.2],[x+.17,y-.7,s*.5],[x-.35,y-1,s*.7]],.025,joint,12);
      animations.push(t=>leg.rotation.x=Math.sin(t*1.7+i)*.12);
    }
  }
  ellipsoid(group,shell,[-2.2,-.05,0],[.5,.55,.43]);
  for(let s of [-1,1]){
    ellipsoid(group,mat('#1b242a'),[-2.45,.15,s*.3],[.09,.12,.05]);
    tube(group,[[-2.3,.3,s*.25],[-2.9,.65,s*.4],[-3.7,.8,s*.3],[-4.3,.65,s*.2]],.017,joint,30);
    tube(group,[[-2.1,.3,s*.25],[-2.8,1.1,s*.5],[-3.9,1.45,s*.7]],.014,joint,24);
  }
  group.rotation.set(.15,-.2,.17);return group;
}

// ---------- one continuous descent ----------
// One world unit is 1/K metres of water, so world height follows depth exactly (see journey.js).
const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smoothstep = (a, b, v) => { const x = clamp((v - a) / (b - a)); return x * x * (3 - 2 * x); };
const WATER = [[0, '#1d6f88'], [200, '#0e485e'], [1000, '#092638'], [4000, '#040e1f'], [6000, '#030b15'], [8200, '#02080e'], [FLOOR, '#010409']]
  .map(([d, c]) => [d, new THREE.Color(c)]);
const waterAt = (d, out) => {
  let i = 0;
  while (i < WATER.length - 2 && d > WATER[i + 1][0]) i++;
  const [d0, c0] = WATER[i], [d1, c1] = WATER[i + 1];
  return out.lerpColors(c0, c1, clamp((d - d0) / (d1 - d0)));
};
const noise = (x, y, z) => Math.sin(x * 1.7 + z * .9) * Math.cos(z * 1.3 - y) + Math.sin(x * 3.1 + y * 2.3 + z * .7) * .5;

const glowTex = (() => {
  const c = Object.assign(document.createElement('canvas'), { width: 64, height: 64 }), g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.2, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const halo = (color, size, opacity = 1) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, opacity, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false, toneMapped: false }));
  s.scale.setScalar(size); return s;
};
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .65, ...o });
const lum = color => new THREE.MeshBasicMaterial({ color, fog: false, toneMapped: false });
const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };
const ball = (r, material, sx = 1, sy = 1, sz = 1, seg = 20) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.ceil(seg * .75)), material);
  m.scale.set(sx, sy, sz); return m;
};
const cone = (r, h, material, seg = 12, open = false) => new THREE.Mesh(new THREE.ConeGeometry(r, h, seg, 1, open), material);
const pipe = (pts, r, material) => new THREE.Mesh(
  new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), 48, r, 6), material);
const rock = (r, color, amt = .25) => {
  const geo = new THREE.IcosahedronGeometry(r, 3), p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).multiplyScalar(1 + noise(v.x * 2 / r, v.y * 2 / r, v.z * 2 / r) * amt);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, std(color, { roughness: 1, flatShading: true }));
};

// Fish facing +x: body and tail as two geometries that share one transform.
const fishGeos = len => {
  const body = new THREE.SphereGeometry(.5, 16, 12); body.scale(len, len * .32, len * .16);
  const tail = new THREE.ConeGeometry(len * .2, len * .35, 4); tail.rotateZ(-Math.PI / 2); tail.scale(1, 1, .25); tail.translate(-len * .62, 0, 0);
  return [body, tail];
};
// Hatchetfish: deep, flat, blade-like bodies.
const hatchetGeos = len => {
  const body = new THREE.SphereGeometry(.5, 14, 10); body.scale(len, len * .75, len * .14);
  const tail = new THREE.ConeGeometry(len * .18, len * .3, 4); tail.rotateZ(-Math.PI / 2); tail.scale(1, 1, .25); tail.translate(-len * .6, len * .1, 0);
  return [body, tail];
};
const fish = (len, material) => {
  const g = new THREE.Group();
  for (const geo of fishGeos(len)) g.add(new THREE.Mesh(geo, material));
  for (const s of [1, -1]) { const e = ball(len * .055, std('#0b0b0b', { roughness: .2 }), 1, 1, 1, 10); e.position.set(len * .32, len * .04, s * len * .065); g.add(e); }
  return g;
};
// Copies of one shape circling a point: fish schools and amphipod swarms.
const school = (geos, material, n, radius, speed = .3) => {
  const g = new THREE.Group();
  const meshes = geos.map(geo => { const m = new THREE.InstancedMesh(geo, material, n); m.frustumCulled = false; g.add(m); return m; });
  const fs = Array.from({ length: n }, () => ({
    a: Math.random() * TAU, r: radius * (.45 + Math.random() * .55), h: (Math.random() - .5) * radius * .6,
    s: speed * (.85 + Math.random() * .3), w: Math.random() * TAU
  }));
  const d = new THREE.Object3D();
  const update = t => {
    fs.forEach((f, i) => {
      const a = f.a + t * f.s;
      d.position.set(Math.cos(a) * f.r, f.h + Math.sin(t * 1.3 + f.w) * .35, Math.sin(a) * f.r);
      d.rotation.set(0, -a - Math.PI / 2, Math.sin(t * 7 + f.w) * .06);
      d.updateMatrix();
      meshes.forEach(m => m.setMatrixAt(i, d.matrix));
    });
    meshes.forEach(m => { m.instanceMatrix.needsUpdate = true; });
  };
  update(0);
  return [g, update];
};
const drift = (amp = .4, sp = .6) => (t, o, h, k) => { o.position.y = h.y + Math.sin(t * sp + k) * amp; o.rotation.y = Math.sin(t * .2 + k) * .25 + o.userData.yaw; };
// Codex's models set their own rotation and push into `animations`; wrap each in a parent
// group and keep its animation slice private so it only runs near the camera.
const wrap = (build, scale, amp = .4) => {
  const from = animations.length, model = build(), fns = animations.splice(from);
  model.scale.multiplyScalar(scale);
  const g = new THREE.Group(); g.add(model);
  return [g, (t, o, h, k) => { fns.forEach(fn => fn(t)); o.position.y = h.y + Math.sin(t * .4 + k) * amp; }];
};

const B = {
  turtle() {
    const g = new THREE.Group(), skin = std('#86956a');
    g.add(ball(1, std('#5f4f2c', { roughness: .8 }), 1.3, .42, 1));
    const head = ball(.33, skin, 1.25, .9, .9); head.position.set(1.5, .05, 0); g.add(head);
    const flips = [];
    for (const [x, s, l] of [[.55, 1, 1.5], [.55, -1, 1.5], [-.9, 1, .7], [-.9, -1, .7]]) {
      const p = new THREE.Group(), f = ball(.5, skin, l * .45, .07, l); f.position.z = s * l * .5; f.rotation.y = s * -.4;
      p.add(f); p.position.set(x, 0, s * .75); p.userData.s = s; g.add(p); flips.push(p);
    }
    return [g, (t, o, h, k) => {
      const a = t * .12 + k;
      o.position.set(h.x + Math.cos(a) * 3, h.y + Math.sin(t * .5) * .5, h.z + Math.sin(a) * 2);
      o.rotation.y = -a - Math.PI / 2;
      flips.forEach((p, i) => { p.rotation.x = p.userData.s * Math.sin(t * 1.6 + (i > 1 ? 1.2 : 0)) * .45; });
    }];
  },
  jelly(r, color, ringColor) {
    const g = new THREE.Group();
    const bell = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 14, 0, TAU, 0, Math.PI / 2),
      std(color, { transparent: true, opacity: .55, emissive: color, emissiveIntensity: .35, side: THREE.DoubleSide, depthWrite: false }));
    g.add(bell);
    const lm = new THREE.LineBasicMaterial({ color, transparent: true, opacity: .45 });
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU, pts = [];
      for (let k = 0; k < 14; k++) pts.push(new THREE.Vector3(Math.cos(a) * r * .85 + Math.sin(k * .7 + i) * k * .02 * r, -k * r * .3, Math.sin(a) * r * .85));
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lm));
    }
    const ring = [];
    if (ringColor) for (let i = 0; i < 16; i++) {
      const a = i / 16 * TAU, s = halo(ringColor, r * .7); s.position.set(Math.cos(a) * r * .95, .05, Math.sin(a) * r * .95); g.add(s); ring.push(s);
    }
    return [g, (t, o, h, k) => {
      const p = Math.sin(t * 1.8 + k);
      bell.scale.set(1 + p * .08, 1 - p * .14, 1 + p * .08);
      o.position.y = h.y + Math.sin(t * .4 + k) * .8 + p * .08;
      o.rotation.z = Math.sin(t * .3 + k) * .12;
      ring.forEach((s, i) => { s.material.opacity = .25 + .75 * Math.max(0, Math.sin(t * 4 - i / 16 * TAU)); }); // Atolla's pinwheel
    }];
  },
  siphonophore() {
    const g = new THREE.Group(), beads = [];
    for (let i = 0; i < 46; i++) {
      const b = ball(i ? .1 : .22, lum(i % 4 ? '#7fe7ff' : '#ffcf7a'), 1, 1, 1, 8);
      if (i % 5 === 0) b.add(halo(i ? '#7fe7ff' : '#ffcf7a', i ? 1 : 2, .7));
      g.add(b); beads.push(b);
    }
    return [g, (t, o, h, k) => {
      beads.forEach((b, i) => b.position.set(5 - i * .28, Math.sin(t * .7 + i * .22 + k) * .7 - i * .03, Math.cos(t * .5 + i * .18) * .5));
      o.position.y = h.y + Math.sin(t * .3) * .4;
    }];
  },
  squid(len, color, eye = '#e6e0c8') {
    const g = new THREE.Group(), m = std(color, { roughness: .45 });
    const mantle = cone(len * .11, len * .45, m, 20); mantle.rotation.z = Math.PI / 2; mantle.position.x = -len * .225; g.add(mantle);
    for (const s of [1, -1]) { const f = ball(len * .1, m, .9, .12, 1); f.position.set(-len * .4, 0, s * len * .06); g.add(f); }
    const head = ball(len * .09, m, 1.2, 1, 1); head.position.x = len * .03; g.add(head);
    for (const s of [1, -1]) {
      const e = ball(len * .035, std(eye, { roughness: .2 })); e.position.set(len * .05, len * .02, s * len * .07); g.add(e);
      const p = ball(len * .02, std('#050505', { roughness: .1 })); p.position.set(len * .06, len * .02, s * len * .095); g.add(p);
    }
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * TAU, long = i === 2 || i === 7, L = len * (long ? .75 : .32), c = Math.cos(a) * len * .05, s = Math.sin(a) * len * .05;
      g.add(pipe([[len * .1, c, s], [len * .1 + L * .4, c * 1.8, s * 1.8 + .1], [len * .1 + L * .75, c * 1.4 - .2, s * 2.2], [len * .1 + L, c * 2.2, s * 1.4]], long ? len * .008 : len * .013, m));
    }
    return [g, (t, o, h, k) => {
      o.position.x = h.x + Math.sin(t * .15 + k) * 2;
      o.position.y = h.y + Math.sin(t * .35 + k) * .5;
      o.rotation.z = Math.sin(t * .4 + k) * .08;
    }];
  },
  vampire() {
    const g = new THREE.Group(), m = std('#4b0f1a', { roughness: .55 });
    g.add(ball(.6, m, 1, 1.35, 1));
    for (const s of [1, -1]) { const f = ball(.3, m, .2, .5, 1); f.position.set(0, .6, s * .55); g.add(f); }
    const web = cone(1.4, 1.3, std('#3a0a14', { side: THREE.DoubleSide, roughness: .7 }), 16, true);
    web.position.y = -.85; g.add(web);
    for (const s of [1, -1]) { const e = ball(.12, lum('#5fd8ff'), 1, 1, 1, 10); e.position.set(.48, .1, s * .3); g.add(e); }
    const tips = [];
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, s = halo('#59c6ff', .9); s.position.set(Math.cos(a) * 1.4, -1.5, Math.sin(a) * 1.4); g.add(s); tips.push(s); }
    return [g, (t, o, h, k) => {
      o.rotation.y = t * .15; o.position.y = h.y + Math.sin(t * .5 + k) * .6;
      web.scale.setScalar(1 + Math.sin(t * 1.2) * .1);
      tips.forEach((s, i) => { s.material.opacity = .5 + .5 * Math.sin(t * 2.5 + i); });
    }];
  },
  whale() {
    const g = new THREE.Group(), m = std('#4d5661', { roughness: .85 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(1.5, 7, 8, 20), m); body.rotation.z = Math.PI / 2; g.add(body);
    const head = new THREE.Mesh(new THREE.BoxGeometry(4.6, 3, 2.9, 2, 2, 2), m); head.position.set(3.4, .2, 0); g.add(head);
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(3.6, .25, .6), std('#d9d4c8')); jaw.position.set(3.2, -1.35, 0); g.add(jaw);
    const tail = cone(1.3, 4.5, m, 16); tail.rotation.z = Math.PI / 2; tail.position.x = -6.4; g.add(tail);
    const fluke = ball(1, m, .8, .08, 2.4); fluke.position.x = -8.6; g.add(fluke);
    for (const s of [1, -1]) { const e = ball(.12, std('#111')); e.position.set(1.4, -.6, s * 1.42); g.add(e); }
    return [g, (t, o, h, k) => {
      const a = (t * .9 + k * 10) % 70;
      o.position.set(h.x - 35 + a, h.y + Math.sin(t * .2) * .6, h.z);
      o.rotation.z = Math.sin(t * .6) * .03; fluke.rotation.z = Math.sin(t * .9) * .25;
    }];
  },
  beaked() {
    const g = new THREE.Group(), m = std('#857a70', { roughness: .8, side: THREE.DoubleSide });
    g.add(ball(.5, m, 6, 1.25, 1.25));
    g.add(at(ball(.5, std('#a89f94', { roughness: .8 }), 1.7, 1.05, 1.05), 2.5, .1, 0));   // pale head of an older animal
    const beak = cone(.24, .8, m, 10); beak.rotation.z = -Math.PI / 2; beak.position.set(3.65, -.1, 0); g.add(beak);
    fin(g, [[-1, .5], [-1.6, 1.05], [-1.95, .5]], m);
    const fluke = at(ball(.5, m, .7, .06, 2.2), -3.3, 0, 0); g.add(fluke);
    for (const s of [1, -1]) {
      const p = at(ball(.5, m, .7, .05, .35), 1.4, -.4, s * .55); p.rotation.y = s * .4; g.add(p);
      g.add(at(ball(.07, std('#111')), 2.95, .15, s * .42));
    }
    return [g, (t, o, h, k) => {
      const a = (t * .7 + k * 10) % 64;
      o.position.set(h.x - 32 + a, h.y + Math.sin(t * .25) * .4, h.z);
      fluke.rotation.z = Math.sin(t * 1.1) * .25; o.rotation.z = Math.sin(t * .6) * .03;
    }];
  },
  // Sharks face +x and cruise a slow loop around their home.
  shark({ len, color, snout = 0, eye = '#0c0c0c', speed = .07, radius = 4 }) {
    const g = new THREE.Group(), m = std(color, { roughness: .7, side: THREE.DoubleSide });
    g.add(ball(.5, m, len, len * .19, len * .19));
    const tail = new THREE.Group(); tail.position.x = -len * .46; g.add(tail);
    fin(tail, [[0, 0], [-len * .3, len * .2], [-len * .2, 0], [-len * .16, -len * .1]], m);
    fin(g, [[len * .02, len * .08], [-len * .1, len * .2], [-len * .14, len * .08]], m);
    for (const s of [1, -1]) {
      const p = at(ball(.5, m, len * .22, len * .015, len * .12), len * .12, -len * .07, s * len * .1); p.rotation.set(s * .3, s * .5, 0); g.add(p);
      g.add(at(ball(len * .022, std(eye, { roughness: .15 })), len * .36, len * .03, s * len * .06));
    }
    if (snout) { const c = cone(len * .05, len * snout, m, 10); c.rotation.z = -Math.PI / 2; c.scale.z = .5; c.position.set(len * (.48 + snout / 2), len * .02, 0); g.add(c); }
    return [g, (t, o, h, k) => {
      const a = t * speed + k;
      o.position.set(h.x + Math.cos(a) * radius, h.y + Math.sin(t * .3 + k) * .3, h.z + Math.sin(a) * radius * .5);
      o.rotation.y = -a - Math.PI / 2;
      tail.rotation.y = Math.sin(t * 1.6 + k) * .35;
    }];
  },
  barreleye() {
    const g = fish(1.5, std('#4a3a30', { roughness: .55 }));
    g.add(at(ball(.32, std('#d6f0f2', { transparent: true, opacity: .22, roughness: .05, depthWrite: false }), 1.35, 1, .8), .36, .2, 0));
    for (const s of [1, -1]) {
      g.add(at(ball(.06, lum('#7dffb0'), 1, 1, 1, 10), .38, .2, s * .07));   // tubular eyes, looking up through the shield
      const f = at(ball(.5, std('#5a4a3e', { transparent: true, opacity: .6, side: THREE.DoubleSide }), .55, .03, .3), 0, -.05, s * .28); f.rotation.x = s * .4; g.add(f);
    }
    return [g, drift(.3, .4)];
  },
  dragonfish() {
    const g = new THREE.Group(), m = std('#120d0e', { roughness: .3, metalness: .2, side: THREE.DoubleSide });
    const pts = []; for (let i = 0; i <= 10; i++) pts.push([-i * .32, Math.sin(i * .6) * .08, 0]);
    const body = pipe(pts, .13, m); body.scale.set(1, 1.3, .7); g.add(body);
    g.add(at(ball(.2, m, 1.3, 1, .8), .1, 0, 0));
    g.add(pipe([[.1, -.1, 0], [.45, -.2, 0], [.55, -.08, 0]], .03, m));
    fin(g, [[-3.15, 0], [-3.6, .28], [-3.6, -.28]], m);
    const red = halo('#ff4433', .9); red.position.set(.12, -.04, .14); g.add(red);
    g.add(at(ball(.04, lum('#ff5a40'), 1, 1, 1, 8), .12, -.04, .14));
    g.add(at(halo('#7fd8ff', .5, .7), .05, .06, .15));
    return [g, (t, o, h, k) => {
      o.position.y = h.y + Math.sin(t * .4 + k) * .35; o.rotation.z = Math.sin(t * .5 + k) * .06;
      red.material.opacity = .65 + .35 * Math.sin(t * 2.2 + k);
    }];
  },
  isopod() {
    const g = new THREE.Group(), shell = std('#b9aa9b', { roughness: .5 }), leg = std('#8a7d72');
    for (let i = 0; i < 8; i++) {
      const x = .85 - i * .26, w = .5 - Math.abs(i - 3.5) * .04, y = .12 - (i - 3.5) ** 2 * .008;
      g.add(at(ball(.5, shell, .34, .3, w * 2), x, y, 0));
      for (const s of [1, -1]) g.add(pipe([[x, -.02, s * w * .8], [x + .08, -.18, s * (w + .15)], [x + .14, -.3, s * (w + .22)]], .025, leg));
    }
    g.add(at(ball(.5, shell, .35, .25, .7), 1.12, .06, 0));
    g.add(at(ball(.5, shell, .45, .08, .75), -1.3, .02, 0));
    for (const s of [1, -1]) {
      g.add(at(ball(.07, std('#20262b', { roughness: .2 }), 1, 1, 1, 10), 1.2, .12, s * .25));
      g.add(pipe([[1.25, .05, s * .15], [1.7, .12, s * .4], [2.1, .05, s * .55]], .02, leg));
    }
    return [g, (t, o, h, k) => { o.position.x = h.x + Math.sin(t * .05 + k) * .6; }];
  },
  // Black-smoker chimney with a rising plume and a thicket of Riftia tube worms.
  vent() {
    const g = new THREE.Group();
    for (const [x, y, r] of [[0, 0, 1.3], [.1, 1.6, 1], [-.05, 2.9, .75], [.05, 3.9, .5]]) {
      const c = rock(r, '#2c2522', .3); c.scale.y = 1.25; c.position.set(x, y, 0); g.add(c);
    }
    const N = 160, pos = new Float32Array(N * 3), seeds = Array.from({ length: N }, () => [Math.random(), Math.random() * TAU, Math.random()]);
    const plumeGeo = new THREE.BufferGeometry(); plumeGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const plume = new THREE.Points(plumeGeo, new THREE.PointsMaterial({ size: .7, map: glowTex, color: '#6f675e', transparent: true, opacity: .4, depthWrite: false }));
    plume.frustumCulled = false; g.add(plume);
    const tubeMat = std('#e9e4da', { roughness: .4 }), plumeMat = std('#b3122a', { roughness: .5, emissive: '#3a0008' }), worms = [];
    for (let i = 0; i < 40; i++) {
      const a = i * 2.4, r = 1.5 + (i % 7) * .18, len = .7 + (i * 7 % 5) * .22;
      const w = at(new THREE.Group(), Math.cos(a) * r, -1.5, Math.sin(a) * r);
      w.add(at(new THREE.Mesh(new THREE.CylinderGeometry(.04, .055, len, 6), tubeMat), 0, len / 2, 0));
      w.add(at(ball(.09, plumeMat, 1, 2.4, 1, 10), 0, len + .16, 0));
      w.rotation.set((Math.random() - .5) * .3, 0, (Math.random() - .5) * .3); w.userData.tilt = [w.rotation.x, w.rotation.z];
      g.add(w); worms.push(w);
    }
    const tick = t => {
      seeds.forEach(([p, a, s], i) => {
        const f = (t * .12 + p) % 1;
        pos.set([Math.cos(a) * f * (1 + s) + Math.sin(t + i) * .1, 4.3 + f * 7, Math.sin(a) * f * (1 + s)], i * 3);
      });
      plumeGeo.attributes.position.needsUpdate = true;
    };
    tick(0);
    return [g, t => {
      tick(t);
      worms.forEach((w, i) => { w.rotation.z = w.userData.tilt[1] + Math.sin(t * .9 + i) * .06; w.rotation.x = w.userData.tilt[0] + Math.cos(t * .7 + i) * .05; });
    }];
  },
  // The bow of RMS Titanic as it lies at 3,800 m: sunk in the sediment, the foremast fallen back
  // over the bridge, the hull draped in rusticles (iron-eating bacteria; no algae grows this deep). Bow towards +x.
  titanic() {
    const g = new THREE.Group(), L = 16, B = 2.4, H = 3.4;
    // One surface for the hull and everything fixed to it. u: break (0) to stem (1),
    // v: keel (0) to deck (1), s: port (-1) to starboard (1).
    const beam = u => Math.min(1, (1 - u) / .45) ** .85;
    const hull = (u, v, s) => [(u - .5) * L, (v - .5) * H + v * u ** 3 * 1.3, s * B / 2 * beam(u) * (.68 + .32 * v)];
    const coat = std('#ffffff', { vertexColors: true, roughness: .95, side: THREE.DoubleSide });
    const C = ['#3a2a21', '#6e3a20', '#7b3517', '#c06a2c'].map(c => new THREE.Color(c)), moss = new THREE.Color(), c = new THREE.Color();
    // Rust runs down the plates; the rusticle crust is thickest on anything facing up.
    const crust = geo => {
      geo.computeVertexNormals();
      const p = geo.attributes.position, n = geo.attributes.normal, col = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const rust = smoothstep(.3, 1.1, noise(x * 1.9 + z * .7, y * .25, z * 1.7) + noise(x * 5.3, y * .6, 3) * .35);
        const growth = clamp(.2 + n.getY(i) * .45 + y * .08 + noise(x * 2.3, y * 3.1, z * 2.3) * .3);
        moss.lerpColors(C[2], C[3], clamp(.5 + noise(x * 4.1, y * 3.7, z * 4.1) * .45));
        c.lerpColors(C[0], C[1], rust * .6).lerp(moss, growth).toArray(col, i * 3);
      }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      return new THREE.Mesh(geo, coat);
    };
    const block = (w, h, d, x, y, z) => g.add(crust(new THREE.BoxGeometry(w, h, d, Math.ceil(w * 3), Math.ceil(h * 3), Math.ceil(d * 3)).translate(x, y, z)));

    // Hull: a box bent onto that surface and torn open at the break.
    const geo = new THREE.BoxGeometry(L, H, B, 96, 14, 8), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) / L + .5, v = p.getY(i) / H + .5, s = p.getZ(i) / (B / 2), [x, y, z] = hull(u, v, s);
      p.setXYZ(i, u < .001 ? x + noise(v * 7, s * 3, 1) * .5 - .3 : x, y, z);
    }
    g.add(crust(geo));

    // A bed of mud piled up the hull and ploughed up at the stem. It fades out at the edges,
    // like seabed caught in a lamp, since there is no floor at this depth anywhere else.
    const mudY = (x, z) => -.5 - 2.2 * ((x / 18) ** 2 + (z / 9) ** 2) + .9 * Math.exp(-((x - 8.4) ** 2 / 2.5 + z * z / 3)) + noise(x * .5, 2, z * .5) * .12;
    {
      const geo = new THREE.PlaneGeometry(36, 22, 72, 44).rotateX(-Math.PI / 2), p = geo.attributes.position, col = new Float32Array(p.count * 4);
      const a = new THREE.Color('#4b4436'), b = new THREE.Color('#665d4a');
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), z = p.getZ(i);
        p.setY(i, mudY(x, z));
        c.lerpColors(a, b, clamp(.5 + noise(x * 1.1, 5, z * 1.1) * .4)).toArray(col, i * 4);
        col[i * 4 + 3] = 1 - smoothstep(.55, 1, Math.hypot(x / 18, z / 11));
      }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 4)); geo.computeVertexNormals();
      g.add(new THREE.Mesh(geo, std('#ffffff', { vertexColors: true, transparent: true, roughness: 1 })));
    }
    for (let i = 0; i < 6; i++) {   // torn plates beyond the break
      const plate = crust(new THREE.BoxGeometry(.6 + Math.random() * .8, .06, .4 + Math.random() * .5, 4, 1, 3));
      const x = -L / 2 - .5 - Math.random() * 2.5, z = (Math.random() - .5) * 3.5;
      plate.position.set(x, mudY(x, z) + .05, z);
      plate.rotation.set((Math.random() - .5) * .5, Math.random() * 3, (Math.random() - .5) * .5); g.add(plate);
    }

    // Superstructure, the first funnel's empty casing, deck fittings and the fallen foremast.
    const deck = 1.7;
    block(7.8, .9, B * .86, -3.7, deck + .4, 0);
    block(6.2, .7, 1.5, -3.7, deck + 1.2, 0);
    const casing = crust(new THREE.CylinderGeometry(.42, .46, .5, 20, 2, true)); casing.scale.z = .7; casing.position.set(-1.6, deck + 1.75, 0); g.add(casing);
    const pit = new THREE.Mesh(new THREE.CircleGeometry(.4, 20), std('#080605')); pit.rotation.x = -Math.PI / 2; pit.scale.y = .7; pit.position.set(-1.6, deck + 1.6, 0); g.add(pit);
    for (const s of [1, -1]) { const [x, y, z] = hull(.9, 1, s * .4); g.add(crust(new THREE.CylinderGeometry(.14, .16, .22, 12).translate(x, y + .1, z))); }
    { const [x, y] = hull(.66, 1, 0); block(.8, .2, .9, x, y + .08, 0); }
    const [mx, my] = hull(.74, 1, 0);
    g.add(crust(pipe([[mx, my, 0], [mx - 2.4, my + 1.1, .2], [-.4, deck + 1.6, .4]], .09, coat).geometry));

    // The railing at the bow, where the two sides meet at the stem.
    for (const s of [1, -1]) {
      const rail = [];
      for (let u = .8; u < 1; u += .025) {
        const [x, y, z] = hull(u, 1, s * .95); rail.push([x, y + .3, z]);
        g.add(crust(new THREE.CylinderGeometry(.018, .018, .3, 4).translate(x, y + .15, z)));
      }
      rail.push(hull(.999, 1, 0).map((q, i) => i === 1 ? q + .3 : q));
      g.add(crust(pipe(rail, .025, coat).geometry));
    }

    // Portholes and windows, then lumps of rusticle crust, all instanced.
    const d = new THREE.Object3D();
    const holes = new THREE.InstancedMesh(new THREE.SphereGeometry(.07, 8, 6), std('#0b0807', { roughness: .4 }), 300);
    let n = 0;
    const hole = (x, y, z, w = 1, h = 1) => { d.position.set(x, y, z); d.rotation.set(0, 0, 0); d.scale.set(w, h, .5); d.updateMatrix(); holes.setMatrixAt(n++, d.matrix); };
    for (const s of [1, -1]) {
      for (const v of [.82, .68]) for (let u = .06; u < .9; u += .02) { const [x, y, z] = hull(u, v, s); hole(x, y, z + s * .005); }
      for (let x = -7.4; x < 0; x += .3) hole(x, deck + .45, s * 1.04, 1.4, .8);
      for (let x = -6.5; x < -.8; x += .3) hole(x, deck + 1.25, s * .76, 1.4, .8);
    }
    holes.count = n; g.add(holes);

    const rnd = (a, b) => a + Math.random() * (b - a);
    const brown = new THREE.Color('#4a2616');
    const tint = () => c.lerpColors(C[2], C[3], Math.random()).lerp(brown, Math.random() * .4);
    const blob = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), std('#ffffff', { roughness: 1, flatShading: true }), 160);
    for (let i = 0; i < 160; i++) {
      if (i < 120) { const [x, y, z] = hull(rnd(.02, .9), 1, rnd(-.7, .7)); d.position.set(x, y + .02, z); d.scale.set(rnd(.2, .55), rnd(.04, .1), rnd(.2, .55)); }
      else if (i < 145) { d.position.set(rnd(-7.5, .1), deck + .86, rnd(-.95, .95)); d.scale.set(rnd(.2, .45), rnd(.04, .1), rnd(.2, .45)); }
      else { d.position.set(rnd(-6.6, -.8), deck + 1.56, rnd(-.7, .7)); d.scale.set(rnd(.2, .4), rnd(.04, .1), rnd(.2, .4)); }
      d.rotation.set(0, rnd(0, TAU), 0); d.updateMatrix(); blob.setMatrixAt(i, d.matrix); blob.setColorAt(i, tint());
    }
    g.add(blob);

    // Rusticles: brittle, icicle-like growths hanging from every edge and below the portholes.
    const rusticleGeo = new THREE.ConeGeometry(.06, 1, 5); rusticleGeo.rotateX(Math.PI); rusticleGeo.translate(0, -.5, 0);
    const hang = new THREE.InstancedMesh(rusticleGeo, std('#ffffff', { roughness: 1 }), 240);
    for (let i = 0; i < 240; i++) {
      const s = i % 2 ? 1 : -1;
      let x, y, z, len = rnd(.2, 1.1);
      if (i < 130) { [x, y, z] = hull(rnd(.02, .99), 1, s); z += s * .03; }
      else if (i < 180) { x = rnd(-7.6, .1); y = deck + .84; z = s * 1.06; }
      else if (i < 210) { x = rnd(-6.7, -.7); y = deck + 1.54; z = s * .78; }
      else { [x, y, z] = hull(rnd(.06, .9), Math.random() < .5 ? .8 : .66, s); z += s * .02; len = rnd(.15, .45); }
      const w = rnd(.6, 1.5);
      d.position.set(x, y, z); d.rotation.set(-s * rnd(0, .12), 0, rnd(-.08, .08)); d.scale.set(w, len, w);
      d.updateMatrix(); hang.setMatrixAt(i, d.matrix); hang.setColorAt(i, tint());
    }
    g.add(hang);

    // Below eye level and tipped towards the camera, so the decks and the bow railing show.
    const wreck = new THREE.Group(); g.position.y = -3.2; wreck.add(g); wreck.rotation.x = .3;
    return [wreck, null];
  },
  gulper() {
    const g = new THREE.Group(), m = std('#151012', { roughness: .6 });
    const pts = []; for (let i = 0; i <= 20; i++) pts.push([-i * .45, Math.sin(i * .5) * .5, Math.cos(i * .35) * .3]);
    g.add(pipe(pts, .12, m));
    const jaw = cone(1, 1.6, std('#1f1418', { side: THREE.DoubleSide, roughness: .5 }), 18, true); jaw.rotation.z = Math.PI / 2; jaw.position.x = .8; g.add(jaw);
    const tip = halo('#ff6fb5', 1.6); tip.position.set(...pts.at(-1)); g.add(tip);
    return [g, (t, o, h, k) => {
      o.rotation.y = o.userData.yaw + Math.sin(t * .3) * .4; o.rotation.z = Math.sin(t * .5) * .1;
      o.position.y = h.y + Math.sin(t * .35 + k) * .5; tip.material.opacity = .6 + .4 * Math.sin(t * 3);
    }];
  },
  fangtooth() {
    const g = fish(1.8, std('#2c2421', { roughness: .8 }));
    const tooth = std('#eeeae0', { roughness: .3 });
    for (const [z, up] of [[.1, 1], [-.1, 1], [.06, -1], [-.06, -1]]) {
      const c = cone(.04, .38, tooth, 5); c.position.set(.88, up * .12, z); c.rotation.z = up > 0 ? 0 : Math.PI; g.add(c);
    }
    return [g, drift(.4, .5)];
  },
  seaPig() {
    const g = new THREE.Group(), m = std('#e8b4c0', { transparent: true, opacity: .85, roughness: .35 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(.35, 1.2, 6, 14), m); body.rotation.z = Math.PI / 2; g.add(body);
    for (let i = 0; i < 6; i++) for (const s of [1, -1]) { const l = cone(.07, .3, m, 6); l.position.set(-.55 + i * .22, -.35, s * .22); l.rotation.z = Math.PI; g.add(l); }
    for (const s of [1, -1]) for (const x of [.55, .35]) { const a = cone(.05, .45, m, 6); a.position.set(x, .45, s * .12); a.rotation.z = -.4; g.add(a); }
    return [g, (t, o, h, k) => { o.position.x = h.x + Math.sin(t * .08 + k) * .8; o.rotation.z = Math.sin(t * 2 + k) * .03; }];
  },
  tripod() {
    const g = fish(1.6, std('#5b4b3d', { roughness: .8 }));
    const ray = std('#3a3029');
    for (const [x, z] of [[.35, .2], [.35, -.2], [-1.0, 0]]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, 1.4, 4), ray); c.position.set(x, -.75, z); g.add(c); }
    return [g, (t, o, h, k) => { o.rotation.z = Math.sin(t * .5 + k) * .02; }];
  },
  bigAmphipod(len, color) {
    const g = new THREE.Group(), m = std(color, { roughness: .4 });
    for (let i = 0; i < 9; i++) {
      const a = i / 8 * 2.2 - .4, seg = ball(len * (.12 - i * .007), m, 1, .9, .8, 12);
      seg.position.set(Math.cos(a) * len * .45, Math.sin(a) * len * .45, 0); g.add(seg);
    }
    for (let i = 0; i < 7; i++) {
      const a = i / 8 * 2.2 - .2, l = new THREE.Mesh(new THREE.CylinderGeometry(len * .01, len * .01, len * .3, 4), m);
      l.position.set(Math.cos(a) * len * .3, Math.sin(a) * len * .3 - len * .1, 0); l.rotation.z = a; g.add(l);
    }
    return [g, drift(.3, .7)];
  },
  cucumber() {
    const g = new THREE.Group(), m = std('#f2a5b8', { transparent: true, opacity: .62, roughness: .25, emissive: '#2a0b12' });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(.3, 1.1, 6, 14), m); body.rotation.z = Math.PI / 2; g.add(body);
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, c = cone(.04, .3, m, 5); c.position.set(.95, Math.cos(a) * .22, Math.sin(a) * .22); c.rotation.z = -Math.PI / 2; g.add(c); }
    return [g, (t, o, h, k) => { o.scale.x = 1 + Math.sin(t * .8 + k) * .06; }];
  },
  xeno() { return [rock(.5, '#cdb894', .35), null]; },
  swarm(n, color, radius) {
    const geo = new THREE.CapsuleGeometry(.04, .16, 3, 6); geo.rotateZ(Math.PI / 2);
    return school([geo], std(color, { roughness: .4 }), n, radius, .5);
  },
};

// `model` keys used by journey.js; `args` are passed through.
const MODELS = {
  turtle: () => B.turtle(),
  sardines: () => school(fishGeos(.5), std('#a9c4d6', { roughness: .35, metalness: .15 }), 140, 5, .35),
  manta: () => wrap(manta, .55, .6),
  moonJelly: (r = 1.1) => B.jelly(r, '#dfe8ff'),
  tuna: () => school(fishGeos(1.6), std('#4a6e92', { roughness: .35, metalness: .15 }), 14, 6, .45),
  jellyDeep: () => wrap(jelly, .7, .8),
  hatchetfish: () => school(hatchetGeos(.45), std('#c9d4dc', { metalness: .6, roughness: .25, emissive: '#27507a', emissiveIntensity: .35 }), 60, 3.5, .25),
  lanternfish: () => school(fishGeos(.45), std('#26384d', { emissive: '#2b6bff', emissiveIntensity: .7, roughness: .4 }), 90, 4, .3),
  siphonophore: () => B.siphonophore(),
  squid: () => B.squid(9, '#8c2d22'),
  barreleye: () => B.barreleye(),
  vampire: () => B.vampire(),
  atolla: () => B.jelly(1, '#9a1d1d', '#4fa8ff'),
  sixgill: () => B.shark({ len: 4.2, color: '#5b5850', eye: '#5fb39a', speed: .06 }),
  angler: () => wrap(angler, .55, .3),
  whale: () => B.whale(),
  goblin: () => B.shark({ len: 3.4, color: '#c79e9a', snout: .28, speed: .08 }),
  isopod: () => B.isopod(),
  dragonfish: () => B.dragonfish(),
  greenland: () => B.shark({ len: 5.5, color: '#4c5257', speed: .035, radius: 5 }),
  gulper: () => B.gulper(),
  vent: () => B.vent(),
  beaked: () => B.beaked(),
  fangtooth: () => B.fangtooth(),
  titanic: () => B.titanic(),
  dumbo: (s = .5) => wrap(dumbo, s, .35),
  tripod: () => B.tripod(),
  seaPig: () => B.seaPig(),
  bigAmphipod: () => B.bigAmphipod(1.5, '#efe9dc'),
  snailfish: (s = .45) => wrap(snailfish, s, .4),
  swarm: (n = 160, r = 3) => B.swarm(n, '#f2ecdf', r),
  amphipod: () => wrap(amphipod, .32, .15),
  xeno: () => B.xeno(),
  cucumber: () => B.cucumber(),
};

export function createOcean(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color();
  scene.fog = new THREE.Fog(0x000000, 4, 90);
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, .1, 300);
  camera.rotation.order = 'YXZ';
  scene.add(camera);

  const sky = new THREE.HemisphereLight('#9bdae0', '#0b2a3a', 2.2);
  const key = new THREE.DirectionalLight('#c0e6e1', 3); key.position.set(-3, 12, 12);
  const rim = new THREE.DirectionalLight('#438da4', 1); rim.position.set(8, 3, -9);
  const lamp = new THREE.PointLight('#c4e8ff', 0, 50, 0);   // submersible lamp, fades in with depth
  lamp.position.set(0, 1, 0); camera.add(lamp);
  scene.add(sky, key, rim);

  // The underside of the sea surface. At z = -15 it meets the bottom of the page's sky band.
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ color: '#a8e6e4', transparent: true, opacity: .3, side: THREE.DoubleSide, depthWrite: false }));
  surface.rotation.x = Math.PI / 2; scene.add(surface);

  // Hadal trench walls, from 6,000 m down past the floor.
  const wallTop = yAt(6000), wallH = wallTop - yAt(FLOOR) + 20;
  for (const s of [1, -1]) {
    const geo = new THREE.BoxGeometry(10, wallH, 120, 4, 220, 40), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getX(i) * s < 0) p.setX(i, p.getX(i) + noise(p.getY(i) * .15, p.getZ(i) * .15, s) * 2.5 + noise(p.getY(i) * .5, p.getZ(i) * .5, 2) * .6);
    geo.computeVertexNormals();
    const wall = new THREE.Mesh(geo, std('#3a332b', { roughness: 1 }));
    wall.position.set(s * 21 - 3, wallTop - wallH / 2 + 10, -40); scene.add(wall);
  }
  // Challenger Deep floor, a few units below the 10,935 m line so the camera stops above it.
  const floorY = yAt(FLOOR) - 3;
  {
    const geo = new THREE.PlaneGeometry(260, 260, 140, 140); geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, noise(p.getX(i) * .08, 0, p.getZ(i) * .08) * 1.2 + noise(p.getX(i) * .6, 1, p.getZ(i) * .6) * .12);
    geo.computeVertexNormals();
    const floor = new THREE.Mesh(geo, std('#3d362c', { roughness: 1 }));
    floor.position.set(0, floorY, -40); scene.add(floor);
  }
  // Same height function as the floor vertices (floor mesh sits at z = -40).
  const floorAt = (x, z) => floorY + noise(x * .08, 0, (z + 40) * .08) * 1.2 + noise(x * .6, 1, (z + 40) * .6) * .12;

  // ---------- creatures ----------
  const life = [], placed = [];   // placed: [object, wide-screen x], re-laid out on resize
  const labelsEl = document.getElementById('labels');
  for (const c of creatures) {
    const [obj, update] = MODELS[c.model](...(c.args ?? []));
    obj.position.set(c.x, c.floor != null ? floorAt(c.x, c.z) + c.floor : yAt(c.depth), c.z);
    obj.rotation.y = obj.userData.yaw = c.yaw ?? 0;
    scene.add(obj); placed.push([obj, c.x]);
    if (c.ground) {   // a flat rock under bottom-dwellers
      const box = new THREE.Box3().setFromObject(obj), r = rock(c.ground, '#3f382e', .18);
      r.scale.y = .2; r.position.set(c.x + 1, box.min.y - c.ground * .15, c.z - 3);
      scene.add(r); placed.push([r, c.x + 1]);
    }
    let el = null;
    if (c.name) {
      el = document.createElement('button');
      el.className = 'specimen'; el.dataset.creature = c.id;
      el.innerHTML = `<span class="specimen-line"></span><span class="specimen-name">${c.name}<small>${c.latin}</small></span><span class="specimen-plus" aria-hidden="true">+</span>`;
      el.setAttribute('aria-label', `About the ${c.name}`);
      labelsEl.append(el);
    }
    life.push({ obj, update, home: obj.position.clone(), k: Math.random() * TAU, el, labelY: c.labelY ?? 1.6, w: 0, h: 0, shown: false, side: '' });
  }

  // ---------- marine snow ----------
  // Only the first `flakes` points are drawn; that number grows with depth (see update).
  const SNOW = 8000, BOX = 44;
  const snowPos = new Float32Array(SNOW * 3);
  for (let i = 0; i < SNOW; i++) snowPos.set([(Math.random() - .5) * 70, (Math.random() - .5) * BOX, -Math.random() * 50 + 4], i * 3);
  const snowGeo = new THREE.BufferGeometry(); snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
  const snowMat = new THREE.PointsMaterial({ size: .12, map: glowTex, color: '#d8ecf5', transparent: true, depthWrite: false, opacity: .3 });
  const snow = new THREE.Points(snowGeo, snowMat); snow.frustumCulled = false; scene.add(snow);

  // ---------- frame loop (driven by app.js) ----------
  let pointerX = 0, time = 0, last = performance.now(), camX = -4.5, labelRight = innerWidth;
  addEventListener('pointermove', e => { pointerX = (e.clientX / innerWidth - .5) * 2; }, { passive: true });
  // Label sizes, and the page's text blocks in page coordinates: a label never sits on top of text.
  let blocks = [];
  const measureLabels = () => {
    life.forEach(c => { if (c.el) { c.w = c.el.offsetWidth; c.h = c.el.offsetHeight; } });
    blocks = [...document.querySelectorAll('main .at, .hero-sub, .ending')].map(el => {
      const r = el.getBoundingClientRect();
      return [r.left, r.right, r.top + scrollY - 12, r.bottom + scrollY + 12];
    });
  };
  const overText = (x0, x1, y0, y1) => blocks.some(([l, r, t, b]) => x0 < r && x1 > l && y0 + scrollY < b && y1 + scrollY > t);
  document.fonts?.ready.then(measureLabels);
  renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); document.getElementById('render-error').hidden = false; });
  renderer.domElement.addEventListener('webglcontextrestored', () => { document.getElementById('render-error').hidden = true; });
  const v = new THREE.Vector3();

  return {
    // `view` comes from layout() in journey.js and only changes with the width. When the mobile URL
    // bar changes the height, the lens is widened or narrowed so world units keep the same pixel size.
    resize(view, viewHeight) {
      renderer.setSize(innerWidth, innerHeight);
      camera.aspect = innerWidth / innerHeight;
      camera.fov = 2 * Math.atan(Math.tan(view.fov * Math.PI / 360) * innerHeight / viewHeight) * 180 / Math.PI;
      camera.updateProjectionMatrix();
      // Wide screens keep the left side for text; narrow screens bring creatures to the middle.
      const narrow = innerWidth < 760 || innerWidth < innerHeight;
      camX = narrow ? 0 : -4.5;
      for (const [o, x] of placed) o.position.x = narrow ? (x - 3) * .45 : x;
      life.forEach(c => { c.home.x = c.obj.position.x; });
      const gauge = document.querySelector('.gauge');
      labelRight = (gauge ? gauge.getBoundingClientRect().left : innerWidth) - 24;
      measureLabels();
    },
    update(depth, paused) {
      const now = performance.now(), dt = Math.min((now - last) / 1000, .1); last = now;
      if (document.hidden) return;
      if (!paused) time += dt;

      // No smoothing on y: the page and the scene must move together.
      camera.position.set(camX + (paused ? 0 : pointerX * .35), yAt(depth), 0);
      camera.rotation.set(-smoothstep(FLOOR - 70, FLOOR, depth) * .3, 0, 0);
      camera.updateMatrixWorld();

      // Darkness: water colour, fog and light all fall off with depth.
      waterAt(depth, scene.background); scene.fog.color.copy(scene.background);
      scene.fog.far = 95 - smoothstep(0, 1000, depth) * 40;
      sky.intensity = 2.2 * Math.exp(-depth / 350) + .12;
      key.intensity = 3 * Math.exp(-depth / 250);
      lamp.intensity = smoothstep(150, 1400, depth) * 2.2;
      snowMat.opacity = .2 + smoothstep(100, 1500, depth) * .45;

      // Sparse flakes at the surface, steadily more (and bigger) all the way to the trench floor.
      const deep = Math.min(1, depth / 9000) ** .8, flakes = Math.round(SNOW * (.12 + .88 * deep));
      snowGeo.setDrawRange(0, flakes); snowMat.size = .12 + deep * .08;
      const camY = camera.position.y, sp = snowGeo.attributes.position;
      for (let i = 0; i < flakes; i++) {
        let y = sp.getY(i) - dt * .25;
        y = camY + ((((y - camY) + BOX / 2) % BOX) + BOX) % BOX - BOX / 2;
        sp.setY(i, y); sp.setX(i, sp.getX(i) + Math.sin(time * .3 + i) * dt * .05);
      }
      sp.needsUpdate = true;

      const top = 90, bottom = innerHeight - 140;   // keep labels clear of the header and instrument bar
      for (const c of life) {
        const near = Math.abs(c.home.y - camY) < 40;
        c.obj.visible = near;
        if (near && c.update && !paused) c.update(time, c.obj, c.home, c.k);
        if (!c.el) continue;
        let op = 0, py = 0, x0 = 0, side = '';
        if (near) {
          v.set(c.obj.position.x, c.obj.position.y + c.labelY, c.obj.position.z).project(camera);
          const px = (v.x + 1) / 2 * innerWidth; py = (1 - v.y) / 2 * innerHeight;
          // Label sits right of the creature, flips left when the depth gauge is in the way,
          // and is centred over the creature when neither side fits (phones).
          x0 = px;
          if (px + c.w > labelRight) {
            if (px - c.w >= 0) { x0 = px - c.w; side = 'flip'; }
            else { x0 = clamp(px - c.w / 2, 8, labelRight - c.w); side = 'centred'; }
          }
          const inside = v.z < 1 && px > 0 && px < labelRight + 24 && !overText(x0, x0 + c.w, py - c.h / 2, py + c.h / 2);
          op = inside ? clamp(Math.min(py - top, bottom - py) / 60) : 0;
        }
        const show = op > .05;
        if (show !== c.shown) { c.el.style.visibility = show ? 'visible' : 'hidden'; c.shown = show; }
        if (!show) continue;
        c.el.style.opacity = op.toFixed(2);
        if (side !== c.side) { c.el.classList.toggle('flip', side === 'flip'); c.el.classList.toggle('centred', side === 'centred'); c.side = side; }
        c.el.style.transform = `translate(${x0}px, ${py}px) translateY(-50%)`;
      }
      renderer.render(scene, camera);
    }
  };
}
