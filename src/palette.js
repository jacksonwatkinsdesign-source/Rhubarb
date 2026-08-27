// palette.js — the whole game's colour vocabulary, defined once.
//
// Pitched at the Battle Network 3/4 overworld: saturated, high contrast, few
// tones per surface but the tones sit far apart, and a hard dark outline on
// everything. Night in a game like that is not murky — it is a deep saturated
// blue with bright warm windows punched into it. Muddy midtones are the enemy.
(function (RB) {
  'use strict';

  var P = {
    // The outline. One colour, on every object, no exceptions — this is the
    // single strongest signal of the style.
    outline: '#0d1024',

    // Neutral ramp, blue-biased and saturated rather than grey.
    ink:  '#141a38',
    sh:   '#1e2850',
    s1:   '#2c3a6e',
    s2:   '#3f5192',
    s3:   '#5468b0',
    s4:   '#7286c8',
    s5:   '#9aabde',
    pale: '#c4d0f0',
    white:'#f2f6ff',

    // Warm ramp — sodium light, wood, anything the building uses to look
    // welcoming. Deliberately hot against all that blue.
    w1: '#5a3218', w2: '#8a5424', w3: '#bd7c30',
    w4: '#e8a840', w5: '#ffc860', cream: '#ffe9a8',

    // Skin, four steps.
    k1: '#7a4428', k2: '#b06a3c', k3: '#e09a5e', k4: '#ffc890',

    // Accents. High chroma, three steps each, and that is the whole supply.
    teal1: '#125a68', teal2: '#1e8fa0', teal3: '#46c4d0',
    grn1:  '#1c6a34', grn2:  '#34a44e', grn3:  '#62d878',
    red1:  '#8a1c30', red2:  '#cc3a48', red3:  '#f4707a',
    gold1: '#a8620c', gold2: '#e89c18', gold3: '#ffd254',
    blu1:  '#16306e', blu2:  '#2a58b8', blu3:  '#4a88e8', blu4: '#8ab8ff',
    vio1:  '#3a2070', vio2:  '#6a3aa8', vio3:  '#a070e0'
  };

  // Legacy names, mapped on. Every scene written before the palette existed
  // keeps working and shifts onto the new colours with it.
  var ALIAS = {
    black: 'outline',
    night0: 'sh', night1: 's1', night2: 's2', night3: 's3',
    steel0: 's2', steel1: 's3', steel2: 's4', steel3: 's5',
    warm0: 'w1', warm1: 'w2', warm2: 'w3', warm3: 'w4', warm4: 'w5',
    amber: 'gold2', gold: 'gold3', orange: 'w4', rose: 'red3',
    violet: 'vio2', teal: 'teal2', green: 'grn2', red: 'red2',
    skin0: 'k3', skin1: 'k2', navy: 'blu1'
  };
  for (var old in ALIAS) P[old] = P[ALIAS[old]];

  RB.P = P;

  // Skies are three or four FLAT bands, never a smooth ramp. Banding is not a
  // limitation being worked around here, it is the look.
  RB.SKY = {
    night:   ['#101740', '#18265e', '#243a86', '#3352a8'],
    predawn: ['#141a48', '#222a72', '#40348e', '#6a3f96'],
    civil:   ['#1a2258', '#32307e', '#6a3f9a', '#b4548a'],
    dawn:    ['#22306e', '#4a3c96', '#a8508e', '#f0806a'],
    sunrise: ['#2a4a9e', '#5a5ec0', '#d0688e', '#ffab52'],
    day:     ['#2a72d8', '#4a94ec', '#7ab8ff', '#bce0ff']
  };

  // How many bands a sky is allowed. Flat blocking, not a gradient.
  RB.SKY_STEPS = 4;
})(window.RB = window.RB || {});
