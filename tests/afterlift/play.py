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
        await pg.evaluate("localStorage.removeItem('vonds-quest')")
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
        await talk()
        print('start', await st())
        # Plaza
        await go('plaza',19,8); await use('up', log=True)
        await go('plaza',20,6); await use('up', log=True)   # log F1
        await go('plaza',12,7); await use('up', log=True)   # kiosk
        await go('plaza',25,7); await use('up', choice=0)   # archive -> atlas
        await pg.wait_for_timeout(300); s=await st(); print('atlas mode:', s['mode']); await pg.screenshot(path=os.environ.get('OUT','/tmp')+'/p_atlas.png'); await pg.evaluate(f"{Q}.press('a')")
        # Commons deeds
        await go('commons',19,8); await use('up', log=True)
        await go('commons',25,9); await use('up', log=True)
        await go('commons',4,15); await use('up', log=True)
        for k in range(3):
            await pg.evaluate(f"{Q}.battle(2)"); await pg.wait_for_timeout(1500); await fight(os.environ.get('OUT','/tmp')+'/p_battle_commons.png' if k==0 else None)
        print('commonsWins', (await st())['f'].get('commonsWins'))
        await go('halflight',31,20); await use('right', log=True)
        await go('halflight',10,12); await use('down', log=True)   # F4
        await go('commons',4,15); await use('up', log=True)
        await go('commons',19,8); await use('up', log=True)
        await go('commons',17,7); await use('up')
        await pg.wait_for_timeout(1500); ok=await fight(os.environ.get('OUT','/tmp')+'/p_boss_eraser.png'); await talk(choice=1, log=True)
        print('ledger lit', (await st())['lit'])
        # Glasshouse wagon
        await go('gardens',7,10); await use('up', choice=1, shot=os.environ.get('OUT','/tmp')+'/p_wagon.png', log=True)
        await go('gardens',27,3); await use('up', choice=2, log=True)
        await go('gardens',31,17); await use('up')
        await pg.wait_for_timeout(1500); await fight(os.environ.get('OUT','/tmp')+'/p_boss_moth.png'); await talk(choice=1, log=True)
        # Undercroft
        await go('undercroft',13,20); await use('up', log=True)
        await go('undercroft',6,19); await use('up'); await puzzle(['whoami','cd /var/log/app','tail error.log'], shot=os.environ.get('OUT','/tmp')+'/p_puzzle.png')
        await go('undercroft',18,19); await use('up'); await puzzle(['df -h','wrong answer','find /var -size +1G','rm /var/log/huge.log'])
        await go('undercroft',31,19); await use('up'); await puzzle(['ps aux','kill 6611','kill -9 6611'])
        await go('undercroft',16,10); await use('up')
        await pg.wait_for_timeout(1500); await fight(os.environ.get('OUT','/tmp')+'/p_boss_panic.png'); await talk(choice=1, log=True)
        print('lit', (await st())['lit'])
        # Plaza east gate
        await go('plaza',30,9); await pg.evaluate(f"{Q}.press('right')"); await pg.wait_for_timeout(400); await pg.evaluate(f"{Q}.release('right')"); await pg.wait_for_timeout(1200); await talk()
        print('after gate:', (await st())['area'])
        await pg.screenshot(path=os.environ.get('OUT','/tmp')+'/p_bastion_title.png')
        await go('bastion',13,10); await use('right', log=True); await puzzle(['whoami','chmod 600 audit.log','ssh ash@keep.bastion'])
        await go('bastion',16,8); await use('up'); await pg.wait_for_timeout(1500); await fight(os.environ.get('OUT','/tmp')+'/p_boss_rootkit.png'); await talk(choice=1, log=True)
        await go('bastion',30,9); await pg.evaluate(f"{Q}.press('right')"); await pg.wait_for_timeout(400); await pg.evaluate(f"{Q}.release('right')"); await pg.wait_for_timeout(1200); await talk()
        print('after bastion gate:', (await st())['area'])
        await go('quiet',19,9); await use('up', log=True)
        await go('quiet',11,12); await use('down', log=True)
        # Terminal
        await go('terminal',7,9); await pg.evaluate(f"{Q}.press('right')"); await pg.wait_for_timeout(300); await pg.evaluate(f"{Q}.release('right')"); await pg.wait_for_timeout(500)
        await talk(log=True); await pg.wait_for_timeout(1500); await fight(os.environ.get('OUT','/tmp')+'/p_boss_reclaimer.png'); await talk(log=True)
        await go('terminal',20,14); await use('up', log=True)
        await go('terminal',14,13); await use('up', choice=0, log=True)
        await pg.wait_for_timeout(1500); await talk(log=True); await pg.wait_for_timeout(1500); await talk()
        s=await st(); print('end:', s['area'], s['f'].get('ending'), 'lvl', s['lvl'])
        await go('plaza',12,7); await use('up', log=True)
        await go('commons',25,9); await use('up', log=True)
        await pg.screenshot(path=os.environ.get('OUT','/tmp')+'/p_end.png')
        print('errors', errs[:6]); await b.close()
asyncio.run(main())
