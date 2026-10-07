// `--mono-control-height-*` must mean ONE thing: the painted outer border-box
// height of the control, for every control, at every size.
//
// It did not. mono-input painted token + 3px (it pinned `height` on the border-less
// native inside a bordered field); mono-select, mono-date and mono-tag-input each
// overflowed their own `min-height` via a fixed-size action box, a 20px icon, or a
// text line box inherited from the host page. Only mono-button was correct.
//
// See fixtures/field-heights.js for why there are three arms — the short version is
// that the bug only exists under a host page with an absolute `line-height`, so a
// single-arm test would have passed throughout.

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']
const ARMS = ['vitepress', 'vacuum', 'shadow']
const CONTROLS = ['input', 'select', 'date', 'tag', 'button']
const TEXT_FIELDS = ['input', 'select', 'date', 'tag']

// The labelled-block check compares fields that share a label + message
// geometry. The Basecoat port changes that geometry (a leading-none text-sm
// label, gap-3), so a ported field can only be compared with other ported
// fields until its siblings follow. Move a control across as it is ported;
// the two cohorts merge back into TEXT_FIELDS when the list is empty.
const PORTED = ['input', 'select', 'date', 'tag']
// Toggles ported to Basecoat size their control off token × 4/9 (size-4 at vega's
// h-9) instead of token / 2. The switch/checkbox pairing check needs both on the
// same ratio; flip `switch` when it is ported and the check returns.
const PORTED_TOGGLES = { checkbox: true, switch: true }
const COHORTS = [PORTED, TEXT_FIELDS.filter((c) => !PORTED.includes(c))].filter((c) => c.length > 1)

// Variants that historically had their own floor: `clearable` exposes the action
// box, `underlined` swaps 3px of border for 2px.
const KINDS = ['bare', 'clearable', 'underlined']

const EPS = 0.05

const spread = (vals) => Math.max(...vals) - Math.min(...vals)
const fmt = (obj) =>
  Object.entries(obj)
    .map(([k, v]) => `${k} ${v}`)
    .join(', ')

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=field-heights`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  // 0. The hostile arm has to actually be hostile, or every check below is vacuous.
  const lines = await page.evaluate(() => ({
    vitepress: window.__armLineHeight('vitepress'),
    vacuum: window.__armLineHeight('vacuum'),
  }))
  reporter.check(
    'the hostile arm really imposes a 24px line box',
    lines.vitepress === '24px',
    `vitepress arm line-height is ${lines.vitepress} (vacuum: ${lines.vacuum})`,
  )

  const tokens = {}
  for (const size of SIZES) tokens[size] = await page.evaluate((s) => window.__tokenPx(s), size)

  for (const size of SIZES) {
    const token = tokens[size]

    for (const arm of ARMS) {
      // The shadow arm only renders the bare kind.
      const kinds = arm === 'shadow' ? ['bare'] : KINDS

      for (const kind of kinds) {
        const h = await page.evaluate(
          ([a, s, k]) => window.__fieldHeights(a, s, k),
          [arm, size, kind],
        )

        // 1. Each control paints exactly the token.
        for (const c of CONTROLS) {
          reporter.check(
            `${arm}/${kind} ${size}: ${c} === --mono-control-height-${size}`,
            h[c] !== null && Math.abs(h[c] - token) < EPS,
            `${c} ${h[c]}px, token ${token}px`,
          )
        }

        // 2. The four text fields agree with each other — this is what a form row
        //    actually shows, and it localizes the outlier when check 1 fails.
        const texts = TEXT_FIELDS.map((c) => h[c])
        reporter.check(
          `${arm}/${kind} ${size}: the four text fields agree`,
          texts.every((v) => v !== null) && spread(texts) < EPS,
          fmt(Object.fromEntries(TEXT_FIELDS.map((c) => [c, h[c]]))),
        )

        // 3. …and with the button, which is the one control that was already right.
        reporter.check(
          `${arm}/${kind} ${size}: text fields agree with button`,
          texts.every((v) => v !== null && Math.abs(v - h.button) < EPS),
          `button ${h.button}, ${fmt(Object.fromEntries(TEXT_FIELDS.map((c) => [c, h[c]])))}`,
        )
      }
    }

    // 4. The height must not depend on the host's line box at all. A control
    //    "fixed" by re-tuning a literal passes checks 1-3 and fails here.
    const hostile = await page.evaluate((s) => window.__fieldHeights('vitepress', s), size)
    const vacuum = await page.evaluate((s) => window.__fieldHeights('vacuum', s), size)
    for (const c of CONTROLS) {
      reporter.check(
        `${size}: ${c} is immune to the host line box`,
        Math.abs(hostile[c] - vacuum[c]) < EPS,
        `hostile ${hostile[c]}px vs vacuum ${vacuum[c]}px`,
      )
    }

    // 5. The shadow stylesheet is a separately compiled copy of the same file.
    const shadow = await page.evaluate((s) => window.__fieldHeights('shadow', s), size)
    for (const c of CONTROLS) {
      reporter.check(
        `${size}: shadow ${c} matches light`,
        shadow[c] !== null && Math.abs(shadow[c] - hostile[c]) < EPS,
        `shadow ${shadow[c]}px vs light ${hostile[c]}px`,
      )
    }

    // 6. A labelled control is what forms actually render — the label row has its
    //    own line box, and three of the four never pinned it.
    const blocks = await page.evaluate((s) => window.__blockHeights('vitepress', s), size)
    for (const cohort of COHORTS) {
      const blockVals = cohort.map((c) => blocks[c]?.block)
      reporter.check(
        `${size}: labelled block heights agree (${cohort.join('/')})`,
        blockVals.every((v) => v != null) && spread(blockVals) < EPS,
        cohort.map(
          (c) => `${c} block ${blocks[c]?.block} (label ${blocks[c]?.label}, gap ${blocks[c]?.gap})`,
        ).join(' | '),
      )
    }

    // 7. switch/checkbox pairing. Both ported: the switch THUMB is the checkbox
    //    box (Basecoat's `size-4` thumb in an `h-[18.4px]` track), so the track is
    //    1.15x the box — checked here as well, since that ratio is what makes the
    //    two read as one scale. Held while only one side is ported.
    const peers = await page.evaluate((s) => window.__peerMetrics('vitepress', s), size)
    if (PORTED_TOGGLES.checkbox === PORTED_TOGGLES.switch) {
      const thumb = PORTED_TOGGLES.switch ? peers.switchThumb : peers.switchTrackH
      reporter.check(
        `${size}: switch ${PORTED_TOGGLES.switch ? 'thumb' : 'track height'} === checkbox box`,
        peers.checkboxBox != null && thumb != null && Math.abs(thumb - peers.checkboxBox) < EPS,
        `${PORTED_TOGGLES.switch ? 'thumb' : 'track'} ${thumb}px vs box ${peers.checkboxBox}px`,
      )
      if (PORTED_TOGGLES.switch) {
        // Upstream's track is 1.15x its thumb (18.4 / 16), but both are snapped to
        // whole pixels now, and the track is BUILT from the thumb: border, then a
        // whole-pixel inset (0 or 1), then the thumb. So the invariant to hold is
        // that the track hugs the thumb — not a ratio that rounding cannot honour.
        const bw = peers.switchBorder ?? 1
        const slack = peers.switchTrackH - peers.checkboxBox - 2 * bw
        reporter.check(
          `${size}: switch track hugs the thumb (border + a whole-pixel inset)`,
          peers.switchTrackH != null && slack >= -0.02 && slack <= 2.02 && Math.abs(slack % 1) < 0.02,
          `track ${peers.switchTrackH}px, thumb ${peers.checkboxBox}px, border ${bw}px -> inset ${(slack / 2).toFixed(2)}px each side`,
        )
      }
    } else {
      const ratio = PORTED_TOGGLES.checkbox ? 4 / 9 : 0.5
      reporter.check(
        `${size}: checkbox box === token × ${PORTED_TOGGLES.checkbox ? '4/9' : '1/2'} (switch pairing held until both are ported)`,
        peers.checkboxBox != null && Math.abs(peers.checkboxBox - token * ratio) < EPS,
        `box ${peers.checkboxBox}px vs ${(token * ratio).toFixed(2)}px (switch track ${peers.switchTrackH}px)`,
      )
    }

    // 8. A textarea beside an input must start its first line on the same baseline.
    //    Tolerance is 0.75px, not 0: `--theme-border-width` is 1.5px and the
    //    browser rounds a border's USED width to a whole device pixel, so the
    //    padding formula (which subtracts the declared 1.5px) is left with a
    //    ~0.5px residual that no CSS can predict — the same rounding checkbox
    //    documents around its optical nudge. The drift this catches was 1.2-5.1px
    //    and grew with size; what is left is constant and sub-pixel.
    reporter.check(
      `${size}: textarea first line centres on the input's line`,
      peers.textareaFirstLine != null && Math.abs(peers.textareaFirstLine - token / 2) < 0.75,
      `textarea first line at ${peers.textareaFirstLine}px, input line centre at ${token / 2}px`,
    )
  }

  // `md` is the default everywhere; its textarea min-height must be exactly what
  // the derivation says: T + (ROWS - 1) x L. Both inputs are read from the
  // element — ROWS and the line box are flavor knobs now (the pre-port literal
  // "+48px" assumed 4 rows of a 16px line and went stale the moment a flavor
  // set --mono-textarea-rows-md).
  const mdPeers = await page.evaluate(() => window.__peerMetrics('vitepress', 'md'))
  const wantMin = tokens.md + (mdPeers.textareaRows - 1) * mdPeers.textareaLinePx
  reporter.check(
    'md: textarea min-height is the control height + (rows - 1) lines',
    mdPeers.textareaMinHeight != null &&
      Math.abs(parseFloat(mdPeers.textareaMinHeight) - wantMin) < EPS,
    `got ${mdPeers.textareaMinHeight}, want ${wantMin}px (token ${tokens.md}px + ${mdPeers.textareaRows - 1} x ${mdPeers.textareaLinePx}px)`,
  )

  // 9. Retune the token and every field must follow. Catches a literal that merely
  //    happens to equal today's value.
  const retuned = await page.evaluate(() => window.__retune('md', '44px'))
  for (const arm of ARMS) {
    for (const c of CONTROLS) {
      reporter.check(
        `retune md -> 44px: ${arm} ${c} follows the token`,
        retuned[arm][c] !== null && Math.abs(retuned[arm][c] - 44) < EPS,
        `${c} ${retuned[arm][c]}px, expected 44px`,
      )
    }
  }
  await page.evaluate(() => window.__restore('md'))
}
