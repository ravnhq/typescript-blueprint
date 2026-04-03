/** @param {import('pnpm').PackageManifest} pkg */
function readPackage(pkg) {
  // CVE fix: force h3 alias to patched version (>=2.0.1-rc.18)
  // @tanstack/start-server-core pins h3-v2: npm:h3@2.0.1-rc.16 which has 3 CVEs
  if (pkg.dependencies?.['h3-v2']) {
    pkg.dependencies['h3-v2'] = 'npm:h3@>=2.0.1-rc.18';
  }
  return pkg;
}

module.exports = { hooks: { readPackage } };
