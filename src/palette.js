// palette.js — the whole game's colour vocabulary, defined once.
//
// Nothing anywhere else may invent a colour. The cosiness of Ihatovo or the
// Battle Network overworld comes from a small, strictly-kept set: a handful
// of ramps, each with a fixed number of steps, reused everywhere. Variation
// comes from which ramp a thing uses, never from a new hex.
(function (RB) {
  'use strict';

  // Five-step neutral ramp, biased slightly violet — a terminal before dawn.
  var N = {
    ink:  '#16151e',
    sh:   '#232231',
    s1:   '#363449',
    s2:   '#4a4762',
    s3:   '#615d7c',
    s4:   '#7d7898',
    s5:   '#9d98b4',
    pale: '#c2bed2',
    white:'#edebf3'
  };

  // Warm ramp: wood, sodium light, anything the building is trying to make
  // feel welcoming.
  var W = {
    w1: '#3c2e2a', w2: '#5a4438', w3: '#7e604a',
    w4: '#a58264', w5: '#c8a684', cream: '#ebdbbb'
  };

  // Skin, four steps, used for everyone.
  var K = { k1: '#8a5a42', k2: '#b57d59', k3: '#dfa576', k4: '#f2c99e' };

  // Accents. One ramp per hue, three steps, and that is the entire supply.
  var A = {
    teal1: '#2a4a56', teal2: '#3f6d7a', teal3: '#5d95a0',
    grn1:  '#3a5a42', grn2:  '#58885c', grn3:  '#7db07f',
    red1:  '#6c2e36', red2:  '#a24c52', red3:  '#ca7a76',
    gold1: '#a6742c', gold2: '#d6a44e', gold3: '#f0cc82',
    blu1:  '#24365e', blu2:  '#3a5a96', blu3:  '#5a86c6', blu4: '#8ab0e2',
    vio1:  '#3a2c52', vio2:  '#573f6e', vio3:  '#8a6a96'
  };

  var P = {};
  [N, W, K, A].forEach(function (group) {
    for (var key in group) P[key] = group[key];
  });

  // Legacy names, mapped onto the ramp above. Every scene written before the
  // palette existed keeps working, and shifts onto the new colours with it —
  // which is the point: one file re-tunes the whole game.
  var ALIAS = {
    black: 'ink',
    night0: 'sh', night1: 's1', night2: 's2', night3: 's3',
    steel0: 's2', steel1: 's3', steel2: 's4', steel3: 's5',
    warm0: 'w1', warm1: 'w2', warm2: 'w3', warm3: 'w4', warm4: 'w5',
    amber: 'gold2', gold: 'gold3', orange: 'red3', rose: 'red3',
    violet: 'vio2', teal: 'teal2', green: 'grn2', red: 'red2',
    skin0: 'k3', skin1: 'k2', navy: 'blu1'
  };
  for (var old in ALIAS) P[old] = P[ALIAS[old]];

  RB.P = P;

  // The dawn arc, as six named states. Every sky in the game is one of these
  // or a blend of two.
  RB.SKY = {
    night:   ['#0d0d1a', '#171a30', '#232a4a', '#33395e'],
    predawn: ['#12132a', '#1e2448', '#3a3468', '#573f6e'],
    civil:   ['#1a1d40', '#2e2f62', '#54417a', '#8a5878'],
    dawn:    ['#232a52', '#413a72', '#8a5a80', '#d4836f'],
    sunrise: ['#2e4276', '#5c5590', '#b0708a', '#f0a868'],
    day:     ['#3d64a6', '#5f86c2', '#90b0da', '#c8dcf0']
  };
})(window.RB = window.RB || {});
