import { createClient } from "@supabase/supabase-js";
import { questions, shuffled } from "./questions.js";
import { RULES, awardPoints, makeCode, medal, ranks } from "./rules.js";
import "./style.css";

const app=document.querySelector("#app");
const endpoint=import.meta.env.VITE_SUPABASE_URL;
const anonKey=import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase=endpoint&&anonKey?createClient(endpoint,anonKey):null;
let state={screen:"home",mode:"family",room:"",name:"",players:[],round:0,index:0,answer:null,roomId:null,session:[],votes:[],loading:false,error:"",seconds:RULES.voteSeconds,phase:"idle",playerId:null,channel:null};
const safe=s=>String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const $=id=>document.getElementById(id);
function say(text){if(!("speechSynthesis" in window))return;window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.rate=0.94;utterance.pitch=0.8;window.speechSynthesis.speak(utterance);}
function render(){
 const q=state.session[state.index];
 app.innerHTML=`<header><div class="brand"><span>CRIXUS PRESENTS</span><h1>THIS <em>OR</em> THAT</h1></div><p>THE CROWD DECIDES</p></header><main>
 ${state.error?`<p class="error" role="alert">${safe(state.error)}</p>`:""}
 ${state.screen==="home"?`<section class="panel center"><h2>Choose Your Arena</h2><p>Two choices. One crowd. No easy answers.</p><div class="actions"><button id="host">HOST GAME</button><button id="join" class="secondary">JOIN GAME</button></div></section>`:""}
 ${state.screen==="host"?`<section class="panel center"><h2>Host Arena</h2><p>Select the mode before creating a room.</p><div class="actions"><button id="family" class="${state.mode==="family"?"":"secondary"}">FAMILY MODE</button><button id="adult" class="${state.mode==="adult"?"":"secondary"}">ADULT MODE</button></div><button id="create">CREATE ROOM</button></section>`:""}
 ${state.screen==="join"?`<section class="panel center"><h2>Join the Arena</h2><label>Room code<input id="room" maxlength="4" autocapitalize="characters" placeholder="AB12" value="${safe(state.room)}"/></label><label>Player name<input id="name" maxlength="24" placeholder="Enter a nickname" value="${safe(state.name)}"/></label><button id="enter">JOIN ROOM</button></section>`:""}
 ${state.screen==="lobby"?`<section class="lobby"><div class="panel center"><h2>HOST ARENA</h2><p>Room code</p><strong class="roomcode">${safe(state.room)}</strong><div class="qr" id="qr"></div><p>Scan to join or enter the code.</p><button id="start">START GAME</button></div><div class="panel"><h2>PLAYERS (${state.players.length}/60)</h2><div class="roster">${state.players.map(p=>`<p>${safe(p.name)}</p>`).join("")||"<p>Waiting for players...</p>"}</div></div></section>`:""}
 ${state.screen==="waiting"?`<section class="panel center"><h2>YOU'RE IN!</h2><strong class="roomcode">${safe(state.room)}</strong><p>Welcome, ${safe(state.name)}.</p><p>Watch the host screen for the next question.</p></section>`:""}
 ${state.screen==="game"?`<section class="panel center"><div class="eyebrow">${state.phase==="final"?"FINAL SHOWDOWN":state.phase==="wild"?"WILD CARD":"ROUND "+(state.round+1)}</div><h2>${safe(q?.text||"The next question is coming...")}</h2><div class="answers"><button id="pick-a">${safe(q?.a||"Option A")}</button><div class="vs">OR</div><button id="pick-b">${safe(q?.b||"Option B")}</button></div><p>${state.answer?"VOTE LOCKED":"Choose your answer"}</p><div class="timer">${state.seconds}s</div></section>`:""}
 ${state.screen==="results"?`<section class="panel center"><h2>THE CROWD HAS SPOKEN</h2><p>Voting results will appear here.</p><button id="continue">CONTINUE</button></section>`:""}
 </main><footer>BUILDING A TRADITION, NOT RESTING UPON ONE!</footer>`;
 if($("host"))$("host").onclick=()=>{state.screen="host";render();};
 if($("join"))$("join").onclick=()=>{state.screen="join";render();};
 if($("family"))$("family").onclick=()=>{state.mode="family";render();};
 if($("adult"))$("adult").onclick=()=>{state.mode="adult";render();};
 if($("create"))$("create").onclick=createRoom;
 if($("enter"))$("enter").onclick=joinRoom;
 if($("start"))$("start").onclick=startGame;
 if($("pick-a"))$("pick-a").onclick=()=>vote("a");
 if($("pick-b"))$("pick-b").onclick=()=>vote("b");
 if($("continue"))$("continue").onclick=()=>{state.screen="lobby";render();};
 if($("qr")){const url=location.origin+location.pathname+"?room="+encodeURIComponent(state.room);$("qr").innerHTML=`<p class="url">${safe(url)}</p>`;}
}
function requireBackend(){if(supabase)return true;state.error="Multiplayer needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY configured in Vercel.";render();return false;}
async function createRoom(){
 if(!requireBackend())return;
 try{state.error="";const code=makeCode();const {data,error}=await supabase.from("rooms").insert({code,mode:state.mode,status:"lobby"}).select().single();if(error)throw error;state.room=code;state.roomId=data.id;state.screen="lobby";subscribe();render();}catch(e){state.error=e.message;render();}
}
async function joinRoom(){
 if(!requireBackend())return;
 const code=$("room").value.trim().toUpperCase(),name=$("name").value.trim();
 if(!/^[A-Z0-9]{4}$/.test(code)||!name){state.error="Enter a four-character room code and your name.";render();return;}
 try{const {data:room,error:roomError}=await supabase.from("rooms").select("*").eq("code",code).eq("status","lobby").single();if(roomError)throw roomError;const {data:player,error}=await supabase.from("players").insert({room_id:room.id,name}).select().single();if(error)throw error;state.room=code;state.roomId=room.id;state.name=name;state.playerId=player.id;state.screen="waiting";subscribe();render();}catch(e){state.error=e.message;render();}
}
async function refreshPlayers(){if(!supabase||!state.roomId)return;const {data,error}=await supabase.from("players").select("*").eq("room_id",state.roomId);if(!error){state.players=data||[];render();}}
function subscribe(){
 if(state.channel)supabase.removeChannel(state.channel);
 state.channel=supabase.channel("room-"+state.roomId).on("postgres_changes",{event:"*",schema:"public",table:"players",filter:"room_id=eq."+state.roomId},refreshPlayers).on("postgres_changes",{event:"*",schema:"public",table:"rooms",filter:"id=eq."+state.roomId},async()=>{const {data}=await supabase.from("rooms").select("*").eq("id",state.roomId).single();if(data?.status==="playing"&&state.screen==="waiting"){state.screen="game";state.session=shuffled(questions.filter(q=>q.mode===data.mode));state.index=data.question_index||0;render();}}).subscribe();
 refreshPlayers();
}
async function startGame(){
 if(!requireBackend())return;
 if(!state.players.length){state.error="At least one player must join before starting.";render();return;}
 try{const {error}=await supabase.from("rooms").update({status:"playing",question_index:0}).eq("id",state.roomId);if(error)throw error;state.session=shuffled(questions.filter(q=>q.mode===state.mode));state.index=0;state.screen="game";state.phase="round";say("Welcome, warriors, to This or That! Read both choices and vote for the one you think the crowd will pick.");render();}catch(e){state.error=e.message;render();}
}
async function vote(choice){
 if(state.answer)return;
 state.answer=choice;
 if(supabase&&state.playerId&&state.roomId){const q=state.session[state.index];const {error}=await supabase.from("votes").insert({room_id:state.roomId,player_id:state.playerId,question_id:q?.id,choice});if(error){state.answer=null;state.error=error.message;}}
 render();
}
if(new URLSearchParams(location.search).has("room")){state.room=new URLSearchParams(location.search).get("room").toUpperCase();state.screen="join";}
render();
