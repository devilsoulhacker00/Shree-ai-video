"use client";

import { useMemo, useState } from "react";

type Scene = { id:number; text:string; image?:string };

const starter = `A small village wakes up at sunrise.
A curious child discovers an old map.
The journey begins toward a hidden valley.`;

export default function Home() {
  const [script,setScript]=useState(starter);
  const [scenes,setScenes]=useState<Scene[]>([]);
  const [images,setImages]=useState<Record<number,string>>({});
  const [status,setStatus]=useState("");
  const [exportUrl,setExportUrl]=useState("");

  const buildScenes=()=> {
    const next=script.split(/\n+/).map(s=>s.trim()).filter(Boolean).map((text,id)=>({id:id+1,text}));
    setScenes(next); setStatus(`${next.length} scenes ready`); setExportUrl("");
  };

  const attachImage=(id:number,file:File)=>{
    const url=URL.createObjectURL(file);
    setImages(v=>({...v,[id]:url}));
  };

  const duration=3;
  const canExport=scenes.length>0;

  const exportVideo=async()=>{
    if(!canExport){setStatus("Create scenes first.");return;}
    setStatus("Rendering in your browser…");
    const canvas=document.createElement("canvas");
    canvas.width=720; canvas.height=1280;
    const ctx=canvas.getContext("2d")!;
    const stream=canvas.captureStream(30);
    const recorder=new MediaRecorder(stream,{mimeType:"video/webm"});
    const chunks:BlobPart[]=[];
    recorder.ondataavailable=e=>e.data.size&&chunks.push(e.data);
    const done=new Promise<void>(resolve=>recorder.onstop=()=>resolve());
    recorder.start();
    for(const scene of scenes){
      const start=performance.now();
      const imgSrc=images[scene.id];
      let img:HTMLImageElement|undefined;
      if(imgSrc){img=new Image();img.src=imgSrc;await new Promise(r=>{img!.onload=()=>r(null);img!.onerror=()=>r(null);});}
      while(performance.now()-start<duration*1000){
        const p=Math.min(1,(performance.now()-start)/(duration*1000));
        ctx.fillStyle="#07111f";ctx.fillRect(0,0,canvas.width,canvas.height);
        if(img){const scale=1+0.08*p;const w=canvas.width*scale,h=canvas.height*scale;ctx.globalAlpha=.78;ctx.drawImage(img,(canvas.width-w)/2,(canvas.height-h)/2,w,h);ctx.globalAlpha=1;}
        const grad=ctx.createLinearGradient(0,700,0,1280);grad.addColorStop(0,"transparent");grad.addColorStop(1,"rgba(0,0,0,.9)");ctx.fillStyle=grad;ctx.fillRect(0,650,720,630);
        ctx.fillStyle="white";ctx.font="bold 38px system-ui";ctx.textAlign="center";
        wrapText(ctx,scene.text,60,900,600,52);
        ctx.fillStyle="#9fb3c8";ctx.font="18px system-ui";ctx.fillText(`Scene ${scene.id} • Shree AI Video`,360,1210);
        await new Promise(r=>requestAnimationFrame(r));
      }
    }
    recorder.stop();await done;
    const blob=new Blob(chunks,{type:"video/webm"});
    const url=URL.createObjectURL(blob);setExportUrl(url);setStatus("Video ready — download it below.");
  };

  return <main>
    <header><div className="brand"><span>✦</span><div><b>Shree AI Video</b><small>Free Video Creation Studio</small></div></div><span className="pill">BROWSER • FREE</span></header>
    <section className="hero"><div><p className="eyebrow">TEXT → SCENES → VIDEO</p><h1>Turn your story into a video.</h1><p className="sub">Create scenes from a script, add your own images, preview the flow, and render a vertical video directly in your browser.</p></div></section>
    <section className="grid">
      <div className="card editor"><div className="cardHead"><h2>1. Your script</h2><button onClick={buildScenes}>Create scenes</button></div><textarea value={script} onChange={e=>setScript(e.target.value)} placeholder="Write one scene per line…"/><div className="hint">One line = one scene • 9:16 export • no API key required</div></div>
      <div className="card"><div className="cardHead"><h2>2. Scenes</h2><span>{scenes.length}</span></div>{scenes.length===0?<div className="empty">Create scenes from your script to begin.</div>:<div className="scenes">{scenes.map(s=><div className="scene" key={s.id}><div className="sceneNo">{s.id}</div><div className="sceneText">{s.text}</div><label className="upload">{images[s.id]?"Image added":"Add image"}<input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f)attachImage(s.id,f)}}/></label></div>)}</div>}</div>
    </section>
    <section className="card render"><div><h2>3. Render video</h2><p>Rendering uses your device, so there is no paid generation API in this MVP.</p></div><button className="primary" onClick={exportVideo} disabled={!canExport}>Render 9:16 video</button>{status&&<div className="status">{status}</div>}{exportUrl&&<a className="download" href={exportUrl} download="shree-ai-video.webm">⬇ Download video</a>}</section>
    <footer>Shree AI Video • Open-source friendly foundation • AI model integrations can be added later</footer>
  </main>;
}

function wrapText(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,maxWidth:number,lineHeight:number){
  const words=text.split(" ");let line="";let yy=y;
  for(const word of words){const test=line?line+" "+word:word;if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,yy);line=word;yy+=lineHeight;}else line=test;}
  if(line)ctx.fillText(line,x,yy);
}