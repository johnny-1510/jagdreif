/* Jagdreif · Ansitz 3D  (three.js r160, alles prozedural, keine externen Modelle) */
(function(){
const T=THREE, PI=Math.PI;
/* ---------- Rauschen ---------- */
function hash(x,y){let h=(Math.imul(x,374761393)+Math.imul(y,668265263))|0;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296}
function vn(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  const a=hash(xi,yi),b=hash(xi+1,yi),c=hash(xi,yi+1),d=hash(xi+1,yi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
function fbm(x,y,o=4){let s=0,a=.5,f=1;for(let i=0;i<o;i++){s+=a*vn(x*f,y*f);f*=2.03;a*=.5}return s}
let seed=1;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
const lerp=(a,b,t)=>a+(b-a)*t, clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), sm=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};

/* ---------- Gelände: Blick nach Süden (+Z), See links (+X), Wiese vorn ---------- */
function lakeMask(x,z){const dx=(x-150)/95,dz=(z-40)/120;return 1-sm(.75,1.05,Math.sqrt(dx*dx+dz*dz)+fbm(x*.02,z*.02)*.25-.12)}
function H(x,z){
  let h=(fbm(x*.008+3,z*.008)-.5)*10;
  const mx=Math.max(0,Math.abs(x)-42)/45, mz=z<14?(14-z)/30:z>110?(z-110)/70:0;
  h*=clamp(Math.hypot(mx,mz),0,1);
  h+=Math.max(0,z-220)*.05*fbm(x*.004,z*.004+7)*2;
  h+=Math.max(0,-z-120)*.03;
  const l=lakeMask(x,z); h=lerp(h,-2.2,l);
  return h;
}
/* ---------- Himmelsfarben nach Sonnenhöhe ---------- */
const KF=[[-14,"#070b18","#141a2c","#2a1f33",.1],[-8,"#121a34","#3c3a58","#7a4a5c",.4],[-3,"#2c3b66","#c07a64","#ff7d4e",.9],[1,"#3f5b91","#e3a477","#ffaa66",.85],[6,"#4b78b4","#d8c4a4","#ffd29a",.5],[20,"#4f86c6","#bcd4e6","#fff0c8",.25]];
function skyAt(el){let i=0;while(i<KF.length-2&&el>KF[i+1][0])i++;const a=KF[i],b=KF[i+1],t=clamp((el-a[0])/(b[0]-a[0]),0,1);
  const c=k=>new T.Color(a[k]).lerp(new T.Color(b[k]),t);return {top:c(1),hor:c(2),glow:c(3),amt:lerp(a[4],b[4],t)}}
function sunVec(az,el){const r=PI/180;return new T.Vector3(Math.cos(el*r)*Math.sin(az*r),Math.sin(el*r),-Math.cos(el*r)*Math.cos(az*r))}

/* ---------- Geometrie-Helfer ---------- */
function paint(g,c){g=g.index?g.toNonIndexed():g;const n=g.attributes.position.count,col=new Float32Array(n*3),cc=new T.Color(c);for(let i=0;i<n;i++){col[i*3]=cc.r;col[i*3+1]=cc.g;col[i*3+2]=cc.b}g.setAttribute("color",new T.BufferAttribute(col,3));return g}
function merge(gs){let n=0;gs.forEach(g=>n+=g.attributes.position.count);const P=new Float32Array(n*3),N=new Float32Array(n*3),C=new Float32Array(n*3);let o=0;
  gs.forEach(g=>{g.computeVertexNormals();P.set(g.attributes.position.array,o*3);N.set(g.attributes.normal.array,o*3);C.set(g.attributes.color.array,o*3);o+=g.attributes.position.count});
  const m=new T.BufferGeometry();m.setAttribute("position",new T.BufferAttribute(P,3));m.setAttribute("normal",new T.BufferAttribute(N,3));m.setAttribute("color",new T.BufferAttribute(C,3));return m}
function stripeTex(base,stripe,n,vertical){const c=document.createElement("canvas");c.width=c.height=64;const x=c.getContext("2d");x.fillStyle=base;x.fillRect(0,0,64,64);x.fillStyle=stripe;
  for(let i=0;i<n;i++){const p=(i+.5)*64/n;vertical?x.fillRect(p-2,0,4,64):x.fillRect(0,p-2,64,4)}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t}

/* ---------- Wild prozedural ---------- */
const M=(c,o={})=>new T.MeshStandardMaterial(Object.assign({color:c,roughness:.95,flatShading:true},o));
function quad(p){
  const g=new T.Group(), body=new T.Group(); g.add(body);
  const mb=p.map?M("#ffffff",{map:p.map}):M(p.col), md=M(p.legCol||p.col);
  const tg=new T.CapsuleGeometry(p.R,Math.max(.01,p.L-2*p.R),3,8);tg.rotateX(PI/2);tg.scale(p.w||1,p.h||1,1);
  const torso=new T.Mesh(tg,mb);torso.position.y=p.leg+p.R*(p.h||1)*.85;body.add(torso);
  const legs=[];[[1,1],[-1,1],[1,-1],[-1,-1]].forEach(([sx,sz])=>{const pv=new T.Group();pv.position.set(sx*p.R*(p.w||1)*.6,p.leg+p.R*.3,sz*(p.L/2-p.R*.75));
    const lg=new T.Mesh(new T.CylinderGeometry(p.legR,p.legR*.6,p.leg+p.R*.3,5),md);lg.position.y=-(p.leg+p.R*.3)/2;pv.add(lg);body.add(pv);legs.push(pv)});
  const neck=new T.Group();neck.position.set(0,p.leg+p.R*(p.h||1)*1.25,p.L/2-p.R*.5);body.add(neck);
  if(p.neck>0){const nk=new T.Mesh(new T.CylinderGeometry(p.neckR*.8,p.neckR,p.neck,6),mb);nk.position.y=p.neck/2;neck.add(nk)}
  const head=new T.Group();head.position.y=p.neck;neck.add(head);
  const hg=p.snout?new T.ConeGeometry(p.headR,p.headL,7):new T.SphereGeometry(p.headR,7,5);if(p.snout)hg.rotateX(PI/2);else hg.scale(1,1,p.headL/p.headR/2);
  const hm=new T.Mesh(hg,p.headMap?M("#fff",{map:p.headMap}):mb);hm.position.z=p.headL*.35;head.add(hm);
  if(p.ears){[1,-1].forEach(s=>{const e=new T.Mesh(new T.ConeGeometry(p.earR||.04,p.ears,4),mb);e.position.set(s*p.headR*.7,p.headR*.9,0);e.rotation.z=-s*.35;head.add(e)})}
  if(p.antler){const ma=M("#d9cdb2");[1,-1].forEach(s=>{const a=new T.Group();a.position.set(s*.06,p.headR*.9,-.02);a.rotation.z=-s*.12;head.add(a);
    const st=new T.Mesh(new T.CylinderGeometry(.012,.02,.24,4),ma);st.position.y=.12;a.add(st);
    [[.09,.5,.08],[.17,-.6,.07]].forEach(([y,r,l])=>{const t=new T.Mesh(new T.CylinderGeometry(.008,.012,l,4),ma);t.position.set(0,y+l/2*Math.cos(r),l/2*Math.sin(r));t.rotation.x=r;a.add(t)})})}
  if(p.tail){const tgm=new T.ConeGeometry(p.tailR,p.tail,6);tgm.rotateX(-PI/2);tgm.translate(0,0,-p.tail/2);const tl=new T.Mesh(tgm,p.tailCol?M(p.tailCol):mb);
    tl.position.set(0,p.leg+p.R*(p.h||1)*1.1,-p.L/2+p.R*.3);tl.rotation.x=p.tailUp||.5;body.add(tl);
    if(p.tailTip){const tt=new T.Mesh(new T.SphereGeometry(p.tailR*.55,5,4),M("#f2efe6"));tt.position.z=-p.tail*.95;tl.add(tt)}}
  if(p.spiegel){const sp=new T.Mesh(new T.SphereGeometry(p.R*.62,7,5),M("#efe9dc"));sp.scale.set(1,1.1,.35);sp.position.set(0,p.leg+p.R*.95,-p.L/2+p.R*.08);body.add(sp)}
  return {g,body,legs,neck,head,base:p.neckUp,graze:p.neckDown,stride:p.stride||.55,walkHz:p.hz||1.6,height:p.leg+p.R*2+p.neck}
}
function person(){
  const g=new T.Group(),body=new T.Group();g.add(body);const jacket=M("#b8402f"),pants=M("#3b3f4a"),skin=M("#d9b08c");
  const legs=[];[1,-1].forEach(s=>{const pv=new T.Group();pv.position.set(s*.1,.9,0);const l=new T.Mesh(new T.CylinderGeometry(.07,.06,.9,5),pants);l.position.y=-.45;pv.add(l);body.add(pv);legs.push(pv)});
  const t=new T.Mesh(new T.CapsuleGeometry(.19,.45,3,7),jacket);t.position.y=1.25;body.add(t);
  const arms=[];[1,-1].forEach(s=>{const pv=new T.Group();pv.position.set(s*.25,1.48,0);const a=new T.Mesh(new T.CylinderGeometry(.05,.045,.6,5),jacket);a.position.y=-.3;pv.add(a);body.add(pv);arms.push(pv)});
  const h=new T.Mesh(new T.SphereGeometry(.12,7,6),skin);h.position.y=1.72;body.add(h);
  const cap=new T.Mesh(new T.CylinderGeometry(.13,.13,.07,8),M("#2f4a3a"));cap.position.y=1.81;body.add(cap);
  return {g,body,legs:[legs[0],legs[1],arms[1],arms[0]],neck:new T.Group(),base:0,graze:0,stride:.45,walkHz:1.7,height:1.85,human:true}
}
let TEX=null;
function texInit(){if(TEX)return;TEX={fr:stripeTex("#5a4532","#c8a77a",7,true),dachs:stripeTex("#efefea","#1a1a1a",3,false)}}
function makeAnimal(k,role){
  texInit();
  if(k==="mensch"){const p=person(),d=quad({L:.7,R:.14,leg:.3,legR:.04,col:"#6b4a2b",neck:.18,neckR:.06,headR:.1,headL:.24,snout:true,ears:.08,tail:.25,tailR:.03,tailUp:1.1,neckUp:.5,neckDown:.5,hz:2.6});
    d.g.position.set(.9,0,.4);p.g.add(d.g);p.dog=d;return p}
  const reh={L:1.1,R:.21,h:1.08,leg:.44,legR:.04,col:"#8a7058",legCol:"#6b5644",neck:.38,neckR:.085,headR:.105,headL:.3,ears:.14,earR:.05,spiegel:true,neckUp:.35,neckDown:2.25,hz:1.5};
  let a;
  if(k==="bock")a=quad(Object.assign({},reh,{antler:true,R:.21}));
  else if(k==="geiss"){a=quad(role==="kitz"?Object.assign({},reh,{col:"#7a6450"}):reh);if(role==="kitz")a.g.scale.setScalar(.72)}
  else if(k==="sau")a=quad({L:1.3,R:.3,h:1.15,w:.78,leg:.3,legR:.055,col:"#4a4038",neck:.18,neckR:.2,headR:.2,headL:.62,snout:true,ears:.11,earR:.06,tail:.25,tailR:.025,tailUp:1.2,neckUp:1.2,neckDown:1.75,hz:1.9,stride:.45});
  else if(k==="frischling")a=quad({L:.62,R:.15,h:1.1,w:.85,leg:.18,legR:.035,col:"#5a4532",map:TEX.fr,neck:.08,neckR:.1,headR:.1,headL:.3,snout:true,ears:.06,earR:.035,tail:.12,tailR:.015,tailUp:1.2,neckUp:1.25,neckDown:1.7,hz:2.6});
  else if(k==="fuchs")a=quad({L:.68,R:.12,h:1.05,leg:.3,legR:.025,col:"#b5651d",legCol:"#2a1d16",neck:.18,neckR:.07,headR:.09,headL:.28,snout:true,ears:.1,earR:.04,tail:.5,tailR:.09,tailUp:.25,tailTip:true,neckUp:.7,neckDown:1.6,hz:2.2});
  else a=quad({L:.78,R:.19,h:.9,w:1.35,leg:.14,legR:.04,col:"#8b8a84",legCol:"#1d1d1d",neck:.05,neckR:.12,headR:.12,headL:.34,snout:true,headMap:TEX.dachs,ears:.04,earR:.03,tail:.12,tailR:.04,tailUp:.6,neckUp:1.3,neckDown:1.6,hz:2.4});
  return a;
}

/* ---------- Welt ---------- */
function World(){
  const R=new T.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
  R.setPixelRatio(Math.min(devicePixelRatio||1,1.75));R.toneMapping=T.ACESFilmicToneMapping;R.outputColorSpace=T.SRGBColorSpace;
  const S=new T.Scene(), cam=new T.PerspectiveCamera(50,1,.1,12000);cam.position.set(0,4.2,0);cam.rotation.order="YXZ";
  S.fog=new T.Fog(0x888888,60,1400);
  const hemi=new T.HemisphereLight(0xbfd4ff,0x3a3020,.6);S.add(hemi);
  const sun=new T.DirectionalLight(0xffc89a,1.5);S.add(sun);S.add(sun.target);
  /* Himmel */
  const skyU={top:{value:new T.Color()},hor:{value:new T.Color()},glow:{value:new T.Color()},amt:{value:.5},sunDir:{value:new T.Vector3()},sunVis:{value:1}};
  const sky=new T.Mesh(new T.SphereGeometry(9000,32,16),new T.ShaderMaterial({uniforms:skyU,side:T.BackSide,depthWrite:false,fog:false,
    vertexShader:`varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform vec3 top,hor,glow,sunDir;uniform float amt,sunVis;varying vec3 vD;void main(){float h=max(vD.y,0.);vec3 c=mix(hor,top,pow(h,.42));
      float s=max(dot(vD,sunDir),0.);c+=glow*amt*(pow(s,5.)*(1.-h)*1.1+pow(s,60.)*.5);c+=vec3(1.,.86,.62)*smoothstep(.9993,.9997,s)*sunVis*1.6;
      if(vD.y<0.)c=hor;gl_FragColor=vec4(c,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`}));S.add(sky);
  /* Sterne */
  const sp=[];for(let i=0;i<900;i++){const a=rnd()*PI*2,e=Math.asin(rnd()*.98+.02);sp.push(Math.cos(e)*Math.sin(a)*8000,Math.sin(e)*8000,Math.cos(e)*Math.cos(a)*8000)}
  const sg=new T.BufferGeometry();sg.setAttribute("position",new T.Float32BufferAttribute(sp,3));
  const stars=new T.Points(sg,new T.PointsMaterial({color:0xffffff,size:1.6,sizeAttenuation:false,transparent:true,opacity:0,fog:false,depthWrite:false}));S.add(stars);
  /* Boden */
  seed=7;
  const gg=new T.PlaneGeometry(2400,2400,220,220);gg.rotateX(-PI/2);gg.translate(0,0,400);
  const gp=gg.attributes.position,gc=new Float32Array(gp.count*3),cA=new T.Color("#6f7d3c"),cB=new T.Color("#9c9450"),cC=new T.Color("#4c5a30"),cS=new T.Color("#6d6450"),tmp=new T.Color();
  for(let i=0;i<gp.count;i++){const x=gp.getX(i),z=gp.getZ(i),h=H(x,z);gp.setY(i,h);
    const meadow=1-clamp(Math.hypot(Math.max(0,Math.abs(x)-42)/30,z<14?(14-z)/20:z>110?(z-110)/40:0),0,1);
    tmp.copy(cC).lerp(cA,meadow).lerp(cB,meadow*fbm(x*.05,z*.05)*.9);const l=lakeMask(x,z);if(l>.02)tmp.lerp(cS,clamp(l*3,0,1));
    gc[i*3]=tmp.r;gc[i*3+1]=tmp.g;gc[i*3+2]=tmp.b}
  gg.setAttribute("color",new T.BufferAttribute(gc,3));gg.computeVertexNormals();
  const ground=new T.Mesh(gg,new T.MeshLambertMaterial({vertexColors:true}));S.add(ground);
  /* See */
  const water=new T.Mesh(new T.PlaneGeometry(500,700),new T.MeshPhongMaterial({color:0x2a3b4a,specular:0xffd0a0,shininess:120,transparent:true,opacity:.92}));
  water.rotation.x=-PI/2;water.position.set(170,-1.1,40);S.add(water);
  /* Berge (Alpenkette im Süden) */
  function ridge(rad,h0,h1,a0,a1,col,snow,n){const pos=[],colr=[],c=new T.Color(col),cs=new T.Color("#e4e8ee"),cd=c.clone().multiplyScalar(.72);
    const A=k=>(a0+(a1-a0)*k)*PI/180, hh=k=>{const v=fbm(k*9+rad*.001,3.3,5);const r=1-Math.abs(fbm(k*16,9.1,3)*2-1);return h0+(h1-h0)*Math.pow(clamp(v*.55+r*.6-.15,0,1),1.3)};
    const P=(k,y)=>[rad*Math.sin(A(k)),y,-rad*Math.cos(A(k))];
    for(let i=0;i<n;i++){const k0=i/n,k1=(i+1)/n,t0=hh(k0),t1=hh(k1),sl=h0+(h1-h0)*.62;
      const col=(y,top)=>{if(!top)return y<0?cd:c;return snow&&y>sl?cs:c};
      const rows=[[-60,-60,false],[Math.min(t0,sl*.85)*.0+t0*.6,t1*.6,false],[t0,t1,true]];
      for(let r=0;r<2;r++){const [ya0,ya1,ta]=rows[r],[yb0,yb1,tb]=rows[r+1];
        const q=[[P(k0,ya0),col(ya0,ta)],[P(k0,yb0),col(yb0,tb)],[P(k1,yb1),col(yb1,tb)],[P(k1,ya1),col(ya1,ta)]];
        [[0,1,2],[0,2,3]].forEach(tr=>tr.forEach(j=>{pos.push(...q[j][0]);colr.push(q[j][1].r,q[j][1].g,q[j][1].b)}))}}
    const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(pos,3));g.setAttribute("color",new T.Float32BufferAttribute(colr,3));
    return new T.Mesh(g,new T.MeshBasicMaterial({vertexColors:true,fog:false,side:T.DoubleSide}))}
  const alps=ridge(5200,180,820,128,205,"#7d879c",true,240), fore=ridge(2600,60,230,95,265,"#3d4a4e",false,200);S.add(alps,fore);
  /* Bäume */
  const coniG=merge([paint(new T.CylinderGeometry(.25,.35,3,5).translate(0,1.5,0),"#4a3626"),paint(new T.ConeGeometry(2.6,6,7).translate(0,5,0),"#23361f"),paint(new T.ConeGeometry(2.1,5,7).translate(0,8,0),"#26401f"),paint(new T.ConeGeometry(1.4,4,7).translate(0,11,0),"#2c4723")]);
  const decoG=merge([paint(new T.CylinderGeometry(.25,.4,4,5).translate(0,2,0),"#4b3a2c"),paint(new T.IcosahedronGeometry(3.2,1).translate(0,6.5,0),"#8a6a2c"),paint(new T.IcosahedronGeometry(2.2,0).translate(1.4,8,.6),"#9b7430")]);
  const tm=new T.MeshLambertMaterial({vertexColors:true});
  const conis=[],decos=[];seed=11;
  for(let i=0;i<9000&&conis.length+decos.length<3600;i++){const x=(rnd()-.5)*1400,z=-350+rnd()*1150;
    const d=Math.hypot(x,z);if(d<22)continue;if(lakeMask(x,z)>.01)continue;
    const edge=z>118+fbm(x*.03,1)*40||Math.abs(x)>58+fbm(z*.03,5)*30||z<-25;
    if(!edge)continue;if(z>700&&rnd()<.6)continue;(rnd()<.24?decos:conis).push([x,z])}
  const inst=(geo,list,smin,smax)=>{const m=new T.InstancedMesh(geo,tm,list.length),o=new T.Object3D(),c=new T.Color();
    list.forEach(([x,z],i)=>{o.position.set(x,H(x,z)-.3,z);o.rotation.y=rnd()*6.28;const s=smin+rnd()*(smax-smin);o.scale.set(s*(.85+rnd()*.3),s,s*(.85+rnd()*.3));o.updateMatrix();m.setMatrixAt(i,o.matrix);c.setHSL(.0,0,.75+rnd()*.4);m.setColorAt(i,c)});return m};
  const forest=new T.Group();forest.add(inst(coniG,conis,1.2,2.2),inst(decoG,decos,.9,1.5));S.add(forest);
  /* Gras */
  const bl=new T.PlaneGeometry(.08,.7,1,3);bl.translate(0,.35,0);const bp=bl.attributes.position;for(let i=0;i<bp.count;i++){const y=bp.getY(i);bp.setX(i,bp.getX(i)*(1-y/.75))}
  const uT={value:0};const gm=new T.MeshLambertMaterial({color:0xb0aa62,side:T.DoubleSide});
  gm.onBeforeCompile=sh=>{sh.uniforms.uT=uT;sh.vertexShader="uniform float uT;\n"+sh.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
    vec4 wp=instanceMatrix*vec4(0.,0.,0.,1.);float sw=position.y*position.y;transformed.x+=sin(uT*1.7+wp.x*.31+wp.z*.17)*.18*sw;transformed.z+=cos(uT*1.2+wp.z*.27)*.09*sw;`)};
  const GN=14000,grass=new T.InstancedMesh(bl,gm,GN),o=new T.Object3D(),gcol=new T.Color();seed=23;
  for(let i=0;i<GN;i++){let x,z;const near=i<5000;x=(rnd()-.5)*(near?40:110);z=(near?6+rnd()*40:8+rnd()*120);if(lakeMask(x,z)>.2){x=-Math.abs(x)}
    o.position.set(x,H(x,z),z);o.rotation.set(0,rnd()*6.28,0);const s=.6+rnd()*.8;const near2=z<16;o.scale.set(s,(near2?.7:.28)+rnd()*(near2?.6:.3),s);o.updateMatrix();grass.setMatrixAt(i,o.matrix);
    gcol.setHSL(.15+rnd()*.06,.35+rnd()*.2,.32+rnd()*.18);grass.setColorAt(i,gcol)}
  S.add(grass);
  /* Feldweg (für den Spaziergänger) */
  const path=new T.Mesh(new T.PlaneGeometry(300,2.4),new T.MeshLambertMaterial({color:0x8a7b62}));path.rotation.x=-PI/2;path.position.set(-40,0,0);S.add(path);path.visible=false;
  /* Kanzel-Brüstung im Vordergrund */
  const kan=new T.Group(),wood=M("#5a4430"),wood2=M("#7a5c3e");
  const rail=new T.Mesh(new T.BoxGeometry(2.6,.12,.22),wood2);rail.position.set(0,3.4,1.6);kan.add(rail);
  const board=new T.Mesh(new T.BoxGeometry(2.6,.9,.06),wood);board.position.set(0,2.9,1.66);kan.add(board);
  [-1.3,1.3].forEach(x=>{const p=new T.Mesh(new T.BoxGeometry(.12,2.6,.12),wood);p.position.set(x,4.6,1.3);kan.add(p)});
  const roof=new T.Mesh(new T.BoxGeometry(2.9,.1,1.2),wood);roof.position.set(0,6.05,1);kan.add(roof);S.add(kan);
  /* Kuppe (nur für die Kugelfang-Situation) */
  const hg=new T.SphereGeometry(1,40,20,0,PI*2,0,PI/2);const hp=hg.attributes.position;for(let i=0;i<hp.count;i++){const y=hp.getY(i);hp.setY(i,Math.pow(y,1.6))}hg.computeVertexNormals();
  const hill=new T.Mesh(hg,new T.MeshLambertMaterial({color:0x56653a}));hill.scale.set(42,30,34);hill.position.set(-62,-1,120);hill.visible=false;S.add(hill);

  function gy(x,z){let h=H(x,z);if(hill.visible){const dx=(x+62)/42,dz=(z-120)/34,r=dx*dx+dz*dz;if(r<1)h=Math.max(h,-1+30*Math.pow(Math.sqrt(1-r),1.6))}return h}
  /* ---------- Zustand ---------- */
  let aim=null, canvasHost=null, raf=0, last=0, yaw=0, pitch=-.12, fov0=50, fovT=50, glass=false, beasts=[], onPick=null, prog=0, baseEl=0, sunAz=240, gyro=null, gyro0=null, sel=-1;
  const ray=new T.Raycaster(), ndc=new T.Vector2();
  function resize(){if(!canvasHost)return;const w=canvasHost.clientWidth,h=canvasHost.clientHeight;if(!w||!h)return;R.setSize(w,h,false);cam.aspect=w/h;fov0=cam.aspect<.8?58:cam.aspect<1.3?52:44;if(!glass)fovT=fov0;cam.updateProjectionMatrix()}
  function light(){const el=baseEl-prog*4.5, k=skyAt(el), sv=sunVec(sunAz,el);
    skyU.top.value.copy(k.top);skyU.hor.value.copy(k.hor);skyU.glow.value.copy(k.glow);skyU.amt.value=k.amt;skyU.sunDir.value.copy(sv);skyU.sunVis.value=el>-1?1:0;
    const fc=k.hor.clone().lerp(k.top,.35);S.fog.color.copy(fc);R.setClearColor(fc);
    const day=clamp((el+6)/14,0,1);sun.intensity=clamp((el+3)/8,0,1)*2.8;sun.color.copy(new T.Color("#ffb070").lerp(new T.Color("#fff3dc"),clamp(el/15,0,1)));
    sun.position.copy(sv).multiplyScalar(300);hemi.intensity=.55+day*1.25;hemi.color.copy(k.top).lerp(new T.Color("#ffffff"),.35);hemi.groundColor.set(0x2a2418);
    stars.material.opacity=clamp((-el-5)/6,0,1)*.9;R.toneMappingExposure=1.05+day*.45;
    const haze=k.hor.clone(),fa=fore.material,aa=alps.material;aa.color.copy(new T.Color(1,1,1).lerp(haze,.45));fa.color.copy(new T.Color(.8,.8,.8).lerp(haze,.25).multiplyScalar(.55+day*.5));aa.color.multiplyScalar(.5+day*.55)}
  function loop(now){raf=requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000||0);last=now;uT.value=now/1000;
    if(gyro&&gyro0!=null){yaw=clamp(-(gyro.a-gyro0.a)*PI/180,-1.4,1.4);pitch=clamp((gyro.b-gyro0.b)*PI/180*.8-.12,-.35,.25)}
    if(aim&&!down){yaw+=(aim.y-yaw)*Math.min(1,dt*5);pitch+=(aim.p-pitch)*Math.min(1,dt*5);if(Math.abs(aim.y-yaw)<.002&&Math.abs(aim.p-pitch)<.002)aim=null}
    cam.rotation.y=PI+yaw;cam.rotation.x=pitch;
    const f=cam.fov+(fovT-cam.fov)*Math.min(1,dt*6);if(Math.abs(f-cam.fov)>.01){cam.fov=f;cam.updateProjectionMatrix()}
    beasts.forEach(b=>b.update(dt,now/1000));sky.position.copy(cam.position);R.render(S,cam)}
  /* Eingabe */
  let down=null;
  function pd(e){aim=null;down={x:e.clientX,y:e.clientY,yaw,pitch,t:performance.now()};R.domElement.setPointerCapture(e.pointerId)}
  function pm(e){if(!down||gyro)return;const k=(cam.fov/fov0)*.0055;yaw=clamp(down.yaw+(e.clientX-down.x)*k,-1.5,1.5);pitch=clamp(down.pitch+(e.clientY-down.y)*k,-.38,.28)}
  function pu(e){if(!down)return;const moved=Math.hypot(e.clientX-down.x,e.clientY-down.y),dt=performance.now()-down.t;down=null;if(moved<8&&dt<500)pick(e)}
  function pick(e){if(!onPick)return;const r=R.domElement.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ndc,cam);
    const hits=ray.intersectObjects(beasts.filter(b=>b.alive).map(b=>b.hit),false);if(hits.length){const i=hits[0].object.userData.i;select(i);onPick(i)}}
  function select(i){sel=i;beasts.forEach((b,j)=>b.mark(j===i))}
  R.domElement.style.touchAction="none";R.domElement.addEventListener("pointerdown",pd);R.domElement.addEventListener("pointermove",pm);R.domElement.addEventListener("pointerup",pu);R.domElement.addEventListener("pointercancel",()=>down=null);
  const onOri=e=>{if(e.alpha==null)return;gyro={a:e.alpha,b:e.beta};if(gyro0==null)gyro0={a:e.alpha,b:e.beta}};
  addEventListener("resize",resize);

  /* Wild steuern */
  function beast(a,i,sc){
    const k=a.k, m=makeAnimal(k,a.role), tgt=place(a,i,sc);
    m.g.position.copy(tgt.start);S.add(m.g);
    const hit=new T.Mesh(new T.SphereGeometry(Math.max(1.6,m.height*1.3),8,6),new T.MeshBasicMaterial({visible:false}));hit.userData.i=i;hit.position.y=m.height*.5;m.g.add(hit);
    const ring=new T.Mesh(new T.RingGeometry(.9,1.05,32),new T.MeshBasicMaterial({color:0xcda85c,transparent:true,opacity:.0,side:T.DoubleSide,depthWrite:false,fog:false}));ring.rotation.x=-PI/2;ring.position.y=.06;ring.scale.setScalar(Math.max(.8,m.height*.9));m.g.add(ring);
    let born=performance.now()/1000,mode="in",t=0,ph=rnd()*6,head=0,from=tgt.start.clone(),to=tgt.pos.clone(),dur=tgt.dur,face=tgt.face,fallT=0,grazeT=rnd()*4;
    const B={hit,alive:true,k,pos:()=>m.g.visible?m.g.position:null,
      mark(on){ring.material.opacity=on?.85:0},
      update(dt,time){t+=dt;let moving=false,spd=0;
        if(mode==="in"){const p=Math.min(1,(time-born)/dur),e=1-Math.pow(1-p,2);m.g.position.lerpVectors(from,to,e);m.g.position.y=gy(m.g.position.x,m.g.position.z);
          const dir=Math.atan2(to.x-from.x,to.z-from.z);m.g.rotation.y=dir;moving=p<1;spd=1;if(p>=1){mode="stand";t=0}}
        else if(mode==="stand"){const d=face-m.g.rotation.y;m.g.rotation.y+=d*Math.min(1,dt*2);grazeT+=dt;
          const g=m.human?0:(Math.sin(grazeT*.55)>.1?1:0);head+= (g-head)*Math.min(1,dt*1.8);moving=Math.abs(d)>.05;spd=.4}
        else if(mode==="out"){const v=new T.Vector3().subVectors(to,m.g.position);const L=v.length();if(L>.5){v.normalize();m.g.position.addScaledVector(v,dt*tgt.flee);m.g.position.y=gy(m.g.position.x,m.g.position.z);m.g.rotation.y=Math.atan2(v.x,v.z)}else{m.g.visible=false}moving=L>.5;spd=tgt.flee/3;head+=(0-head)*dt*4}
        else if(mode==="fall"){fallT+=dt;const p=Math.min(1,fallT/.7);m.body.position.y=Math.sin(Math.min(1,fallT/.35)*PI)*.35;m.body.rotation.z=(p*p)*PI/2*(face>0?1:-1);m.body.position.y-= p*.1;head=1}
        ph+=dt*m.walkHz*PI*2*(moving?spd*1.2:0);const amp=moving?m.stride:0;
        m.legs.forEach((l,j)=>{const s=(j===0||j===3)?1:-1;l.rotation.x+= (Math.sin(ph)*amp*s-l.rotation.x)*Math.min(1,dt*10)});
        if(!m.human){m.neck.rotation.x=lerp(m.base,m.graze,head);m.head.rotation.x=-m.neck.rotation.x+.15+head*1.05}else if(m.dog){const d=m.dog;d.legs.forEach((l,j)=>{const s=(j===0||j===3)?1:-1;l.rotation.x=moving?Math.sin(ph*1.6)*.6*s:0});d.neck.rotation.x=d.base}
        m.body.position.y=(mode==="fall")?m.body.position.y:Math.abs(Math.sin(ph))*.03*(moving?1:0)},
      flee(){if(!B.alive)return;mode="out";to=tgt.exit.clone();m.g.visible=true},
      fall(){B.alive=false;mode="fall";fallT=0;ring.material.opacity=0},
      dispose(){S.remove(m.g)}};
    return B;
  }
  function place(a,i,sc){
    const X=-(a.x-240)/240*11, Z=22+(366-a.y)*2.2;let pos=new T.Vector3(X,0,Z);
    if(sc.id==="kuppe"){pos.set(-62,0,119)}
    if(a.k==="mensch"&&sc.an[0]){const f=place(sc.an[0],0,{id:""}).pos;const s=150/f.z;pos.set(f.x*s,0,150)}
    pos.y=gy(pos.x,pos.z);
    const side=X>=0?1:-1, start=sc.id==="kuppe"?new T.Vector3(pos.x-22,0,pos.z+8):a.k==="mensch"?new T.Vector3(pos.x+40,0,pos.z):new T.Vector3(pos.x+side*14+(rnd()-.5)*4,0,Math.max(pos.z+26,124));
    start.y=gy(start.x,start.z);
    const exit=a.k==="mensch"?new T.Vector3(pos.x-80,0,pos.z):new T.Vector3(pos.x+side*30,0,pos.z+70);
    const face=a.k==="mensch"?-PI/2:(side>0?-PI/2:PI/2)+(rnd()-.5)*.2;
    return {pos,start,exit,face,dur:sc.id==="kuppe"?4:3.2+i*.5+(a.k==="mensch"?6:0),flee:a.k==="mensch"?1.3:a.k==="dachs"?3:9};
  }

  return {
    attach(host){canvasHost=host;host.prepend(R.domElement);R.domElement.className="az3d";resize();requestAnimationFrame(resize);if(!raf){last=performance.now();raf=requestAnimationFrame(loop)}},
    scene(sc,date,cb){beasts.forEach(b=>b.dispose());beasts=[];onPick=cb;sel=-1;prog=0;glass=false;fovT=fov0;yaw=0;pitch=-.12;
      const sp=window.sunPos(date);baseEl=sp.el;sunAz=sp.az;hill.visible=sc.id==="kuppe";path.visible=sc.id==="mensch";if(sc.id==="mensch"){path.position.set(0,H(0,150)+.05,150)}
      seed=Math.floor(Math.random()*1e6)+1;beasts=sc.an.map((a,i)=>beast(a,i,sc));light()},
    progress(p){prog=p;light()},
    glass(on){glass=on==null?!glass:on;fovT=glass?fov0/4.5:fov0;
      if(glass&&!gyro){const al=beasts.filter(b=>b.alive&&b.pos());if(al.length){const c=new T.Vector3();al.forEach(b=>c.add(b.pos()));c.divideScalar(al.length);c.y+=.5;
        const d=c.sub(cam.position);const tp=Math.atan2(d.y,Math.hypot(d.x,d.z));aim={y:clamp(Math.atan2(d.x,d.z),-1.5,1.5),p:clamp(tp,-.38,.28)}}}
      return glass},
    select,
    _dbg:{cam,S,makeAnimal,R},
    shoot(i,falls){const b=beasts[i];if(b&&falls)b.fall();beasts.forEach((x,j)=>{if(j!==i)setTimeout(()=>x.flee(),250+j*120)})},
    leave(){beasts.forEach(b=>b.flee())},
    async gyro(){try{if(typeof DeviceOrientationEvent!=="undefined"&&DeviceOrientationEvent.requestPermission){const r=await DeviceOrientationEvent.requestPermission();if(r!=="granted")return false}
      if(gyro){removeEventListener("deviceorientation",onOri);gyro=null;gyro0=null;return false}gyro={a:0,b:0};gyro0=null;addEventListener("deviceorientation",onOri);return true}catch(e){return false}},
    stop(){cancelAnimationFrame(raf);raf=0;if(gyro){removeEventListener("deviceorientation",onOri);gyro=null}},
    dispose(){this.stop();removeEventListener("resize",resize);beasts.forEach(b=>b.dispose());S.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){[].concat(o.material).forEach(m=>{if(m.map)m.map.dispose();m.dispose()})}});R.dispose();R.forceContextLoss&&R.forceContextLoss();R.domElement.remove()}
  };
}
window.AZ3D={World,supported(){try{const c=document.createElement("canvas");return !!(window.WebGLRenderingContext&&(c.getContext("webgl2")||c.getContext("webgl")))}catch(e){return false}}};
})();
