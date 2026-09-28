# ✅ CLOSED 2026-09-28. Kept for the reasoning.

> The code path described below **no longer exists**. `src/data/load.ts` imports one
> file, `history.sample.json`, and nothing else. There is no glob, so no local build can
> carry private data and `vercel --prod` from this folder is no longer dangerous.
>
> ⚡ **Measured proof:** a plain `npm run build` went from **3,201 kB to 1,824 kB**. The
> 1,377 kB that disappeared is the private export that had been bundled into every build.
> A scan of the output for Tanay, Home Depot, Everlaw, Woodforest, resign and recruiter
> comes back empty, and `verify.ts` still reports 1475 / 199 / 179 / 13.5%.
>
> The original write-up follows, because the reasoning is worth keeping: it is the case
> study in a flag that reads as a safety control and is not one.

# ⛑ The hazard, as it stood on 26 September

Found 2026-09-26 while deploying a copy change. **Not currently exploited, and the live site is
clean**, but the guard that is supposed to prevent it does not work.

## What is wrong

`src/data/load.ts` line 6:

```ts
const privateMods = import.meta.glob('./history.private.json', { eager: true, import: 'default' })
const privateData = Object.values(privateMods)[0]

// VITE_SAMPLE=1 forces the synthetic set even when the private export is on disk.
export const entries = ((import.meta.env.VITE_SAMPLE ? undefined : privateData) ?? sample)
```

**`VITE_SAMPLE` gates the SELECTION, not the INCLUSION.** An eager glob is resolved at build time and
the matched module is bundled whether or not anything reads it. So on this machine:

| Command | What is displayed | What is **in the bundle** |
|---|---|---|
| `npm run build` | real history | real history |
| `VITE_SAMPLE=1 npm run build` | sample | ⛑ **real history, all 1,470 entries** |

Measured: with `VITE_SAMPLE=1` the output still contained "Tanay" and "Woodforest", and weighed
3,126 kB against 3,201 kB for the unflagged build. The flag removed 75 kB, not 1.5 MB.

## Why the live site is nevertheless fine

`history.private.json` and `history.private.1470.json` are both gitignored and neither is tracked
(`git ls-files` confirms only `history.sample.json` ships). **Vercel builds from the repo**, the glob
matches nothing there, and the sample is used. Verified on the live site: generic transcripts,
footer reads "sample data", and the sample JSON itself contains zero occurrences of Tanay,
Woodforest, danielglaze, Dreadfuls, or Braves.

## The actual risk

**A local deploy.** `vercel --prod` or `vercel deploy` run from this folder builds here, not on
Vercel, and would publish the full real export: 1,470 dictations, 96,456 words, including outreach
strategy, other companies, and Woodforest internal numbers that are under the ratios-only disclosure
rule. ⚡ Sharing a local `dist/` has the same effect.

**Until this is fixed, deploy only by `git push`.**

## The fix, when there is time

Make the glob itself conditional so the file is never reachable at build time:

```ts
const privateMods = import.meta.env.VITE_SAMPLE
  ? {}
  : import.meta.glob('./history.private.json', { eager: true, import: 'default' })
```

⚑ Not applied on 26 September on purpose: Daniel was mid-edit on the video and a build-behaviour
change that evening could have broken the localhost he was recording against. It is a latent hazard,
not an active one, and it waits for a moment when nothing depends on the build.

Related: `src/data/load.ts`, `.gitignore`, note 7's provenance list.
