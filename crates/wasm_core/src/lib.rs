use wasm_bindgen::prelude::*;

const F2: f32 = 0.366_025_42; // (sqrt(3.0) - 1.0) / 2.0
const G2: f32 = 0.211_324_87; // (3.0 - sqrt(3.0)) / 6.0

#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[wasm_bindgen]
pub struct NoiseField {
    width: usize,
    height: usize,
    pixels: Vec<u8>,
    perm: [u8; 512],
}

#[wasm_bindgen]
impl NoiseField {
    #[wasm_bindgen(constructor)]
    pub fn new(seed: u32) -> NoiseField {
        NoiseField {
            width: 0,
            height: 0,
            pixels: Vec::new(),
            perm: build_perm_table(seed),
        }
    }

    pub fn resize(&mut self, width: usize, height: usize) {
        self.width = width.max(1);
        self.height = height.max(1);
        self.pixels.resize(self.width * self.height * 4, 0);
    }

    pub fn buffer_ptr(&self) -> *const u8 {
        self.pixels.as_ptr()
    }

    pub fn buffer_len(&self) -> usize {
        self.pixels.len()
    }

    pub fn render_frame(&mut self, time: f32, spatial_scale: f32, time_scale: f32) {
        let z = time * time_scale;
        let scale = spatial_scale.max(0.000_1);
        let mut i = 0;

        for y in 0..self.height {
            let yf = y as f32 * scale;
            for x in 0..self.width {
                let xf = x as f32 * scale;
                let v = fbm_simplex_2d(&self.perm, xf, yf, z);
                let n = ((v + 1.0) * 0.5).clamp(0.0, 1.0);

                let r = (8.0 + 92.0 * n) as u8;
                let g = (14.0 + 78.0 * n) as u8;
                let b = (28.0 + 190.0 * n) as u8;

                self.pixels[i] = r;
                self.pixels[i + 1] = g;
                self.pixels[i + 2] = b;
                self.pixels[i + 3] = 255;
                i += 4;
            }
        }
    }
}

fn build_perm_table(seed: u32) -> [u8; 512] {
    let mut base = [0u8; 256];
    for (i, v) in base.iter_mut().enumerate() {
        *v = i as u8;
    }

    let mut state = seed.wrapping_add(0x9E37_79B9);
    for i in (1..256).rev() {
        state = state
            .wrapping_mul(1_664_525)
            .wrapping_add(1_013_904_223);
        let j = (state as usize) % (i + 1);
        base.swap(i, j);
    }

    let mut perm = [0u8; 512];
    for i in 0..512 {
        perm[i] = base[i & 255];
    }
    perm
}

#[inline]
fn dot(gi: u8, x: f32, y: f32) -> f32 {
    match gi & 7 {
        0 => x + y,
        1 => -x + y,
        2 => x - y,
        3 => -x - y,
        4 => x,
        5 => -x,
        6 => y,
        _ => -y,
    }
}

#[inline]
fn simplex_2d(perm: &[u8; 512], xin: f32, yin: f32) -> f32 {
    let s = (xin + yin) * F2;
    let i = (xin + s).floor();
    let j = (yin + s).floor();
    let t = (i + j) * G2;

    let x0 = xin - (i - t);
    let y0 = yin - (j - t);

    let (i1, j1) = if x0 > y0 { (1usize, 0usize) } else { (0usize, 1usize) };

    let x1 = x0 - i1 as f32 + G2;
    let y1 = y0 - j1 as f32 + G2;
    let x2 = x0 - 1.0 + 2.0 * G2;
    let y2 = y0 - 1.0 + 2.0 * G2;

    let ii = (i as i32 & 255) as usize;
    let jj = (j as i32 & 255) as usize;

    let gi0 = perm[ii + perm[jj] as usize] & 7;
    let gi1 = perm[ii + i1 + perm[jj + j1] as usize] & 7;
    let gi2 = perm[ii + 1 + perm[jj + 1] as usize] & 7;

    let n0 = contrib(gi0, x0, y0);
    let n1 = contrib(gi1, x1, y1);
    let n2 = contrib(gi2, x2, y2);

    70.0 * (n0 + n1 + n2)
}

#[inline]
fn contrib(gi: u8, x: f32, y: f32) -> f32 {
    let t = 0.5 - x * x - y * y;
    if t <= 0.0 {
        0.0
    } else {
        let t2 = t * t;
        t2 * t2 * dot(gi, x, y)
    }
}

#[inline]
fn fbm_simplex_2d(perm: &[u8; 512], x: f32, y: f32, z: f32) -> f32 {
    let mut amp = 0.5;
    let mut freq = 1.0;
    let mut sum = 0.0;
    let mut norm = 0.0;

    for octave in 0..4 {
        let ox = z * (0.13 + octave as f32 * 0.07);
        let oy = z * (0.17 + octave as f32 * 0.05);
        sum += simplex_2d(perm, x * freq + ox, y * freq + oy) * amp;
        norm += amp;
        amp *= 0.5;
        freq *= 2.0;
    }

    (sum / norm).clamp(-1.0, 1.0)
}

#[cfg(test)]
mod tests {
    use super::{add, NoiseField};

    #[test]
    fn adds_numbers() {
        assert_eq!(add(2, 3), 5);
    }

    #[test]
    fn renders_noise_bytes() {
        let mut noise = NoiseField::new(42);
        noise.resize(32, 16);
        noise.render_frame(0.5, 0.05, 0.3);
        assert_eq!(noise.buffer_len(), 32 * 16 * 4);
    }
}
