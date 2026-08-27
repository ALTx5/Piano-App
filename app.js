const state={mode:'multiple',clef:'both',round:0,correct:0,streak:0,target:null,phase:'name',deck:[],lastPitch:null};
const notes={
  treble:[{n:'C',o:4,s:-2},{n:'D',o:4,s:-1},{n:'E',o:4,s:0},{n:'F',o:4,s:1},{n:'G',o:4,s:2},{n:'A',o:4,s:3},{n:'B',o:4,s:4},{n:'C',o:5,s:5},{n:'D',o:5,s:6},{n:'E',o:5,s:7},{n:'F',o:5,s:8},{n:'G',o:5,s:9},{n:'A',o:5,s:10}],
  bass:[{n:'E',o:2,s:-2},{n:'F',o:2,s:-1},{n:'G',o:2,s:0},{n:'A',o:2,s:1},{n:'B',o:2,s:2},{n:'C',o:3,s:3},{n:'D',o:3,s:4},{n:'E',o:3,s:5},{n:'F',o:3,s:6},{n:'G',o:3,s:7},{n:'A',o:3,s:8},{n:'B',o:3,s:9},{n:'C',o:4,s:10}]
};
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);

const savedTheme=localStorage.getItem('keynote-theme');
const prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;
setTheme(savedTheme||(prefersDark?'dark':'light'));
$('#themeToggle').onclick=()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');
function setTheme(theme){
  const dark=theme==='dark', button=$('#themeToggle');
  document.documentElement.dataset.theme=theme;
  button.setAttribute('aria-pressed',dark);
  button.querySelector('.utility-icon').textContent=dark?'☀':'☾';
  button.querySelector('.utility-label').textContent=dark?'Light mode':'Dark mode';
  document.querySelector('meta[name="theme-color"]').content=dark?'#151c1a':'#f6f1e8';
  localStorage.setItem('keynote-theme',theme);
}

setKeyboardView(localStorage.getItem('keynote-keyboard-view')||'scroll');
$('#keyboardViewToggle').onclick=()=>setKeyboardView($('#pianoSection').classList.contains('fit-keyboard')?'scroll':'fit');
function setKeyboardView(view){
  const fit=view==='fit', button=$('#keyboardViewToggle');
  $('#pianoSection').classList.toggle('fit-keyboard',fit);
  button.setAttribute('aria-pressed',fit);
  button.querySelector('.utility-label').textContent=fit?'Scrollable piano':'Fit whole piano';
  button.querySelector('.utility-icon').textContent=fit?'⇥':'↔';
  localStorage.setItem('keynote-keyboard-view',view);
}

$$('#modeChoices button').forEach(b=>b.onclick=()=>selectGroup('#modeChoices',b,'mode'));
$$('#clefChoices button').forEach(b=>b.onclick=()=>selectGroup('#clefChoices',b,'clef'));
function selectGroup(group,b,key){$$(group+' button').forEach(x=>{x.classList.remove('selected');x.setAttribute('aria-pressed','false')});b.classList.add('selected');b.setAttribute('aria-pressed','true');state[key]=b.dataset[key];state.deck=[]}

$('#startBtn').onclick=()=>{$('#setupScreen').classList.remove('active');$('#gameScreen').classList.add('active');newRound()};
$('#backBtn').onclick=()=>{$('#gameScreen').classList.remove('active');$('#setupScreen').classList.add('active')};

function newRound(){
  state.round++; state.phase='name';
  if(!state.deck.length) refillDeck();
  state.target=state.deck.pop(); state.lastPitch=`${state.target.clef}-${state.target.n}${state.target.o}`;
  $('#roundLabel').textContent=`Note ${state.round}`; $('#scoreLabel').textContent=`${state.correct} correct`;
  $('#clefBadge').textContent=`${state.target.clef.toUpperCase()} CLEF`; $('#phaseHint').textContent='Name the note on the staff.';
  $('#feedback').className='feedback'; $('#feedback').textContent='';
  $('#pianoSection').classList.add('locked'); $('#pianoHint').textContent='Name the note above to unlock the keys.';
  drawStaff(); renderAnswers(); clearKeys();
}

function refillDeck(){
  const clefs=state.clef==='both'?['treble','bass']:[state.clef];
  state.deck=clefs.flatMap(clef=>notes[clef].map(note=>({...note,clef})));
  for(let i=state.deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[state.deck[i],state.deck[j]]=[state.deck[j],state.deck[i]]}
  const next=state.deck[state.deck.length-1];
  if(state.deck.length>1&&`${next.clef}-${next.n}${next.o}`===state.lastPitch)[state.deck[state.deck.length-1],state.deck[0]]=[state.deck[0],state.deck[state.deck.length-1]];
}

function drawStaff(){
  const {s,clef}=state.target, svg=$('#staff'); const bottom=164, gap=22, y=bottom-s*11;
  let lines=''; for(let i=0;i<5;i++)lines+=`<line x1="55" y1="${bottom-i*gap}" x2="470" y2="${bottom-i*gap}"/>`;
  let ledger=''; if(s<0)for(let i=-2;i>=s;i-=2)ledger+=`<line class="ledger" x1="284" y1="${bottom-i*11}" x2="350" y2="${bottom-i*11}"/>`;
  if(s>8)for(let i=10;i<=s;i+=2)ledger+=`<line class="ledger" x1="284" y1="${bottom-i*11}" x2="350" y2="${bottom-i*11}"/>`;
  const symbol=clef==='treble'?'𝄞':'𝄢'; const sy=clef==='treble'?171:151;
  svg.innerHTML=`<g stroke="#66706b" stroke-width="1.5">${lines}${ledger}</g><text x="78" y="${sy}" font-size="92" font-family="serif" fill="#233f37">${symbol}</text><ellipse cx="317" cy="${y}" rx="15" ry="10" transform="rotate(-15 317 ${y})" fill="#203a33"/><line x1="330" y1="${y-3}" x2="330" y2="${y-58}" stroke="#203a33" stroke-width="3"/>`;
}

function renderAnswers(){
  const area=$('#answerArea');
  if(state.mode==='blank'){
    area.innerHTML='<form class="blank-form"><input class="blank-input" maxlength="1" placeholder="Type A–G" aria-label="Note name" autocomplete="off"><button class="submit-btn">Check</button></form>';
    area.querySelector('form').onsubmit=e=>{e.preventDefault();checkName(area.querySelector('input').value,area.querySelector('input'))}; setTimeout(()=>area.querySelector('input').focus(),0);
  }else{
    let choices=new Set([state.target.n]); const all='ABCDEFG'; while(choices.size<4)choices.add(all[Math.floor(Math.random()*7)]);
    area.innerHTML=[...choices].sort(()=>Math.random()-.5).map(n=>`<button class="answer-btn" data-note="${n}">${n}</button>`).join('');
    area.querySelectorAll('button').forEach(b=>b.onclick=()=>checkName(b.dataset.note,b));
  }
}

function checkName(value,el){
  if(state.phase!=='name')return; const right=value.trim().toUpperCase()===state.target.n;
  if(!right){resetStreak();el.classList.add('wrong');feedback(`Not quite — try another note.`,false);return}
  state.phase='piano'; if(el.classList){el.classList.remove('wrong');el.classList.add('correct')}
  $$('#answerArea button,#answerArea input').forEach(x=>x.disabled=true); feedback(`That’s ${state.target.n}. Now find it on the piano.`,true);
  $('#phaseHint').textContent='Correct. Match its pitch on the keyboard.'; $('#pianoSection').classList.remove('locked'); $('#pianoHint').textContent=`Find ${state.target.n}${state.target.o} on the keyboard.`;
}
function feedback(t,ok){const f=$('#feedback');f.textContent=t;f.className='feedback '+(ok?'success':'error')}

function buildKeyboard(){
  const board=$('#keyboard'), whites=[]; let html='';
  const addWhite=id=>{whites.push(id);html+=`<button class="white-key" data-pitch="${id}" aria-label="${id}"><span class="key-label">${id==='A0'||id==='C8'||id[0]==='C'?id:''}</span></button>`};
  addWhite('A0');addWhite('B0');
  for(let o=1;o<=7;o++)for(const n of ['C','D','E','F','G','A','B'])addWhite(n+o);
  addWhite('C8');
  board.innerHTML=html;
  const blackAfter={C:'C#',D:'D#',F:'F#',G:'G#',A:'A#'};
  whites.forEach((id,i)=>{const n=id[0],o=id.slice(1);if(blackAfter[n]&&id!=='C8'){const b=document.createElement('button');b.className='black-key';b.dataset.pitch=blackAfter[n]+o;b.setAttribute('aria-label',b.dataset.pitch);b.style.left=`${(i+1)*100/52}%`;board.appendChild(b)}});
  board.querySelectorAll('button').forEach(k=>k.onclick=()=>checkKey(k));
  requestAnimationFrame(()=>{const scroller=$('.keyboard-scroll'),middle=board.querySelector('[data-pitch="C4"]');if(!$('#pianoSection').classList.contains('fit-keyboard'))scroller.scrollLeft=middle.offsetLeft-scroller.clientWidth/2+middle.offsetWidth/2});
}
function checkKey(key){
  if(state.phase!=='piano')return; const wanted=state.target.n+state.target.o;
  if(key.dataset.pitch!==wanted){resetStreak();key.classList.add('key-wrong');feedback(`That was ${key.dataset.pitch}. Look for ${wanted}.`,false);return}
  key.classList.add('key-hit');state.phase='done';state.correct++;state.streak++;$('#streakCount').textContent=state.streak;$('#scoreLabel').textContent=`${state.correct} correct`;
  feedback(`Beautiful — ${wanted} is exactly right.`,true);$('#pianoHint').innerHTML='<button class="next-btn" id="nextBtn">Next note →</button>';$('#nextBtn').onclick=newRound;
}
function resetStreak(){state.streak=0;$('#streakCount').textContent='0'}
function clearKeys(){$$('.keyboard button').forEach(k=>k.classList.remove('key-hit','key-wrong'))}
buildKeyboard();
