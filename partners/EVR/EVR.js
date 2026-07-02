const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyD5oir2beAnURC3hy56VCA4vIaJXuu6KoGlNmF03cyXEzqSwbAzqZOH9yiKdYGlEYQ/exec";

    window.addEventListener('load', () => {
      const img = document.getElementById('hero-img');
      if (img) img.classList.add('loaded');
      renderGrid('all');
    });

    document.getElementById('hamburger').addEventListener('click', () => {
      document.getElementById('mobile-menu').classList.toggle('open');
    });
    document.querySelectorAll('#mobile-menu a').forEach(a => {
      a.addEventListener('click', () => document.getElementById('mobile-menu').classList.remove('open'));
    });

    // ── Product data ─────────────────────────────────────────────
    // colours: array of {label, hex} — hex is display colour, label is the name
    // sizes: array of strings
    const PRODUCTS = [

      // ── TECH ─────────────────────────────────────────────────────────
      { sku:'913',
        name:'EVR TECH Aero Cycling Bottle',
        range:'tech', cat:'Bottle', gender:null,
        priceSGD: 'S$24',
        sizes:['610ml'],
        colours:[
          {label:'Black Gold',     hex:'#1a1a1a',  varImg:1},
          {label:'White Gold',     hex:'#f5f5f5',  varImg:7},
          {label:'Translucent Grey', hex:'#888888',varImg:6},
          {label:'Translucent Orange', hex:'#f26522',varImg:2},
          {label:'Off-White',      hex:'#e8e4d9',  varImg:1},
          {label:'Translucent Black', hex:'#2d2d2d',varImg:5},
          {label:'Translucent White', hex:'#eeeeee',varImg:4},
          {label:'Translucent Blue',  hex:'#7b8fd4',varImg:3},
        ]},

      { sku:'KXH2608',
        name:'EVR TECH Gold Series Seamless Bib Shorts',
        range:'tech', cat:'Bib Shorts', gender:'M',
        priceSGD: 'S$134',
        sizes:['XS','S','M','L','XL','2XL','3XL','4XL','5XL'],
        colours:[
          {label:'White Gold', hex:'#f5f5f5', varImg:1},
          {label:'Black Gold', hex:'#1a1a1a', varImg:2},
        ]},

      { sku:'KXH2626',
        name:'EVR TECH Gold Series Long Sleeve Jersey',
        range:'tech', cat:'Jersey', gender:'F',
        priceSGD: 'S$95',
        sizes:['XS','S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Silver',  hex:'#b0bec5', varImg:1},
          {label:'Yellow',  hex:'#afb42b', varImg:2},
          {label:'White',   hex:'#f0f0f0', varImg:3},
          {label:'Black',   hex:'#1a1a1a', varImg:4},
        ]},

      { sku:'902X6',
        name:'EVR TECH Performance Cycling Socks',
        range:'tech', cat:'Socks', gender:null,
        priceSGD: 'S$13',
        sizes:['One Size'],
        colours:[
          {label:'Army Olive',  hex:'#827717', varImg:1},
          {label:'Mint Green',  hex:'#a5d6a7', varImg:2},
          {label:'Light Blue',  hex:'#90caf9', varImg:3},
          {label:'Maroon',      hex:'#880e4f', varImg:4},
          {label:'Grey',        hex:'#9e9e9e', varImg:5},
          {label:'Light Pink',  hex:'#f8bbd9', varImg:6},
          {label:'Orange',      hex:'#f26522', varImg:7},
          {label:'Dark Blue',   hex:'#1a237e', varImg:8},
          {label:'White',       hex:'#f0f0f0', varImg:9},
          {label:'Pink',        hex:'#f06292', varImg:10},
          {label:'Black',       hex:'#1a1a1a', varImg:11},
          {label:'Yellow',      hex:'#f9a825', varImg:12},
          {label:'Neon',        hex:'#cddc39', varImg:13},
        ]},

      // ── EXPLORE ───────────────────────────────────────────────────────
      { sku:'912',
        name:'EVR EXPLORE Cycling Water Bottle',
        range:'explore', cat:'Bottle', gender:null,
        priceSGD: 'Price TBA',
        sizes:['550ml','650ml'],
        sizeImgOffset: {550:0, 650:8},
        colours:[
          {label:'Green Blue',   hex:'#26a69a', varImg:1},
          {label:'Pink Purple',  hex:'#ce93d8', varImg:2},
          {label:'Pink',         hex:'#f48fb1', varImg:3},
          {label:'Purple',       hex:'#9575cd', varImg:4},
          {label:'Orange',       hex:'#ffa726', varImg:5},
          {label:'Pink Blue',    hex:'#f06292', varImg:6},
          {label:'Blue',         hex:'#42a5f5', varImg:7},
          {label:'Black White',  hex:'#1a1a1a', varImg:8},
        ]},

      { sku:'902T',
        name:'EVR EXPLORE Colour Tint Cycling Bottle',
        range:'explore', cat:'Bottle', gender:null,
        priceSGD: 'S$12',
        sizes:['620ml'],
        colours:[
          {label:'Pink Clear',  hex:'#f48fb1', varImg:1},
          {label:'Blue',        hex:'#1565c0', varImg:2},
          {label:'Black',       hex:'#1a1a1a', varImg:3},
          {label:'Green',       hex:'#2e7d32', varImg:4},
        ]},

      { sku:'902B',
        name:'EVR EXPLORE Cycling Bottle',
        range:'explore', cat:'Bottle', gender:null,
        priceSGD: 'S$12',
        sizes:['620ml'],
        colours:[
          {label:'Translucent Grey', hex:'#9e9e9e', varImg:5},
          {label:'Clear',            hex:'#e0e0e0', varImg:6},
          {label:'White',            hex:'#f5f5f5', varImg:7},
          {label:'Black',            hex:'#212121', varImg:8},
        ]},

      { sku:'905B',
        name:'EVR EXPLORE Insulated Cycling Bottle',
        range:'explore', cat:'Bottle', gender:null,
        priceSGD: 'S$18',
        sizes:['620ml'],
        colours:[
          {label:'White Black',  hex:'#e8e8e8', varImg:1},
          {label:'Black Purple', hex:'#311b92', varImg:2},
          {label:'Black',        hex:'#1a1a1a', varImg:3},
          {label:'Blue Black',   hex:'#90caf9', varImg:4},
          {label:'Green',        hex:'#cddc39', varImg:5},
        ]},

      { sku:'KX1154',
        name:'EVR EXPLORE Street Art Cycling Jersey',
        range:'explore', cat:'Jersey', gender:'M',
        priceSGD: 'S$72',
        sizes:['S','M','L','XL','2XL','3XL','4XL','5XL'],
        colours:[
          {label:'Grey',   hex:'#9e9e9e', varImg:1},
          {label:'Black',  hex:'#1a1a1a', varImg:2},
          {label:'Pink',   hex:'#ce93d8', varImg:3},
          {label:'White',  hex:'#f0f0f0', varImg:4},
          {label:'Green',  hex:'#004d40', varImg:5},
        ]},

      { sku:'905S',
        name:'EVR EXPLORE Aero Cycling Socks',
        range:'explore', cat:'Socks', gender:null,
        priceSGD: 'S$29',
        sizes:['One Size'],
        colours:[
          {label:'White Neon',  hex:'#cddc39', varImg:1},
          {label:'White Pink',  hex:'#f48fb1', varImg:2},
          {label:'Black Pink',  hex:'#1a1a1a', varImg:3},
          {label:'White Black', hex:'#e0e0e0', varImg:4},
          {label:'Black White', hex:'#424242', varImg:5},
        ]},

      { sku:'906',
        name:'EVR EXPLORE Reflective Cycling Socks',
        range:'explore', cat:'Socks', gender:null,
        priceSGD: 'S$13',
        sizes:['One Size'],
        colours:[
          {label:'White Orange', hex:'#f26522', varImg:1},
          {label:'White Pink',   hex:'#e91e8c', varImg:2},
          {label:'Black',        hex:'#1a1a1a', varImg:3},
        ]},

      { sku:'901',
        name:'EVR EXPLORE Cycling Socks',
        range:'explore', cat:'Socks', gender:null,
        priceSGD: 'S$13',
        priceSGD2: 'S$15',
        sizes:['One Size'],
        colours:[
          {label:'Black',       hex:'#1a1a1a', varImg:1, price:'S$13'},
          {label:'White',       hex:'#f0f0f0', varImg:2, price:'S$13'},
          {label:'Green',       hex:'#2e7d32', varImg:3, price:'S$13'},
          {label:'Blue',        hex:'#00838f', varImg:4, price:'S$13'},
          {label:'Yellow',      hex:'#f9a825', varImg:5, price:'S$13'},
          {label:'Black White', hex:'#37474f', varImg:6, price:'S$15'},
          {label:'White Black', hex:'#eeeeee', varImg:7, price:'S$15'},
        ]},

      { sku:'LX002',
        name:'EVR EXPLORE Cycling Gloves',
        range:'explore', cat:'Gloves', gender:null,
        priceSGD: 'S$24',
        sizes:['S','M','L','XL'],
        colours:[
          {label:'Blue',  hex:'#1565c0', varImg:1},
          {label:'Grey',  hex:'#9e9e9e', varImg:2},
          {label:'White', hex:'#f0f0f0', varImg:3},
          {label:'Green', hex:'#8bc34a', varImg:4},
          {label:'Navy',  hex:'#1a237e', varImg:5},
        ]},

      { sku:'XT002',
        name:'EVR EXPLORE Spring Autumn Shoe Cover',
        range:'explore', cat:'Shoe Cover', gender:null,
        priceSGD: 'S$34',
        sizes:['S (37-39)','M (40-42)','L (43-45)'],
        colours:[
          {label:'White', hex:'#f0f0f0', varImg:1},
          {label:'Black', hex:'#1a1a1a', varImg:2},
        ]},

      { sku:'EV1001',
        name:'EVR EXPLORE UV Protection Face Gaiter',
        range:'explore', cat:'Accessories', gender:null,
        priceSGD: 'S$15',
        sizes:['One Size'],
        colours:[
          {label:'Pink',  hex:'#f48fb1', varImg:1},
          {label:'White', hex:'#f5f5f5', varImg:2},
          {label:'Grey',  hex:'#cfd8dc', varImg:3},
          {label:'Black', hex:'#1a1a1a', varImg:4},
        ]},

      { sku:'EH1001',
        name:'EVR EXPLORE Cycling Cap',
        range:'explore', cat:'Cap', gender:null,
        priceSGD: 'S$17',
        sizes:['One Size'],
        colours:[
          {label:'Pink',   hex:'#f48fb1', varImg:1},
          {label:'Wine',   hex:'#880e4f', varImg:2},
          {label:'Black',  hex:'#1a1a1a', varImg:3},
          {label:'Yellow', hex:'#f9a825', varImg:4},
          {label:'White',  hex:'#ec407a', varImg:5},
        ]},

      // ── DISCOVER ──────────────────────────────────────────────────────
      { sku:'2618',
        name:'EVR DISCOVER Short Sleeve Cycling Jersey',
        range:'discover', cat:'Jersey', gender:'F',
        priceSGD: 'S$67',
        sizes:['XS','S','M','L','XL','2XL'],
        colours:[
          {label:'Purple', hex:'#7b8fd4', varImg:1},
          {label:'Yellow', hex:'#e8d5b0', varImg:2},
          {label:'Pink',   hex:'#f48fb1', varImg:3},
        ]},

      { sku:'2617',
        name:'EVR DISCOVER Short Sleeve Cycling Jersey',
        range:'discover', cat:'Jersey', gender:'M',
        priceSGD: 'S$67',
        sizes:['S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Blue',   hex:'#5c6bc0', varImg:1},
          {label:'Grey',   hex:'#8d6e63', varImg:3},
          {label:'Purple', hex:'#4527a0', varImg:4},
        ]},

      { sku:'2510',
        name:'EVR DISCOVER Short Sleeve Cycling Jersey',
        range:'discover', cat:'Jersey', gender:'M',
        priceSGD: 'S$72',
        sizes:['S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Light Blue',    hex:'#26a69a', varImg:1},
          {label:'White Orange',  hex:'#9e9e9e', varImg:2},
          {label:'Purple',        hex:'#7b1fa2', varImg:3},
          {label:'Black',         hex:'#eeeeee', varImg:4},
        ]},

      { sku:'2511',
        name:'EVR DISCOVER Short Sleeve Cycling Jersey',
        range:'discover', cat:'Jersey', gender:'F',
        priceSGD: 'S$72',
        sizes:['XS','S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Pink',   hex:'#f48fb1', varImg:1},
          {label:'Yellow', hex:'#fff8e1', varImg:2},
          {label:'Purple', hex:'#ce93d8', varImg:3},
          {label:'Blue',   hex:'#b3e5fc', varImg:4},
        ]},

      { sku:'2501',
        name:'EVR DISCOVER Cycling Bib Shorts',
        range:'discover', cat:'Bib Shorts', gender:'M',
        priceSGD: 'S$65',
        sizes:['S','M','L','XL','2XL','3XL','4XL'],
        colours:[
          {label:'Blue',  hex:'#1565c0', varImg:1},
          {label:'Grey',  hex:'#424242', varImg:2},
          {label:'White', hex:'#bdbdbd', varImg:3},
          {label:'Black', hex:'#1a1a1a', varImg:4},
        ]},

      { sku:'2406',
        name:'EVR DISCOVER Breeze Cycling Bib Shorts',
        range:'discover', cat:'Bib Shorts', gender:'M',
        priceSGD: 'S$84',
        sizes:['S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Orange',     hex:'#f26522', varImg:1},
          {label:'Grey',       hex:'#cfd8dc', varImg:2},
          {label:'Blue',       hex:'#1a237e', varImg:3},
          {label:'Black',      hex:'#1a1a1a', varImg:4},
          {label:'Charcoal',   hex:'#546e7a', varImg:5},
        ]},

      { sku:'2405',
        name:'EVR DISCOVER Breeze Cycling Shorts',
        range:'discover', cat:'Bib Shorts', gender:'M',
        priceSGD: 'S$72',
        sizes:['S','M','L','XL','2XL','3XL','4XL'],
        colours:[
          {label:'Dark Blue',  hex:'#4527a0', varImg:1},
          {label:'Blue',       hex:'#1565c0', varImg:2},
          {label:'Grey',       hex:'#37474f', varImg:3},
          {label:'Light Blue', hex:'#eceff1', varImg:4},
          {label:'Black',      hex:'#1a1a1a', varImg:5},
        ]},

      { sku:'8102',
        name:'EVR DISCOVER Breeze Cycling Bib Pants',
        range:'discover', cat:'Bib Tights', gender:'F',
        priceSGD: 'S$95',
        sizes:['XS','S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Mauve',      hex:'#8d6e63', varImg:1},
          {label:'Steel Blue', hex:'#607d8b', varImg:2},
          {label:'Mid Grey',   hex:'#757575', varImg:3},
          {label:'Black',      hex:'#1a1a1a', varImg:4},
        ]},

      { sku:'2521',
        name:'EVR DISCOVER Sweat-Wicking Long Sleeve Base Layer',
        range:'discover', cat:'Base Layer', gender:'M',
        priceSGD: 'S$24',
        sizes:['S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'White', hex:'#f0f0f0', varImg:1},
        ]},

      // ── ULTRA ─────────────────────────────────────────────────────────
      { sku:'LX007',
        name:'EVR ULTRA Performance Cycling Gloves',
        range:'ultra', cat:'Gloves', gender:null,
        priceSGD: 'S$60',
        sizes:['S','M','L','XL'],
        colours:[
          {label:'White', hex:'#f0f0f0', varImg:1},
          {label:'Black', hex:'#1a1a1a', varImg:2},
        ]},

      { sku:'LX012',
        name:'EVR ULTRA Premium Cycling Gloves',
        range:'ultra', cat:'Gloves', gender:null,
        priceSGD: 'S$100',
        sizes:['S','M','L','XL'],
        colours:[
          {label:'White', hex:'#f0f0f0', varImg:1},
          {label:'Black', hex:'#1a1a1a', varImg:2},
        ]},

      // ── ASCENT ────────────────────────────────────────────────────────
      { sku:'LX008',
        name:'EVR ASCENT Performance Cycling Gloves',
        range:'ascent', cat:'Gloves', gender:null,
        priceSGD: 'S$24',
        sizes:['S','M','L','XL'],
        colours:[
          {label:'White', hex:'#f0f0f0', varImg:1},
          {label:'Green', hex:'#558b2f', varImg:2},
          {label:'Navy',  hex:'#1a237e', varImg:3},
          {label:'Grey',  hex:'#37474f', varImg:4},
        ]},

      // ── CITY / DISCOVER / EXPLORE / ASCENT / TECH / PRO / JOY (no images yet)
      { sku:'KX2523', name:'EVR CITY Lifestyle Tee', range:'city', cat:'Lifestyle T-Shirt', gender:'M', priceSGD:'Price TBA', sizes:['S','M','L','XL','2XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null},{label:'Grey',hex:'#9e9e9e',varImg:null}] },
      { sku:'KX2524', name:'EVR CITY Lifestyle Tee', range:'city', cat:'Lifestyle T-Shirt', gender:'F', priceSGD:'Price TBA', sizes:['XS','S','M','L','XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null},{label:'Grey',hex:'#9e9e9e',varImg:null}] },
      { sku:'DZ12', name:'EVR CITY Base Jersey', range:'city', cat:'Jersey', gender:null, priceSGD:'Price TBA', sizes:['XS','S','M','L','XL','2XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null}] },
      { sku:'KX2519', name:'EVR DISCOVER Sweat-Wicking Base Layer', range:'discover', cat:'Base Layer', gender:'M', priceSGD:'Price TBA', sizes:['XS','S','M','L','XL','2XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null}] },
      { sku:'KX2520', name:'EVR DISCOVER Sweat-Wicking Base Layer', range:'discover', cat:'Base Layer', gender:'F', priceSGD:'Price TBA', sizes:['XS','S','M','L','XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null}] },
      { sku:'KX2154', name:'EVR EXPLORE Street Art Cycling Jersey', range:'explore', cat:'Jersey', gender:'F', priceSGD:'Price TBA', sizes:['XS','S','M','L','XL'], colours:[{label:'Grey',hex:'#9e9e9e',varImg:null},{label:'Navy',hex:'#1a237e',varImg:null},{label:'Pink',hex:'#ce93d8',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null},{label:'Teal',hex:'#004d40',varImg:null}] },
      { sku:'KX3154', name:'EVR EXPLORE Street Art Long Sleeve Jersey', range:'explore', cat:'Jersey', gender:'M', priceSGD:'Price TBA', sizes:['S','M','L','XL','2XL'], colours:[{label:'Grey',hex:'#9e9e9e',varImg:null},{label:'Navy',hex:'#1a237e',varImg:null},{label:'Pink',hex:'#ce93d8',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null},{label:'Teal',hex:'#004d40',varImg:null}] },
      { sku:'KX2512', name:'EVR EXPLORE Woven Wild Jersey', range:'explore', cat:'Jersey', gender:'M', priceSGD:'Price TBA', sizes:['S','M','L','XL','2XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null},{label:'Blue',hex:'#1565c0',varImg:null},{label:'Red',hex:'#e53935',varImg:null}] },
      { sku:'KX2513', name:'EVR EXPLORE Woven Wild Jersey', range:'explore', cat:'Jersey', gender:'F', priceSGD:'Price TBA', sizes:['XS','S','M','L','XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null},{label:'Blue',hex:'#1565c0',varImg:null},{label:'Red',hex:'#e53935',varImg:null}] },
      { sku:'KX2517', name:'EVR EXPLORE Time Jersey', range:'explore', cat:'Jersey', gender:'M', priceSGD:'Price TBA', sizes:['S','M','L','XL','2XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null},{label:'Blue',hex:'#1565c0',varImg:null}] },
      { sku:'KX2516', name:'EVR EXPLORE Time Jersey', range:'explore', cat:'Jersey', gender:'F', priceSGD:'Price TBA', sizes:['XS','S','M','L','XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null},{label:'Blue',hex:'#1565c0',varImg:null}] },
      { sku:'KX2430', name:'EVR ASCENT Mystic Jersey', range:'ascent', cat:'Jersey', gender:'M', priceSGD:'Price TBA', sizes:['S','M','L','XL','2XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null},{label:'Blue',hex:'#1565c0',varImg:null},{label:'Red',hex:'#e53935',varImg:null}] },
      { sku:'KX2431', name:'EVR ASCENT Mystic Jersey', range:'ascent', cat:'Jersey', gender:'F', priceSGD:'Price TBA', sizes:['XS','S','M','L','XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null},{label:'Blue',hex:'#1565c0',varImg:null},{label:'Red',hex:'#e53935',varImg:null}] },
      { sku:'KX2535', name:'EVR ASCENT Breakthrough Jersey', range:'ascent', cat:'Jersey', gender:'M', priceSGD:'Price TBA', sizes:['S','M','L','XL','2XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null},{label:'Blue',hex:'#1565c0',varImg:null},{label:'Orange',hex:'#f26522',varImg:null}] },
      { sku:'KX2537', name:'EVR ASCENT Breakthrough Jersey', range:'ascent', cat:'Jersey', gender:'F', priceSGD:'Price TBA', sizes:['XS','S','M','L','XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null},{label:'Blue',hex:'#1565c0',varImg:null},{label:'Orange',hex:'#f26522',varImg:null}] },
      { sku:'KX2546', name:'EVR ASCENT Breakthrough Long Sleeve Jersey', range:'ascent', cat:'Jersey', gender:'M', priceSGD:'Price TBA', sizes:['S','M','L','XL','2XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null},{label:'Blue',hex:'#1565c0',varImg:null}] },
      { sku:'KX2547', name:'EVR ASCENT Breakthrough Long Sleeve Jersey', range:'ascent', cat:'Jersey', gender:'F', priceSGD:'Price TBA', sizes:['XS','S','M','L','XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null},{label:'Blue',hex:'#1565c0',varImg:null}] },
      { sku:'KX9109', name:'EVR ASCENT Windbreaker Bib Shorts', range:'ascent', cat:'Bib Shorts', gender:'M', priceSGD:'Price TBA', sizes:['S','M','L','XL','2XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null},{label:'Blue',hex:'#1565c0',varImg:null}] },
      { sku:'KX9403', name:'EVR ASCENT Breakthrough Bib Shorts', range:'ascent', cat:'Bib Shorts', gender:'M', priceSGD:'Price TBA', sizes:['S','M','L','XL','2XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null},{label:'Blue',hex:'#1565c0',varImg:null}] },
      { sku:'KX9503', name:'EVR ASCENT Breakthrough Bib Shorts', range:'ascent', cat:'Bib Shorts', gender:'F', priceSGD:'Price TBA', sizes:['XS','S','M','L','XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null},{label:'Blue',hex:'#1565c0',varImg:null}] },
      { sku:'KX2556', name:'EVR ASCENT Liu Ying Speedsuit', range:'ascent', cat:'Speedsuit', gender:null, priceSGD:'Price TBA', sizes:['XS','S','M','L','XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null}] },
      { sku:'KX2543', name:'EVR ASCENT Warmth Wind Jacket', range:'ascent', cat:'Jacket', gender:'M', priceSGD:'Price TBA', sizes:['S','M','L','XL','2XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null},{label:'Blue',hex:'#1565c0',varImg:null}] },
      { sku:'KX2544', name:'EVR ASCENT Warmth Wind Jacket', range:'ascent', cat:'Jacket', gender:'F', priceSGD:'Price TBA', sizes:['XS','S','M','L','XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null},{label:'Blue',hex:'#1565c0',varImg:null}] },
      { sku:'KX2551', name:'EVR ASCENT Speed Training Pants', range:'ascent', cat:'Training Pants', gender:'M', priceSGD:'Price TBA', sizes:['S','M','L','XL','2XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'Grey',hex:'#9e9e9e',varImg:null}] },
      { sku:'KX2552', name:'EVR ASCENT Speed Training Pants', range:'ascent', cat:'Training Pants', gender:'F', priceSGD:'Price TBA', sizes:['XS','S','M','L','XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'Grey',hex:'#9e9e9e',varImg:null}] },
      { sku:'KX2407', name:'EVR TECH Race Suit', range:'tech', cat:'Speedsuit', gender:null, priceSGD:'Price TBA', sizes:['XS','S','M','L','XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null}] },
      { sku:'DZ07', name:'EVR TECH Light Wind Vest', range:'tech', cat:'Wind Vest', gender:null, priceSGD:'Price TBA', sizes:['XS','S','M','L','XL','2XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null}] },
      { sku:'KX2557', name:'EVR TECH Wind Motion Jacket', range:'tech', cat:'Jacket', gender:null, priceSGD:'Price TBA', sizes:['XS','S','M','L','XL','2XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null},{label:'Blue',hex:'#1565c0',varImg:null}] },
      { sku:'KX2430F', name:'EVR PRO Mystic Pro Jersey', range:'pro', cat:'Jersey', gender:'M', priceSGD:'Price TBA', sizes:['S','M','L','XL','2XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null},{label:'Blue',hex:'#1565c0',varImg:null}] },
      { sku:'KX9405', name:'EVR PRO Endurance Bib Tights', range:'pro', cat:'Bib Tights', gender:'M', priceSGD:'Price TBA', sizes:['S','M','L','XL','2XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null}] },
      { sku:'KX9505', name:'EVR PRO Endurance Bib Tights', range:'pro', cat:'Bib Tights', gender:'F', priceSGD:'Price TBA', sizes:['XS','S','M','L','XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null}] },
      { sku:'KX2514', name:'EVR JOY Explore Jersey', range:'joy', cat:'Jersey', gender:'M', priceSGD:'Price TBA', sizes:['S','M','L','XL','2XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null},{label:'Blue',hex:'#1565c0',varImg:null},{label:'Red',hex:'#e53935',varImg:null}] },
      { sku:'KX2515', name:'EVR JOY Explore Jersey', range:'joy', cat:'Jersey', gender:'F', priceSGD:'Price TBA', sizes:['XS','S','M','L','XL'], colours:[{label:'Black',hex:'#1a1a1a',varImg:null},{label:'White',hex:'#f0f0f0',varImg:null},{label:'Blue',hex:'#1565c0',varImg:null},{label:'Red',hex:'#e53935',varImg:null}] },
    ];

    const RANGE_META = {
      city:     { label:'CITY',     badgeCls:'badge-city',     dotCls:'range-dot-city'     },
      discover: { label:'DISCOVER', badgeCls:'badge-discover', dotCls:'range-dot-discover' },
      explore:  { label:'EXPLORE',  badgeCls:'badge-explore',  dotCls:'range-dot-explore'  },
      ascent:   { label:'ASCENT',   badgeCls:'badge-ascent',   dotCls:'range-dot-ascent'   },
      tech:     { label:'TECH',     badgeCls:'badge-tech',     dotCls:'range-dot-tech'     },
      pro:      { label:'PRO',      badgeCls:'badge-pro',      dotCls:'range-dot-pro'      },
      ultra:    { label:'ULTRA',    badgeCls:'badge-ultra',    dotCls:'range-dot-ultra'    },
      joy:      { label:'JOY',      badgeCls:'badge-joy',      dotCls:'range-dot-joy'      },
    };

    const CAT_ICON = { 'Jersey':'🧥','Bib Shorts':'🚴','Bib Tights':'🚴','Base Layer':'👕','Bottle':'🚰','Gloves':'🧤','Socks':'🧦','Shoe Cover':'👟','Cap':'🧢','Accessories':'🎽','default':'🚴' };

    // ── Image auto-discovery ─────────────────────────────────────
    // Lists every SKU that has at least one WebP in photos/.
    // Add a SKU here once you've run prepare_images.py for it.
    // imgSrc(sku) returns the path to variation _1 (the card thumbnail).
    const SKUS_WITH_IMAGES = new Set([
      '913', '905B', '2618', 'LX002', '2617', 'XT002', 'LX008',
      '906', '912', 'LX007', 'KX1154', '2501', '905S', 'KXH2608',
      '901', 'KXH2626', '902X6', '902T', '902B', 'LX012', '2406', '8102',
      '2510', '2405', '2511', '2521', 'EV1001', 'EH1001'
    ]);

    function imgSrc(sku, varIdx) {
      const v = varIdx || 1;
      // 902T and 902B share the photos/902_*.webp folder
      if (sku === '902T') return `photos/902_${v}.webp`;
      if (sku === '902B') return `photos/902_${v}.webp`;
      if (!SKUS_WITH_IMAGES.has(sku)) return null;
      return `photos/${sku}_${v}.webp`;
    }

    // Get the display image for a product+colour+size combo
    function getProductImg(p, colourIdx, selectedSize) {
      const c = p.colours[colourIdx || 0];
      if (!c || c.varImg === null) return null;

      // 912: size selector shifts image offset
      if (p.sku === '912') {
        const offset = (selectedSize === '650ml') ? 8 : 0;
        return imgSrc(p.sku, c.varImg + offset);
      }
      return imgSrc(p.sku, c.varImg);
    }

    // ── Render grid ───────────────────────────────────────────────
    let activeRange = 'all';

    // Category display order & labels
    const CAT_ORDER = ['Jersey','Bib Shorts','Bib Tights','Base Layer','Gloves','Socks','Shoe Cover','Cap','Accessories','Bottle'];

    function renderGrid(range) {
      activeRange = range;
      const grid = document.getElementById('shopee-grid');
      const filtered = range === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.range === range);
      document.getElementById('catalogue-count').textContent = filtered.length + ' product' + (filtered.length !== 1 ? 's' : '');

      // Group by category (in defined order)
      const grouped = {};
      CAT_ORDER.forEach(c => { grouped[c] = []; });
      filtered.forEach(p => {
        if (!grouped[p.cat]) grouped[p.cat] = [];
        grouped[p.cat].push(p);
      });

      let html = '';
      let firstGroup = true;
      for (const cat of [...CAT_ORDER, ...Object.keys(grouped).filter(k => !CAT_ORDER.includes(k))]) {
        const items = grouped[cat];
        if (!items || !items.length) continue;

        // Section header
        const rm = range !== 'all' ? RANGE_META[range] : null;
        const badgeCls = rm ? rm.badgeCls : 'badge-explore';
        const dotCls   = rm ? rm.dotCls   : 'range-dot-explore';
        const rangeHtml = rm
          ? `<span class="sg-section-range"><span class="range-dot ${dotCls}"></span>${rm.label}</span>`
          : '';
        html += `<div class="sg-section-header${firstGroup ? ' sg-first' : ''}">
          ${rangeHtml}
          <span class="sg-section-cat">${cat}</span>
          <span class="sg-section-count">${items.length} item${items.length !== 1 ? 's' : ''}</span>
        </div>`;
        firstGroup = false;

        // Cards
        html += items.map(p => {
          const rm2 = RANGE_META[p.range] || { label: p.range.toUpperCase(), badgeCls:'badge-explore', dotCls:'range-dot-explore' };
          const icon = CAT_ICON[p.cat] || CAT_ICON.default;
          const genderTag = p.gender ? `<span class="sc-gender">${p.gender === 'M' ? '♂' : '♀'}</span>` : '';
          const colourCount = p.colours.length > 1 ? p.colours.length + ' colours' : (p.colours.length === 1 ? p.colours[0].label : '');
          const sizeCount = p.sizes.length > 1 ? p.sizes.length + ' sizes' : (p.sizes.length === 1 ? p.sizes[0] : '');
          const varCount = [colourCount, sizeCount].filter(Boolean).join(' · ');
          return `<div class="sc-card" onclick="openDrawer('${p.sku}')">
            ${(() => { const src = getProductImg(p, 0, p.sizes && p.sizes[0]); return src
              ? `<img class="sc-img" src="${src}" alt="${p.name}" loading="lazy" decoding="async">`
              : `<div class="sc-img-ph"><span class="sc-img-ph-icon">${icon}</span></div>`; })()}
            <div class="sc-body">
              <div class="sc-range-row">
                <span class="rs-range-badge ${rm2.badgeCls}"><span class="range-dot ${rm2.dotCls}"></span>${rm2.label}</span>${genderTag}
              </div>
              <div class="sc-name">${p.name}</div>
              <div class="sc-var">${varCount || '—'}</div>
              <div class="sc-price">${p.priceSGD || 'Price TBA'}</div>
            </div>
          </div>`;
        }).join('');
      }
      grid.innerHTML = html;
    }

    // ── Range filter ──────────────────────────────────────────────
    function filterRange(range, btn) {
      document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      renderGrid(range);
    }

    // ── Drawer ────────────────────────────────────────────────────
    let currentProduct = null;
    let selectedColour = null;
    let selectedSize = null;

    function openDrawer(sku) {
      const p = PRODUCTS.find(x => x.sku === sku);
      if (!p) return;
      currentProduct = p;
      selectedColour = p.colours.length ? p.colours[0].label : null;
      selectedSize = p.sizes.length ? p.sizes[0] : null;

      const rm = RANGE_META[p.range] || { label: p.range.toUpperCase(), badgeCls:'badge-explore', dotCls:'range-dot-explore' };
      document.getElementById('pdrawer-badge').className = 'rs-range-badge ' + rm.badgeCls;
      document.getElementById('pdrawer-badge').innerHTML = `<span class="range-dot ${rm.dotCls}"></span>${rm.label}`;
      document.getElementById('pdrawer-cat').textContent = p.cat + (p.gender ? (p.gender === 'M' ? ' — Men' : ' — Women') : '');
      document.getElementById('pdrawer-name').textContent = p.name;
      document.getElementById('pdrawer-cn').textContent = '';
      const drawerImg = document.getElementById('pdrawer-img');
      const drawerPh  = document.getElementById('pdrawer-img-ph');
      const firstImg  = getProductImg(p, 0, p.sizes && p.sizes[0]);
      if (firstImg) {
        drawerImg.src = firstImg;
        drawerImg.alt = p.name;
        drawerImg.style.display = 'block';
        drawerPh.style.display  = 'none';
      } else {
        drawerImg.style.display = 'none';
        drawerPh.style.display  = 'flex';
        document.getElementById('pdrawer-ph-icon').textContent = CAT_ICON[p.cat] || '🚴';
        document.getElementById('pdrawer-ph-sku').textContent  = '';
      }
      // Price — show per-product SGD price
      updateDrawerPrice(p, null);

      // Colours
      const cBlock = document.getElementById('pdrawer-colours-block');
      const swatch = document.getElementById('pdrawer-swatches');
      if (p.colours.length) {
        cBlock.style.display = '';
        swatch.innerHTML = p.colours.map((c, i) => 
          `<button class="pdrawer-swatch${c.label === selectedColour ? ' active' : ''}" 
            style="background:${c.hex}" 
            title="${c.label}"
            onclick="selectColour('${c.label}', ${c.varImg || i+1}, ${i}, this)"></button>`
        ).join('');
        document.getElementById('pdrawer-colour-chosen').textContent = '— ' + selectedColour;
      } else { cBlock.style.display = 'none'; }

      // Sizes
      const szBlock = document.getElementById('pdrawer-sizes-block');
      const szWrap = document.getElementById('pdrawer-sizes');
      if (p.sizes.length) {
        szBlock.style.display = '';
        szWrap.innerHTML = p.sizes.map(s =>
          `<button class="pdrawer-size-btn${s === selectedSize ? ' active' : ''}" onclick="selectSize('${s}', this)">${s}</button>`
        ).join('');
        document.getElementById('pdrawer-size-chosen').textContent = '— ' + selectedSize;
      } else { szBlock.style.display = 'none'; }

      // Show product pane
      document.getElementById('pdrawer-product').style.display = '';
      document.getElementById('pdrawer-order').style.display = 'none';
      document.getElementById('pdrawer-overlay').classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function selectColour(label, varIdx, colourObjIdx, btn) {
      selectedColour = label;
      document.querySelectorAll('.pdrawer-swatch').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('pdrawer-colour-chosen').textContent = '— ' + label;

      // Update price (901 has per-colour pricing)
      updateDrawerPrice(currentProduct, colourObjIdx);

      // Swap image using getProductImg
      const drawerImg = document.getElementById('pdrawer-img');
      const drawerPh  = document.getElementById('pdrawer-img-ph');
      const selectedSize = document.getElementById('pdrawer-size-chosen') ?
        document.getElementById('pdrawer-size-chosen').textContent.replace('— ','') : null;
      const src = getProductImg(currentProduct, colourObjIdx, selectedSize);
      if (src) {
        drawerImg.src = src;
        drawerImg.style.display = 'block';
        drawerPh.style.display  = 'none';
      }
    }

    function updateDrawerPrice(p, colourIdx) {
      const c = colourIdx !== null ? p.colours[colourIdx] : null;
      const price = (c && c.price) ? c.price : (p.priceSGD || 'Price TBA');
      document.getElementById('pdrawer-price').textContent = price;
    }

    function selectSize(size, btn) {
      selectedSize = size;
      document.querySelectorAll('.pdrawer-size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('pdrawer-size-chosen').textContent = '— ' + size;

      // For 912: swap image when size changes
      if (currentProduct && currentProduct.sku === '912') {
        const colourIdx = currentProduct.colours.findIndex(c => c.label === selectedColour);
        if (colourIdx >= 0) {
          const drawerImg = document.getElementById('pdrawer-img');
          const src = getProductImg(currentProduct, colourIdx, size);
          if (src) { drawerImg.src = src; drawerImg.style.display = 'block'; }
        }
      }
    }



    function goToOrder() {
      const p = currentProduct;
      let summary = `<strong>${p.name}</strong> (${p.sku})`;
      if (selectedColour) summary += `<br>Colour: ${selectedColour}`;
      if (selectedSize) summary += `<br>Size: ${selectedSize}`;
      document.getElementById('pdrawer-order-summary').innerHTML = summary;
      document.getElementById('pdrawer-product').style.display = 'none';
      document.getElementById('pdrawer-order').style.display = '';
      document.getElementById('of-success').style.display = 'none';
      document.getElementById('of-error').style.display = 'none';
    }

    function goToProduct() {
      document.getElementById('pdrawer-product').style.display = '';
      document.getElementById('pdrawer-order').style.display = 'none';
    }

    function closeDrawer() {
      document.getElementById('pdrawer-overlay').classList.remove('open');
      document.body.style.overflow = '';
    }

    function handleDrawerOverlay(e) {
      if (e.target === document.getElementById('pdrawer-overlay')) closeDrawer();
    }

    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

    function changeQty(delta) {
      const input = document.getElementById('of-qty');
      input.value = Math.max(1, Math.min(99, parseInt(input.value || 1) + delta));
    }

    async function submitOrder() {
      const name = document.getElementById('of-name').value.trim();
      const email = document.getElementById('of-email').value.trim();
      const qty = document.getElementById('of-qty').value;
      if (!name || !email) { alert('Please fill in your name and email.'); return; }

      const p = currentProduct;
      const btn = document.getElementById('of-submit');
      btn.disabled = true;
      btn.textContent = 'Sending…';

      const payload = {
        type: 'evr-order',
        name, email,
        phone: document.getElementById('of-phone').value.trim(),
        product: `${p.name} (${p.sku})`,
        colour: selectedColour || '—',
        size: selectedSize || '—',
        qty,
        delivery: document.getElementById('of-delivery').value,
        remarks: document.getElementById('of-remarks').value.trim(),
        timestamp: new Date().toISOString()
      };

      try {
        const res = await fetch(SCRIPT_URL, { method:'POST', body: JSON.stringify(payload) });
        const data = await res.json();
        if (data.result === 'success') {
          document.getElementById('of-success').style.display = '';
          btn.style.display = 'none';
        } else { throw new Error(data.error); }
      } catch(err) {
        document.getElementById('of-error').style.display = '';
        btn.disabled = false;
        btn.textContent = 'Try Again';
      }
    }