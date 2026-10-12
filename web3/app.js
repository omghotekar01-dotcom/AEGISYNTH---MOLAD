import {createPublicClient,createWalletClient,custom,http,parseAbi,parseEther,formatEther,keccak256,toHex,isAddress} from 'viem';
import {proposalFromReview} from './policy-evidence.mjs';

const rpc=import.meta.env.VITE_MONAD_TESTNET_RPC || 'https://testnet-rpc.monad.xyz';
const address=import.meta.env.VITE_AEGIS_VAULT_ADDRESS || '';
const api=import.meta.env.VITE_AEGIS_API_BASE || 'https://aegisynth.onrender.com';
const chain={id:10143,name:'Monad Testnet',nativeCurrency:{name:'MON',symbol:'MON',decimals:18},rpcUrls:{default:{http:[rpc]}},blockExplorers:{default:{name:'MonadVision',url:'https://testnet.monadvision.com'}},testnet:true};
const abi=parseAbi([
 'function owner() view returns (address)', 'function operator() view returns (address)',
 'function reviewer() view returns (address)', 'function policyVersion() view returns (uint64)',
 'function policyEvidenceHash() view returns (bytes32)', 'function lifetimeSpent() view returns (uint256)',
 'function paused() view returns (bool)', 'function allowedRecipients(address) view returns (bool)',
 'function setRecipient(address,bool)', 'function configurePolicy(bytes32,uint256,uint256,bool)',
 'function deposit() payable', 'function withdrawUnused(uint256)', 'function approvePayment(bytes32,address,uint256,uint64)',
 'function executePayment(bytes32,address,uint256)', 'function pause()', 'function unpause()',
 'function completedPayments(bytes32) view returns (bool)',
 'event PaymentExecuted(bytes32 indexed paymentId,address indexed recipient,address indexed operator,uint256 amount,uint64 policyVersion)'
]);
const client=createPublicClient({chain,transport:http(rpc,{timeout:12000,retryCount:1})});
const $=id=>document.getElementById(id);
let account=null,review=null,wallet=null,busy=false;
$('vault').textContent=address || 'No public vault address configured.';
$('explorer').href=isAddress(address)?`https://testnet.monadvision.com/address/${address}`:'https://testnet.monadvision.com';

function status(message,type='neutral',tx=null){
 $('status').className='status '+(type==='success'?'good':type==='error'?'warn':'');
 $('status').replaceChildren(document.createTextNode(message+' '));
 if(tx){const link=document.createElement('a');link.textContent='Verify transaction on MonadVision ↗';link.href=`https://testnet.monadvision.com/tx/${tx}`;link.target='_blank';link.rel='noreferrer';$('status').append(link);}
}
function errorMessage(err){return String(err?.shortMessage||err?.message||err).slice(0,450);}
async function assertContract(){
 if(!isAddress(address))throw new Error('Configure VITE_AEGIS_VAULT_ADDRESS with YOUR newly deployed AegisVault contract.');
 if(await client.getChainId()!==10143)throw new Error('RPC is not Monad Testnet 10143');
 if(await client.getBytecode({address})==='0x')throw new Error('No deployed vault bytecode at configured address');
}
async function connect(){
 if(!window.ethereum)throw new Error('MetaMask or an injected EVM wallet is required to sign transactions.');
 let chainId=await window.ethereum.request({method:'eth_chainId'});
 if(Number(BigInt(chainId))!==10143){
  try{await window.ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:'0x279f'}]});}
  catch(err){if(err.code!==4902)throw err;await window.ethereum.request({method:'wallet_addEthereumChain',params:[{chainId:'0x279f',chainName:'Monad Testnet',rpcUrls:[rpc],nativeCurrency:chain.nativeCurrency,blockExplorerUrls:['https://testnet.monadvision.com']}]});}
 }
 const accounts=await window.ethereum.request({method:'eth_requestAccounts'});
 if(!accounts?.length)throw new Error('Select a wallet account.');
 account=accounts[0];wallet=createWalletClient({account,chain,transport:custom(window.ethereum)});
 $('account').textContent=account;
 await refresh();return account;
}
async function refresh(){
 await assertContract();
 const [version,balance,spent,owner,operator,reviewer,paused]=await Promise.all([
 client.readContract({address,abi,functionName:'policyVersion'}),client.getBalance({address}),client.readContract({address,abi,functionName:'lifetimeSpent'}),
 client.readContract({address,abi,functionName:'owner'}),client.readContract({address,abi,functionName:'operator'}),
 client.readContract({address,abi,functionName:'reviewer'}),client.readContract({address,abi,functionName:'paused'})]);
 $('policyVersion').textContent=String(version)+(paused?' · PAUSED':' · ACTIVE');
 $('balance').textContent=formatEther(balance)+' test MON';$('spent').textContent=formatEther(spent)+' test MON';
 status(`On-chain state verified. Owner: ${owner}. Operator: ${operator}. Reviewer: ${reviewer}. Vault is ${paused?'paused':'unpaused'}.`,'success');
}
async function loadPolicy(){
 status('Loading AEGISYNTH review evidence. This does not activate any payment permission.');
 const res=await fetch(api.replace(/\/$/,'')+'/api/v1/review-package',{method:'GET',headers:{Accept:'application/json'},cache:'no-store'});
 if(!res.ok)throw new Error('AEGISYNTH API returned HTTP '+res.status);
 const pkg=await res.json();review=proposalFromReview(pkg);
 $('policyId').textContent=review.policyId;$('evidence').textContent=review.evidenceHash;
 $('recommendation').textContent=review.action+' (human review required)';$('apiNote').textContent=review.note;
 status('Verified-shape research package loaded. The fingerprint is not a signature and is not yet a Monad-approved policy.','success');
}
async function ensureAccount(){
 await assertContract();if(!account||!wallet)await connect();
 const [list,chainHex]=await Promise.all([
 window.ethereum.request({method:'eth_accounts'}),window.ethereum.request({method:'eth_chainId'})]);
 if(!list?.[0]||list[0].toLowerCase()!==account.toLowerCase()||Number(BigInt(chainHex))!==10143){account=null;wallet=null;throw new Error('Account or network changed. Reconnect wallet.');}
 return account;
}
async function transact(functionName,args=[],value){
 if(busy)throw new Error('A blockchain action is already pending.');busy=true;
 try{
  const signer=await ensureAccount();
  const payload={address,abi,functionName,args,account:signer,...(value!==undefined?{value}:{})};
  let request;
  try{({request}=await client.simulateContract(payload));}
  catch(err){status('Contract rejected this action in simulation. NO blockchain transaction was broadcast. '+errorMessage(err),'error');return;}
  status('Simulation passed. Waiting for your MetaMask signature (never shared with AEGISYNTH).');
  const tx=await wallet.writeContract(request);
  status('Transaction broadcast; waiting for its verified on-chain receipt.','neutral',tx);
  const receipt=await client.waitForTransactionReceipt({hash:tx,confirmations:1,timeout:90000});
  if(receipt.status!=='success'){status('Transaction reverted on Monad. It was NOT successful.','error',tx);return;}
  status('CONFIRMED on Monad Testnet, block '+receipt.blockNumber+'.','success',tx);
  await refresh();
  status('CONFIRMED on Monad Testnet, block '+receipt.blockNumber+'.','success',tx);
 }finally{busy=false;}
}
function parsePositive(id){const text=$(id).value.trim();if(!/^\d+(\.\d{1,18})?$/.test(text))throw new Error('Enter a valid positive MON amount for '+id);const v=parseEther(text);if(v<=0n)throw new Error('Amount must be greater than zero');return v;}
function addr(id){const v=$(id).value.trim();if(!isAddress(v))throw new Error('Invalid address in '+id);return v;}
function paymentId(){const ref=$('ref').value.trim();if(ref.length<3||ref.length>80)throw new Error('Payment reference must be 3–80 characters');return keccak256(toHex(ref));}
async function guarded(fn){try{await fn();}catch(err){status(errorMessage(err),'error');}}
$('connect').onclick=()=>guarded(connect);$('refresh').onclick=()=>guarded(refresh);$('loadPolicy').onclick=()=>guarded(loadPolicy);
$('activate').onclick=()=>guarded(async()=>{
 if(!review)throw new Error('Load the verified AEGISYNTH review package first.');
 const per=parsePositive('perPay'),total=parsePositive('budget');if(per>total)throw new Error('Maximum payment cannot exceed lifetime budget');
 const approval=$('reviewRequired').checked;
 if(!approval&&!confirm('You are disabling per-payment review. The owner is responsible for this policy. Continue?'))return;
 if(!confirm('Authorize this HUMAN-APPROVED policy on Monad Testnet? No AI auto-deployment occurs.'))return;
 await transact('configurePolicy',[review.evidenceHash,per,total,approval]);
});
$('allow').onclick=()=>guarded(async()=>transact('setRecipient',[addr('allowAddress'),true]));
$('pause').onclick=()=>guarded(async()=>transact('pause'));
$('unpause').onclick=()=>guarded(async()=>transact('unpause'));
$('fund').onclick=()=>guarded(async()=>transact('deposit',[],parsePositive('deposit')));
$('withdrawButton').onclick=()=>guarded(async()=>{if(!confirm('Only the vault owner may recover unused test MON. Continue?'))return;await transact('withdrawUnused',[parsePositive('withdraw')]);});
$('approve').onclick=()=>guarded(async()=>{
 const expires=BigInt(Math.floor(Date.now()/1000)+3600);
 await transact('approvePayment',[paymentId(),addr('recipient'),parsePositive('amount'),expires]);
});
$('execute').onclick=()=>guarded(async()=>transact('executePayment',[paymentId(),addr('recipient'),parsePositive('amount')]));
if(window.ethereum?.on){window.ethereum.on('accountsChanged',()=>{account=null;wallet=null;$('account').textContent='Wallet changed. Reconnect.';});window.ethereum.on('chainChanged',()=>{account=null;wallet=null;$('account').textContent='Network changed. Reconnect.';});}
if(isAddress(address))guarded(refresh);
