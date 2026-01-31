/* =========================================================
   Random colorful HR (stable + theme-consistent)
   - Prefer current data-bg palette (A/B/MIX) for consistency
   - Each <hr> uses a 2-color gradient picked from that palette
   - Deterministic per page (seeded), so it feels “random but not messy”
   - Reacts to data-theme / data-bg changes
   Targets:
   - Article: #article-container hr
   - Writer preview: #mw-system .mw-preview-body hr
   ========================================================= */
(function () {
    const HR_SELECTOR = "#article-container hr, #mw-system .mw-preview-body hr";

    function rgba(rgbStr, a) {
        return `rgba(${rgbStr}, ${a})`;
    }

    function getVar(name) {
        const v = getComputedStyle(document.documentElement).getPropertyValue(name);
        return (v || "").trim(); // "120, 190, 175"
    }

    // ----- seeded random: stable but still “random-looking”
    function hashString(str) {
        // simple DJB2
        let h = 5381;
        for (let i = 0; i < str.length; i++) {
            h = ((h << 5) + h) ^ str.charCodeAt(i);
        }
        return h >>> 0;
    }

    function mulberry32(seed) {
        return function () {
            let t = (seed += 0x6d2b79f5);
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function pick2Distinct(arr, rand) {
        if (!arr.length) return ["110, 165, 210", "120, 190, 175"];
        if (arr.length === 1) return [arr[0], arr[0]];
        const i = Math.floor(rand() * arr.length);
        let j = Math.floor(rand() * arr.length);
        if (j === i) j = (j + 1) % arr.length;
        return [arr[i], arr[j]];
    }

    // 当前页面的“档位配色”（只取当前 data-bg 的 a/b/mix）
    function getCurrentBgPalette() {
        const a = getVar("--bg-a-rgb");
        const b = getVar("--bg-b-rgb");
        const m = getVar("--bg-mix-rgb");
        const palette = [];
        if (a) palette.push(a);
        if (b) palette.push(b);
        if (m) palette.push(m);
        return palette;
    }

    // 全档位备用（用于当前变量缺失/或做少量穿插）
    function getAllBgPalette() {
        return [
            // bg0
            "120, 170, 210", "165, 150, 200", "142, 160, 206",
            // bg1
            "110, 165, 210", "120, 190, 175", "116, 178, 192",
            // bg2
            "118, 192, 178", "210, 186, 150", "164, 190, 164",
            // bg3
            "214, 178, 190", "214, 198, 150", "214, 188, 170"
        ];
    }

    function apply() {
        const hrs = document.querySelectorAll(HR_SELECTOR);
        if (!hrs.length) return;

        const html = document.documentElement;
        const isDark = html.getAttribute("data-theme") === "dark";
        const alpha = isDark ? 0.55 : 0.70;

        const dataBg = html.getAttribute("data-bg") || "bg0";

        // ✅ 核心：优先使用当前档位配色，保证整页更统一
        const currentPalette = getCurrentBgPalette();
        const fallbackPalette = getAllBgPalette();

        // 当前档位拿不到时兜底
        const basePalette = currentPalette.length ? currentPalette : fallbackPalette;

        // ✅ seed：让“同一页面每条 hr 分配稳定”，避免看起来乱跳
        // 你可以按需换 seed 策略：例如加上 pathname，让不同文章不同效果
        const seedStr = `${location.pathname}|${dataBg}|${isDark ? "dark" : "light"}`;
        const rand = mulberry32(hashString(seedStr));

        hrs.forEach((hr, idx) => {
            // ✅ 为了“随机但不乱”，大部分从 basePalette 抽
            // ✅ 少量（例如 15%）从全档位穿插，让你感觉“更丰富”
            const useGlobal = rand() < 0.15;
            const palette = useGlobal ? fallbackPalette : basePalette;

            // 用 idx 再扰动一下，确保每条 hr 不一样
            const localRand = mulberry32(hashString(seedStr + "|" + idx));
            const [c1, c2] = pick2Distinct(palette, localRand);

            hr.style.setProperty("--hr-a", rgba(c1, alpha));
            hr.style.setProperty("--hr-b", rgba(c2, alpha));
        });
    }

    // init
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", apply, { once: true });
    } else {
        apply();
    }

    // react to theme/bg change
    const obs = new MutationObserver(() => apply());
    obs.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme", "data-bg"]
    });

    // (Optional) If your content is injected dynamically (pjax, etc.)
    // re-apply after route changes. Uncomment if needed.
    /*
    window.addEventListener("pjax:complete", apply);
    window.addEventListener("popstate", apply);
    */
})();
