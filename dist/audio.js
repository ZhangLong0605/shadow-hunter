/* Shadow Hunter original procedural score. All notes are synthesized locally. */
'use strict';
window.HUNTER_AUDIO = (() => {
  let context, master, music, sfx, reverb, timer, enabled = true, unlocked = false;
  let musicVolume = .48, effectsVolume = .65, scene = 'menu', step = 0, nextTime = 0;
  const voices = new Set();
  const themes = {
    menu: {bpm:72, root:50, chords:[0,5,3,7], melody:[12,null,19,17,15,null,14,12,10,null,12,15,14,null,7,null], gain:.78},
    camp: {bpm:68, root:50, chords:[0,3,5,0], melody:[12,null,15,19,17,null,15,null,10,null,14,17,15,null,12,null], gain:.72},
    explore: {bpm:82, root:50, chords:[0,5,3,7], melody:[12,null,19,null,17,15,null,14,12,null,10,12,15,null,14,null], gain:.8},
    combat: {bpm:108, root:50, chords:[0,0,5,7], melody:[12,19,null,17,15,null,14,12,10,null,12,15,14,7,null,10], gain:.85, drums:true},
    boss: {bpm:126, root:38, chords:[0,1,5,7], melody:[24,31,29,27,26,null,24,19,22,24,27,null,26,19,22,null], gain:.9, drums:true},
    victory: {bpm:78, root:53, chords:[0,5,7,0], melody:[12,16,19,null,24,null,23,19,21,null,19,16,17,19,24,null], gain:.85, major:true},
    defeat: {bpm:58, root:50, chords:[0,3,5,0], melody:[19,null,null,17,15,null,null,14,12,null,null,10,7,null,null,null], gain:.65}
  };
  const frequency = midi => 440 * 2 ** ((midi - 69) / 12);
  function voice(midi, time, duration, volume, type='sine', destination=music) {
    if (!context || context.state !== 'running' || !enabled) return;
    const oscillator=context.createOscillator(), envelope=context.createGain();
    oscillator.type=type; oscillator.frequency.setValueAtTime(frequency(midi),time);
    envelope.gain.setValueAtTime(0,time);
    envelope.gain.linearRampToValueAtTime(volume,time+Math.min(.035,duration/5));
    envelope.gain.exponentialRampToValueAtTime(.0001,time+duration);
    oscillator.connect(envelope); envelope.connect(destination);
    if(destination===music) envelope.connect(reverb);
    voices.add(oscillator); oscillator.onended=()=>{voices.delete(oscillator);oscillator.disconnect();envelope.disconnect();};
    oscillator.start(time); oscillator.stop(time+duration+.04);
  }
  function drum(time, strong) {
    const oscillator=context.createOscillator(), envelope=context.createGain();
    oscillator.frequency.setValueAtTime(strong?100:180,time);
    oscillator.frequency.exponentialRampToValueAtTime(35,time+.16);
    envelope.gain.setValueAtTime(strong?.065:.022,time);
    envelope.gain.exponentialRampToValueAtTime(.0001,time+.2);
    oscillator.connect(envelope);envelope.connect(music);voices.add(oscillator);
    oscillator.onended=()=>{voices.delete(oscillator);oscillator.disconnect();envelope.disconnect();};
    oscillator.start(time);oscillator.stop(time+.21);
  }
  function schedule() {
    if(!context||!unlocked||!enabled||context.state!=='running'||document.hidden)return;
    if(nextTime<context.currentTime-.2)nextTime=context.currentTime+.06;
    const theme=themes[scene]||themes.explore, beat=60/theme.bpm/2;
    while(nextTime<context.currentTime+.22){
      const index=step%16,chord=theme.chords[Math.floor(step/16)%theme.chords.length],root=theme.root+chord;
      if(index===0){
        for(const [offset,volume] of [[0,.022],[theme.major?4:3,.014],[7,.014]])voice(root+offset,nextTime,beat*15,volume,'sine');
        voice(root-12,nextTime,beat*7,.04,'sine');
      }
      const note=theme.melody[index];
      if(note!==null)voice(theme.root+note,nextTime,beat*2.7,.038*theme.gain,'triangle');
      if(index%2===0){const arpeggio=[0,7,12,theme.major?16:15][Math.floor(index/2)%4];voice(root+arpeggio,nextTime,beat*1.8,.018,'sine');}
      if(theme.drums&&index%2===0)drum(nextTime,index%8===0);
      step++;nextTime+=beat;
    }
  }
  function initialize() {
    if(context)return;
    const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
    context=new Audio();master=context.createGain();music=context.createGain();sfx=context.createGain();
    const compressor=context.createDynamicsCompressor();master.gain.value=enabled?.65:0;music.gain.value=musicVolume;sfx.gain.value=effectsVolume;
    music.connect(master);sfx.connect(master);master.connect(compressor);compressor.connect(context.destination);
    const convolver=context.createConvolver(),wet=context.createGain();wet.gain.value=.19;
    const length=Math.floor(context.sampleRate*1.8),impulse=context.createBuffer(2,length,context.sampleRate);
    let noise=1947;for(let channel=0;channel<2;channel++){const data=impulse.getChannelData(channel);for(let i=0;i<length;i++){noise=(noise*1664525+1013904223)>>>0;data[i]=(noise/4294967296*2-1)*(1-i/length)**3;}}
    convolver.buffer=impulse;convolver.connect(wet);wet.connect(music);reverb=convolver;
    timer=setInterval(schedule,80);
  }
  async function unlock() {
    try{initialize();if(!context)return false;if(context.state==='suspended')await context.resume();unlocked=context.state==='running';if(unlocked&&nextTime===0)nextTime=context.currentTime+.08;schedule();return unlocked;}catch{return false;}
  }
  function configure(settings) {
    enabled=settings.sound!==false;musicVolume=settings.music/100;effectsVolume=settings.effects/100;
    if(context){const t=context.currentTime;master.gain.setTargetAtTime(enabled?.65:0,t,.06);music.gain.setTargetAtTime(musicVolume,t,.08);sfx.gain.setTargetAtTime(effectsVolume,t,.06);}
  }
  function setScene(value) {if(value===scene||!themes[value])return;scene=value;step=0;if(context)nextTime=context.currentTime+.12;}
  function effect(freq=330,duration=.1,type='sine',volume=.05) {
    if(!enabled||!unlocked||!context||context.state!=='running'||document.hidden)return;
    const oscillator=context.createOscillator(),envelope=context.createGain(),t=context.currentTime;
    oscillator.type=type;oscillator.frequency.setValueAtTime(freq,t);oscillator.frequency.exponentialRampToValueAtTime(Math.max(20,freq/2),t+duration);
    envelope.gain.setValueAtTime(volume,t);envelope.gain.exponentialRampToValueAtTime(.0001,t+duration);
    oscillator.connect(envelope);envelope.connect(sfx);voices.add(oscillator);
    oscillator.onended=()=>{voices.delete(oscillator);oscillator.disconnect();envelope.disconnect();};oscillator.start(t);oscillator.stop(t+duration+.02);
  }
  document.addEventListener('visibilitychange',()=>{if(!context)return;if(document.hidden){for(const node of voices){try{node.stop();}catch{}}context.suspend().catch(()=>{});}else if(unlocked&&enabled)context.resume().then(()=>{nextTime=context.currentTime+.12;}).catch(()=>{});});
  return {unlock,configure,setScene,effect,status:()=>({supported:!!(window.AudioContext||window.webkitAudioContext),unlocked,enabled,scene,musicVolume,effectsVolume,activeVoices:voices.size})};
})();
