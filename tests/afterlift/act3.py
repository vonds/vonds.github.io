import os
import asyncio, json
from playwright.async_api import async_playwright
SHOTS = {}
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path=os.environ.get('CHROME') or None); errs=[]
        c=await b.new_context(viewport={'width':1440,'height':900}); pg=await c.new_page()
        pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.route('**/*',lambda r: r.continue_() if 'localhost' in r.request.url else r.abort())
        await pg.goto('http://localhost:8771/'); await pg.wait_for_timeout(800)
        await pg.evaluate("localStorage.setItem('vonds-quest', JSON.stringify(%s))" % json.dumps({'met':True,'lvl':95,'wins':60,'xp':0,'area':'ring0','x':9,'y':6,'rest':['ring0',9,6],'flags':{'ending':'cut','watchdog':1,'kite':1,'upTicket':1,'merged':1,'tuesday':1},'items':{'gb':3},'seen':{'ring0':1}}))
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
                for i in range(150):
                    if await pg.evaluate("document.querySelector('.rpg-term').classList.contains('on')"): break
                    await pg.evaluate(f"{Q}.advance()"); await pg.wait_for_timeout(80)
                await pg.evaluate(f"{Q}.puzzle({json.dumps(a)})"); await pg.wait_for_timeout(200)
            return await talk(log=True)
        async def walk(d, n):
            for i in range(n):
                await pg.evaluate(f"{Q}.press('{d}')"); await pg.wait_for_timeout(260); await pg.evaluate(f"{Q}.release('{d}')"); await pg.wait_for_timeout(60)
        for i in range(8): await pg.evaluate(f"{Q}.advance()"); await pg.wait_for_timeout(80)
        print('start', (await st())['area'])
        await use('up', choice=0, log=True); await pg.wait_for_timeout(1300); print('area', (await st())['area'])
        await go('firmware',35,8); await use('up', choice=0, log=True); print('fight hyp', await fight()); await talk(log=True)
        await go('rack',9,11); await use('up', log=True); await puzzle(['df -h','smartctl -H /dev/sda','rsync -av /meridian/ /mnt/spare/'])
        await go('rack',30,11); await use('up', log=True); await puzzle(['top','kill 4040','kill -9 4040'])
        await go('rack',42,8); await use('up', choice=0, log=True); print('fight eol', await fight()); await talk(log=True)
        await go('console',32,10); await use('up', choice=0, log=True); print('fight wipe', await fight()); await talk(log=True)
        await puzzle(['crontab -l','crontab -r','rsync -a /srv/ newhost:/srv/','wall "We are still here."'])
        s=await st(); print({k:s['f'].get(k) for k in ['hypervisor','smart','fan3','eolboss','wipe','kept']}, 'lvl', s['lvl'])
        print('errors', errs)
        await b.close()
asyncio.run(main())
