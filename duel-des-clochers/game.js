import {createGame,step,scores,dash,colors,COUNT} from './engine.js?v=2';
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
let team=0,game=createGame(),last=0,keys=new Set(),stick={x:0,y:0},shown=false, resumeAfterHelp=false;
game.running=false;
const trees=[[60,65],[100,55],[910,60],[947,90],[55,470],[90,510],[930,485],[960,450],[500,40],[540,46]];
function circle(x,y,r,color){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
function round(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function person(p,leader=false){
 ctx.save();ctx.translate(p.x,p.y);ctx.scale(leader?1.3:1,leader?1.3:1);
 ctx.fillStyle='#253e3020';ctx.beginPath();ctx.ellipse(0,10,10,5,0,0,Math.PI*2);ctx.fill();
 if(p.shield>0){ctx.strokeStyle=colors[p.team]+'88';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,17,0,Math.PI*2*p.shield/3);ctx.stroke();}
 if(leader){circle(0,0,22,colors[p.team]+'22');ctx.strokeStyle=colors[p.team];ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,22,0,Math.PI*2);ctx.stroke();}
 round(-7,-1,14,16,5,p.team<0?'#8e9b83':colors[p.team]);circle(0,-7,6,'#e9c7a2');
 if(leader){round(-6,-14,12,5,2,p.team===0?'#333c38':'#fff9e8');if(p.team===0)round(-2,0,4,3,0,'#fff9e8');else{round(-5,0,3,11,1,'#f9f4dd');}ctx.fillStyle='#fff9e8';ctx.font='11px Georgia';ctx.textAlign='center';ctx.fillText(p.team===0?'✝︎':'☾',0,37);}
 ctx.restore();
}
function draw(){
 ctx.fillStyle='#cad6b7';ctx.fillRect(0,0,1000,560);
 round(110,65,780,430,45,'#dce0c6');round(135,92,730,376,32,'#e9e5cb');
 ctx.strokeStyle='#c9cbb24f';ctx.lineWidth=1;for(let x=145;x<870;x+=32){ctx.beginPath();ctx.moveTo(x,95);ctx.lineTo(x,465);ctx.stroke();}for(let y=110;y<470;y+=28){ctx.beginPath();ctx.moveTo(137,y);ctx.lineTo(863,y);ctx.stroke();}
 round(0,235,1000,90,8,'#e9e5cb');round(455,0,90,560,8,'#e9e5cb');
 // The two village buildings sit outside the playable square.
 for(const [x,c,mark] of [[184,colors[0],'✝︎'],[734,colors[1],'☾']]){round(x,4,82,53,5,'#526b5125');round(x,0,78,48,4,'#eee9d6');ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(x-6,9);ctx.lineTo(x+39,-13);ctx.lineTo(x+84,9);ctx.fill();round(x+30,23,17,25,8,c);ctx.fillStyle=c;ctx.font='23px Georgia';ctx.textAlign='center';ctx.fillText(mark,x+39,0);}
 for(const [x,y] of trees){circle(x+4,y+8,21,'#334e3020');circle(x,y,22,'#849c6b');circle(x-6,y-5,16,'#96ac7b');circle(x+7,y-5,12,'#a4b788');}
 for(const [x,y] of [[315,64],[620,490]]){round(x,y,58,10,3,'#ac9066');round(x+5,y+10,4,5,1,'#6c7457');round(x+48,y+10,4,5,1,'#6c7457');}
 // Decorative compass and village name.
 ctx.fillStyle='#6f8062';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText('LA PLACE DES RENCONTRES',500,535);ctx.fillText('N',967,36);ctx.fillText('↑',967,53);
 [...game.people,...game.leaders].sort((a,b)=>a.y-b.y).forEach(p=>person(p,game.leaders.includes(p)));
 for(const p of game.particles){ctx.globalAlpha=p.life/.65;ctx.strokeStyle=colors[p.team];ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,20+(1-p.life/.65)*24,0,Math.PI*2);ctx.stroke();ctx.font='bold 15px sans-serif';ctx.fillStyle=colors[p.team];ctx.fillText('+1',p.x,p.y-25-(.65-p.life)*30);ctx.globalAlpha=1;}
 if(game.paused){ctx.fillStyle='#19372e77';ctx.fillRect(0,0,1000,560);ctx.fillStyle='#fff9eb';ctx.font='500 36px sans-serif';ctx.textAlign='center';ctx.fillText('Petite pause sur la place.',500,270);}
}
function hud(){const s=scores(game);for(let i=0;i<2;i++){$('score'+i).textContent=s[i];$('bar'+i).style.width=s[i]/COUNT*100+'%';$('role'+i).textContent=i===team?'· VOUS':'· IA';} $('neutral').textContent=COUNT-s[0]-s[1];const sec=Math.ceil(game.time);$('timer').textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');const cd=game.leaders[team].cooldown;$('dash').textContent=cd>0?Math.ceil(cd)+' s':'ÉLAN';if(!game.running&&!shown&&$('menu').hidden){shown=true;$('result').hidden=false;$('pause').disabled=true;$('result-title').textContent=game.winner===-1?'Belle égalité.':game.winner===team?'Vous avez rassemblé !':'Le voisin l’emporte.';$('result-detail').textContent=`${s[team]} habitants dans votre camp, ${s[1-team]} chez votre adversaire. ${s.includes(COUNT)?'Tout le village est rallié !':'La place vous attend pour une revanche.'}`;}}
function frame(t){const dt=last?(t-last)/1000:0;last=t;step(game,dt,{x:(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('q')||keys.has('a')?1:0)+stick.x,y:(keys.has('arrowdown')||keys.has('s')?1:0)-(keys.has('arrowup')||keys.has('z')||keys.has('w')?1:0)+stick.y});draw();hud();requestAnimationFrame(frame);}
function start(){document.activeElement?.blur();game=createGame(team);shown=false;keys.clear();stick={x:0,y:0};$('menu').hidden=true;$('result').hidden=true;$('pause').disabled=false;$('pause').textContent='II Pause';$('status').textContent='LA MANCHE EST LANCÉE';last=performance.now();}
function pause(){document.activeElement?.blur();if(!game.running)return;game.paused=!game.paused;keys.clear();stick={x:0,y:0};$('pause').textContent=game.paused?'> Reprendre':'II Pause';}
document.querySelectorAll('[data-team]').forEach(b=>b.onclick=()=>{team=Number(b.dataset.team);document.querySelectorAll('[data-team]').forEach(el=>{el.classList.toggle('selected',el===b);el.setAttribute('aria-pressed',String(el===b));});});
$('start').onclick=start;$('replay').onclick=start;$('change').onclick=()=>{$('result').hidden=true;$('menu').hidden=false;};$('pause').onclick=pause;
$('rules').onclick=()=>{resumeAfterHelp=game.running&&!game.paused;if(resumeAfterHelp)pause();$('help').showModal();};$('close-help').onclick=()=>$('help').close();$('help').addEventListener('close',()=>{if(resumeAfterHelp&&game.running&&game.paused)pause();resumeAfterHelp=false;});
window.addEventListener('keydown',e=>{if($('help').open||!$('menu').hidden||!$('result').hidden)return;const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();keys.add(k);if(k==='p'&&!e.repeat)pause();if(k===' '&&game.running&&!game.paused)dash(game.leaders[team]);});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();if(game.running&&!game.paused)pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.running&&!game.paused)pause();});
let pointer=null;const pad=$('stick');function joystick(e){const r=pad.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,len=Math.hypot(x,y),scale=Math.max(30,len);stick={x:x/scale,y:y/scale};pad.firstElementChild.style.transform=`translate(${stick.x*28}px,${stick.y*28}px)`;}
pad.onpointerdown=e=>{if(pointer!==null)return;pointer=e.pointerId;pad.setPointerCapture(pointer);joystick(e);};pad.onpointermove=e=>{if(e.pointerId===pointer)joystick(e);};function release(e){if(e.pointerId!==pointer)return;pointer=null;stick={x:0,y:0};pad.firstElementChild.style.transform='';}pad.onpointerup=release;pad.onpointercancel=release;pad.onlostpointercapture=release;
$('dash').onpointerdown=e=>{e.preventDefault();if(game.running&&!game.paused)dash(game.leaders[team]);};
requestAnimationFrame(frame);
