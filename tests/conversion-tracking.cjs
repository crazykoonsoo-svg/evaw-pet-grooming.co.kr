const fs=require('fs'),vm=require('vm'),cp=require('child_process'),assert=require('assert');
const files=cp.execFileSync('git',['ls-files','*.html','assets/news-nearby.js','assets/area-nearby.js','assets/branch-nearby.js'],{encoding:'utf8'}).trim().split('\n');
let checked=0,scenarios=0;
(async()=>{
for(const f of files){
 const text=fs.readFileSync(f,'utf8');
 if(f.endsWith('.js')){new vm.Script(text,{filename:f});continue;}
 for(const m of text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) if(!/src=|application\/ld\+json/.test(m[1]))new vm.Script(m[2],{filename:f});
 assert(!text.includes("ga4('form_submit'"),f);
 const match=text.match(/^( +)async function submitForm\(\) \{[\s\S]*?\n\1\}/m);if(!match)continue;
 assert(match[0].includes('if (btn.disabled) return;'),f+' duplicate guard');
 for(const mode of ['accepted','rejected','http_error','pending']){
  const nodes={};const calls=[],events=[];let error=false;
  const el=id=>nodes[id]||(nodes[id]={value:'test',checked:true,disabled:false,style:{},classList:{remove(){}},focus(){},textContent:''});
  el('f-phone').value='01000000000';
  let release;
  const ctx={document:{getElementById:el,querySelector:el,querySelectorAll:()=>[]},selectedCourse:'test',selectedPurpose:'test',selectedPurposes:['test'],clearError(){},showError(){error=true},goToStep1(){},isValidContactNumber:()=>true,trackLead(){},naverCnv:t=>events.push(['naver',t]),ga4:(a,b)=>events.push([a,b]),fetch:async url=>{calls.push(url);if(url.includes('web3forms')){if(mode==='pending')await new Promise(r=>release=r);return {ok:mode!=='http_error',json:async()=>({success:mode!=='rejected'})}}return{};}};
  vm.createContext(ctx);vm.runInContext(match[0],ctx);
  const first=ctx.submitForm();if(mode==='pending'){await ctx.submitForm();assert.equal(calls.length,1);release();}await first;
  const success=mode==='accepted'||mode==='pending';assert.equal(events.filter(x=>x[0]==='generate_lead').length,success?1:0,f+mode);assert.equal(calls.length,success?2:1,f+' sheet on failure');assert.equal(error,!success,f+mode);scenarios++;
 }
 checked++;
}
// Tracking vendor exceptions do not escape the production wrappers.
const main=fs.readFileSync('index.html','utf8');const c={location:{pathname:'/'},gtag(){throw Error('blocked')},wcs:{cnv(){throw Error('blocked')}},wcs_add:{}};vm.createContext(c);
for(const name of ['ga4','naverCnv']){const re=new RegExp('  function '+name+'\\([^]*?\\n  \\}');vm.runInContext(main.match(re)[0],c);}
c.ga4('generate_lead','consultation');c.naverCnv('4');
console.log(JSON.stringify({syntaxFiles:files.length,formHandlers:checked,submissionScenarios:scenarios,vendorFailureIsolation:'passed'}));
})().catch(e=>{console.error(e);process.exit(1)});
