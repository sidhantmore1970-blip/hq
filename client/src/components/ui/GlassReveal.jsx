import React, { useRef, useState, useEffect } from 'react';
import { Renderer, Program, Mesh, Triangle, Transform, Texture } from 'ogl';

const VERTEX_SHADER = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uTexA;
uniform sampler2D uTexB;
uniform vec2 uPointer;
uniform float uRadius;
uniform float uStrength;
uniform float uAspect;
uniform float uShape; // 0: circle, 1: square, 2: blob, 3: portal
uniform float uTime;
uniform float uDispersion;
uniform float uActive;

varying vec2 vUv;

// Distance functions
float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

void main() {
  vec2 p = vUv - uPointer;
  p.x *= uAspect;

  float d = 0.0;
  if (uShape < 0.5) {
    // Circle lens
    d = sdCircle(p, uRadius);
  } else if (uShape < 1.5) {
    // Square lens
    d = sdBox(p, vec2(uRadius * 0.85));
  } else if (uShape < 2.5) {
    // Blob lens
    float angle = atan(p.y, p.x);
    float wobble = sin(angle * 4.0 + uTime * 2.0) * 0.03 + cos(angle * 3.0 - uTime) * 0.02;
    d = sdCircle(p, uRadius + wobble);
  } else {
    // Rippling portal lens
    float r = length(p);
    float ripple = sin(r * 30.0 - uTime * 4.0) * 0.02;
    d = r - uRadius + ripple;
  }

  // Smooth lens mask
  float mask = 1.0 - smoothstep(-0.02, 0.02, d);
  mask *= uActive;

  // Glass refraction normal / offset
  vec2 normal = normalize(p + vec2(0.0001));
  float falloff = clamp(1.0 - (length(p) / (uRadius + 0.001)), 0.0, 1.0);
  vec2 refractOffset = normal * (falloff * falloff) * uStrength;

  // Base background (Layer A)
  vec4 colA = texture2D(uTexA, vUv);

  // Refracted foreground with chromatic aberration (Layer B)
  vec2 uvR = vUv - refractOffset * (1.0 + uDispersion);
  vec2 uvG = vUv - refractOffset;
  vec2 uvB = vUv - refractOffset * (1.0 - uDispersion);

  float r = texture2D(uTexB, uvR).r;
  float g = texture2D(uTexB, uvG).g;
  float b = texture2D(uTexB, uvB).b;
  vec4 colB = vec4(r, g, b, 1.0);

  // Glass edge specular rim highlight
  float rim = smoothstep(0.04, 0.0, abs(d)) * mask;
  vec3 rimColor = vec3(0.4, 0.8, 1.0) * rim * 0.7;

  // Lens internal shadow / fresnel edge
  float edgeDarken = smoothstep(-0.06, 0.0, d) * mask * 0.3;

  vec4 finalColor = mix(colA, colB, mask);
  finalColor.rgb = mix(finalColor.rgb, finalColor.rgb * (1.0 - edgeDarken), mask);
  finalColor.rgb += rimColor;

  gl_FragColor = finalColor;
}
`;

export default function GlassReveal({
  srcA = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop', // retro blueprint
  srcB = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop', // vibrant 3D glass render
  lensShape = 'circle', // 'circle' | 'square' | 'blob' | 'portal'
  radius = 0.22,
  strength = 0.08,
  dispersion = 0.03,
  className = '',
  style = {},
  children
}) {
  const containerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [pointer, setPointer] = useState([0.5, 0.5]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer;
    try {
      renderer = new Renderer({
        alpha: true,
        dpr: Math.min(window.devicePixelRatio || 1, 2)
      });
    } catch (e) {
      console.warn('WebGL initialization failed, falling back to CSS.', e);
      return;
    }

    const gl = renderer.gl;
    const canvas = gl.canvas;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    container.appendChild(canvas);

    const scene = new Transform();
    const texA = new Texture(gl, { generateMipmaps: false });
    const texB = new Texture(gl, { generateMipmaps: false });

    const loadTex = (src, target) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { target.image = img; };
      img.src = src;
    };

    loadTex(srcA, texA);
    loadTex(srcB, texB);

    const shapeId = lensShape === 'square' ? 1.0 : (lensShape === 'blob' ? 2.0 : (lensShape === 'portal' ? 3.0 : 0.0));

    const program = new Program(gl, {
      vertex: VERTEX_SHADER,
      fragment: FRAGMENT_SHADER,
      uniforms: {
        uTexA: { value: texA },
        uTexB: { value: texB },
        uPointer: { value: [0.5, 0.5] },
        uRadius: { value: radius },
        uStrength: { value: strength },
        uAspect: { value: 1.0 },
        uShape: { value: shapeId },
        uTime: { value: 0 },
        uDispersion: { value: dispersion },
        uActive: { value: 0.0 }
      },
      transparent: true
    });

    const geometry = new Triangle(gl);
    const mesh = new Mesh(gl, { geometry, program });
    mesh.setParent(scene);

    const resize = () => {
      const w = container.clientWidth || 400;
      const h = container.clientHeight || 300;
      renderer.setSize(w, h);
      program.uniforms.uAspect.value = w / h;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    let targetActive = 0;
    let currentActive = 0;
    let targetX = 0.5, targetY = 0.5;
    let currentX = 0.5, currentY = 0.5;
    let animId = 0;
    let time = 0;

    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      targetX = (e.clientX - rect.left) / rect.width;
      targetY = 1.0 - (e.clientY - rect.top) / rect.height; // WebGL UV is inverted Y
      targetActive = 1.0;
    };

    const handlePointerEnter = () => {
      targetActive = 1.0;
      setIsHovered(true);
    };

    const handlePointerLeave = () => {
      targetActive = 0.0;
      setIsHovered(false);
    };

    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerenter', handlePointerEnter);
    container.addEventListener('pointerleave', handlePointerLeave);

    const render = () => {
      time += 0.02;
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      currentActive += (targetActive - currentActive) * 0.1;

      program.uniforms.uTime.value = time;
      program.uniforms.uPointer.value = [currentX, currentY];
      program.uniforms.uActive.value = currentActive;

      renderer.render({ scene });
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerenter', handlePointerEnter);
      container.removeEventListener('pointerleave', handlePointerLeave);
      if (canvas.parentNode === container) {
        container.removeChild(canvas);
      }
    };
  }, [srcA, srcB, lensShape, radius, strength, dispersion]);

  return (
    <div
      ref={containerRef}
      className={`glass-reveal-container ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        cursor: 'crosshair',
        borderRadius: 'var(--radius-lg)',
        ...style
      }}
    >
      {/* Fallback image */}
      <img 
        src={srcA} 
        alt="Glass Reveal Base" 
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0 }}
      />
      {children}
    </div>
  );
}
