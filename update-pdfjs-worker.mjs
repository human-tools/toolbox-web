import fs from 'fs';

fs.writeFileSync(
  'src/pdfjs.worker.min.json',
  JSON.stringify(
    fs.readFileSync(
      './node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
      'utf-8'
    )
  )
);
