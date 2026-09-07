# Bloom restoration, September 7

## Follow-up: intermittent partial blackouts

The flame shader had an unguarded `pow(1.0 - p.y, 1.25)`. At a flame edge, interpolated UV coordinates can overshoot their nominal range slightly. A negative base makes this fractional power undefined. The fix clamps the base to `[0, 1]` before evaluating it. The original bloom pipeline, lighting, renderer settings, and artwork remain unchanged.

The user's 4.088-second recording shows a blackout around 0.917 seconds. Most of the 3D scene disappears, but a narrow strip at the right edge survives, along with the DOM text and logo. This is consistent with an invalid floating-point value spreading through bloom's blur textures. The earlier whole-frame RGB-range check below could not detect this kind of partial blackout; it did not establish that the scene was blink-free.

Verification on the actual Mac browser:

- At 1560 × 1130 CSS pixels and device pixel ratio 2, the original shader produced three visually confirmed bad frames in a 20-second browser screencast containing 1,404 captured frames. Other control runs also reproduced the partial blackout.
- Direct rendering with bloom temporarily bypassed produced no matching blackouts across 40 seconds and 2,620 captured frames.
- With only the shader clamp applied, three 20-second screencasts captured 4,571 frames without a matching blackout. Mouse movement, capture size, and image quality matched the original run. These are captured browser frames, not a GPU performance measurement.
- A fresh production build using the original renderer settings captured another 1,509 frames over 20 seconds without a matching blackout. Total fixed observation: 6,080 captured frames over 80 seconds.
- The bad JPEG frames contained roughly 15,000–17,500 base64 characters; normal frames contained at least 33,832 characters in the fixed runs. A 25,000-character cutoff identified candidates for visual inspection. This detector is specific to the stationary Glite garden composition and does not establish correctness for arbitrary views.
- A separate WebGL 2 shader test on the same GPU evaluated `pow(-1.1920928955078125e-7, 1.25)`. The original expression produced NaN; the clamped expression did not. This verifies the numerical hazard, not a direct measurement of the original scene's interpolated UV overshoot. The [Khronos GLSL reference](https://registry.khronos.org/OpenGL-Refpages/es3.0/html/pow.xhtml) specifies that a negative base is undefined.

Canvas retention, transparency, multisampling, CSS compositing, and GPU synchronization experiments did not reliably resolve the reproduction. All were removed. The clamp is the only runtime source change.

## Original restoration

Fable's T3 thread `buft.io`, `a141e464-066d-4234-b589-90c35465ce17`, records the original investigation. Commit `b34a4a0` removed `@react-three/postprocessing` and replaced bloom with additive glow sprites. It also kept all flowers mounted and replaced their individual lights with three moving lights. Later commits improved loading, compression, routing, and accessibility.

The recorded comparison isolated the old composer as a trigger for intermittent black frames. Disabling mipmap blur did not reliably help. The exact internal cause was not established. A skipped render while the wrapper owns the frame is a plausible mechanism, not a proven diagnosis.

`GardenBloom` now uses the installed Three.js compositor directly. Its pass order is RenderPass, UnrealBloomPass, OutputPass. One stable callback owns the final render, with a direct scene render when the compositor has not yet been constructed. It sizes the render targets with the canvas and disposes the passes on unmount. The replacement glow sprites were removed. The persistent flowers, fixed light count, model fades, and other later changes remain.

## Browser evidence

Checked the local Next production build in Chromium at 1280 × 850 and 390 × 844 CSS pixels. Mouse sweeps, actual wheel scrolling, distant project jumps, project opening and closing, resizing, and the shared animation pause were exercised.

A temporary observer copied the rendered garden canvas to a 48 × 32 pixel buffer after each completed render. After skipping the first 120 warm-up frames, it classified a frame as blank when the maximum minus minimum mean RGB value was below 5 on the 0–255 scale.

The production observation lasted 78.8 seconds. All 9,308 sampled frames after warm-up contained scene content; no blank frames were detected. The smallest observed RGB range was 140. The earlier development run also detected no blank frames. The probe adds readback work, so these runs are evidence about blank frames, not a performance benchmark. They do not prove the absence of every possible driver or browser presentation issue. The observer was removed after validation.

Glite's correction, reset, dictionary search, dictionary lookup from the phone, correct and incorrect answers, all four questions, and the mobile layout were exercised. A non-Glite project still opened its existing scene. No browser runtime errors were reported. Formatting, lint, TypeScript, and the Next production build passed.

The generated Glite HTML contains the story, dictionary, and quiz before JavaScript runs; only the café canvas waits for its client bundle. With the café model request deliberately blocked, the story and quiz remained usable and the garden loaded. After unblocking the request, Try again recovered the model without reloading the page. The café lamp was also toggled by clicking its actual mesh.
