import test from 'node:test';
import assert from 'node:assert/strict';
import {proposalFromReview} from '../web3/policy-evidence.mjs';
const valid={package_version:'1.2',artifact_sha256:'f'.repeat(64),synthetic_only:true,production_claim:false,approval_status:'HUMAN_APPROVAL_REQUIRED',deployment_status:'NOT_DEPLOYED',policy:{verified:true,action:'STEP_UP',policy_id:'ZD-04',false_positive_rate:0.01}};
test('maps verified synthetic artifact to audit-only evidence',()=>{
 const result=proposalFromReview(valid);
 assert.equal(result.evidenceHash,'0x'+'f'.repeat(64));
 assert.equal(result.humanReviewRecommended,true);
 assert.equal(result.syntheticOnly,true);
});
for(const [field,value] of [['artifact_sha256','wrong'],['synthetic_only',false],['production_claim',true],['approval_status','APPROVED'],['deployment_status','CANARY']]){
 test('fails closed on unsafe review field '+field,()=>assert.throws(()=>proposalFromReview({...valid,[field]:value})));
}
test('blocks unverified policy',()=>assert.throws(()=>proposalFromReview({...valid,policy:{...valid.policy,verified:false}})));
test('blocks excessive false-positive rate',()=>assert.throws(()=>proposalFromReview({...valid,policy:{...valid.policy,false_positive_rate:0.3}})));
test('not all policies automatically become payment permissions',()=>assert.equal(proposalFromReview(valid).humanReviewRecommended,true));
