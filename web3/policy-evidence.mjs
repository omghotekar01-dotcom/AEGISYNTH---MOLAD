/** A read-only presentation mapping: NOT an authority to spend funds. */
export function proposalFromReview(pkg) {
  if (!pkg || typeof pkg !== 'object') throw new Error('No AEGISYNTH review package');
  if (pkg.package_version !== '1.2' || pkg.synthetic_only !== true || pkg.production_claim !== false ||
      pkg.approval_status !== 'HUMAN_APPROVAL_REQUIRED' || pkg.deployment_status !== 'NOT_DEPLOYED' ||
      !pkg.policy || pkg.policy.verified !== true || !['STEP_UP','REVIEW'].includes(pkg.policy.action) ||
      typeof pkg.artifact_sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(pkg.artifact_sha256)) {
    throw new Error('A verified, human-governed synthetic AEGISYNTH review package is required');
  }
  if (!Number.isFinite(pkg.policy.false_positive_rate) || pkg.policy.false_positive_rate > 0.02 || pkg.policy.false_positive_rate < 0) {
    throw new Error('Policy exceeds the allowed synthetic false-positive budget');
  }
  return Object.freeze({
    evidenceHash: '0x' + pkg.artifact_sha256,
    action: pkg.policy.action,
    policyId: String(pkg.policy.policy_id),
    humanReviewRecommended: true,
    syntheticOnly: true,
    note: 'The AI review hash is audit evidence, not a signature. Spending limits and recipient wallets require separate owner approval.'
  });
}
