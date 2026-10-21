export const COUNT=40, TURNS=10;
export const colors=['#dc765c','#379489'];
export function createGame(team=0,random=Math.random){return {team,turn:1,phase:'aim',running:true,paused:false,winner:null,elapsed:0,particles:[],leaders:[{x:170,y:280,vx:0,vy:0,team:0},{x:830,y:280,vx:0,vy:0,team:1}],people:Array.from({length:COUNT},()=>({x:80+random()*840,y:70+random()*420,team:-1,shield:0}))};}
export function scores(g){return [0,1].map(t=>g.people.filter(p=>p.team===t).length);}
export function convert(g,p,team){if(p.team===team||p.shield===g.turn)return false;p.team=team;p.shield=g.turn;g.particles.push({x:p.x,y:p.y,team,life:.65});return true;}
export function launch(g,dx,dy){if(!g.running||g.paused||g.phase!=='aim'||Math.hypot(dx,dy)<8)return false;const player=g.leaders[g.team],ai=g.leaders[1-g.team];const targets=g.people.filter(p=>p.team!==ai.team);const target=targets.sort((a,b)=>Math.hypot(a.x-ai.x,a.y-ai.y)-Math.hypot(b.x-ai.x,b.y-ai.y))[0]||{x:500,y:280};const ax=target.x-ai.x,ay=target.y-ai.y,dist=Math.hypot(ax,ay)||1;const power=Math.min(140,Math.hypot(dx,dy))*5;const len=Math.hypot(dx,dy);player.vx=dx/len*power;player.vy=dy/len*power;const ap=Math.min(650,Math.max(260,dist*2));ai.vx=ax/dist*ap;ai.vy=ay/dist*ap;g.phase='motion';g.elapsed=0;return true;}
export function step(g,dt){if(!g.running||g.paused||g.phase!=='motion')return;dt=Math.max(0,Math.min(.04,dt));g.elapsed+=dt;
for(const l of g.leaders){l.x+=l.vx*dt;l.y+=l.vy*dt;for(const [pos,vel,min,max] of [['x','vx',28,972],['y','vy',35,525]]){if(l[pos]<min){l[pos]=min;l[vel]=Math.abs(l[vel])*.8;}if(l[pos]>max){l[pos]=max;l[vel]=-Math.abs(l[vel])*.8;}}const friction=Math.exp(-1.1*dt);l.vx*=friction;l.vy*=friction;if(Math.hypot(l.vx,l.vy)<12)l.vx=l.vy=0;}
const [a,b]=g.leaders,dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<38&&d>0){const nx=dx/d,ny=dy/d,over=(38-d)/2;a.x-=nx*over;a.y-=ny*over;b.x+=nx*over;b.y+=ny*over;const relative=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;if(relative>0){a.vx-=relative*nx;a.vy-=relative*ny;b.vx+=relative*nx;b.vy+=relative*ny;}}
for(const p of g.people){const nearby=g.leaders.filter(l=>Math.hypot(p.x-l.x,p.y-l.y)<26).sort((a,b)=>Math.hypot(p.x-a.x,p.y-a.y)-Math.hypot(p.x-b.x,p.y-b.y));if(nearby.length)convert(g,p,nearby[0].team);}
g.particles=g.particles.filter(p=>(p.life-=dt)>0);
if(g.elapsed>8||g.leaders.every(l=>l.vx===0&&l.vy===0)){g.leaders.forEach(l=>{l.vx=l.vy=0;});const s=scores(g);if(g.turn>=TURNS||s.includes(COUNT)){g.running=false;g.phase='over';g.winner=s[0]===s[1]?-1:s[0]>s[1]?0:1;}else{g.turn++;g.phase='aim';}}
}
