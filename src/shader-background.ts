// Fullscreen animated GLSL shader background — vanilla WebGL2, no dependencies.
// Fixed behind all page content; degrades silently to the flat body background
// if WebGL2 isn't available.

const VERTEX_SRC = `#version 300 es
  layout(location = 0) in vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`

// Ported from the "AnoAI" animated-shader-background component (21st.dev,
// @minhxthanh) — same fbm/aurora-loop math, adapted from Three.js
// ShaderMaterial (GLSL ES 1.00, gl_FragColor) to raw WebGL2 (GLSL ES 3.00,
// out vec4). Uniform names iTime/iResolution -> uTime/uResolution to match
// the rest of this module.
const FRAGMENT_SRC = `#version 300 es
  precision highp float;

  uniform vec2 uResolution;
  uniform float uTime;

  out vec4 outColor;

  #define NUM_OCTAVES 3

  float rand(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u * u * (3.0 - 2.0 * u);

    float res = mix(
      mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x),
      mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x), u.y);
    return res * res;
  }

  float fbm(vec2 x) {
    float v = 0.0;
    float a = 0.3;
    vec2 shift = vec2(100);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < NUM_OCTAVES; ++i) {
      v += a * noise(x);
      x = rot * x * 2.0 + shift;
      a *= 0.4;
    }
    return v;
  }

  void main() {
    vec2 shake = vec2(sin(uTime * 1.2) * 0.005, cos(uTime * 2.1) * 0.005);
    vec2 p = ((gl_FragCoord.xy + shake * uResolution.xy) - uResolution.xy * 0.5) / uResolution.y * mat2(6.0, -4.0, 4.0, 6.0);
    vec2 v;
    vec4 o = vec4(0.0);

    float f = 2.0 + fbm(p + vec2(uTime * 5.0, 0.0)) * 0.5;

    for (int ii = 0; ii < 35; ii++) {
      float i = float(ii);
      v = p + cos(i * i + (uTime + p.x * 0.08) * 0.025 + i * vec2(13.0, 11.0)) * 3.5 + vec2(sin(uTime * 3.0 + i) * 0.003, cos(uTime * 3.5 - i) * 0.003);
      float tailNoise = fbm(v + vec2(uTime * 0.5, i)) * 0.3 * (1.0 - (i / 35.0));
      vec4 auroraColors = vec4(
        0.1 + 0.3 * sin(i * 0.2 + uTime * 0.4),
        0.3 + 0.5 * cos(i * 0.3 + uTime * 0.5),
        0.7 + 0.3 * sin(i * 0.4 + uTime * 0.3),
        1.0
      );
      vec4 currentContribution = auroraColors * exp(sin(i * i + uTime * 0.8)) / length(max(v, vec2(v.x * f * 0.015, v.y * 1.5)));
      float thinnessFactor = smoothstep(0.0, 1.0, i / 35.0) * 0.6;
      o += currentContribution * (1.0 + tailNoise * 0.8) * thinnessFactor;
    }

    // Divisor tuned down from the source component's 100.0 -> 25.0: at 100.0
    // the aurora was nearly invisible against this site's dark navy body
    // (measured mean brightness ~6/255, ~3% of pixels even faintly lit).
    // 25.0 keeps the same shape/character but makes it actually perceptible.
    o = tanh(pow(o / 25.0, vec4(1.6)));
    outColor = o * 1.5;
  }
`

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('Failed to create shader')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`Shader compile error: ${info}`)
  }
  return shader
}

export function setupShaderBackground() {
  try {
    const canvas = document.createElement('canvas')
    canvas.id = 'shader-bg'
    canvas.setAttribute(
      'style',
      'position:fixed;inset:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;'
    )
    document.body.insertBefore(canvas, document.body.firstChild)

    const gl = canvas.getContext('webgl2', { antialias: false, powerPreference: 'low-power' })
    if (!gl) return

    const program = gl.createProgram()
    if (!program) return

    gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC))
    gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Program link error: ${gl.getProgramInfoLog(program)}`)
    }
    gl.useProgram(program)

    // Fullscreen triangle — no vertex data needed beyond 3 points covering the viewport.
    const vertices = new Float32Array([-1, -1, 3, -1, -1, 3])
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    const uResolution = gl.getUniformLocation(program, 'uResolution')
    const uTime = gl.getUniformLocation(program, 'uTime')

    const maxDpr = 1.75
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr)
      const width = Math.floor(window.innerWidth * dpr)
      const height = Math.floor(window.innerHeight * dpr)
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
        gl.viewport(0, 0, width, height)
      }
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })

    const start = performance.now()
    const frame = (now: number) => {
      const time = (now - start) / 1000
      gl.uniform2f(uResolution, canvas.width, canvas.height)
      gl.uniform1f(uTime, time)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  } catch (err) {
    // WebGL unsupported or failed to init — flat body background remains visible.
    console.warn('Shader background disabled:', err)
  }
}
