"use client";

import { useEffect, useMemo, useState } from "react";

type Scene = { id:number; text:string; duration:number; transition:"fade"|"slide"|"cut" };
const starter = `A small village wakes up at sunrise.
A curious child discovers an old map.
The journey begins toward a hidden valley.`;
const PROJECT_KEY="shree-ai-video-project-v3";

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
  const [captions,setCaptions]=useState(true);
  const [captionStyle,setCaptionStyle]=useState<"box"|"clean"|"neon">("box");
  const [previewScene,setPreviewScene]=useState(0);
  const [previewPlaying,setPreviewPlaying]=useState(false);

  const sceneCount=useMemo(()=>script.split(/\n+/).filter(s=>s.trim()).length,[script]);
  const totalDuration=useMemo(()=>scenes.reduce((n,s)=>n+s.duration,0),[scenes]);
  const activePreview=useMemo(()=>scenes[previewScene]||null,[scenes,previewScene]);
  useEffect(()=>{if(previewScene>=scenes.length)setPreviewScene(Math.max(0,scenes.length-1));},[scenes.length,previewScene]);
  useEffect(()=>{if(!previewPlaying||!scenes.length)return;const t=window.setTimeout(()=>setPreviewScene(i=>i+1>=scenes.length?0:i+1),(activePreview?.duration||3)*1000);return()=>window.clearTimeout(t);},[previewPlaying,previewScene,scenes.length,activePreview?.duration]);

  useEffect(()=>{try{const raw=localStorage.getItem(PROJECT_KEY);if(!raw)return;const p=JSON.parse(raw);if(typeof p.script==="string")setScript(p.script);if(Array.isArray(p.scenes))setScenes(p.scenes);if(p.images&&typeof p.images==="object")setImages(p.images);if(typeof p.musicName==="string")setMusicName(p.musicName);if(typeof p.captions==="boolean")setCaptions(p.captions);if(["box","clean","neon"].includes(p.captionStyle))setCaptionStyle(p.captionStyle);}catch{}},[]);

  const buildScenes=()=>{const next=script.split(/\n+/).map(s=>s.trim()).filter(Boolean).map((text,id)=>({id:id+1,text,duration:3,transition:"fade" as const}));setScenes(next);setStatus(`${next.length} scenes ready • ${next.length*3}s timeline`);setExportUrl("");setAiVideoUrl("");};
  const updateScene=(id:number,patch:Partial<Scene>)=>setScenes(v=>v.map(s=>s.id===id?{...s,...patch}:s));
  const moveScene=(id:number,dir:-1|1)=>setScenes(v=>{const i=v.findIndex(s=>s.id===id),j=i+dir;if(i<0||j<0||j>=v.length)return v;const a=[...v];[a[i],a[j]]=[a[j],a[i]];return a.map((s,i)=>({...s,id:i+1}));});
  const removeScene=(id:number)=>{setScenes(v=>v.filter(s=>s.id!==id).map((s,i)=>({...s,id:i+1})));setStatus("Scene removed.");};
  const makeStory=()=>{const topics=["A mysterious signal appears in the night sky.","A young explorer follows the signal into an ancient forest.","Inside the forest, a hidden doorway opens.","The explorer finds a glowing city and discovers its secret.","At sunrise, the journey becomes a new beginning."];setScript(topics.join("\n"));setScenes([]);setStatus("AI-style story draft created — edit it before rendering.");};
  const saveProject=()=>{try{localStorage.setItem(PROJECT_KEY,JSON.stringify({script,scenes,images,musicName,captions,captionStyle}));setStatus("Project saved on this device.");}catch{setStatus("Could not save project. Browser storage may be full.");}};
  const exportProject=()=>{try{const payload={version:1,exportedAt:new Date().toISOString(),script,scenes,images,musicName,captions,captionStyle};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="shree-ai-video-project.json";a.click();URL.revokeObjectURL(url);setStatus("Project JSON exported.");}catch{setStatus("Could not export project.");}};
  const importProject=(file:File)=>{const reader=new FileReader();reader.onload=()=>{try{const p=JSON.parse(String(reader.result));if(typeof p.script!=="string"||!Array.isArray(p.scenes))throw new Error();setScript(p.script);setScenes(p.scenes);setImages(p.images&&typeof p.images==="object"?p.images:{});setMusicName(typeof p.musicName==="string"?p.musicName:"");setCaptions(typeof p.captions==="boolean"?p.captions:true);setCaptionStyle(["box","clean","neon"].includes(p.captionStyle)?p.captionStyle:"box");setStatus("Project JSON imported.");}catch{setStatus("Invalid Shree AI Video project file.");}};reader.readAsText(file);};
  const loadProject=()=>{try{const raw=localStorage.getItem(PROJECT_KEY);if(!raw){setStatus("No saved project found.");return;}const p=JSON.parse(raw);setScript(typeof p.script==="string"?p.script:starter);setScenes(Array.isArray(p.scenes)?p.scenes:[]);setImages(p.images&&typeof p.images==="object"?p.images:{});setMusicName(typeof p.musicName==="string"?p.musicName:"");setCaptions(typeof p.captions==="boolean"?p.captions:true);setCaptionStyle(["box","clean","neon"].includes(p.captionStyle)?p.captionStyle:"box");setStatus("Saved project loaded.");}catch{setStatus("Saved project could not be loaded.");}};
  const speak=(text:string)=>{if(typeof window==="undefined"||!("speechSynthesis" in window)){setStatus("Browser voice is not available.");return;}window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=voice==="slow"?.85:voice==="fast"?1.15:1;window.speechSynthesis.speak(u);setStatus("Voice preview playing…");};
  const attachImage=(id:number,file:File)=>{setImages(v=>({...v,[id]:URL.createObjectURL(file)}));};
  const attachMusic=(file:File)=>{setMusicUrl(URL.createObjectURL(file));setMusicName(file.name);setStatus("Background music selected for this session.");};

  const generateImage=async(scene:Scene)=>{setBusyImage(scene.id);setStatus(`Generating AI image for scene ${scene.id}…`);try{const res=await fetch("/api/generate-image",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:`${scene.text}. Cinematic vertical short-video frame, detailed environment, consistent story character, dramatic lighting.`})});if(!res.ok){const data=await res.json().catch(()=>({}));throw new Error(data.error||"AI image generation failed");}setImages(v=>({...v,[scene.id]:URL.createObjectURL(await res.blob())}));setStatus(`AI image ready for scene ${scene.id}.`);}catch(err){setStatus(err instanceof Error?err.message:"AI image generation failed.");}finally{setBusyImage(null);}};
  const generateVideo=async()=>{if(!scenes.length){setStatus("Create scenes first.");return;}setBusyVideo(true);setAiVideoUrl("");setStatus("Generating AI video… this can take a while.");try{const prompt=scenes.map(s=>s.text).join(" ");const res=await fetch("/api/generate-video",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:`${prompt}. Create a cinematic vertical social video, 9:16 composition, coherent visual story.`,duration})});if(!res.ok){const data=await res.json().catch(()=>({}));throw new Error(data.error||"AI video generation failed");}setAiVideoUrl(URL.createObjectURL(await res.blob()));setStatus("AI video ready — preview or download it below.");}catch(err){setStatus(err instanceof Error?err.message:"AI video generation failed.");}finally{setBusyVideo(false);}};

  const exportVideo=async()=>{
    if(!scenes.length){setStatus("Create scenes first.");return;}
    setStatus(musicUrl?"Rendering timeline with mixed background music…":"Rendering timeline…");
    const canvas=document.createElement("canvas");canvas.width=720;canvas.height=1280;const ctx=canvas.getContext("2d")!;
    const videoStream=canvas.captureStream(30);let audioContext:AudioContext|undefined;let music:HTMLAudioElement|undefined;let audioDestination:MediaStreamAudioDestinationNode|undefined;
    if(musicUrl){try{audioContext=new AudioContext();music=new Audio(musicUrl);music.loop=true;music.volume=.22;const source=audioContext.createMediaElementSource(music);audioDestination=audioContext.createMediaStreamDestination();source.connect(audioDestination);source.connect(audioContext.destination);await audioContext.resume();await music.play();}catch{setStatus("Music could not be mixed; rendering video without audio.");music=undefined;}}
    const tracks=[...videoStream.getVideoTracks(),...(audioDestination?.stream.getAudioTracks()||[])];
    const stream=new MediaStream(tracks);const mime=MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")?"video/webm;codecs=vp9,opus":"video/webm";
    const recorder=new MediaRecorder(stream,{mimeType:mime});const chunks:BlobPart[]=[];recorder.ondataavailable=e=>e.data.size&&chunks.push(e.data);const done=new Promise<void>(resolve=>recorder.onstop=()=>resolve());recorder.start();
    try{
      for(let index=0;index<scenes.length;index++){const scene=scenes[index],start=performance.now(),sceneDuration=scene.duration*1000,src=images[scene.id];let img:HTMLImageElement|undefined;
        if(src){img=new Image();img.src=src;await new Promise(r=>{img!.onload=()=>r(null);img!.onerror=()=>r(null);});}
        while(performance.now()-start<sceneDuration){const p=Math.min(1,(performance.now()-start)/sceneDuration);ctx.fillStyle="#07111f";ctx.fillRect(0,0,720,1280);
          if(img){const scale=1+.08*p,w=720*scale,h=1280*scale;let x=(720-w)/2;if(scene.transition==="slide"&&index>0)x+=(1-Math.min(1,p/.45))*720;ctx.globalAlpha=scene.transition==="fade"?Math.min(1,p/.35):.86;ctx.drawImage(img,x,(1280-h)/2,w,h);ctx.globalAlpha=1;}
          const grad=ctx.createLinearGradient(0,620,0,1280);grad.addColorStop(0,"transparent");grad.addColorStop(1,"rgba(0,0,0,.94)");ctx.fillStyle=grad;ctx.fillRect(0,620,720,660);
          if(captions)drawCaption(ctx,scene.text,captionStyle,p);
          ctx.fillStyle="#9fb3c8";ctx.font="18px system-ui";ctx.textAlign="center";ctx.fillText(`Scene ${scene.id} • Shree AI Video`,360,1215);
          await new Promise(r=>requestAnimationFrame(r));
        }
      }
    }finally{music?.pause();if(music)music.currentTime=0;audioContext?.close();recorder.stop();}
    await done;const blob=new Blob(chunks,{type:"video/webm"});setExportUrl(URL.createObjectURL(blob));setStatus(`Final video ready • ${totalDuration}s • ${captions?"captions on":"captions off"}`);
  };

  return <main>
    <header><div className="brand"><span>✦</span><div><b>Shree AI Video</b><small>AI Video Creation Studio</small></div></div><span className="pill">LOCAL + AI</span></header>
    <section className="hero"><div><p className="eyebrow">IDEA → SCRIPT → TIMELINE → AI MEDIA → VIDEO</p><h1>Make vertical videos from an idea.</h1><p className="sub">Build scenes, control timing, add captions and music, generate AI media, save your project and render 9:16 video.</p></div></section>
    <section className="toolbar card">
      <div><div><b>AI-style story assistant</b><p>Creates a ready-to-edit scene outline locally.</p></div><button onClick={makeStory}>✨ Generate story</button></div>
      <div><div><b>Project</b><p>Save/load your current work on this device.</p></div><div className="projectBtns"><button onClick={saveProject}>Save</button><button onClick={loadProject}>Load</button><button onClick={exportProject}>Export</button><label className="mini upload">Import<input type="file" accept="application/json,.json" onChange={e=>{const f=e.target.files?.[0];if(f)importProject(f);e.currentTarget.value=""}}/></label></div></div>
      <div><div><b>Voice preview</b><p>Uses your browser’s built-in speech engine.</p></div><select value={voice} onChange={e=>setVoice(e.target.value)}><option value="default">Normal</option><option value="slow">Slow</option><option value="fast">Fast</option></select></div>
      <div><div><b>Background music</b><p>{musicName||"Optional audio file for the final render."}</p></div><label className="upload">Choose music<input type="file" accept="audio/*" onChange={e=>{const f=e.target.files?.[0];if(f)attachMusic(f)}}/></label></div>
    </section>
    <section className="card captionPanel"><div><b>Captions</b><p>Burn scene text directly into the exported video.</p></div><label className="toggle"><input type="checkbox" checked={captions} onChange={e=>setCaptions(e.target.checked)}/><span>On</span></label><select value={captionStyle} onChange={e=>setCaptionStyle(e.target.value as typeof captionStyle)} disabled={!captions}><option value="box">Classic box</option><option value="clean">Clean</option><option value="neon">Highlight</option></select></section>

    <section className="card previewPanel"><div className="cardHead"><div><h2>Live preview</h2><p className="timelineMeta">Scene {activePreview?.id||0} of {scenes.length} • {activePreview?.duration||0}s</p></div><div className="previewBtns"><button onClick={()=>setPreviewScene(i=>Math.max(0,i-1))} disabled={!scenes.length}>‹</button><button className="primary" onClick={()=>setPreviewPlaying(v=>!v)} disabled={!scenes.length}>{previewPlaying?"Pause":"▶ Preview"}</button><button onClick={()=>setPreviewScene(i=>scenes.length?Math.min(scenes.length-1,i+1):0)} disabled={!scenes.length}>›</button></div></div><div className="previewStage">{activePreview&&<>{images[activePreview.id]?<img src={images[activePreview.id]} alt="" />:<div className="previewPlaceholder">✦<span>Add or generate an image for this scene</span></div>}<div className="previewOverlay"><span>Scene {activePreview.id}</span>{captions&&<strong className={captionStyle}>{activePreview.text}</strong>}</div></>}</div>{scenes.length>0&&<input className="previewScrub" type="range" min="0" max={scenes.length-1} value={previewScene} onChange={e=>{setPreviewPlaying(false);setPreviewScene(Number(e.target.value))}} />}</section>

    <section className="card timeline"><div className="cardHead"><div><h2>1. Timeline</h2><p className="timelineMeta">{scenes.length} scenes • {totalDuration}s total</p></div><button onClick={buildScenes}>Rebuild from script</button></div>{!scenes.length?<div className="empty">Create scenes from your script to start editing the timeline.</div>:<div className="timelineList">{scenes.map((s,i)=><div className="timelineRow" key={s.id}><div className="timelineTrack"><span>Scene {s.id}</span><div className="trackBar"><i style={{width:`${Math.min(100,s.duration/8*100)}%`}}/></div><b>{s.duration}s</b></div><div className="timelineControls"><input aria-label={`Scene ${s.id} duration`} type="range" min="1" max="8" step=".5" value={s.duration} onChange={e=>updateScene(s.id,{duration:Number(e.target.value)})}/><select value={s.transition} onChange={e=>updateScene(s.id,{transition:e.target.value as Scene["transition"]})}><option value="fade">Fade</option><option value="slide">Slide</option><option value="cut">Cut</option></select><button className="mini" onClick={()=>moveScene(s.id,-1)} disabled={i===0}>↑</button><button className="mini" onClick={()=>moveScene(s.id,1)} disabled={i===scenes.length-1}>↓</button><button className="mini danger" onClick={()=>removeScene(s.id)}>Delete</button></div></div>)}</div>}</section>

    <section className="grid">
      <div className="card editor"><div className="cardHead"><h2>2. Your script</h2><button onClick={buildScenes}>Create scenes</button></div><textarea value={script} onChange={e=>setScript(e.target.value)} placeholder="Write one scene per line…"/><div className="hint">{sceneCount} scene lines • timeline durations can be adjusted above</div></div>
      <div className="card"><div className="cardHead"><h2>3. Scene media</h2><span>{scenes.length}</span></div>{!scenes.length?<div className="empty">Create scenes to unlock narration and AI media.</div>:<div className="scenes">{scenes.map(s=><div className="scene" key={s.id}><div className="sceneNo">{s.id}</div><div className="sceneText"><b>{s.text}</b>{images[s.id]&&<img className="sceneImage" src={images[s.id]} alt={`Scene ${s.id}`}/>}</div><div className="actions"><button className="mini" onClick={()=>speak(s.text)}>🔊</button><button className="mini aiButton" onClick={()=>generateImage(s)} disabled={busyImage===s.id}>{busyImage===s.id?"…":"✨ AI image"}</button><label className="upload">{images[s.id]?"✓ Image":"Add image"}<input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f)attachImage(s.id,f)}}/></label></div></div>)}</div>}</div>
    </section>

    <section className="card aiVideo"><div className="cardHead"><div><h2>4. AI video generator</h2><p>Server-side provider adapter keeps your API key out of the browser.</p></div><div className="videoControls"><label>Seconds <select value={duration} onChange={e=>setDuration(Number(e.target.value))}><option value={2}>2</option><option value={4}>4</option><option value={6}>6</option><option value={8}>8</option></select></label><button className="primary" onClick={generateVideo} disabled={!scenes.length||busyVideo}>{busyVideo?"Generating…":"✨ Generate AI video"}</button></div></div>{aiVideoUrl&&<div className="aiVideoResult"><video src={aiVideoUrl} controls playsInline/><a className="download" href={aiVideoUrl} download="shree-ai-video-ai.mp4">⬇ Download AI video</a></div>}</section>
    <section className="card render"><div><h2>5. Final render</h2><p>Local 9:16 WebM render with timeline, captions, transitions and mixed music.</p></div><button className="primary" onClick={exportVideo} disabled={!scenes.length}>Render final video</button>{status&&<div className="status">{status}</div>}{exportUrl&&<a className="download" href={exportUrl} download="shree-ai-video.webm">⬇ Download WebM</a>}</section>
    <footer>Shree AI Video • captions • timeline • transitions • mixed music • AI media • browser rendering</footer>
  </main>;
}

function drawCaption(ctx:CanvasRenderingContext2D,text:string,style:"box"|"clean"|"neon",progress:number){
  const words=text.split(" ");let lines:string[]=[];let line="";
  for(const word of words){const test=line?line+" "+word:word;if(ctx.measureText(test).width>590&&line){lines.push(line);line=word;}else line=test;}if(line)lines.push(line);
  const visible=Math.max(1,Math.ceil(lines.length*progress));const shown=lines.slice(0,visible);const y=1030-(shown.length-1)*42;
  ctx.textAlign="center";ctx.font="bold 34px system-ui";
  if(style==="box"){ctx.fillStyle="rgba(0,0,0,.62)";ctx.fillRect(45,y-42,630,shown.length*45+28);ctx.fillStyle="white";}
  else if(style==="neon"){ctx.shadowColor="#6da7ff";ctx.shadowBlur=18;ctx.fillStyle="white";}
  else {ctx.fillStyle="white";ctx.shadowColor="rgba(0,0,0,.9)";ctx.shadowBlur=8;}
  shown.forEach((line,i)=>ctx.fillText(line,360,y+i*42));ctx.shadowBlur=0;
}