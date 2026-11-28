import os
import asyncio, json, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path=os.environ.get('CHROME') or None); errs=[]
        pg=await b.new_page(viewport={'width':1200,'height':900}); pg.on('pageerror',lambda e: errs.append(str(e)+(e.stack or '')[:300]))
        await pg.route('**/*',lambda r: r.continue_() if 'localhost' in r.request.url else r.abort())
        await pg.goto('http://localhost:8771/?c=2'); await pg.wait_for_timeout(1500)
        seen={k:1 for k in ['plaza','commons','halflight','gardens','undercroft','bastion','line']}
        await pg.evaluate("localStorage.setItem('vonds-quest', JSON.stringify(%s))" % json.dumps({'met':True,'lvl':30,'wins':20,'xp':0,'area':'plaza','x':29,'y':18,'rest':['plaza',8,16],'flags':{'packet':1},'items':{},'seen':seen,'lit':{}}))
        await pg.evaluate("window.VondsPick('afterlift')"); await pg.wait_for_timeout(3800)
        Q="window.__quest"
        async def clear():
            for i in range(40):
                t=await pg.evaluate(f"!!{Q}.state().talking")
                if not t: break
                await pg.evaluate(f"{Q}.advance()"); await pg.wait_for_timeout(90)
        await clear()
        # walk to the plaza's sprawl gate
        await pg.evaluate(f"{Q}.go('plaza',30,18)"); await pg.wait_for_timeout(900); await clear()
        await pg.evaluate(f"{Q}.press('down')"); await pg.wait_for_timeout(500); await pg.evaluate(f"{Q}.release('down')"); await pg.wait_for_timeout(1500)
        st=await pg.evaluate(f"(()=>{{const s={Q}.state();return [s.area,s.me.x,s.me.y]}})()"); print('after gate', st)
        await pg.screenshot(path=os.environ.get('OUT','/tmp')+'/sp1.png')
        await clear(); await pg.evaluate(f"{Q}.go('sprawl',62,62)"); await pg.wait_for_timeout(1200); await clear(); await pg.wait_for_timeout(3000); await pg.screenshot(path=os.environ.get('OUT','/tmp')+'/sp2.png')
        await clear(); await pg.evaluate(f"{Q}.go('sprawl',100,16)"); await pg.wait_for_timeout(1200); await clear()
        await pg.evaluate(f"{Q}.state().save.flags.packet=1"); await pg.evaluate(f"{Q}.face('right')"); await pg.evaluate(f"{Q}.interact()"); await pg.wait_for_timeout(300)
        print(await pg.evaluate(f"(()=>{{const s={Q}.state();return [s.area,s.me.dir,s.save.flags.packet,s.talking,s.mode,s.map[16][101]]}})()"))
        print('boat?', await pg.evaluate(f"{Q}.state().me.boat"))
        await pg.evaluate(f"{Q}.press('right')"); await pg.wait_for_timeout(900); await pg.evaluate(f"{Q}.release('right')"); await pg.wait_for_timeout(300)
        print('pos', await pg.evaluate(f"[{Q}.state().me.x,{Q}.state().me.y]"))
        await pg.screenshot(path=os.environ.get('OUT','/tmp')+'/sp3.png')
        print('errors',errs); await b.close()
asyncio.run(main())
