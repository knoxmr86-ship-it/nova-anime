let logged=false;
async function req(u,o){let r=await fetch(u,o);let d=await r.json();return [r,d]}
async function adminLogin(){let [r,d]=await req('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:au.value,password:ap.value})});if(r.ok){logged=true;show()}else am.textContent=d.error}
async function show(){login.style.display='none';panel.style.display='block';let [_,s]=await req('/api/admin/settings');sn.value=s.site_name;sp.value=s.weekly_price;load()}
async function saveSettings(){await req('/api/admin/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({site_name:sn.value,weekly_price:sp.value})});alert('Settings saved')}
async function addAnime(){let body={title:title.value,description:desc.value,poster:poster.value,video_url:video.value};let [r,d]=await req('/api/admin/anime',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)alert(d.error);else{title.value=desc.value=poster.value=video.value='';load()}}
async function load(){let [_,a]=await req('/api/anime');list.innerHTML=a.map(x=>`<div class="item"><span><b>${x.title}</b><br><small>${x.description||''}</small></span><button class="secondary" onclick="del(${x.id})">Delete</button></div>`).join('')}
async function del(id){if(!confirm('Delete this anime?'))return;await req('/api/admin/anime/'+id,{method:'DELETE'});load()}
async function logout(){await req('/api/admin/logout',{method:'POST'});location.reload()}
(async()=>{let r=await fetch('/api/admin/me');if(r.ok)show()})();