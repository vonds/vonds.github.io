import os
import asyncio, json, sys
from playwright.async_api import async_playwright
CASES=[('kes','concourse',20),('odessa','halflight',18),('piper','upper',24),('moth','undercroft',22),('rook','bastion',26),('sable','stacks',28),('juni','observatory',24),('ves','anchor',44)]
only=sys.argv[1:] 
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path=os.environ.get('CHROME') or None); errs=[]
        Q="window.__quest"
        for cid,area,lv in CASES:
            if only and cid not in only: continue
            first=True
            pg=await b.new_page(viewport={'width':1200,'height':900}); pg.on('pageerror',lambda e: errs.append(str(e)+(e.stack or '')[:400]))
            await pg.route('**/*',lambda r: r.continue_() if 'localhost' in r.request.url else r.abort())
            await pg.goto('http://localhost:8771/?c=2'); await pg.wait_for_timeout(1500)
            sv={'met':True,'lvl':lv,'wins':60,'xp':0,'area':area,'x':1,'y':1,'rest':['plaza',8,16],'flags':{},'items':{'gb':5,'mb':9},'seen':{},'party':{'has':{cid:1},'active':[cid],'hp':{}}}
            await pg.evaluate("localStorage.setItem('vonds-quest', JSON.stringify(%s))" % json.dumps(sv))
            if first: await pg.evaluate("window.VondsPick('afterlift')"); first=False
            await pg.wait_for_timeout(3000)
            idle=0
            for i in range(120):
                if not await pg.evaluate(f"!!({Q}.state().talking || {Q}.state().sceneOn)"):
                    idle+=1
                    if idle>8: break
                else: idle=0
                await pg.evaluate(f"{Q}.advance()"); await pg.wait_for_timeout(150)
            sp=await pg.evaluate(f"window.MeridianWorld.areas['{area}'].spawn")
            await pg.evaluate(f"(()=>{{const s={Q}.state(); s.save.party.has['{cid}']=1; s.save.party.active=['{cid}']; s.save.lvl={lv}; delete s.save.flags['arc_{cid}']}})()")
            await pg.evaluate(f"{Q}.go('{area}',{sp[0]},{sp[1]})"); await pg.wait_for_timeout(3500)
            for i in range(12): await pg.evaluate(f"{Q}.advance()"); await pg.wait_for_timeout(60)
            # take a step to trigger
            for d in ['right','left','down','up']:
                await pg.evaluate(f"{Q}.press('{d}')"); await pg.wait_for_timeout(300); await pg.evaluate(f"{Q}.release('{d}')"); await pg.wait_for_timeout(400)
                if await pg.evaluate(f"!!{Q}.state().talking"): break
            shot=0; said=[]
            for i in range(400):
                s=await pg.evaluate(f"(()=>{{const s={Q}.state();return {{mode:s.mode,phase:s.B&&s.B.phase,talking:s.talking,f:!!s.save.flags['arc_{cid}']}}}})()")
                if s['f'] and s['mode']=='map' and not s['talking']: break
                if s['talking']:
                    t=await pg.evaluate("document.querySelector('.rpg-msg p')?document.querySelector('.rpg-msg p').textContent:''")
                    if t and (not said or said[-1]!=t): said.append(t)
                    if not shot and len(said)>=4: await pg.wait_for_timeout(300); await pg.screenshot(path=os.environ.get('OUT','/tmp')+f'/arc_{cid}.png'); shot=1
                    if await pg.evaluate("document.querySelectorAll('.rpg-opts button').length") and os.environ.get('LAST'):
                        for k in range(3): await pg.evaluate(f"{Q}.press('down')")
                    await pg.evaluate(f"{Q}.advance()"); await pg.wait_for_timeout(70); continue
                if s['mode']=='battle':
                    if s['phase']=='menu':
                        await pg.evaluate(f"(()=>{{const B={Q}.state().B;B.foes.forEach(f=>{{if(!f.dead)f.hp=1}})}})()")
                        await pg.evaluate(f"{Q}.press('a')"); await pg.wait_for_timeout(150)
                        if await pg.evaluate(f"{Q}.state().B&&{Q}.state().B.phase")=='target': await pg.evaluate(f"{Q}.press('a')")
                    if s['phase']=='type':
                        await pg.fill('.rpg-term input','ls'); await pg.press('.rpg-term input','Enter')
                await pg.wait_for_timeout(120)
            print(await pg.evaluate(f"[{Q}.state().save.party.active,{Q}.state().save.lvl,{Q}.state().save.flags['arc_{cid}'],{Q}.state().scene,{Q}.state().me.x,{Q}.state().me.y,{Q}.state().me.moving,{Q}.state().mode,{Q}.state().area,document.querySelector('.rpg').className]"))
            print(await pg.evaluate("document.querySelector('.rpg-msg p')?document.querySelector('.rpg-msg p').textContent:''"), said[-3:])
            print('flags', await pg.evaluate("Object.keys(window.__quest.state().save.flags).filter(k=>/Self|Vee|Talk|Open/.test(k))"))
            await pg.close()
            print(cid, 'settled' if s['f'] else 'NOT settled', len(said), 'lines')
        print('errors',errs); await b.close()
asyncio.run(main())
