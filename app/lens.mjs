// Original receipt analysis. Protocol fields from Apache-2.0 QoreChain hybrid.proto.
export const CHAIN='qorechain-diana';
export const RPC='https://rpc-testnet.qore.host';
export const HYBRID='/qorechain.pqc.v1.PQCHybridSignature';
export const MAX=1024*1024;
const decoder=new TextDecoder('utf-8',{fatal:true});
export function hashInput(x){if(typeof x!=='string'||!/^(?:0x)?[0-9a-fA-F]{64}$/.test(x.trim()))throw Error('Enter a 64-character transaction hash.');return x.trim().replace(/^0x/,'').toUpperCase();}
export function base64(s){
 if(typeof s!=='string'||s.length>MAX*1.4||s.length%4||! /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s))throw Error('Invalid or oversized base64.');
 const b=Uint8Array.from(atob(s),c=>c.charCodeAt(0));if(b.length>MAX)throw Error('Transaction is too large.');return b;
}
export async function sha256(b){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();}
export function fields(b){
 if(!(b instanceof Uint8Array)||b.length>MAX)throw Error('Invalid protobuf buffer.');
 let pos=0;const out=[];
 const vi=()=>{let n=0n;for(let i=0;i<10;i++){if(pos>=b.length)throw Error('Truncated varint.');const x=b[pos++];n|=BigInt(x&127)<<BigInt(i*7);if(!(x&128)){if(n>BigInt(Number.MAX_SAFE_INTEGER))throw Error('Varint out of supported range.');return Number(n)}}throw Error('Overlong varint.');};
 while(pos<b.length){
  if(out.length>=4096)throw Error('Too many protobuf fields.');
  const tag=vi(),no=Math.floor(tag/8),wire=tag%8;if(!no||no>536870911)throw Error('Invalid field number.');
  let value;if(wire===0)value=vi();else if(wire===2){const len=vi();if(pos+len>b.length)throw Error('Truncated bytes.');value=b.slice(pos,pos+len);pos+=len;}
  else if(wire===1||wire===5){const len=wire===1?8:4;if(pos+len>b.length)throw Error('Truncated fixed field.');value=b.slice(pos,pos+len);pos+=len;}
  else throw Error('Unsupported protobuf wire type.');
  out.push({no,wire,value});
 }return out;
}
function only(f,n,wire,required=true){
 const a=f.filter(x=>x.no===n);if(a.length>1||a.some(x=>x.wire!==wire))throw Error('Duplicate or wrong-wire field '+n);
 if(required&&!a.length)throw Error('Missing field '+n);return a[0]?.value;
}
function uint(x,name){if(!/^(0|[1-9][0-9]*)$/.test(String(x)))throw Error('Invalid '+name);return BigInt(x);}
export async function analyse(bundle,expectedHash,{observedRpc=false}={}){
 if(!bundle||typeof bundle!=='object')throw Error('Receipt bundle must be an object.');
 const net=bundle.network?.result;if(net?.node_info?.network!==CHAIN)throw Error('Not the Diana testnet.');
 if(net.sync_info?.catching_up!==false)throw Error('RPC node is catching up or its sync state is unknown.');
 const tx=bundle.receipt?.result;if(!tx||typeof tx!=='object')throw Error(bundle.receipt?.error?'RPC did not return a transaction.':'Missing RPC receipt.');
 const claimed=hashInput(tx.hash),requested=expectedHash?hashInput(expectedHash):claimed;
 if(requested!==claimed)throw Error('Returned hash does not match the requested transaction.');
 const raw=base64(tx.tx),actual=await sha256(raw);if(actual!==claimed)throw Error('Raw transaction SHA-256 does not match the receipt.');
 const height=uint(tx.height,'inclusion height'),latest=uint(net.sync_info.latest_block_height,'node height');
 if(height<1n||latest<height)throw Error('Impossible inclusion height.');
 const code=tx.tx_result?.code;if(!Number.isSafeInteger(code)||code<0)throw Error('Missing or invalid transaction result code.');
 const f=fields(raw),body=fields(only(f,1,2));only(f,2,2);
 const sigs=f.filter(x=>x.no===3);if(sigs.length<1||sigs.some(x=>x.wire!==2||x.value.length!==64))throw Error('Expected classical 64-byte signatures.');
 const messages=body.filter(x=>x.no===1).map(x=>{if(x.wire!==2)throw Error('Invalid message field.');return decoder.decode(only(fields(x.value),1,2));});
 if(!messages.length)throw Error('Missing transaction messages.');
 const memo=only(body,2,2,false);const extensions=body.filter(x=>x.no===1023||x.no===2047).map(x=>{
  if(x.wire!==2)throw Error('Invalid extension field.');
  const e=fields(x.value);return {critical:x.no===1023,type:decoder.decode(only(e,1,2)),value:only(e,2,2)};
 });
 const pq=extensions.filter(x=>x.type===HYBRID);let structural='absent',detail='No PQC hybrid extension found.';
 if(pq.length>1){structural='malformed';detail='Duplicate hybrid extensions.';}
 else if(pq.length===1){
  try{const p=fields(pq[0].value),alg=only(p,1,0),sig=only(p,2,2),pk=only(p,3,2,false);
   if(!pq[0].critical||alg!==1||sig.length!==4627||(pk&&pk.length!==2592))throw Error('Wrong placement, algorithm or ML-DSA-87 sizes.');
   structural='present';detail='Critical ML-DSA-87 extension, expected byte lengths; cryptography not verified.';
  }catch(e){structural='malformed';detail=e.message;}
 }
 return {schema:1,network:CHAIN,hash:actual,height:height.toString(),observed_node_height:latest.toString(),execution:code===0?'success':'failed',code,messages,memo:memo?decoder.decode(memo):'',classical_signatures:sigs.length,hybrid_structure:structural,hybrid_detail:detail,cryptographic_verification:'not performed',inclusion_proof:'not verified; trusting supplied RPC data',origin:bundle.synthetic===true?'synthetic fixture — NOT chain evidence':observedRpc?'official RPC observation':'imported — origin not authenticated',checked_at:new Date().toISOString(),qualified_contest_submission:false};
}
