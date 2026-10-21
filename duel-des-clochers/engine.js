export const COUNT = 40;
export const DURATION = 90;
export const colors = ['#dc765c', '#379489'];
export function createGame(team=0, random=Math.random) {
  return {team, time:DURATION, running:true, paused:false, winner:null, particles:[],
    leaders:[{x:170,y:280,team:0,cooldown:0,boost:0},{x:830,y:280,team:1,cooldown:0,boost:0}],
    people:Array.from({length:COUNT},()=>({x:90+random()*820,y:90+random()*380,team:-1,shield:0,angle:random()*Math.PI*2,turn:random()*3}))};
}
export function scores(g){return [g.people.filter(p=>p.team===0).length,g.people.filter(p=>p.team===1).length];}
export function dash(p){if(p.cooldown<=0){p.boost=.3;p.cooldown=4;return true;}return false;}
export function convert(g,p,team){if(p.team===team||p.shield>0)return false;p.team=team;p.shield=3;g.particles.push({x:p.x,y:p.y,team,life:.65});return true;}
function move(p,x,y,speed,dt){const len=Math.hypot(x,y);if(len){p.x+=x/len*speed*dt;p.y+=y/len*speed*dt;}p.x=Math.max(36,Math.min(964,p.x));p.y=Math.max(46,Math.min(524,p.y));}
export function step(g,dt,input={x:0,y:0}){
  if(!g.running||g.paused)return;
  dt=Math.max(0,Math.min(dt,.05));g.time=Math.max(0,g.time-dt);
  for(const p of g.people){p.shield=Math.max(0,p.shield-dt);p.turn-=dt;if(p.turn<0){p.angle+=(Math.random()-.5)*2;p.turn=1+Math.random()*2;}move(p,Math.cos(p.angle),Math.sin(p.angle),18,dt);if(p.x<=36||p.x>=964||p.y<=46||p.y>=524)p.angle+=Math.PI;}
  for(const l of g.leaders){l.cooldown=Math.max(0,l.cooldown-dt);l.boost=Math.max(0,l.boost-dt);}
  const player=g.leaders[g.team], ai=g.leaders[1-g.team];
  move(player,input.x,input.y,player.boost>0?420:160,dt);
  const targets=g.people.filter(p=>p.team!==ai.team&&p.shield<=0).sort((a,b)=>Math.hypot(a.x-ai.x,a.y-ai.y)-Math.hypot(b.x-ai.x,b.y-ai.y));
  if(targets.length){const t=targets[0],d=Math.hypot(t.x-ai.x,t.y-ai.y);if(d>150)dash(ai);move(ai,t.x-ai.x,t.y-ai.y,ai.boost>0?420:160,dt);}
  for(const p of g.people){const nearby=g.leaders.filter(l=>Math.hypot(p.x-l.x,p.y-l.y)<25).sort((a,b)=>Math.hypot(p.x-a.x,p.y-a.y)-Math.hypot(p.x-b.x,p.y-b.y));if(nearby.length)convert(g,p,nearby[0].team);}
  g.particles=g.particles.filter(p=>(p.life-=dt)>0);
  const s=scores(g);if(g.time<=0||s.includes(COUNT)){g.running=false;g.winner=s[0]===s[1]?-1:s[0]>s[1]?0:1;}
}
