import {sha256} from '../app/lens.mjs';
export function vi(n){let b=[];do{let x=n%128;n=Math.floor(n/128);b.push(x|(n?128:0));}while(n);return b;}
export function f(n,v,wire=2){return [...vi(n*8+wire),...(wire===2?[...vi(v.length),...v]:vi(v))];}
export const text=s=>[...new TextEncoder().encode(s)];
export const b64=b=>Buffer.from(b).toString('base64');
export async function fixture(options={}){
 const p=[...f(1,options.algorithm??1,0),...f(2,new Array(options.signatureLength??4627).fill(0)),...f(3,new Array(options.keyLength??2592).fill(0))];
 const any=[...f(1,text(options.type??'/qorechain.pqc.v1.PQCHybridSignature')),...f(2,p)];
 const msg=[...f(1,text('/cosmos.bank.v1beta1.MsgSend')),...f(2,[])];
 const body=[...f(1,msg),...f(2,text(options.memo??'Synthetic structure only; not a real signature')),...(options.absent?[]:f(options.noncritical?2047:1023,any)),...(options.duplicate?f(1023,any):[])];
 const bytes=new Uint8Array([...f(1,body),...f(2,[]),...f(3,new Array(64).fill(0))]);
 return {synthetic:true,network:{result:{node_info:{network:options.network??'qorechain-diana'},sync_info:{catching_up:false,latest_block_height:'120'}}},receipt:{result:{hash:await sha256(bytes),height:'100',tx:b64(bytes),tx_result:{code:options.code??0}}}};
}
