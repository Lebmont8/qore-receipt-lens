import {RPC,hashInput,MAX} from './lens.mjs';
export async function fetchJson(url,fetcher=fetch){
 const response=await fetcher(url,{method:'GET',redirect:'error',credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw Error('Official testnet RPC returned HTTP '+response.status+'. No automatic retry.');
 const reader=response.body?.getReader();if(!reader)throw Error('Missing response body.');let size=0,parts=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX*2)throw Error('RPC response exceeds 2 MiB.');parts.push(value);}}finally{await reader.cancel().catch(()=>{});}
 const bytes=new Uint8Array(size);let offset=0;for(const p of parts){bytes.set(p,offset);offset+=p.length;}
 return JSON.parse(new TextDecoder().decode(bytes));
}
export async function acquire(hash,fetcher=fetch){
 const h=hashInput(hash);const network=await fetchJson(RPC+'/status',fetcher);
 if(network?.result?.node_info?.network!=='qorechain-diana')throw Error('Official endpoint is not Diana testnet.');
 if(network.result.sync_info?.catching_up!==false)throw Error('RPC is catching up; no transaction request made.');
 const receipt=await fetchJson(RPC+'/tx?hash=0x'+h+'&prove=false',fetcher);
 return {origin:'rpc',network,receipt,acquired_at:new Date().toISOString()};
}
export async function connectWallet(provider){
 if(!provider?.isQoreX||typeof provider.enable!=='function'||typeof provider.getKey!=='function')throw Error('Install QoreX and select Testnet. No wallet is connected.');
 await provider.enable('qorechain-diana');
 const key=await provider.getKey('qorechain-diana');
 if(typeof key?.bech32Address!=='string'||!/^qor1[023456789acdefghjklmnpqrstuvwxyz]{38}$/.test(key.bech32Address))throw Error('Wallet did not return a native QoreChain address.');
 return {address:key.bech32Address,chain:'qorechain-diana',signature_requested:false};
}
