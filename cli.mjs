import fs from 'node:fs';import {analyse} from './app/lens.mjs';import {acquire} from './app/client.mjs';
try{
 const [mode,arg]=process.argv.slice(2);let b;
 if(mode==='file'&&arg){const stat=fs.statSync(arg);if(stat.size>2097152)throw Error('Input file exceeds 2 MiB.');b=JSON.parse(fs.readFileSync(arg,'utf8'));}
 else if(mode==='lookup'&&arg)b=await acquire(arg);
 else throw Error('Usage: node cli.mjs file receipt.json | lookup TXHASH. Reads only; never signs.');
 console.log(JSON.stringify(await analyse(b,mode==='lookup'?arg:undefined,{observedRpc:mode==='lookup'}),null,2));
}catch(e){console.error(e.message);process.exitCode=1;}
