"use client";

import { useMemo, useState } from "react";

type Scene = { id:number; text:string };
const starter = `A small village wakes up at sunrise.
A curious child discovers an old map.
The journey begins toward a hidden valley.`;

export default function Home() {
  const [script,setScript]=useState(starter);
  const [scenes,setScenes]=useState<Scene[]>([]);
  const [images,setImages]=useState<Record<number,string>>({});
  const [status,setStatus]=useState("");
  const [exportUrl,setExportUrl]=useState("");
  const [voice,setVoice]=useState("default");

  const sceneCount=useMemo(()=>script.split(/\n+/).filter(s=>s.trim()).length,[script]);

  const buildScenes=()=> {
    const next=script.split(/\n+/).map(s=>s.trim()).filter(Boolean).map((text,id)=>({id:id+1,text}));
    setScenes(next); setStatus(`${next.length} scenes ready`); setExportUrl("");
  };

  const makeStory=()=>{
    const topics=["A mysterious signal appears in the night sky.","A young explorer follows the signal into an ancient forest.","Inside the forest, a hidden doorway opens.","The explorer finds a glowing city and discovers its secret.","At sunrise, the journey becomes a new beginning."];
    setScript(topics.join("\n")); setScenes([]); setStatus("AI-style story draft created — edit it before rendering.");
  };

  const speak=(text:string)=>{
    if(typeof window==="undefined"||!("speechSynthesis" in window)){setStatus("Browser voice is not available.");return;}
    window.speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);
    u.rate=voice==="slow"?.85:voice==="fast"?1.15:1;
    u.pitch=1;
    window.speechSynthesis.speak(u);
    setStatus("Voice preview playing…");
  };

  const attachImage=(id:number,file:File)=>{
    const url=URL.createObjectURL(file);
    setImages(v=>({...v,[id]:url}));
  };

  const exportVideo=async()=>{
    if(!scenes.length){setStatus("Create scenes first.");return;}
    setStatus("Rendering 9:16 video in your browser…");
    const canvas=document.createElement("canvas"); canvas.width=720; canvas.height=1280;
    const ctx=canvas.getContext("2d")!;
    const stream=canvas.captureStream(30);
    const recorder=new MediaRecorder(stream,{mimeType:"video/webm"});
    const chunks:BlobPart[]=[]; recorder.ondataavailable=e=>e.data.size&&chunks.push(e.data);
    const done=new Promise<void>(resolve=>recorder.onstop=()=>resolve()); recorder.start();
    for(const scene of scenes){
      const start=performance.now(), duration=3; const src=images[scene.id];
      let img:HTMLImageElement|undefined;
      if(src){img=new Image();img.src=src;await new Promise(r=>{img!.onload=()=>r(null);img!.onerror=()=>r(null);});}
      while(performance.now()-start<duration*1000){
        const p=Math.min(1,(performance.now()-start)/(duration*1000));
        ctx.fillStyle="#07111f";ctx.fillRect(0,0,720,1280);
        if(img){const scale=1+.08*p,w=720*scale,h=1280*scale;ctx.globalAlpha=.82;ctx.drawImage(img,(720-w)/2,(1280-h)/2,w,h);ctx.globalAlpha=1;}
        const grad=ctx.createLinearGradient(0,650,0,1280);grad.addColorStop(0,"transparent");grad.addColorStop(1,"rgba(0,0,0,.92)");ctx.fillStyle=grad;ctx.fillRect(0,650,720,630);
        ctx.fillStyle="white";ctx.font="bold 38px system-ui";ctx.textAlign="center";wrapText(ctx,scene.text,60,900,600,52);
        ctx.fillStyle="#9fb3c8";ctx.font="18px system-ui";ctx.fillText(`Scene ${scene.id} • Shree AI Video`,360,1210);
        await new Promise(r=>requestAnimationFrame(r));
      }
    }
    recorder.stop();await done;
    const blob=new Blob(chunks,{type:"video/webm"});const url=URL.createObjectURL(blob);
    setExportUrl(url);setStatus("Video ready — download it below.");
  };

  return <main>
    <header><div className="brand"><span>✦</span><div><b>Shree AI Video</b><small>Free Video Creation Studio</small></div></div><span className="pill">FREE • LOCAL</span></header>
    <section className="hero"><div><p className="eyebrow">SCRIPT → SCENES → VOICE → VIDEO</p><h1>Make vertical videos from an idea.</h1><p className="sub">Draft a story, split it into scenes, preview narration, add images and render a 9:16 video on your device.</p></div></section>
    <section className="toolbar card">
      <div><div><b>AI-style story assistant</b><p>Creates a ready-to-edit scene outline without an external API.</p></div><button onClick={makeStory}>✨ Generate story</button></div>
      <div><div><b>Voice preview</b><p>Uses your browser’s built-in speech engine.</p></div><select value={voice} onChange={e=>setVoice(e.target.value)}><option value="default">Normal</option><option value="slow">Slow</option><option value="fast">Fast</option></select></div>
    </section>
    <section className="grid">
      <div className="card editor"><div className="cardHead"><h2>1. Your script</h2><button onClick={buildScenes}>Create scenes</button></div><textarea value={script} onChange={e=>setScript(e.target.value)} placeholder="Write one scene per line…"/><div className="hint">{sceneCount} scene lines • 9:16 export • no API key</div></div>
      <div className="card"><div className="cardHead"><h2>2. Scenes</h2><span>{scenes.length}</span></div>{!scenes.length?<div className="empty">Create scenes to unlock narration and image slots.</div>:<div className="scenes">{scenes.map(s=><div className="scene" key={s.id}><div className="sceneNo">{s.id}</div><div className="sceneText">{s.text}</div><div className="actions"><button className="mini" onClick={()=>speak(s.text)}>🔊</button><label className="upload">{images[s.id]?"✓ Image":"Add image"}<input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f)attachImage(s.id,f)}}/></label></div></div>)}</div>}</div>
    </section>
    <section className="card render"><div><h2>3. Render</h2><p>On-device WebM rendering; no paid video API is used.</p></div><button className="primary" onClick={exportVideo} disabled={!scenes.length}>Render 9:16 video</button>{status&&<div className="status">{status}</div>}{exportUrl&&<a className="download" href={exportUrl} download="shree-ai-video.webm">⬇ Download video</a>}</section>
    <footer>Shree AI Video • Free/open-source friendly foundation • AI model adapters can be added later</footer>
  </main>;
}

function wrapText(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,maxWidth:number,lineHeight:number){
  const words=text.split(" ");let line="";let yy=y;
  for(const word of words){const test=line?line+" "+word:word;if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,yy);line=word;yy+=lineHeight;}else line=test;}
  if(line)ctx.fillText(line,x,yy);
}