// Netlify build plugin for the mono npm registry.
//
// onPreBuild — version validation:
//   Fails the build (production) when a package's source changed since its
//   published release but package.json's version was not bumped. Runs BEFORE
//   the expensive build so feedback is fast. Previews/branch builds only warn
//   (check-versions.mjs decides via CONTEXT).
//
// onSuccess — publish:
//   Runs AFTER the deployment is confirmed live. Publishes
//   @mono-lit/devextreme → @mono-lit/utility → @mono-lit/helper via
//   scripts/registry/publish.mjs; already-published versions are skipped.
//
// Auth: REGISTRY_PUBLISH_TOKEN must be set as a Netlify environment variable
// (the same one the function checks at runtime).

const { execFile } = require('node:child_process')
const { promisify } = require('node:util')

const run = promisify(execFile)

module.exports = {
  async onPreBuild({ utils }) {
    try {
      await utils.run('node', ['scripts/registry/check-versions.mjs'])
    } catch (err) {
      await utils.build.failBuild(
        [
          'Version check failed — a package changed without a version bump.',
          'Bump "version" in the package(s) listed above to publish the changes.',
        ].join(' '),
        { error: err },
      )
    }
  },

  async onSuccess() {
    if (process.env.CONTEXT !== 'production') {
      console.log('[publish-registry] not a production deploy — skipping publish')
      return
    }
    if (!process.env.REGISTRY_PUBLISH_TOKEN) {
      console.warn(
        '[publish-registry] REGISTRY_PUBLISH_TOKEN is not set — packages will NOT be published automatically',
      )
      return
    }

    console.log('[publish-registry] deploy is live — publishing mono packages')
    const { stdout, stderr } = await run('node', ['scripts/registry/publish.mjs'], {
      cwd: process.cwd(),
      env: process.env,
    })
    console.log(stdout.trim())
    if (stderr.trim()) console.error(stderr.trim())
  },
}
