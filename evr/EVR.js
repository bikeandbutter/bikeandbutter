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

      // ── DISCOVER ─────────────────────────────────
      { sku:'KXH2617',
        name:'EVR DISCOVER Zella Jersey',
        range:'discover', cat:'Jersey', gender:'F',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Morocco Red', hex:'#a4302f', varImg:1},
          {label:'Classic Grey', hex:'#888888', varImg:2},
          {label:'Morocco Blue', hex:'#2c3e50', varImg:3},
        ]},

      { sku:'KXH2618',
        name:'EVR DISCOVER Zella Jersey',
        range:'discover', cat:'Jersey', gender:'M',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Morocco Red', hex:'#a4302f', varImg:1},
          {label:'Classic Grey', hex:'#888888', varImg:2},
          {label:'Morocco Blue', hex:'#2c3e50', varImg:3},
        ]},

      // ── EXPLORE ─────────────────────────────────
      { sku:'KXH2519C',
        name:'EVR EXPLORE Eternal Jersey',
        range:'explore', cat:'Jersey', gender:'F',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Water Green', hex:'#3f5d43', varImg:1},
          {label:'Mystic Purple Gold', hex:'#6b4c8a', varImg:2},
          {label:'Green Black', hex:'#1a1a1a', varImg:3},
        ]},

      { sku:'KXH2514C',
        name:'EVR EXPLORE Eternal Jersey',
        range:'explore', cat:'Jersey', gender:'M',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Water Green', hex:'#3f5d43', varImg:1},
          {label:'Vivid Purple', hex:'#6b4c8a', varImg:2},
        ]},

      // ── TECH ─────────────────────────────────
      { sku:'KXH2620',
        name:'EVR TECH Light Element Jersey',
        range:'tech', cat:'Jersey', gender:'M',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Navy', hex:'#1b2a4a', varImg:1},
          {label:'Royal Blue', hex:'#2c3e50', varImg:2},
          {label:'Violet', hex:'#6b4c8a', varImg:3},
        ]},

      { sku:'KXH2619',
        name:'EVR TECH Light Element Jersey',
        range:'tech', cat:'Jersey', gender:'F',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Navy', hex:'#1b2a4a', varImg:1},
          {label:'Royal Blue', hex:'#2c3e50', varImg:2},
          {label:'Violet', hex:'#6b4c8a', varImg:3},
        ]},

      { sku:'KXH2623',
        name:'EVR TECH Gold Storage Jersey',
        range:'tech', cat:'Jersey', gender:'M',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Gold White', hex:'#f5f5f5', varImg:1},
          {label:'Gold', hex:'#c9a227', varImg:2},
          {label:'Gold Blue', hex:'#2c3e50', varImg:3},
          {label:'Zirconium Blue', hex:'#2c3e50', varImg:4},
        ]},

      { sku:'KXH2625',
        name:'EVR TECH Gold Storage Jersey',
        range:'tech', cat:'Jersey', gender:'F',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Gold White', hex:'#f5f5f5', varImg:1},
          {label:'Gold', hex:'#c9a227', varImg:2},
          {label:'Gold Blue', hex:'#2c3e50', varImg:3},
        ]},

      { sku:'KXH2626',
        name:'EVR TECH Gold Series Long Sleeve Jersey',
        range:'tech', cat:'Jersey', gender:'F',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Silver', hex:'#b0bec5', varImg:1},
          {label:'Yellow', hex:'#c9a227', varImg:2},
          {label:'White', hex:'#f5f5f5', varImg:3},
          {label:'Black', hex:'#1a1a1a', varImg:4},
        ]},

      { sku:'KXH2619A',
        name:'EVR TECH Crown Vest',
        range:'tech', cat:'Vest', gender:'M',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL'],
        colours:[
          {label:'Black', hex:'#1a1a1a', varImg:1},
        ]},

      { sku:'KXH2608',
        name:'EVR TECH Gold Series Bib Shorts',
        range:'tech', cat:'Bib Shorts', gender:'M',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL','4XL','5XL'],
        colours:[
          {label:'White Gold', hex:'#f5f5f5', varImg:1},
          {label:'Black Gold', hex:'#1a1a1a', varImg:2},
        ]},

      { sku:'KXH2609',
        name:'EVR TECH Gold Series Bib Shorts',
        range:'tech', cat:'Bib Shorts', gender:'F',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL','4XL','5XL'],
        colours:[
          {label:'White Gold', hex:'#f5f5f5', varImg:1},
          {label:'Black Gold', hex:'#1a1a1a', varImg:2},
        ]},

      // ── PRO ─────────────────────────────────
      { sku:'KXH2610',
        name:'EVR PRO Race Jersey',
        range:'pro', cat:'Jersey', gender:'M',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Black', hex:'#1a1a1a', varImg:1},
        ]},

      { sku:'KXH2606',
        name:'EVR PRO Race Bib Shorts',
        range:'pro', cat:'Bib Shorts', gender:'M',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL','4XL','5XL'],
        colours:[
          {label:'Black', hex:'#1a1a1a', varImg:1},
        ]},

      // ── ASCENT ─────────────────────────────────
      { sku:'KXH2535',
        name:'EVR ASCENT Breakthrough Jersey',
        range:'ascent', cat:'Jersey', gender:'M',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Rock Black', hex:'#1a1a1a', varImg:1},
          {label:'Navy Blue', hex:'#1b2a4a', varImg:2},
          {label:'Red', hex:'#a4302f', varImg:3},
          {label:'Grey', hex:'#888888', varImg:4},
        ]},

      { sku:'KXH2537',
        name:'EVR ASCENT Breakthrough Jersey',
        range:'ascent', cat:'Jersey', gender:'F',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Rock Black', hex:'#1a1a1a', varImg:1},
          {label:'Powder Pink', hex:'#e79ab5', varImg:2},
          {label:'Navy', hex:'#1b2a4a', varImg:3},
          {label:'Grey', hex:'#888888', varImg:4},
        ]},

      { sku:'KXH2542',
        name:'EVR ASCENT Warmth Wind Jacket',
        range:'ascent', cat:'Jacket', gender:'M',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL'],
        colours:[
          {label:'Rock Black', hex:'#1a1a1a', varImg:1},
        ]},

      { sku:'KXH2543',
        name:'EVR ASCENT Warmth Wind Jacket',
        range:'ascent', cat:'Jacket', gender:'F',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL'],
        colours:[
          {label:'Rock Black', hex:'#1a1a1a', varImg:1},
          {label:'Deep Night Blue', hex:'#2c3e50', varImg:2},
        ]},

      { sku:'KXH2544',
        name:'EVR ASCENT Warmth Wind Jacket',
        range:'ascent', cat:'Jacket', gender:'M',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL'],
        colours:[
          {label:'Graphite Black', hex:'#1a1a1a', varImg:1},
        ]},

      { sku:'KXH2546',
        name:'EVR ASCENT Standard Extreme Night Long Sleeve Jersey',
        range:'ascent', cat:'Jersey', gender:'M',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Extreme Black', hex:'#1a1a1a', varImg:1},
        ]},

      { sku:'KXH2547',
        name:'EVR ASCENT Standard Extreme Night Long Sleeve Jersey',
        range:'ascent', cat:'Jersey', gender:'F',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Extreme Black', hex:'#1a1a1a', varImg:1},
          {label:'Tibetan Blue', hex:'#2c3e50', varImg:2},
        ]},

      // ── TECH ─────────────────────────────────
      { sku:'KXH2557',
        name:'EVR TECH Wind Motion Jacket',
        range:'tech', cat:'Jacket', gender:null,
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL'],
        colours:[
          {label:'Extreme Black', hex:'#1a1a1a', varImg:1},
          {label:'Rush Blue', hex:'#2c3e50', varImg:2},
          {label:'Rush Grey', hex:'#888888', varImg:3},
          {label:'Rush Purple', hex:'#6b4c8a', varImg:4},
        ]},

      // ── ASCENT ─────────────────────────────────
      { sku:'9403',
        name:'EVR ASCENT Breakthrough Bib Shorts',
        range:'ascent', cat:'Bib Shorts', gender:'F',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL','4XL','5XL'],
        colours:[
          {label:'Onyx Black', hex:'#1a1a1a', varImg:1},
          {label:'Navy Powder', hex:'#1b2a4a', varImg:2},
          {label:'Neon Grey', hex:'#888888', varImg:3},
          {label:'Light Pink Purple', hex:'#e79ab5', varImg:4},
        ]},

      { sku:'9503',
        name:'EVR ASCENT Breakthrough Bib Shorts',
        range:'ascent', cat:'Bib Shorts', gender:'M',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL','4XL','5XL'],
        colours:[
          {label:'Onyx Black', hex:'#1a1a1a', varImg:1},
          {label:'Navy Powder', hex:'#1b2a4a', varImg:2},
          {label:'Neon Grey', hex:'#888888', varImg:3},
          {label:'Moss Grey', hex:'#888888', varImg:4},
        ]},

      { sku:'KXH2548',
        name:'EVR ASCENT Speed Bib Tights',
        range:'ascent', cat:'Bib Tights', gender:'M',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Dark Night Black', hex:'#1a1a1a', varImg:1},
          {label:'Deep Grey', hex:'#888888', varImg:2},
        ]},

      { sku:'KXH2549',
        name:'EVR ASCENT Speed Bib Tights',
        range:'ascent', cat:'Bib Tights', gender:'F',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Dark Night Black', hex:'#1a1a1a', varImg:1},
          {label:'Deep Grey', hex:'#888888', varImg:2},
        ]},

      { sku:'KXH2554',
        name:'EVR ASCENT Flying Leap Bib Tights',
        range:'ascent', cat:'Bib Tights', gender:'F',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Dark Night Black', hex:'#1a1a1a', varImg:1},
          {label:'Deep Grey', hex:'#888888', varImg:2},
        ]},

      { sku:'KXH2555',
        name:'EVR ASCENT Flying Leap Bib Tights',
        range:'ascent', cat:'Bib Tights', gender:'M',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Dark Night Black', hex:'#1a1a1a', varImg:1},
          {label:'Deep Grey', hex:'#888888', varImg:2},
        ]},

      { sku:'KXH2550',
        name:'EVR ASCENT Thermal Shield Bib Tights',
        range:'ascent', cat:'Bib Tights', gender:'M',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Dark Night Black', hex:'#1a1a1a', varImg:1},
        ]},

      { sku:'KXH2551',
        name:'EVR ASCENT Thermal Shield Bib Tights',
        range:'ascent', cat:'Bib Tights', gender:'F',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Dark Night Black', hex:'#1a1a1a', varImg:1},
        ]},

      { sku:'KXH2556',
        name:'EVR ASCENT Liu Ying Speedsuit',
        range:'ascent', cat:'Speedsuit', gender:null,
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL'],
        colours:[
          {label:'Radiance Black', hex:'#1a1a1a', varImg:1},
          {label:'Radiance Blue', hex:'#2c3e50', varImg:2},
        ]},

      // ── EXPLORE ─────────────────────────────────
      { sku:'1154',
        name:'EVR EXPLORE Street Art Jersey',
        range:'explore', cat:'Jersey', gender:null,
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Green', hex:'#3f5d43', varImg:1},
          {label:'Dark Green', hex:'#3f5d43', varImg:2},
          {label:'White', hex:'#f5f5f5', varImg:3},
          {label:'Grey', hex:'#888888', varImg:4},
          {label:'Pink', hex:'#e79ab5', varImg:5},
        ]},

      { sku:'KX4154',
        name:'EVR EXPLORE Street Art Long Sleeve Jersey',
        range:'explore', cat:'Jersey', gender:'F',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Black', hex:'#1a1a1a', varImg:1},
          {label:'White', hex:'#f5f5f5', varImg:2},
          {label:'Pink', hex:'#e79ab5', varImg:3},
        ]},

      { sku:'KXH2552',
        name:'EVR EXPLORE Variance Jersey',
        range:'explore', cat:'Jersey', gender:'M',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Blue Grey', hex:'#888888', varImg:1},
          {label:'Camo', hex:'#5a5f4d', varImg:2},
          {label:'Green', hex:'#3f5d43', varImg:3},
          {label:'Multi', hex:'#999999', varImg:4},
        ]},

      { sku:'KXH2553',
        name:'EVR EXPLORE Variance Jersey',
        range:'explore', cat:'Jersey', gender:'F',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Black', hex:'#1a1a1a', varImg:1},
          {label:'Pink', hex:'#e79ab5', varImg:2},
          {label:'Multi', hex:'#999999', varImg:3},
          {label:'Blue Green', hex:'#2c3e50', varImg:4},
        ]},

      // ── PRO ─────────────────────────────────
      { sku:'2430',
        name:'EVR PRO Mystic Pro Jersey',
        range:'pro', cat:'Jersey', gender:null,
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL'],
        colours:[
          {label:'Mountain Grey', hex:'#888888', varImg:1},
          {label:'Black', hex:'#1a1a1a', varImg:2},
        ]},

      { sku:'2410',
        name:'EVR PRO Race Bib Shorts',
        range:'pro', cat:'Bib Shorts', gender:null,
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL','3XL','4XL','5XL'],
        colours:[
          {label:'Black Grey', hex:'#1a1a1a', varImg:1},
          {label:'Black', hex:'#1a1a1a', varImg:2},
        ]},

      // ── TECH ─────────────────────────────────
      { sku:'KXH2558',
        name:'EVR TECH Base Layer Long Sleeve',
        range:'tech', cat:'Base Layer', gender:null,
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL'],
        colours:[
          {label:'Grey', hex:'#888888', varImg:1},
          {label:'Black', hex:'#1a1a1a', varImg:2},
          {label:'Sky Blue', hex:'#2c3e50', varImg:3},
        ]},

      { sku:'KXH2559',
        name:'EVR TECH Base Layer Long Sleeve',
        range:'tech', cat:'Base Layer', gender:null,
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL'],
        colours:[
          {label:'Off White', hex:'#f5f5f5', varImg:1},
          {label:'Black', hex:'#1a1a1a', varImg:2},
        ]},

      // ── EXPLORE ─────────────────────────────────
      { sku:'KX2555',
        name:'EVR EXPLORE Vest',
        range:'explore', cat:'Vest', gender:'F',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL'],
        colours:[
          {label:'Orange', hex:'#c8622a', varImg:1},
          {label:'Yellow', hex:'#c9a227', varImg:2},
          {label:'Black', hex:'#1a1a1a', varImg:3},
          {label:'Purple', hex:'#6b4c8a', varImg:4},
        ]},

      // ── ASCENT ─────────────────────────────────
      { sku:'KX1504',
        name:'EVR ASCENT Vest',
        range:'ascent', cat:'Vest', gender:null,
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL'],
        colours:[
          {label:'Navy Rock Black', hex:'#1a1a1a', varImg:1},
          {label:'Rock Grey', hex:'#888888', varImg:2},
          {label:'Sky Grey', hex:'#888888', varImg:3},
        ]},

      // ── TECH ─────────────────────────────────
      { sku:'KX1151',
        name:'EVR TECH Vest',
        range:'tech', cat:'Vest', gender:'F',
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL'],
        colours:[
          {label:'Yellow', hex:'#c9a227', varImg:1},
          {label:'Blue', hex:'#2c3e50', varImg:2},
          {label:'Green', hex:'#3f5d43', varImg:3},
          {label:'Pink', hex:'#e79ab5', varImg:4},
          {label:'Light Grey', hex:'#888888', varImg:5},
        ]},

      // ── EXPLORE ─────────────────────────────────
      { sku:'KX3307',
        name:'EVR EXPLORE Windbreaker',
        range:'explore', cat:'Windbreaker', gender:null,
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL'],
        colours:[
          {label:'Army Green', hex:'#3f5d43', varImg:1},
          {label:'Grey', hex:'#888888', varImg:2},
          {label:'Black', hex:'#1a1a1a', varImg:3},
          {label:'Yellow', hex:'#c9a227', varImg:4},
        ]},

      // ── ASCENT ─────────────────────────────────
      { sku:'KX3301',
        name:'EVR ASCENT Windbreaker',
        range:'ascent', cat:'Windbreaker', gender:null,
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL'],
        colours:[
          {label:'Navy Grey', hex:'#888888', varImg:1},
          {label:'Grey', hex:'#888888', varImg:2},
        ]},

      // ── TECH ─────────────────────────────────
      { sku:'KX3305',
        name:'EVR TECH Windbreaker',
        range:'tech', cat:'Windbreaker', gender:null,
        priceSGD: 'Price TBA',
        sizes:['XS','S','M','L','XL','2XL'],
        colours:[
          {label:'Grey', hex:'#888888', varImg:1},
          {label:'Pink', hex:'#e79ab5', varImg:2},
          {label:'Cream', hex:'#e8e0cf', varImg:3},
          {label:'Navy', hex:'#1b2a4a', varImg:4},
          {label:'Blue', hex:'#2c3e50', varImg:5},
        ]},

      // ── MULTI ─────────────────────────────────
      { sku:'T24',
        name:'EVR Tail Light',
        range:'multi', cat:'Tail Light', gender:null,
        priceSGD: 'Price TBA',
        sizes:['One Size'],
        colours:[
          {label:'Black', hex:'#1a1a1a', varImg:1},
        ]},

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
      'KXH2617', 'KXH2618', 'KXH2519C', 'KXH2514C', 'KXH2620', 'KXH2619',
      'KXH2623', 'KXH2625', 'KXH2626', 'KXH2619A', 'KXH2608', 'KXH2609',
      'KXH2610', 'KXH2606', 'KXH2535', 'KXH2537', 'KXH2542', 'KXH2543',
      'KXH2544', 'KXH2546', 'KXH2547', 'KXH2557', '9403', '9503',
      'KXH2548', 'KXH2549', 'KXH2554', 'KXH2555', 'KXH2550', 'KXH2551',
      'KXH2556', '1154', 'KX4154', 'KXH2552', 'KXH2553', '2430',
      '2410', 'KXH2558', 'KXH2559', 'KX2555', 'KX1504', 'KX1151',
      'KX3307', 'KX3301', 'KX3305', 'T24',
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