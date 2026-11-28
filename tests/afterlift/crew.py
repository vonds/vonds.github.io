import os
import asyncio, json
from playwright.async_api import async_playwright
SHOTS = {}
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path=os.environ.get('CHROME') or None); errs=[]
        c=await b.new_context(viewport={'width':1440,'height':900}); pg=await c.new_page()
        pg.on('pageerror',lambda e: errs.append(str(e)+' @ '+(e.stack or '')[:400]))
        await pg.route('**/*',lambda r: r.continue_() if 'localhost' in r.request.url else r.abort())
        await pg.goto('http://localhost:8771/'); await pg.wait_for_timeout(800)
        await pg.evaluate("localStorage.setItem('vonds-quest', JSON.stringify(%s))" % json.dumps({'met':True,'lvl':90,'wins':60,'xp':0,'area':'plaza','x':8,'y':16,'rest':['plaza',8,16],'flags':{},'items':{'gb':3},'seen':{}}))
        await pg.goto('http://localhost:8771/?p=1'); await pg.wait_for_timeout(1800)
        await pg.evaluate("window.VondsPick('afterlift')"); await pg.wait_for_timeout(3800)
        Q = "window.__quest"
        async def st(): return await pg.evaluate(f"(()=>{{const s={Q}.state();return {{mode:s.mode,talking:s.talking,area:s.area,x:s.me.x,y:s.me.y,pz:!!s.PZ,phase:s.B&&s.B.phase,f:s.save.flags,lit:s.save.lit,lvl:s.save.lvl,hp:s.save.hp}}}})()")
        async def opts(): return await pg.evaluate("document.querySelectorAll('.rpg-opts button').length")
        async def text(): return await pg.evaluate("document.querySelector('.rpg-msg p').textContent")
        async def talk(choice=None, shot=None, log=False):
            seen=[]
            for i in range(60):
                s=await st()
                if not s['talking']: break
                await pg.evaluate(f"{Q}.advance()"); await pg.wait_for_timeout(40)   # finish typing
                t=await text()
                if not seen or seen[-1]!=t: seen.append(t)
                if await opts():
                    if shot: await pg.screenshot(path=shot); shot=None
                    if choice == 'last': choice = (await opts()) - 1
                    if choice is not None:
                        for k in range(choice): await pg.evaluate(f"{Q}.press('down')")
                    await pg.evaluate(f"{Q}.advance()"); await pg.wait_for_timeout(120)
                    choice=None
                    continue
                if shot and len(seen)>=2: await pg.screenshot(path=shot); shot=None
                await pg.evaluate(f"{Q}.advance()"); await pg.wait_for_timeout(60)
            if log: print('   said:', ' | '.join(x[:70] for x in seen))
            return seen
        async def go(a,x,y):
            await pg.evaluate(f"{Q}.go('{a}',{x},{y})"); await pg.wait_for_timeout(950); await talk()
        async def use(d, **kw):
            await pg.evaluate(f"{Q}.face('{d}')"); await pg.evaluate(f"{Q}.interact()"); await pg.wait_for_timeout(100)
            return await talk(**kw)
        async def fight(shot=None):
            for i in range(200):
                s=await st()
                if s['mode']=='map' and not s['talking']:
                    await pg.wait_for_timeout(400); s=await st()
                    if s['mode']=='map' and not s['talking']: return True
                if s['talking']: await talk(choice='last', log=True); continue
                if s['phase']=='menu':
                    if shot: await pg.screenshot(path=shot); shot=None
                    await pg.evaluate(f"(()=>{{const B={Q}.state().B;B.foes.forEach(f=>{{if(!f.dead)f.hp=1}})}})()")
                    await pg.evaluate(f"{Q}.press('a')"); await pg.wait_for_timeout(150)
                    s=await st()
                    if s['phase']=='target': await pg.evaluate(f"{Q}.press('a')")
                if s['phase']=='type':
                    await pg.evaluate(f"(()=>{{const B={Q}.state().B;B.foes.forEach(f=>{{if(!f.dead)f.hp=1}})}})()")
                    await pg.fill('.rpg-term input','ls'); await pg.press('.rpg-term input','Enter')
                await pg.wait_for_timeout(250)
            return False
        async def puzzle(answers, shot=None):
            for a in answers:
                await pg.wait_for_timeout(150)
                if shot: await pg.fill('.rpg-term input', a); await pg.screenshot(path=shot); shot=None
                await pg.evaluate(f"{Q}.puzzle({json.dumps(a)})")
            await pg.wait_for_timeout(200); return await talk(log=True)
        async def puzzle(answers):
            for a in answers:
                for i in range(40):
                    if await pg.evaluate("document.querySelector('.rpg-term').classList.contains('on')"): break
                    await pg.evaluate(f"{Q}.advance()"); await pg.wait_for_timeout(80)
                await pg.evaluate(f"{Q}.puzzle({json.dumps(a)})"); await pg.wait_for_timeout(200)
            return await talk(log=True)
        async def walk(d, n):
            for i in range(n):
                await pg.evaluate(f"{Q}.press('{d}')"); await pg.wait_for_timeout(260); await pg.evaluate(f"{Q}.release('{d}')"); await pg.wait_for_timeout(60)
        for i in range(8): await pg.evaluate(f"{Q}.advance()"); await pg.wait_for_timeout(80)
        for i in range(8): await pg.evaluate(f"{Q}.advance()"); await pg.wait_for_timeout(80)
        CREW=[('pell','halflight',9,9),('dray','waterworks',11,5),('null','registry',10,14),('lux','upper',21,15),('gauge','margin',36,8),('acknak','ring0',6,11),('morrow','deep',24,3),('kessler','anchor',17,11),('halcyon','upstream',26,22),('root','rack',4,13)]
        for cid,a,x,y in CREW:
            await go(a,x,y+1); await pg.evaluate(f"{Q}.face('up')"); await pg.wait_for_timeout(100)
            await pg.evaluate(f"{Q}.interact()"); await pg.wait_for_timeout(200)
            for i in range(500):
                s=await pg.evaluate(f"(()=>{{const s={Q}.state();return {{mode:s.mode,phase:s.B&&s.B.phase,talking:s.talking,f:!!s.save.flags['crew_{cid}'],sc:s.sceneOn}}}})()")
                if s['f'] and s['mode']=='map' and not s['talking'] and not s['sc']: break
                if s['talking']: await pg.evaluate(f"{Q}.advance()"); await pg.wait_for_timeout(70); continue
                if s['mode']=='battle':
                    if s['phase']=='menu':
                        await pg.evaluate(f"(()=>{{const B={Q}.state().B;B.foes.forEach(f=>{{if(!f.dead)f.hp=1}})}})()")
                        await pg.evaluate(f"{Q}.press('a')"); await pg.wait_for_timeout(150)
                        if await pg.evaluate(f"{Q}.state().B&&{Q}.state().B.phase")=='target': await pg.evaluate(f"{Q}.press('a')")
                    if s['phase']=='type': await pg.fill('.rpg-term input','ls'); await pg.press('.rpg-term input','Enter')
                await pg.wait_for_timeout(120)
            if cid in ('dray','halcyon','root'): await pg.screenshot(path=os.environ.get('OUT','/tmp')+'/crew_%s.png'%cid)
            r=True
            s2=await st(); print(cid, r, s2['f'].get('crew_'+cid))
        print('errors', errs)
        await b.close()
asyncio.run(main())
