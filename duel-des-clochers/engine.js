export const COUNT=40;
export const colors=['#dc765c','#379489'];
export const CAMPS=[{x:65,y:280,r:56},{x:935,y:280,r:56}];
export const DEFAULTS={obstacles:true,residents:true,leaders:true,mixed:true};
export const OBSTACLES=[{x:500,y:280,r:52,kind:'fountain'},{x:355,y:155,r:29,kind:'planter'},{x:645,y:405,r:29,kind:'planter'},{x:355,y:405,r:29,kind:'planter'},{x:645,y:155,r:29,kind:'planter'}];
const radius=p=>p.leader?19:10;
function seeded(seed=42){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
export function createGame(team=0,options={},random=seeded()){
 const g={team,options:{...DEFAULTS,...options},turn:1,phase:'aim',running:true,paused:false,winner:null,elapsed:0,particles:[],leaders:[{x:170,y:280,vx:0,vy:0,team:0,leader:true},{x:830,y:280,vx:0,vy:0,team:1,leader:true}],people:[]};g.obstacles=g.options.obstacles?OBSTACLES:[];
 while(g.people.length<COUNT){const p={x:155+random()*690,y:60+random()*440,team:-1,shield:0,secured:false,vx:0,vy:0,path:[]};if(g.obstacles.some(o=>Math.hypot(p.x-o.x,p.y-o.y)<o.r+18)||g.people.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<24))continue;g.people.push(p);}
 return g;
}
export function scores(g){return [0,1].map(t=>g.people.filter(p=>p.secured&&p.team===t).length);}
export function travelling(g){return [0,1].map(t=>g.people.filter(p=>!p.secured&&p.team===t).length);}
export function convert(g,p,team){if(p.secured||p.team===team||p.shield===g.turn)return false;p.team=team;p.shield=g.turn;p.path=[];g.particles.push({x:p.x,y:p.y,team,life:.65});return true;}
// Breadth-first navigation around the fixed obstacles. Moving people never block a route permanently.
export function routeToCamp(g,p){
 const size=20,cols=49,rows=26,cell=(x,y)=>({x:Math.max(0,Math.min(cols-1,Math.round((x-20)/size))),y:Math.max(0,Math.min(rows-1,Math.round((y-30)/size)))}),world=c=>({x:20+c.x*size,y:30+c.y*size}),key=c=>c.y*cols+c.x;
 const start=cell(p.x,p.y),goal=cell(CAMPS[p.team].x,CAMPS[p.team].y),queue=[start],parents=new Map([[key(start),null]]);let found=null;
 const free=c=>{const w=world(c);return !g.obstacles.some(o=>Math.hypot(w.x-o.x,w.y-o.y)<o.r+14);};
 for(let i=0;i<queue.length;i++){const c=queue[i];if(key(c)===key(goal)){found=c;break;}for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const n={x:c.x+dx,y:c.y+dy};if(n.x<0||n.y<0||n.x>=cols||n.y>=rows||parents.has(key(n))||!free(n))continue;if(dx&&dy&&(!free({x:c.x+dx,y:c.y})||!free({x:c.x,y:c.y+dy})))continue;parents.set(key(n),c);queue.push(n);}}
 if(!found)return [CAMPS[p.team]];const path=[];while(found&&key(found)!==key(start)){path.push(world(found));found=parents.get(key(found));}return path.reverse().concat([CAMPS[p.team]]);
}
export function launch(g,dx,dy){
 if(!g.running||g.paused||g.phase!=='aim'||Math.hypot(dx,dy)<8)return false;
 const player=g.leaders[g.team],ai=g.leaders[1-g.team];const targets=g.people.filter(p=>!p.secured&&p.team!==ai.team).sort((a,b)=>Math.hypot(a.x-ai.x,a.y-ai.y)-Math.hypot(b.x-ai.x,b.y-ai.y));const target=targets[0]||{x:500,y:280};const ax=target.x-ai.x,ay=target.y-ai.y,dist=Math.hypot(ax,ay)||1,power=Math.min(140,Math.hypot(dx,dy))*5,len=Math.hypot(dx,dy);player.vx=dx/len*power;player.vy=dy/len*power;const ap=Math.min(650,Math.max(260,dist*2));ai.vx=ax/dist*ap;ai.vy=ay/dist*ap;
 const random=seeded(g.turn*97);
 for(const p of g.people){if(p.secured)continue;if(p.team>=0){p.path=routeToCamp(g,p);const t=p.path[0],d=Math.hypot(t.x-p.x,t.y-p.y)||1;p.vx=(t.x-p.x)/d*115;p.vy=(t.y-p.y)/d*115;}else{const a=random()*Math.PI*2,s=35+random()*40;p.vx=Math.cos(a)*s;p.vy=Math.sin(a)*s;}}
 g.phase='motion';g.elapsed=0;return true;
}
export function collide(a,b){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),min=radius(a)+radius(b);if(d>=min)return false;const nx=d>1e-6?dx/d:1,ny=d>1e-6?dy/d:0,over=(min-d)/2;a.x-=nx*over;a.y-=ny*over;b.x+=nx*over;b.y+=ny*over;const rel=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;if(rel>0){const ma=a.leader?3:1,mb=b.leader?3:1,impulse=1.65*rel/(1/ma+1/mb);a.vx-=impulse/ma*nx;a.vy-=impulse/ma*ny;b.vx+=impulse/mb*nx;b.vy+=impulse/mb*ny;}return true;}
function scenery(g,p){const r=radius(p);for(const [axis,v,min,max] of [['x','vx',r+6,994-r],['y','vy',r+12,548-r]]){if(p[axis]<min){p[axis]=min;p[v]=Math.abs(p[v])*.75;}if(p[axis]>max){p[axis]=max;p[v]=-Math.abs(p[v])*.75;}}
 for(const o of g.obstacles){const dx=p.x-o.x,dy=p.y-o.y,d=Math.hypot(dx,dy),min=o.r+r;if(d>=min)continue;const nx=d?dx/d:1,ny=d?dy/d:0;p.x=o.x+nx*(min+.1);p.y=o.y+ny*(min+.1);const dot=p.vx*nx+p.vy*ny;if(dot<0){p.vx-=1.7*dot*nx;p.vy-=1.7*dot*ny;}}
}
export function step(g,dt){if(!g.running||g.paused||g.phase!=='motion')return;dt=Math.max(0,Math.min(.04,dt));g.elapsed+=dt;
 // Substeps prevent a fast leader from skipping a small resident.
 for(let sub=0;sub<2;sub++){const h=dt/2,people=g.people.filter(p=>!p.secured),bodies=[...g.leaders,...people];
 for(const p of bodies){let speed=Math.hypot(p.vx,p.vy);if(!p.leader&&p.team>=0&&p.shield!==g.turn&&speed>5){while(p.path.length>1&&Math.hypot(p.path[0].x-p.x,p.path[0].y-p.y)<16)p.path.shift();const t=p.path[0];if(t){const d=Math.hypot(t.x-p.x,t.y-p.y)||1,blend=Math.min(1,h*7);let ux=(t.x-p.x)/d,uy=(t.y-p.y)/d;
// Keep to the right when approaching another resident, preventing head-on deadlocks.
if(g.options.residents&&people.some(q=>{if(q===p)return false;const dx=q.x-p.x,dy=q.y-p.y,along=dx*ux+dy*uy,side=Math.abs(dx*uy-dy*ux);return along>0&&along<64&&side<25;})){const nx=ux-uy*1.5,ny=uy+ux*1.5,n=Math.hypot(nx,ny);ux=nx/n;uy=ny/n;}
p.vx+=(speed*ux-p.vx)*blend;p.vy+=(speed*uy-p.vy)*blend;}}
 p.x+=p.vx*h;p.y+=p.vy*h;scenery(g,p);const f=Math.exp(-(p.leader?1.1:.9)*h);p.vx*=f;p.vy*=f;if(Math.hypot(p.vx,p.vy)<(p.leader?12:6))p.vx=p.vy=0;}
 if(g.options.leaders)collide(g.leaders[0],g.leaders[1]);
 if(g.options.residents)for(let i=0;i<people.length;i++)for(let j=i+1;j<people.length;j++)collide(people[i],people[j]);
 // Conversion remains enabled even when physical leader/resident collisions are disabled.
 for(const p of people){const near=g.leaders.filter(l=>Math.hypot(p.x-l.x,p.y-l.y)<31).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));if(near.length){const changed=convert(g,p,near[0].team);if(changed){p.vx=p.vy=0;}if(g.options.mixed)for(const l of near)collide(l,p);}}
 for(const p of bodies)scenery(g,p);
 for(const p of people)if(p.team>=0&&p.shield!==g.turn){const camp=CAMPS[p.team];if(Math.hypot(p.x-camp.x,p.y-camp.y)<camp.r-8){p.secured=true;p.vx=p.vy=0;p.path=[];}}
 }
 g.particles=g.particles.filter(p=>(p.life-=dt)>0);
 if(g.people.every(p=>p.secured)){g.running=false;g.phase='over';const s=scores(g);g.winner=s[0]===s[1]?-1:s[0]>s[1]?0:1;return;}
 if(g.elapsed>8||[...g.leaders,...g.people.filter(p=>!p.secured)].every(p=>p.vx===0&&p.vy===0)){[...g.leaders,...g.people].forEach(p=>{p.vx=p.vy=0;});g.turn++;g.phase='aim';}
}
