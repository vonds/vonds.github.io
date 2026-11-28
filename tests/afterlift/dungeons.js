global.window=global; global.document={}; const P=process.argv[2];
require(P+'/meridian-world.js'); const gearBefore=Object.keys(window.MeridianWorld.gear); require(P+'/meridian-dungeons.js'); require(P+'/meridian-sprawl.js');
const WD=window.MeridianWorld; console.log('gear collision', ['lantern','stamp','lens','seed'].filter(k=>gearBefore.includes(k)));
for (const D of WD.dungeons){ const a=WD.areas[D.id], m=a.map, H=m.length, W=m[0].length;
  function bfs(gOpen,hOpen){ const seen={}, q=[a.spawn]; seen[a.spawn]=1; while(q.length){const [x,y]=q.shift(); for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny; if(seen[k]||nx<0||ny<0||nx>=W||ny>=H) continue; const c=m[ny][nx]; if('Tsco'.includes(c) && !(c==='h')) { if(c!=='T') seen[k]=2; continue;} if(c==='G'&&!gOpen) continue; if(c==='h'&&!hOpen) continue; if(c==='E') {seen[k]=1; continue;} seen[k]=1; q.push([nx,ny]);}} return seen; }
  const all=bfs(1,1), nog=bfs(0,1), noh=bfs(1,0);
  const items=[]; for(let y=0;y<H;y++)for(let x=0;x<W;x++){const c=m[y][x]; if('sco'.includes(c)) items.push([c,x,y,!!all[x+','+y],!!nog[x+','+y],!!noh[x+','+y]]);}
  const bx=WD.areas[D.id]; console.log(D.id, W+'x'+H, 'exit', JSON.stringify(a.exits), 'gate', Object.keys(a.gates));
  console.log(' items [ch,x,y,reach,reachNoGate,reachNoHidden]:', JSON.stringify(items));
  let bossRoomReach=false; for(let y=0;y<H;y++)for(let x=0;x<W;x++){ /* boss room tiles adjacent to gate */ }
  console.log(m.join('\n'));
}
