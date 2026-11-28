import os
import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path=os.environ.get('CHROME') or None); errs=[]
        pg=await b.new_page(viewport={'width':1200,'height':900}); pg.on('pageerror',lambda e: errs.append(str(e)+(e.stack or '')[:400]))
        await pg.route('**/*',lambda r: r.continue_() if 'localhost' in r.request.url else r.abort())
        await pg.goto('http://localhost:8771/?c=2'); await pg.wait_for_timeout(1500)
        await pg.evaluate("localStorage.setItem('vonds-quest', JSON.stringify(%s))" % json.dumps({'met':True,'lvl':92,'wins':60,'xp':0,'area':'plaza','x':8,'y':16,'rest':['plaza',8,16],'flags':{'arc_kes':1},'items':{'gb':3,'mb':5},'seen':{},'party':{'has':{'kes':1,'rook':1},'active':['kes','rook'],'hp':{}},'rows':{'rook':'back'}}))
        await pg.evaluate("window.VondsPick('afterlift')"); await pg.wait_for_timeout(3800)
        Q="window.__quest"
        for i in range(12): await pg.evaluate(f"{Q}.advance()"); await pg.wait_for_timeout(80)
        await pg.evaluate("window.__logs=[]; new MutationObserver(()=>{const t=document.querySelector('.rpg-title').textContent; if(t) window.__logs.push(t)}).observe(document.querySelector('.rpg-title'),{childList:true,characterData:true,subtree:true})")
        await pg.evaluate(f"{Q}.boss('crew_root')"); await pg.wait_for_timeout(2500)
        logs=set(); shot=0
        for i in range(260):
            s=await pg.evaluate(f"(()=>{{const s={Q}.state();return {{mode:s.mode,phase:s.B&&s.B.phase,t:document.querySelector('.rpg-title')?document.querySelector('.rpg-title').textContent:'',talking:s.talking,round:s.B&&s.B.round}}}})()")
            if s['t']: logs.add(s['t'][:150])
            if s['mode']=='map' and not s['talking']: break
            if s['talking']: await pg.evaluate(f"{Q}.advance()"); await pg.wait_for_timeout(100); continue
            if s['phase']=='menu':
                if not shot and (s['round'] or 0)>=2: await pg.screenshot(path=os.environ.get('OUT','/tmp')+'/mech.png'); shot=1
                if (s['round'] or 0) > 9: await pg.evaluate(f"(()=>{{const B={Q}.state().B;B.foes.forEach(f=>{{if(!f.dead)f.hp=1}})}})()")
                else: await pg.evaluate(f"(()=>{{const B={Q}.state().B;B.foes.forEach(f=>{{if(!f.dead&&f.foe.boss)f.hp=Math.max(1,f.hp-Math.round(f.max*.05))}})}})()")
                await pg.evaluate(f"{Q}.press('a')"); await pg.wait_for_timeout(150)
                s2=await pg.evaluate(f"{Q}.state().B&&{Q}.state().B.phase")
                if s2=='target': await pg.evaluate(f"{Q}.press('a')")
            if s['phase']=='type':
                await pg.fill('.rpg-term input','ls'); await pg.press('.rpg-term input','Enter')
            await pg.wait_for_timeout(260)
        logs=set(x[:200] for x in await pg.evaluate("window.__logs"))
        for l in sorted(logs):
            print(' ',l)
        print('errors',errs); await b.close()
asyncio.run(main())
