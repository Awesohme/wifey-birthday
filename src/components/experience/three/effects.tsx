"use client";

import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

export function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom luminanceThreshold={0.55} luminanceSmoothing={0.9} intensity={0.7} mipmapBlur />
      <Vignette eskil={false} offset={0.1} darkness={0.55} />
    </EffectComposer>
  );
}
