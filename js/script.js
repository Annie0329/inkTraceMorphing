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

    const svgText = await response.text();
    const svgDocument = new DOMParser().parseFromString(svgText, "image/svg+xml");
    const svg = svgDocument.documentElement;

    return document.importNode(svg, true);
}

async function initializeMorphs() {
    const manifestResponse = await fetch("./svg-manifest.json");

    const pairs = await manifestResponse.json();

    const results = await Promise.allSettled(
        pairs.map(async ({ label, source, target }) => ({
            label,
            sourceSvg: await loadSvg(source),
            targetSvg: await loadSvg(target)
        }))
    );

    results.forEach((result) => {

        const { label, sourceSvg, targetSvg } = result.value;
        const sourcePaths = sourceSvg.querySelectorAll("path");
        const targetPaths = targetSvg.querySelectorAll("path");

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

initializeMorphs()
