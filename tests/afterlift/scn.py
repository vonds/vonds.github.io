import os
import asyncio, json, sys
from playwright.async_api import async_playwright
CASES=[('climbSeen','tether',None,55,{'ending':'cut'}), ('upSeen','upstream',None,60,{'ending':'cut','upIn':1})]
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path=os.environ.get('CHROME') or None); errs=[]
        Q="window.__quest"
        for flag,area,pos,lv,fl in CASES:
            pg=await b.new_page(viewport={'width':1200,'height':900}); pg.on('pageerror',lambda e: errs.append(str(e)+(e.stack or '')[:300]))
            await pg.route('**/*',lambda r: r.continue_() if 'localhost' in r.request.url else r.abort())
            await pg.goto('http://localhost:8771/?c=2'); await pg.wait_for_timeout(1200)
            await pg.evaluate("localStorage.setItem('vonds-quest', JSON.stringify(%s))" % json.dumps({'met':True,'lvl':lv,'wins':40,'xp':0,'area':'plaza','x':8,'y':16,'rest':['plaza',8,16],'flags':fl,'items':{'gb':5},'seen':{},'lit':{'spire':1,'archive':1}}))
            await pg.evaluate("window.VondsPick('afterlift')"); await pg.wait_for_timeout(3500)
            idle=0
            for i in range(120):
                if not await pg.evaluate(f"!!({Q}.state().talking || {Q}.state().sceneOn)"):
                    idle+=1
                    if idle>8: break
                else: idle=0
                await pg.evaluate(f"{Q}.advance()"); await pg.wait_for_timeout(150)
            await pg.evaluate(f"(()=>{{const s={Q}.state(); s.save.lvl={lv}; Object.assign(s.save.flags, {json.dumps(fl)}); s.save.lit.spire=1; s.save.met=true;}})()")
            # find a walkable tile satisfying pos constraint
            t=await pg.evaluate(f"""(()=>{{const a=window.MeridianWorld.areas['{area}'], m=a.map; const wantY={pos[1] if pos else -1}; if (wantY<0) return a.spawn;
              for(let y=0;y<m.length;y++) for(let x=1;x<m[0].length-1;x++) {{ if(wantY>=0 && y<wantY) continue; if(y>3 && x>3 && '.,='.includes(m[y][x]) && '.,='.includes(m[y][x+1]) && '.,='.includes(m[y][x-1]) && '.,='.includes(m[y][x+2])) return [x,y]; }} return a.spawn; }})()""")
            await pg.evaluate(f"{Q}.go('{area}',{t[0]},{t[1]})"); await pg.wait_for_timeout(3000)
            for i in range(10): await pg.evaluate(f"{Q}.advance()"); await pg.wait_for_timeout(60)
            for d in ['right','left','down','up','left','right','up','down']:
                await pg.evaluate(f"{Q}.press('{d}')"); await pg.wait_for_timeout(280); await pg.evaluate(f"{Q}.release('{d}')"); await pg.wait_for_timeout(500)
                if await pg.evaluate(f"!!{Q}.state().talking || {Q}.state().sceneOn"): break
            said=[]; ok=False
            for i in range(500):
                s=await pg.evaluate(f"(()=>{{const s={Q}.state();return {{mode:s.mode,phase:s.B&&s.B.phase,talking:s.talking,f:!!s.save.flags['{flag}'],sc:s.sceneOn}}}})()")
                if s['f'] and s['mode']=='map' and not s['talking'] and not s['sc']: ok=True; break
                if s['talking']:
                    tx=await pg.evaluate("document.querySelector('.rpg-msg p')?document.querySelector('.rpg-msg p').textContent:''")
                    if tx and (not said or said[-1]!=tx): said.append(tx)
                    if len(said)==5: await pg.screenshot(path=os.environ.get('OUT','/tmp')+f'/sc_{flag}.png')
                    await pg.evaluate(f"{Q}.advance()"); await pg.wait_for_timeout(70); continue
                if s['mode']=='battle':
                    if s['phase']=='menu':
                        await pg.evaluate(f"(()=>{{const B={Q}.state().B;B.foes.forEach(f=>{{if(!f.dead)f.hp=1}})}})()")
                        await pg.evaluate(f"{Q}.press('a')"); await pg.wait_for_timeout(150)
                        if await pg.evaluate(f"{Q}.state().B&&{Q}.state().B.phase")=='target': await pg.evaluate(f"{Q}.press('a')")
                    if s['phase']=='type': await pg.fill('.rpg-term input','ls'); await pg.press('.rpg-term input','Enter')
                await pg.wait_for_timeout(120)
            print(flag, ok, len(said), said[:4], await pg.evaluate(f"[{Q}.state().area,{Q}.state().me.x,{Q}.state().me.y]")); await pg.close()
        print('errors',errs); await b.close()
asyncio.run(main())
