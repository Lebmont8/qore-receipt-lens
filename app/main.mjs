import {analyse,hashInput} from './lens.mjs';import {acquire,connectWallet} from './client.mjs';
const $=id=>document.getElementById(id);let report=null,generation=0;
function clear(){$('inspect').disabled=false;generation++;report=null;$('result').hidden=true;$('export').disabled=true;$('status').textContent='';}
function invalid(show){$('hash').setAttribute('aria-invalid',String(show));$('hash-error').hidden=!show;$('hash').setAttribute('aria-describedby',show?'hash-hint hash-error':'hash-hint');}
function render(r){report=r;$('result').hidden=false;$('export').disabled=false;$('origin').textContent=r.origin;
 const rows=[['Network',r.network],['Transaction hash',r.hash],['Included at block',r.height],['Execution',r.execution+' (code '+r.code+')'],['Hybrid extension',r.hybrid_structure+' — '+r.hybrid_detail],['Cryptographic check',r.cryptographic_verification],['Inclusion proof',r.inclusion_proof],['Analysed at',r.checked_at]];
 $('facts').replaceChildren();for(const [label,value]of rows){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;$('facts').append(dt,dd);}
 $('messages').replaceChildren(...r.messages.map(t=>{const li=document.createElement('li');li.textContent=t;return li;}));$('memo').textContent='Memo: '+(r.memo||'(empty)');$('status').textContent='Analysis ready. Read the evidence limits below.';}
async function run(loader,expected,fromRpc=false){clear();const g=generation;$('inspect').disabled=true;$('status').textContent='Reading and checking…';
 try{const r=await analyse(await loader(),expected,{observedRpc:fromRpc});if(g===generation)render(r);}
 catch(e){if(g===generation)$('status').textContent=e.message;}
 finally{if(g===generation)$('inspect').disabled=false;}}
$('hash').addEventListener('input',()=>{clear();invalid(false);});
$('hash').addEventListener('blur',()=>{if($('hash').value){try{hashInput($('hash').value);invalid(false);}catch{invalid(true);}}});
$('lookup').addEventListener('submit',e=>{e.preventDefault();let h;try{h=hashInput($('hash').value);}catch{clear();invalid(true);$('hash').focus();return;}invalid(false);run(()=>acquire(h),h,true);});
$('example').addEventListener('click',()=>run(async()=>{const r=await fetch('/example.json');if(!r.ok)throw Error('Example unavailable.');return r.json();}));
$('import').addEventListener('change',()=>{const file=$('import').files[0];if(!file){clear();return;}run(async()=>{if(file.size>2097152)throw Error('Input file exceeds 2 MiB.');return JSON.parse(await file.text());});});
$('export').addEventListener('click',()=>{if(!report)return;const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='qore-analysis-'+report.hash.slice(0,12)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);});
$('connect').addEventListener('click',async()=>{const b=$('connect');b.disabled=true;$('wallet').textContent='Waiting for QoreX…';try{const r=await connectWallet(window.qorex?.native);$('wallet').textContent='Public address: '+r.address+'. No signature requested; selected network must be checked in QoreX.';}catch(e){$('wallet').textContent=e.message;}finally{b.disabled=false;}});
