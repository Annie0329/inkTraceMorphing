gsap.registerPlugin(MorphSVGPlugin);

const gallery = document.createElement("main");
gallery.className = "svg-gallery";
document.body.append(gallery);

const animationsByCard = new WeakMap();
const observer =
    "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
                entries.forEach(({ target, isIntersecting }) => {
                    animationsByCard.get(target)?.forEach((animation) => {
                        if (isIntersecting) {
                            animation.resume();
                        } else {
                            animation.pause();
                        }
                    });
                });
            },
            { rootMargin: "80px" }
        )
        : null;

async function loadSvg(path) {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`無法載入 ${path}：HTTP ${response.status}`);
    }

    const svgText = await response.text();
    const svgDocument = new DOMParser().parseFromString(svgText, "image/svg+xml");
    const svg = svgDocument.documentElement;

    if (svg.localName !== "svg" || svgDocument.querySelector("parsererror")) {
        throw new Error(`${path} 不是有效的 SVG 文件`);
    }

    return document.importNode(svg, true);
}

async function initializeMorphs() {
    const manifestResponse = await fetch("./svg-manifest.json");
    if (!manifestResponse.ok) {
        throw new Error(`無法載入 SVG 配對清單：HTTP ${manifestResponse.status}`);
    }

    const pairs = await manifestResponse.json();
    if (!Array.isArray(pairs) || pairs.length === 0) {
        throw new Error("SVG 配對清單格式錯誤");
    }

    const results = await Promise.allSettled(
        pairs.map(async ({ label, source, target }) => ({
            label,
            sourceSvg: await loadSvg(source),
            targetSvg: await loadSvg(target)
        }))
    );

    results.forEach((result, index) => {
        if (result.status === "rejected") {
            console.error(`無法載入「${pairs[index].label}」動畫：`, result.reason);
            return;
        }

        const { label, sourceSvg, targetSvg } = result.value;
        const sourcePaths = sourceSvg.querySelectorAll("path");
        const targetPaths = targetSvg.querySelectorAll("path");

        if (sourcePaths.length === 0 || sourcePaths.length !== targetPaths.length) {
            console.error(
                `「${label}」的 SVG 路徑數量不相符，已略過動畫：${sourcePaths.length} 對 ${targetPaths.length}`
            );
            return;
        }

        const card = document.createElement("figure");
        card.className = "svg-card";
        const caption = document.createElement("figcaption");
        caption.textContent = label;

        sourceSvg.setAttribute("role", "img");
        sourceSvg.setAttribute("aria-label", `${label}字形變形動畫`);
        targetSvg.setAttribute("aria-hidden", "true");
        card.append(caption, sourceSvg, targetSvg);
        gallery.append(card);

        const animations = Array.from(sourcePaths, (sourcePath, pathIndex) =>
            gsap.to(sourcePath, {
                morphSVG: targetPaths[pathIndex],
                duration: 2,
                ease: "expo.inOut",
                repeat: -1,
                yoyo: true,
                paused: observer !== null
            })
        );

        if (observer) {
            animationsByCard.set(card, animations);
            observer.observe(card);
        }
    });
}

initializeMorphs().catch((error) => {
    console.error("無法初始化 SVG 變形動畫：", error);
});
