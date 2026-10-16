# Tahun Gajah V8 — Cloud Render Smoke Test

**State:** validated engineering baseline; NOT visual-quality-approved and NOT a finished historical film.
**Branch:** feat/tahun-gajah-v8-cloud-render.
**Workflow:** .github/workflows/tahun-gajah-v8-cloud.yml.
**Scene:** experiments/tahun-gajah-v8-cloud/scene.js.

## Purpose
Render a real, continuously updated **3D code-built scene** without using the user's Mac. Uses Three.js WebGL in headless Chrome on a GitHub-hosted Ubuntu runner, deterministic 24fps screenshot capture in Puppeteer, and FFmpeg H.264 encoding. No GPT Image, Blender, AI motion/video, still-frame puppetry, music, paid media APIs, or local-machine setup.

## Verified evidence
- 2026-10-16 [cloud run 38864991909](https://github.com/lovelyajbi/OpenMontage/actions/runs/38864991909): successful 48-frame 360×640 MP4, corrected after initial FFmpeg installer error.
- 2026-10-16 [cloud run 38865368999](https://github.com/lovelyajbi/OpenMontage/actions/runs/38865368999): successful 48 frames after camera framing fix; FFmpeg full-file decode passed; artifact MP4-only, retention 7 days.
- Browser boots real Three.js. Procedural animated hero elephant, follower elephants, faceless people, desert terrain, city architecture, dust and tracking camera; CPU software WebGL. Still visually stylized, rudimentary mesh/anatomy, limited environment visibility. **Do not call this a premium film.**

## How to run with no Mac installation
For automatic cloud reruns, commit a change to one of the experimental files under experiments/tahun-gajah-v8-cloud/ on the branch. Its push event automatically starts the workflow. Open [GitHub Actions](https://github.com/lovelyajbi/OpenMontage/actions/workflows/tahun-gajah-v8-cloud.yml), select the latest branch run, and download the MP4-only artifact when it succeeds.

The workflow has workflow_dispatch too; GitHub's Actions UI generally requires the workflow to be on the default branch to show manual dispatch. While intentionally isolated on a feature branch, rely on push for automated running.

## Actual execution architecture
- Node 22, Google Chrome and npm modules (three, puppeteer-core) on GitHub runner.
- FFmpeg automatically installed on runner.
- 2 sec × 24 fps = 48 deterministic native 360×640 frames, H.264; temporary screenshot frames are not uploaded.
- Artifacts contain one MP4. Runner's temporary working directory is destroyed after job completion.
- Browser scene is standalone inside the **OpenMontage repository**; native OpenMontage Python tool registry, threejs_world->HyperFrames orchestration, custom character IK, and commercial-scale rendering have **not yet been integrated or tested**. Avoid saying "full OpenMontage production pipeline" is ready.

## Constraints and next work
- The repo is **public**. Don't commit private narration, unpublished customer data, tokens, or secrets. GitHub Actions run/artifact details may be publicly accessible.
- A runner is a cloud computer, not free unlimited GPU rendering. Standard Ubuntu runners are CPU-oriented and may use SwiftShader, so heavy high-res projects are slow.
- Engine success does NOT establish believable elephant anatomy, foot planting/IK, realistic PBR skin/cloth, foliage, or cinematography.
- Next gate: improve connected anatomical mesh, weight shift/ground contact, lighting and settlement visibility; native 24fps short video; visual acceptance by user.
- No reusable Lovelya production skill should be declared complete until repeated user-approved quality renders exist.

## Provenance
References: OpenMontage's ThreeJSWorld/HyperFrames and existing ChatGPT Code3D reference pack; this experimental cloud renderer is separate source and does not modify existing application behavior.
