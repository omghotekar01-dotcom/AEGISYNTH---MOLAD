const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('AegisVault security invariants', function () {
  let vault, owner, operator, reviewer, recipient, attacker;
  const hash = ethers.id('synthetic-review-package-v1');
  const amount = ethers.parseEther('0.005');
  const max = ethers.parseEther('0.01');
  const budget = ethers.parseEther('0.02');
  const id = n => ethers.id(`payment-${n}`);
  beforeEach(async () => {
    [owner, operator, reviewer, recipient, attacker] = await ethers.getSigners();
    const factory = await ethers.getContractFactory('AegisVault');
    vault = await factory.deploy(operator.address, reviewer.address);
    await vault.waitForDeployment();
    await (await vault.connect(owner).configurePolicy(hash, max, budget, true)).wait();
    await (await vault.connect(owner).setRecipient(recipient.address, true)).wait();
    await (await vault.connect(owner).deposit({value: ethers.parseEther('0.03')})).wait();
  });
  async function approve(n, who=recipient.address, wei=amount) {
    const latest = await ethers.provider.getBlock('latest');
    return vault.connect(reviewer).approvePayment(id(n), who, wei, latest.timestamp + 3600);
  }
  it('permits reviewed payment, updates accounting and disallows replay', async()=>{
    await approve('a');
    const before = await ethers.provider.getBalance(recipient.address);
    await expect(vault.connect(operator).executePayment(id('a'),recipient.address,amount)).to.emit(vault,'PaymentExecuted');
    expect(await ethers.provider.getBalance(recipient.address)).to.equal(before + amount);
    expect(await vault.lifetimeSpent()).to.equal(amount);
    await expect(vault.connect(operator).executePayment(id('a'),recipient.address,amount)).to.be.revertedWithCustomError(vault,'PaymentAlreadyCompleted');
  });
  it('rejects unauthorized caller even with valid approval',async()=>{
    await approve('a');
    await expect(vault.connect(attacker).executePayment(id('a'),recipient.address,amount)).to.be.revertedWithCustomError(vault,'Unauthorized');
  });
  it('rejects unapproved recipient, excessive amount and missing review',async()=>{
    await expect(vault.connect(operator).executePayment(id('a'),attacker.address,amount)).to.be.revertedWithCustomError(vault,'PaymentRejected');
    await expect(vault.connect(operator).executePayment(id('b'),recipient.address,max+1n)).to.be.revertedWithCustomError(vault,'PaymentRejected');
    await expect(vault.connect(operator).executePayment(id('c'),recipient.address,amount)).to.be.revertedWithCustomError(vault,'ApprovalMissing');
  });
  it('checks current policy version and exact review parameters',async()=>{
    await approve('a');
    await expect(vault.connect(operator).executePayment(id('a'),recipient.address,amount+1n)).to.be.revertedWithCustomError(vault,'ApprovalMissing');
    await (await vault.connect(owner).configurePolicy(ethers.id('new-review'),max,budget,true)).wait();
    await expect(vault.connect(operator).executePayment(id('a'),recipient.address,amount)).to.be.revertedWithCustomError(vault,'ApprovalMissing');
  });
  it('enforces cumulative lifetime budget and pause',async()=>{
    for(let n=0;n<4;n++){
      await approve(n);
      await (await vault.connect(operator).executePayment(id(n),recipient.address,amount)).wait();
    }
    await expect(approve('over')).to.be.revertedWithCustomError(vault,'PaymentRejected');
    await expect(vault.connect(operator).executePayment(id('over'),recipient.address,amount)).to.be.revertedWithCustomError(vault,'PaymentRejected');
    await (await vault.connect(owner).pause()).wait();
    await expect(vault.connect(operator).executePayment(id('whilePaused'),recipient.address,amount)).to.be.revertedWithCustomError(vault,'VaultPaused');
  });
  it('rejects unauthorized policy changes and supports owner recovery',async()=>{
    await expect(vault.connect(attacker).setRecipient(attacker.address,true)).to.be.revertedWithCustomError(vault,'Unauthorized');
    await expect(vault.connect(operator).configurePolicy(hash,max,budget,false)).to.be.revertedWithCustomError(vault,'Unauthorized');
    const balance = await ethers.provider.getBalance(await vault.getAddress());
    await expect(vault.connect(owner).withdrawUnused(balance)).to.emit(vault,'OwnerWithdrawal');
    expect(await ethers.provider.getBalance(await vault.getAddress())).to.equal(0n);
  });
  it('rejects review approval by non-reviewer', async()=>{
    const latest = await ethers.provider.getBlock('latest');
    await expect(vault.connect(attacker).approvePayment(id('a'),recipient.address,amount,latest.timestamp+3600)).to.be.revertedWithCustomError(vault,'Unauthorized');
  });
  it('invalidates outstanding approval when reviewer is rotated', async()=>{
    await approve('a');
    await (await vault.connect(owner).setReviewer(owner.address)).wait();
    await expect(vault.connect(operator).executePayment(id('a'),recipient.address,amount)).to.be.revertedWithCustomError(vault,'ApprovalMissing');
  });
  it('honors recipient revocation even after reviewer approval', async()=>{
    await approve('a');
    await (await vault.connect(owner).setRecipient(recipient.address,false)).wait();
    await expect(vault.connect(operator).executePayment(id('a'),recipient.address,amount)).to.be.revertedWithCustomError(vault,'PaymentRejected');
  });
  it('rejects expired reviewer approval', async()=>{
    const now=(await ethers.provider.getBlock('latest')).timestamp;
    await (await vault.connect(reviewer).approvePayment(id('old'),recipient.address,amount,now+2)).wait();
    await ethers.provider.send('evm_increaseTime',[10]);
    await ethers.provider.send('evm_mine',[]);
    await expect(vault.connect(operator).executePayment(id('old'),recipient.address,amount)).to.be.revertedWithCustomError(vault,'ApprovalMissing');
  });
  it('allows a bounded unreviewed policy only after owner configuration',async()=>{
    await (await vault.connect(owner).configurePolicy(ethers.id('pass-policy'),max,budget,false)).wait();
    await expect(vault.connect(operator).executePayment(id('a'),recipient.address,amount)).to.emit(vault,'PaymentExecuted');
  });
});
