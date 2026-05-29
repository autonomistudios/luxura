const fs = require('fs');
const path = require('path');
const https = require('https');

const domains = {
  hair: 'avant-garde hair architecture styling',
  barber: 'luxury barber studio styling and fade cut',
  makeup: 'luxury makeup artistry contour',
  nails: 'luxury nail art designer',
  clothing: 'full outfit fashion styling complete look',
  shirt: 'luxury tops and silk blouses',
  pants: 'luxury trousers and wide leg bottoms',
  shorts: 'luxury tailored shorts',
  swimwear: 'luxury swimwear and resort wear',
  hat: 'luxury headwear hats and caps',
  shoes: 'luxury footwear heels and leather boots',
  earrings: 'luxury earrings fine jewelry',
  necklace: 'luxury necklace diamond fine jewelry',
  bracelet: 'luxury bracelet fine jewelry',
  watch: 'luxury watch fine timepiece',
  ring: 'luxury ring fine jewelry stacked',
  belt: 'luxury leather belt waist detail'
};

const publicDir = path.join(process.cwd(), 'public', 'domains');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Downloading 17 pristine rectangle images to local repository...');

let finished = 0;
const total = Object.keys(domains).length;

Object.entries(domains).forEach(([id, desc]) => {
  const prompt = `masterpiece high fashion photography of ${desc}, vogue editorial vanity fair aesthetic, vivid cinematic dramatic neon noir lighting, rich deep dark background, 8k resolution photorealistic`;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=500&model=flux&nologo=true&seed=42`;
  const dest = path.join(publicDir, `${id}.jpg`);
  
  https.get(url, (resp) => {
    if(resp.statusCode !== 200) {
       console.log(`Failed for ${id}: HTTP ${resp.statusCode}`);
       return;
    }
    const file = fs.createWriteStream(dest);
    resp.pipe(file);
    file.on('finish', () => {
      file.close();
      finished++;
      if (finished === total) {
        console.log('ALL IMAGES SYNTHESIZED AND SAVED SUCCESSFULLY!');
      }
    });
  }).on('error', (err) => console.log('Error downloading ' + id + ': ' + err.message));
});
