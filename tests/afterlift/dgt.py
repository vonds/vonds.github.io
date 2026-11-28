import os
import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path=os.environ.get('CHROME') or None); errs=[]
        pg=await b.new_page(viewport={'width':1200,'height':900}); pg.on('pageerror',lambda e: errs.append(str(e)+(e.stack or '')[:300]))
        await pg.route('**/*',lambda r: r.continue_() if 'localhost' in r.request.url else r.abort())
        await pg.goto('http://localhost:8771/?c=2'); await pg.wait_for_timeout(1500)
        await pg.evaluate("localStorage.setItem('vonds-quest', JSON.stringify(%s))" % json.dumps({'met':True,'lvl':30,'wins':20,'xp':0,'area':'plaza','x':8,'y':16,'rest':['plaza',8,16],'flags':{},'items':{'gb':3},'seen':{'plaza':1},'lit':{}}))
        await pg.evaluate("window.VondsPick('afterlift')"); await pg.wait_for_timeout(3800)
        Q="window.__quest"
        async def clear():
            for i in range(60):
                if not await pg.evaluate(f"!!{Q}.state().talking"): break
                await pg.evaluate(f"{Q}.advance()"); await pg.wait_for_timeout(80)
        await clear()
        # walk onto the dungeon's sprawl marker from the tile in front of it
        site=await pg.evaluate("window.MeridianWorld.sprawlAll.filter(s=>s.id==='deadletter')[0]")
        await pg.evaluate(f"{Q}.go('sprawl',{site['x']},{site['y']+2})"); await pg.wait_for_timeout(3000); await clear()
        await pg.evaluate(f"{Q}.press('up')"); await pg.wait_for_timeout(400); await pg.evaluate(f"{Q}.release('up')"); await pg.wait_for_timeout(2500); await clear()
        st=await pg.evaluate(f"[{Q}.state().area,{Q}.state().me.x,{Q}.state().me.y]"); print('entered', st)
        await pg.screenshot(path=os.environ.get('OUT','/tmp')+'/dg_in.png')
        # throw every switch by interacting from beside it
        sws=await pg.evaluate("Object.keys(window.MeridianWorld.spots).filter(k=>k.startsWith('deadletter:')).map(k=>k.split(':')[1].split(',').map(Number))")
        for sx,sy in sws:
            await pg.evaluate(f"{Q}.go('deadletter',{sx},{sy+1})"); await pg.wait_for_timeout(1800); await clear()
            await pg.evaluate(f"{Q}.face('up')"); await pg.evaluate(f"{Q}.interact()"); await pg.wait_for_timeout(200); await clear()
        print('flags', await pg.evaluate(f"Object.keys({Q}.state().save.flags).filter(k=>k.startsWith('dg_'))"))
        # walk through the gate into the boss room
        gate=await pg.evaluate("Object.keys(window.MeridianWorld.areas.deadletter.gates)[0].split(',').map(Number)")
        await pg.evaluate(f"{Q}.go('deadletter',{gate[0]},{gate[1]-1})"); await pg.wait_for_timeout(1800); await clear()
        for i in range(3):
            await pg.evaluate(f"{Q}.press('down')"); await pg.wait_for_timeout(300); await pg.evaluate(f"{Q}.release('down')"); await pg.wait_for_timeout(300)
            if await pg.evaluate(f"!!{Q}.state().talking"): break
        await pg.wait_for_timeout(300); await pg.screenshot(path=os.environ.get('OUT','/tmp')+'/dg_boss.png')
        for i in range(300):
            s=await pg.evaluate(f"(()=>{{const s={Q}.state();return {{mode:s.mode,phase:s.B&&s.B.phase,talking:s.talking,f:!!s.save.flags.dg_deadletter}}}})()")
            if s['f'] and s['mode']=='map' and not s['talking']: break
            if s['talking']: await pg.evaluate(f"{Q}.advance()"); await pg.wait_for_timeout(80); continue
            if s['mode']=='battle' and s['phase']=='menu':
                await pg.evaluate(f"(()=>{{const B={Q}.state().B;B.foes.forEach(f=>{{if(!f.dead)f.hp=1}})}})()")
                await pg.evaluate(f"{Q}.press('a')"); await pg.wait_for_timeout(150)
                if await pg.evaluate(f"{Q}.state().B&&{Q}.state().B.phase")=='target': await pg.evaluate(f"{Q}.press('a')")
            if s['mode']=='battle' and s['phase']=='type': await pg.fill('.rpg-term input','ls'); await pg.press('.rpg-term input','Enter')
            await pg.wait_for_timeout(150)
        print('cleared', s['f'])
        print('errors',errs); await b.close()
asyncio.run(main())
