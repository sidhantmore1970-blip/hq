import React, { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle, Transform } from 'ogl';

const VS = `attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}`;

const FS = `precision highp float;
uniform vec2 uR;
uniform float uT;
uniform vec2 uV;
uniform float uS;
uniform float uTw;
uniform float uDe;
uniform float uMs;
uniform float uB;
uniform int uIt;
uniform vec3 uColorLow;
uniform vec3 uColorHigh;
uniform vec3 uBgColor;

float h(vec2 p){
  return sin(p.x+sin(p.y+uT*uV.x))*sin(p.y*p.x*0.1+uT*uV.y);
}

void main(){
  vec2 frag=gl_FragCoord.xy/uR;
  vec2 p=frag-0.5;
  p.x*=uR.x/uR.y;
  p*=uS;

  float ms=uT*uMs*0.1;
  vec2 d=vec2(sin(ms),cos(ms))*0.1;
  float kt=uTw*0.01;
  float kd=1.0/uDe;

  vec2 e=vec2(0.05,0.);
  vec2 r=vec2(0.);
  for(int i=0;i<16;i++){
    if(i>=uIt)break;
    float a=h(p);
    float b=h(p+e.xy);
    float c=h(p+e.yx);
    vec2 q=vec2(b-a,c-a)*18.;
    p+=vec2(-q.y,q.x)*kt+q*kd+d;
    r=q;
  }

  float t=clamp(length(r)*0.4,0.0,1.0);
  vec3 col=mix(uColorLow,uColorHigh,t)*uB;
  vec3 outColor=mix(uBgColor,col,0.45);

  gl_FragColor=vec4(outColor, 0.4);
}
`;

export default function ShaderFlow({
  className = '',
  flowSpeed = [0.25, 0.15],
  scale = 3.5,
  brightness = 1.0,
  colorLow = [0.03, 0.05, 0.15],  // Deep indigo/navy
  colorHigh = [0.02, 0.72, 0.83], // Cyan #06b6d4
  bgColor = [0.03, 0.04, 0.06]    // Dark canvas
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer;
    try {
      renderer = new Renderer({
        alpha: true,
        dpr: Math.min(window.devicePixelRatio || 1, 1.5)
      });
    } catch (e) {
      return;
    }

    const gl = renderer.gl;
    const canvas = gl.canvas;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    container.appendChild(canvas);

    const scene = new Transform();
    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: VS,
      fragment: FS,
      uniforms: {
        uR: { value: [1, 1] },
        uT: { value: 0 },
        uV: { value: flowSpeed },
        uS: { value: scale },
        uTw: { value: 40.0 },
        uDe: { value: 20.0 },
        uMs: { value: 0.8 },
        uB: { value: brightness },
        uIt: { value: 12 },
        uColorLow: { value: colorLow },
        uColorHigh: { value: colorHigh },
        uBgColor: { value: bgColor }
      },
      transparent: true
    });

    const mesh = new Mesh(gl, { geometry, program });
    mesh.setParent(scene);

    const resize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      renderer.setSize(w, h);
      program.uniforms.uR.value = [w, h];
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    let animId = 0;
    let time = 0;
    const render = () => {
      time += 0.015;
      program.uniforms.uT.value = time;
      renderer.render({ scene });
      animId = requestAnimationFrame(render);
    };
    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      if (canvas.parentNode === container) {
        container.removeChild(canvas);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`shader-flow-wrapper ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0
      }}
    />
  );
}
