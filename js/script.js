gsap.registerPlugin(MorphSVGPlugin);

const svgs = document.querySelectorAll("svg");

for (let svgIndex = 0; svgIndex < svgs.length; svgIndex += 2) {
    const sourcePaths = svgs[svgIndex].querySelectorAll("path");
    const targetSvg = svgs[svgIndex + 1];

    const targetPaths = targetSvg.querySelectorAll("path");

    for (let i = 0; i < sourcePaths.length; i++) {
        gsap.to(sourcePaths[i], {
            morphSVG: targetPaths[i],
            duration: 2,
            ease: "expo.inOut",
            repeat: -1,
            yoyo: true
        });
    }
}