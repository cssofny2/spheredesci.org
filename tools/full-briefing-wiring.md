# Wiring in the full briefing video

The homepage already loads `assets/video-queue.js`. It does nothing until the page contains an element with the id `full-briefing-video`, so the queue is ready and dormant. When the new video exists, these steps make it live. This is a repository-only note (the `tools` folder is not published).

## Steps

1. Encode the new video to 25 MiB or less (Cloudflare's per-file limit for static assets), for example H.264, about 300 kbps video, 64 kbps mono audio, `+faststart`.
2. Put the files in `assets/video/` as `{{NEW_VIDEO}}.mp4`, `{{NEW_VIDEO}}-poster.jpg` and `{{NEW_VIDEO}}.en.vtt` (captions from the final audio).
3. In `index.html`, inside the "project in plain words" section:
   - paste the **Up next card** below directly after the `<figcaption id="intro-video-caption">` of the intro video;
   - paste the **Full briefing block** below after the four numbered cards and before the "Want the technical detail?" line;
   - replace `{{NEW_VIDEO}}` with the real file name, and `{{TRANSCRIPT_PARAGRAPHS}}` with the transcript as `<p class="text-slate-300 mb-3">` paragraphs.
4. Add a second `VideoObject` to the page's JSON-LD (`@id` `https://spheredesci.org/#full-briefing-video`: name, description, thumbnailUrl, uploadDate, duration, contentUrl, encodingFormat, width, height, inLanguage, isPartOf `#webpage`, transcript) and change the `WebPage` entry's `video` to a list of both ids.
5. Rebuild the CSS (`npx --yes tailwindcss@3.4.17 -c tailwind.config.cjs -i styles.input.css -o assets/tailwind.css --minify`): the block uses a few classes the page does not otherwise need.
6. Test with `npx --yes serve . -l 3000 --no-clipboard` (Python's built-in test server does not support seeking). Seek the intro video to its last second and let it end: the card should count down from 5, then scroll to and play the full briefing.
7. Add a line to the updates log, and update the sitemap `lastmod` for `/`.

## How the queue behaves

When the intro video ends, the Up next card appears with a 5-second countdown and "Play now" / "Cancel" buttons. At zero it scrolls to the full briefing (without animation if the viewer prefers reduced motion) and calls `play()`. If the browser blocks autoplay, the viewer presses play. Playing, replaying or cancelling either video stops a pending auto-start. Without JavaScript both videos simply sit on the page in order.

## Up next card

```html
<div id="up-next" class="max-w-md mx-auto mt-6 glass-panel rounded-xl p-4 text-left" hidden aria-live="polite">
                    <p class="text-xs uppercase tracking-widest text-slate-400 mb-2">Up next</p>
                    <div class="flex items-center gap-4">
                        <img src="/assets/video/{{NEW_VIDEO}}-poster.jpg" alt="" width="120" height="68" class="rounded w-28 h-auto flex-shrink-0" loading="lazy" decoding="async">
                        <div>
                            <p class="font-bold text-white">The full briefing (8 min)</p>
                            <p class="text-sm text-slate-300">Starting in <span id="up-next-count">5</span> seconds</p>
                        </div>
                    </div>
                    <div class="mt-4 flex gap-3">
                        <button type="button" id="up-next-play" class="bg-copper-600 hover:bg-copper-500 text-white px-4 py-2 rounded font-bold text-sm">Play now</button>
                        <button type="button" id="up-next-cancel" class="border border-slate-600 hover:border-slate-400 text-slate-300 px-4 py-2 rounded font-bold text-sm">Cancel</button>
                    </div>
```

## Full briefing block

```html
<div id="full-briefing" class="glass-panel p-8 rounded-xl mb-8 fade-in-up">
                <h3 class="text-2xl font-bold text-white mb-4">Want more detail? Watch the full briefing</h3>
                <p class="text-lg text-slate-300 leading-relaxed mb-6">This 8-minute video goes deeper. It covers the idea behind the question, the kind of equipment and lab a test would need, and how the idea relates to open questions in physics.</p>
                <figure>
                    <div class="rounded-xl overflow-hidden border border-slate-700 shadow-2xl bg-black">
                        <video id="full-briefing-video" class="block w-full h-auto" controls playsinline preload="none" width="1280" height="720" poster="/assets/video/{{NEW_VIDEO}}-poster.jpg" aria-describedby="full-briefing-note">
                            <source src="/assets/video/{{NEW_VIDEO}}.mp4" type="video/mp4">
                            <track kind="captions" srclang="en" label="English" src="/assets/video/{{NEW_VIDEO}}.en.vtt">
                            Your browser cannot play this video. <a href="/assets/video/{{NEW_VIDEO}}.mp4">Download the video (MP4, 10 MB)</a>.
                        </video>
                    </div>
                    <figcaption id="full-briefing-note" class="note mt-4 text-sm text-slate-300">
                        <strong class="text-white">Read this first.</strong> This is an AI-generated explainer about the source material behind the project. It is not the project&rsquo;s protocol, results or budget. Some statements go further than this project does. S.P.H.E.R.E. does not claim teleportation, levitation or movement without crossing space, and nothing has been measured. The cost figures in the video are an outside illustration; the project&rsquo;s own planning figures are on the <a href="/transparency/#phases" class="text-copper-400 underline hover:text-white">budget and funding page</a>.
                    </figcaption>
                </figure>
                <details class="mt-6">
                    <summary class="cursor-pointer font-bold text-white">Read the video transcript</summary>
                    <div class="mt-4">
{{TRANSCRIPT_PARAGRAPHS}}
                        <p class="text-slate-400 text-sm">Transcript made by speech recognition and lightly corrected. Passages marked [unclear] could not be confirmed.</p>
                    </div>
                </details>
            </div>
```
