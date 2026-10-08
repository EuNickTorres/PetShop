"use client";

import { useEffect, useRef } from "react";
import { LOGIN_MESH_FRAGMENT_SHADER } from "./login-mesh-shader";

const VERTEX_SHADER = `
attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("No se pudo compilar el fondo de acceso:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

export default function LoginMeshBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const showFallback = () => { canvas.style.display = "none"; };

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    if (!gl) {
      showFallback();
      return;
    }

    const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, LOGIN_MESH_FRAGMENT_SHADER);
    if (!vertex || !fragment) {
      showFallback();
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      showFallback();
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      return;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      showFallback();
      console.error("No se pudo iniciar el fondo de acceso:", gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      return;
    }

    const buffer = gl.createBuffer();
    if (!buffer) {
      showFallback();
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.useProgram(program);

    const position = gl.getAttribLocation(program, "a_position");
    if (position < 0) {
      showFallback();
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      return;
    }
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    // The first two neutral colours remain light; the two drifting accents
    // replace the original blues with the site's forest/mint palette.
    gl.uniform3fv(gl.getUniformLocation(program, "u_colors[0]"), new Float32Array([
      1.000, 1.000, 1.000,
      0.961, 0.961, 0.961,
      0.184, 0.447, 0.361,
      0.514, 0.710, 0.616,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
    ]));

    const scene = gl.getUniformLocation(program, "u_scene");
    gl.uniform4f(gl.getUniformLocation(program, "u_shape"), 1.30, 0.56, 0.67, 0.19);
    gl.uniform4f(gl.getUniformLocation(program, "u_surface"), 2.02, 1.17, 0.00, 1.00);
    gl.uniform4f(gl.getUniformLocation(program, "u_finish"), 0.00, 0.15, 0.007, 0.10);
    gl.uniform4f(gl.getUniformLocation(program, "u_transform"), 5069.0, 2.72, 0.15, 0.0);
    gl.uniform4f(gl.getUniformLocation(program, "u_space"), 0.09, 0.15, 0.0, 0.0);
    gl.uniform4f(gl.getUniformLocation(program, "u_cursor"), 0.0, 2.0, 0.65, 0.46);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let elapsed = 0;
    let previousTime: number | null = null;
    let contextLost = false;

    const draw = (timestamp: number) => {
      if (contextLost || document.hidden) return;
      if (previousTime !== null) elapsed += (timestamp - previousTime) / 1000;
      previousTime = timestamp;
      gl.uniform4f(scene, canvas.width, canvas.height, elapsed * -1.8, 4.0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reducedMotion.matches) frame = requestAnimationFrame(draw);
    };

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = null;
    };

    const start = () => {
      if (document.hidden || contextLost || frame) return;
      frame = requestAnimationFrame((timestamp) => {
        frame = 0;
        draw(timestamp);
      });
    };

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width === width && canvas.height === height) return;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      stop();
      start();
    };

    const onVisibilityChange = () => {
      if (document.hidden) stop();
      else start();
    };
    const onMotionChange = () => {
      stop();
      start();
    };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      stop();
      canvas.style.visibility = "hidden";
    };

    const observer = new ResizeObserver(resize);
    observer.observe(parent);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibilityChange);
    reducedMotion.addEventListener("change", onMotionChange);
    canvas.addEventListener("webglcontextlost", onContextLost);
    resize();
    start();

    return () => {
      stop();
      observer.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reducedMotion.removeEventListener("change", onMotionChange);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, []);

  return <canvas ref={canvasRef} className="agenda-login-mesh" aria-hidden="true" />;
}
