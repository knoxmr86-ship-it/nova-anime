async function api(u,o){let r=await fetch(u,o);let d=await r.json();return [r,d]}
async function boot(){
 const [_,s]=await api('/api/public');
 document.querySelector('.logo').innerHTML=(s.site_name||'NOVA ANIME').replace(/ (.*)/,'<span>$1</span>');
 price.textContent=s.weekly_price; payprice.textContent=`PKR ${s.weekly_price} / week`;
 nav.innerHTML=s.logged_in?`<a href="/admin">Owner</a> &nbsp; <a href="#" onclick="logout()">Logout</a>`:`<a href="/login.html">Login</a> &nbsp; <a href="/admin">Owner</a>`;
 status.textContent=s.is_member?'Active member':'Members only';
 const [r,a]=await api('/api/anime'); grid.innerHTML=a.map(x=>`<article class="anime"><img src="${x.poster||'https://placehold.co/500x750/151521/aaa?text=Anime'}"><div class="info"><h3>${x.title}</h3><p class="tiny">${x.description||''}</p>${s.is_member?`<button onclick="watch(${x.id})">Watch</button>`:`<div class="lock">🔒 Membership required</div>`}</div></article>`).join('');
}
async function watch(id){let [r,d]=await api('/api/anime/'+id);if(!r.ok){alert(d.error);return}window.open(d.video_url,'_blank','noopener')}
async function pay(method){let [r,d]=await api('/api/payment/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({method})});paymsg.textContent=d.message}
async function logout(){await fetch('/api/logout',{method:'POST'});location.reload()}
boot();