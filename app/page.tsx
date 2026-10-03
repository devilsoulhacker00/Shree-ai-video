"use client";

import { useEffect, useMemo, useState } from "react";

type Scene = { id:number; text:string };
const starter = `A small village wakes up at sunrise.
A curious child discovers an old map.
The journey begins toward a hidden valley.`;
const PROJECT_KEY="shree-ai-video-project-v1";

export default function Home() {
  const [script,setScript]=useState(starter);
  const [scenes,setScenes]=useState<Scene[]>([]);
  const [images,setImages]=useState<Record<number,string>>({});
  const [status,setStatus]=useState("");
  const [exportUrl,setExportUrl]=useState("");
  const [aiVideoUrl,setAiVideoUrl]=useState("");
  const [voice,setVoice]=useState("default");
  const [busyImage,setBusyImage]=useState<number|null>(null);
  const [busyVideo,setBusyVideo]=useState(false);
  const [duration,setDuration]=useState(4);
  const [musicUrl,setMusicUrl]=useState("");
  const [musicName,setMusicName]=useState("");

  const sceneCount=useMemo(()=>script.split(/\n+/).filter(s=>s.trim()).length,[script]);

  useEffect(()=>{try{const raw=localStorage.getItem(PROJECT_KEY);if(!raw)return;const p=JSON.parse(raw);if(typeof p.script==="string")setScript(p.script);if(Array.isArray(p.scenes))setScenes(p.scenes);if(p.images&&typeof p.images==="object")setImages(p.images);if(typeof p.musicName==="string")setMusicName(p.musicName);}catch{}},[]);

  const buildScenes=()=> {
    const next=script.split(/\n+/).map(s=>s.trim()).filter(Boolean).map((text,id)=>({id:id+1,text}));
    setScenes(next); setStatus(`${next.length} scenes ready`); setExportUrl(""); setAiVideoUrl("");
  };

  const makeStory=()=>{
    const topics=[
      "A mysterious signal appears in the night sky.",
      "A young explorer follows the signal into an ancient forest.",
      "Inside the forest, a hidden doorway opens.",
      "The explorer finds a glowing city and discovers its secret.",
      "At sunrise, the journey becomes a new beginning."
    ];
    setScript(topics.join("\n")); setScenes([]); setStatus("AI-style story draft created — edit it before rendering.");
  };

  const saveProject=()=>{
    try{
      localStorage.setItem(PROJECT_KEY,JSON.stringify({script,scenes,images,musicName}));
      setStatus("Project saved on this device.");
    }catch{setStatus("Could not save project. Browser storage may be full.");}
  };

  const loadProject=()=>{
    try{
      const raw=localStorage.getItem(PROJECT_KEY);
      if(!raw){setStatus("No saved project found.");return;}
      const p=JSON.parse(raw);
      setScript(typeof p.script==="string"?p.script:starter);
      setScenes(Array.isArray(p.scenes)?p.scenes:[]);
      setImages(p.images&&typeof p.images==="object"?p.images:{});
      setMusicName(typeof p.musicName==="string"?p.musicName:"");
      setStatus("Saved project loaded.");
    }catch{setStatus("Saved project could not be loaded.");}
  };

  const speak=(text:string)=>{
    if(typeof window==="undefined"||!("speechSynthesis" in window)){setStatus("Browser voice is not available.");return;}
    window.speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);
    u.rate=voice==="slow"?.85:voice==="fast"?1.15:1;
    window.speechSynthesis.speak(u);
    setStatus("Voice preview playing…");
  };

  const attachImage=(id:number,file:File)=>{
    const url=URL.createObjectURL(file);
    setImages(v=>({...v,[id]:url}));
  };

  const attachMusic=(file:File)=>{
    const url=URL.createObjectURL(file);
    setMusicUrl(url); setMusicName(file.name); setStatus("Background music selected for this session.");
  };

  const generateImage=async(scene:Scene)=>{
    setBusyImage(scene.id); setStatus(`Generating AI image for scene ${scene.id}…`);
    try{
      const res=await fetch("/api/generate-image",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:`${scene.text}. Cinematic vertical short-video frame, detailed environment, consistent story character, dramatic lighting.`})});
      if(!res.ok){const data=await res.json().catch(()=>({}));throw new Error(data.error||"AI image generation failed");}
      const blob=await res.blob(); const url=URL.createObjectURL(blob);
      setImages(v=>({...v,[scene.id]:url})); setStatus(`AI image ready for scene ${scene.id}.`);
    }catch(err){setStatus(err instanceof Error?err.message:"AI image generation failed.");}finally{setBusyImage(null);}
  };

  const generateVideo=async()=>{
    if(!scenes.length){setStatus("Create scenes first.");return;}
    setBusyVideo(true);setAiVideoUrl("");setStatus("Generating AI video… this can take a while.");
    try{
      const prompt=scenes.map(s=>s.text).join(" ");
      const res=await fetch("/api/generate-video",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:`${prompt}. Create a cinematic vertical social video, 9:16 composition, coherent visual story.`,duration})});
      if(!res.ok){const data=await res.json().catch(()=>({}));throw new Error(data.error||"AI video generation failed");}
      const blob=await res.blob(); setAiVideoUrl(URL.createObjectURL(blob)); setStatus("AI video ready — preview or download it below.");
    }catch(err){setStatus(err instanceof Error?err.message:"AI video generation failed.");}finally{setBusyVideo(false);}
  };

  const exportVideo=async()=>{
    if(!scenes.length){setStatus("Create scenes first.");return;}
    setStatus(musicUrl?"Rendering with selected background music…":"Rendering 9:16 video in your browser…");
    const canvas=document.createElement("canvas"); canvas.width=720; canvas.height=1280;
    const ctx=canvas.getContext("2d")!;
    const stream=canvas.captureStream(30);
    const recorder=new MediaRecorder(stream,{mimeType:"video/webm"});
    const chunks:BlobPart[]=[]; recorder.ondataavailable=e=>e.data.size&&chunks.push(e.data);
    const done=new Promise<void>(resolve=>recorder.onstop=()=>resolve()); recorder.start();

    let music:HTMLAudioElement|undefined;
    if(musicUrl){music=new Audio(musicUrl);music.loop=true;music.volume=.2;await music.play().catch(()=>{});}

    for(const scene of scenes){
      const start=performance.now(), sceneDuration=3, src=images[scene.id];
      let img:HTMLImageElement|undefined;
      if(src){img=new Image();img.src=src;await new Promise(r=>{img!.onload=()=>r(null);img!.onerror=()=>r(null);});}
      while(performance.now()-start<sceneDuration*1000){
        const p=Math.min(1,(performance.now()-start)/(sceneDuration*1000));
        ctx.fillStyle="#07111f";ctx.fillRect(0,0,720,1280);
        if(img){const scale=1+.08*p,w=720*scale,h=1280*scale;ctx.globalAlpha=.82;ctx.drawImage(img,(720-w)/2,(1280-h)/2,w,h);ctx.globalAlpha=1;}
        const grad=ctx.createLinearGradient(0,650,0,1280);grad.addColorStop(0,"transparent");grad.addColorStop(1,"rgba(0,0,0,.92)");ctx.fillStyle=grad;ctx.fillRect(0,650,720,630);
        ctx.fillStyle="white";ctx.font="bold 38px system-ui";ctx.textAlign="center";wrapText(ctx,scene.text,60,900,600,52);
        ctx.fillStyle="#9fb3c8";ctx.font="18px system-ui";ctx.fillText(`Scene ${scene.id} • Shree AI Video`,360,1210);
        await new Promise(r=>requestAnimationFrame(r));
      }
    }
    music?.pause();
    recorder.stop();await done;
    const blob=new Blob(chunks,{type:"video/webm"});const url=URL.createObjectURL(blob);
    setExportUrl(url);setStatus("Browser-rendered video ready — download it below.");
  };

  return <main>
    <header><div className="brand"><span>✦</span><div><b>Shree AI Video</b><small>AI Video Creation Studio</small></div></div><span className="pill">LOCAL + AI</span></header>
    <section className="hero"><div><p className="eyebrow">IDEA → SCRIPT → SCENES → AI MEDIA → VIDEO</p><h1>Make vertical videos from an idea.</h1><p className="sub">Create scenes, generate AI media, add music, save your project and render a vertical video.</p></div></section>

    <section className="toolbar card">
      <div><div><b>AI-style story assistant</b><p>Creates a ready-to-edit scene outline locally.</p></div><button onClick={makeStory}>✨ Generate story</button></div>
      <div><div><b>Project</b><p>Save/load your current work on this device.</p></div><div className="projectBtns"><button onClick={saveProject}>Save</button><button onClick={loadProject}>Load</button></div></div>
      <div><div><b>Voice preview</b><p>Uses your browser’s built-in speech engine.</p></div><select value={voice} onChange={e=>setVoice(e.target.value)}><option value="default">Normal</option><option value="slow">Slow</option><option value="fast">Fast</option></select></div>
      <div><div><b>Background music</b><p>{musicName||"Optional audio file for the local render."}</p></div><label className="upload">Choose music<input type="file" accept="audio/*" onChange={e=>{const f=e.target.files?.[0];if(f)attachMusic(f)}}/></label></div>
    </section>

    <section className="grid">
      <div className="card editor"><div className="cardHead"><h2>1. Your script</h2><button onClick={buildScenes}>Create scenes</button></div><textarea value={script} onChange={e=>setScript(e.target.value)} placeholder="Write one scene per line…"/><div className="hint">{sceneCount} scene lines • 9:16 export • browser renderer needs no API key</div></div>
      <div className="card"><div className="cardHead"><h2>2. Scenes</h2><span>{scenes.length}</span></div>{!scenes.length?<div className="empty">Create scenes to unlock narration and AI media.</div>:<div className="scenes">{scenes.map(s=><div className="scene" key={s.id}><div className="sceneNo">{s.id}</div><div className="sceneText"><b>{s.text}</b>{images[s.id]&&<img className="sceneImage" src={images[s.id]} alt={`Scene ${s.id}`}/>}</div><div className="actions"><button className="mini" onClick={()=>speak(s.text)}>🔊</button><button className="mini aiButton" onClick={()=>generateImage(s)} disabled={busyImage===s.id}>{busyImage===s.id?"…":"✨ AI image"}</button><label className="upload">{images[s.id]?"✓ Image":"Add image"}<input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f)attachImage(s.id,f)}}/></label></div></div>)}</div>}</div>
    </section>

    <section className="card aiVideo">
      <div className="cardHead"><div><h2>3. AI video generator</h2><p>Server-side provider adapter keeps your API key out of the browser.</p></div><div className="videoControls"><label>Seconds <select value={duration} onChange={e=>setDuration(Number(e.target.value))}><option value={2}>2</option><option value={4}>4</option><option value={6}>6</option><option value={8}>8</option></select></label><button className="primary" onClick={generateVideo} disabled={!scenes.length||busyVideo}>{busyVideo?"Generating…":"✨ Generate AI video"}</button></div></div>
      {aiVideoUrl&&<div className="aiVideoResult"><video src={aiVideoUrl} controls playsInline/><a className="download" href={aiVideoUrl} download="shree-ai-video-ai.mp4">⬇ Download AI video</a></div>}
    </section>

    <section className="card render"><div><h2>4. Final render</h2><p>Local 9:16 WebM render with optional music playback.</p></div><button className="primary" onClick={exportVideo} disabled={!scenes.length}>Render final video</button>{status&&<div className="status">{status}</div>}{exportUrl&&<a className="download" href={exportUrl} download="shree-ai-video.webm">⬇ Download WebM</a>}</section>
    <footer>Shree AI Video • local project save • music selection • AI media adapters • browser rendering fallback</footer>
  </main>;
}

function wrapText(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,maxWidth:number,lineHeight:number){
  const words=text.split(" ");let line="";let yy=y;
  for(const word of words){const test=line?line+" "+word:word;if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,yy);line=word;yy+=lineHeight;}else line=test;}
  if(line)ctx.fillText(line,x,yy);
}