# Bloom restoration, September 7

Fable's T3 thread `buft.io`, `a141e464-066d-4234-b589-90c35465ce17`, records the original investigation. Commit `b34a4a0` removed `@react-three/postprocessing` and replaced bloom with additive glow sprites. It also kept all flowers mounted and replaced their individual lights with three moving lights. Later commits improved loading, compression, routing, and accessibility.

The recorded comparison isolated the old composer as a trigger for intermittent black frames. Disabling mipmap blur did not reliably help. The exact internal cause was not established. A skipped render while the wrapper owns the frame is a plausible mechanism, not a proven diagnosis.

`GardenBloom` now uses the installed Three.js compositor directly. Its pass order is RenderPass, UnrealBloomPass, OutputPass. One stable callback owns the final render, with a direct scene render when the compositor has not yet been constructed. It sizes the render targets with the canvas and disposes the passes on unmount. The replacement glow sprites were removed. The persistent flowers, fixed light count, model fades, and other later changes remain.

## Browser evidence

Checked the local Next production build in Chromium at 1280 × 850 and 390 × 844 CSS pixels. Mouse sweeps, actual wheel scrolling, distant project jumps, project opening and closing, resizing, and the shared animation pause were exercised.

A temporary observer copied the rendered garden canvas to a 48 × 32 pixel buffer after each completed render. After skipping the first 120 warm-up frames, it classified a frame as blank when the maximum minus minimum mean RGB value was below 5 on the 0–255 scale.

The production observation lasted 78.8 seconds. All 9,308 sampled frames after warm-up contained scene content; no blank frames were detected. The smallest observed RGB range was 140. The earlier development run also detected no blank frames. The probe adds readback work, so these runs are evidence about blank frames, not a performance benchmark. They do not prove the absence of every possible driver or browser presentation issue. The observer was removed after validation.

Glite's correction, reset, dictionary search, dictionary lookup from the phone, correct and incorrect answers, all four questions, and the mobile layout were exercised. A non-Glite project still opened its existing scene. No browser runtime errors were reported. Formatting, lint, TypeScript, and the Next production build passed.

The generated Glite HTML contains the story, dictionary, and quiz before JavaScript runs; only the café canvas waits for its client bundle. With the café model request deliberately blocked, the story and quiz remained usable and the garden loaded. After unblocking the request, Try again recovered the model without reloading the page. The café lamp was also toggled by clicking its actual mesh.
