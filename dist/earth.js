(() => {
'use strict';
const earth=document.querySelector('.earth');
if(!earth)return;
const canvas=document.createElement('canvas');canvas.className='earth-canvas';canvas.setAttribute('aria-hidden','true');
let gl;
try{gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false,powerPreference:'low-power',preserveDrawingBuffer:false});}catch{return;}
if(!gl)return;
const vertex=`attribute vec2 a_position;varying vec2 v_uv;void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;
const fragment=`precision highp float;
varying vec2 v_uv;
uniform sampler2D u_map;
uniform float u_rotation;
uniform vec3 u_sun;
uniform float u_edge;
const float PI=3.141592653589793;
vec2 mapUV(vec3 n){
 float tilt=.401426; // Earth's axis, held still while its surface rotates.
 vec3 local=vec3(cos(tilt)*n.x+sin(tilt)*n.y,-sin(tilt)*n.x+cos(tilt)*n.y,n.z);
 return vec2(fract(atan(local.x,local.z)/(2.*PI)+.5+u_rotation/(2.*PI)),asin(clamp(local.y,-1.,1.))/PI+.5);
}
void main(){
 vec2 p=(v_uv*2.-1.)*1.012;
 float rr=dot(p,p);
 if(rr>1.025){gl_FragColor=vec4(0.);return;}
 float r=sqrt(rr);
 vec3 n=vec3(p,sqrt(max(0.,1.-min(rr,1.))));
 vec3 sun=normalize(u_sun);
 if(rr>1.){
  float air=exp(-(r-1.)*230.)*.35;
  float facing=max(.1,dot(normalize(vec3(p,.12)),sun));
  gl_FragColor=vec4(vec3(.30,.62,.90),air*facing);return;
 }
 vec2 uv=mapUV(n);
 vec3 photo=texture2D(u_map,uv).rgb;
 vec3 linearColor=pow(photo,vec3(2.2));
 float daylight=max(dot(n,sun),0.);
 float ambient=.045+.045*n.z;
 vec3 color=linearColor*(ambient+daylight*1.08);
 // Ocean reflections move over the same fixed spherical surface as the lighting.
 float ocean=smoothstep(.01,.085,photo.b-photo.r)*smoothstep(-.015,.055,photo.b-photo.g);
 vec3 halfVector=normalize(sun+vec3(0.,0.,1.));
 float sunGlint=pow(max(dot(n,halfVector),0.),52.)*ocean*.085*daylight;
 color+=vec3(.65,.8,1.)*sunGlint;
 color=pow(max(color,vec3(0.)),vec3(1./2.2));
 float rim=pow(1.-n.z,3.4);
 float litRim=max(.08,dot(n,sun));
 color+=vec3(.16,.38,.65)*rim*litRim*1.05;
 float alpha=1.-smoothstep(1.-u_edge,1.,r);
 gl_FragColor=vec4(color,alpha);
}`;
function shader(type,source){const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){gl.deleteShader(sh);throw new Error('Earth shader unavailable');}return sh;}
let program;
try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;}catch{return;}
gl.useProgram(program);
const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
const position=gl.getAttribLocation(program,'a_position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
const rotationLocation=gl.getUniformLocation(program,'u_rotation'),sunLocation=gl.getUniformLocation(program,'u_sun'),edgeLocation=gl.getUniformLocation(program,'u_edge');
gl.uniform1i(gl.getUniformLocation(program,'u_map'),0);
const image=new Image();
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
let loaded=false,contextLost=false,frame=0,lastTime=0,elapsed=0,lastLight=-1,previousRender=0;
const lightSources=[...document.querySelectorAll('[id^="liquid-bevel-"] feDistantLight')];
const still=()=>motionPreference.matches||document.body.classList.contains('calm');
function resize(){if(!loaded||contextLost)return;const size=Math.min(1536,Math.round(earth.clientWidth*Math.min(devicePixelRatio||1,1.5)));if(canvas.width!==size){canvas.width=size;canvas.height=size;gl.viewport(0,0,size,size);gl.uniform1f(edgeLocation,2.2/size);}render();}
function render(){if(!loaded||contextLost)return;
 // A seven-minute rotation; illumination changes much more subtly than geography.
 const orbit=elapsed/420*2*Math.PI;
 const azimuth=235+Math.sin(orbit*.55)*6;
 const elevation=52+Math.sin(orbit*.55+.4)*2;
 const az=azimuth*Math.PI/180,el=elevation*Math.PI/180;
 const sun=[Math.cos(az)*Math.cos(el),-Math.sin(az)*Math.cos(el),Math.sin(el)];
 gl.uniform1f(rotationLocation,.10+orbit);gl.uniform3f(sunLocation,...sun);gl.drawArrays(gl.TRIANGLES,0,6);
 // The glass bevel and the planet receive this one shared directional light.
 if(Math.abs(azimuth-lastLight)>.015){lightSources.forEach(source=>{source.setAttribute('azimuth',azimuth.toFixed(3));source.setAttribute('elevation',elevation.toFixed(3));});document.documentElement.style.setProperty('--planet-reflection',((sun[0]+.65)*75).toFixed(3)+'%');document.documentElement.style.setProperty('--planet-glass-brightness',(0.7+sun[1]*.28).toFixed(4));lastLight=azimuth;}
}
function tick(time){frame=0;if(!loaded||contextLost||document.hidden||still()){lastTime=0;return;}if(lastTime)elapsed+=Math.min((time-lastTime)/1000,.1);lastTime=time;if(time-previousRender>=1000/30){render();previousRender=time;}frame=requestAnimationFrame(tick);}
function start(){cancelAnimationFrame(frame);frame=0;lastTime=0;if(!loaded||contextLost)return;render();if(!document.hidden&&!still())frame=requestAnimationFrame(tick);}
image.onload=()=>{if(contextLost)return;try{gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);gl.generateMipmap(gl.TEXTURE_2D);loaded=true;earth.append(canvas);resize();earth.classList.add('sphere-ready');document.body.classList.add('orbital-lighting');start();}catch{loaded=false;canvas.remove();earth.classList.remove('sphere-ready');document.body.classList.remove('orbital-lighting');}};
image.src='assets/earth-texture.jpg';
new ResizeObserver(resize).observe(earth);
new MutationObserver(start).observe(document.body,{attributes:true,attributeFilter:['class']});
motionPreference.addEventListener('change',start);document.addEventListener('visibilitychange',start);
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;cancelAnimationFrame(frame);earth.classList.remove('sphere-ready');document.body.classList.remove('orbital-lighting');});
// Retain the CSS wallpaper after context loss without interrupting open windows.
canvas.addEventListener('webglcontextrestored',()=>{loaded=false;canvas.remove();});
})();
