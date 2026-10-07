/* G10-ADHESION V6.5.5 — numéro officiel + réinitialisation paiement test — 2026-10-06 */
(function(){
'use strict';
const V='6.5.5', OFFICIAL_WA='+241 07 64 12 449', KMAIL='g10_last_email_v65';
let uMembers=null,uPlatform=null,uSettings=null,uMember=null,page=1,pageSize=50,reconciling=false;
function d(v){return String(v||'').replace(/\D/g,'').replace(/^00/,'')}
function pk(v){var x=d(v);return x.length>=8?x.slice(-8):x}
function key(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function mname(m){return [m&&m.firstName,m&&m.firstName2,m&&m.lastName,m&&m.lastName2].filter(Boolean).join(' ').trim()}
function pname(p){return [p&&p.firstName,p&&p.firstName2,p&&p.lastName,p&&p.lastName2].filter(Boolean).join(' ').trim()||(p&&p.name)||''}
function mobile(){return matchMedia('(max-width:760px)').matches}
function official(){return OFFICIAL_WA}
function waDest(){return OFFICIAL_WA}
function addStyle(){
 if(document.getElementById('g10v65css'))return;
 var s=document.createElement('style');s.id='g10v65css';s.textContent=
 '.g10-first-help{margin:8px 0 12px;padding:11px 12px;border:1px solid #b9d5ea;border-radius:12px;background:#f1f8fe;color:#24425f;font-size:12px;line-height:1.45}'+
 '.g10-test-active{font-weight:900!important;color:#087a48!important}.g10-step-progress{display:flex;justify-content:space-between;gap:10px;margin:10px 0;padding:11px 14px;border-radius:13px;background:#edf6fd;color:#225c89}.g10-step-toggle{display:none;margin-left:auto;border:0;background:#eef4f9;color:#0b4a7a;width:34px;height:34px;border-radius:50%;font-size:22px}'+
 '.g10-extbox{margin:12px 0;padding:12px 14px;border:1px solid #d9e5ef;border-radius:14px;background:#f8fbfe;display:flex;align-items:center;justify-content:space-between;gap:12px}.g10-extbox small{display:block;color:#65778c;margin-top:3px}.g10-modal{position:fixed;inset:0;z-index:12000;display:none;align-items:center;justify-content:center;padding:14px;background:rgba(8,35,58,.72)}.g10-modal.open{display:flex}.g10-dialog{position:relative;width:min(520px,100%);max-height:90dvh;overflow:auto;background:#fff;border-radius:20px;padding:22px}.g10-close{position:absolute;right:12px;top:12px;border:0;border-radius:50%;width:36px;height:36px;font-size:22px}.g10-service{width:100%;border:1px solid #dce5ef;border-radius:12px;background:#fff;padding:12px;margin:7px 0;display:flex;justify-content:space-between;color:#0b355a}'+
 '.g10-platform-tools,.g10-pager{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.g10-pager{justify-content:center;margin-top:12px}.g10-scroll{position:fixed;right:14px;bottom:18px;z-index:5000;display:grid;gap:7px}.g10-scroll button{width:42px;height:42px;border:1px solid #cddbea;border-radius:50%;background:#fff;color:#0b4a7a;font-size:20px;box-shadow:0 8px 20px rgba(8,35,58,.16)}.g10-menu{display:none!important}#directionApp .sidebar{overflow-y:auto}#directionApp .side-foot{position:static!important;margin-top:16px!important}'+
 '@media(max-width:760px){#directionApp{display:block!important}#directionApp.hidden{display:none!important}#directionApp .sidebar{display:block!important;position:fixed!important;left:0;top:0;width:min(84vw,310px)!important;height:100dvh!important;z-index:7000;transform:translateX(-105%);transition:.2s;overflow-y:auto!important}#directionApp.g10-open .sidebar{transform:translateX(0)}#directionApp .main{padding:66px 12px 95px!important}.g10-menu.g10-show{display:flex!important;position:fixed;left:12px;top:max(10px,env(safe-area-inset-top));z-index:6900;border:0;border-radius:12px;padding:10px 13px;background:#0b4a7a;color:#fff;font-weight:900}.g10-step-toggle{display:block}.g10-step-card>.panel-head{cursor:pointer}.g10-step-card.g10-collapsed>:not(.panel-head){display:none!important}.g10-step-card{scroll-margin-top:70px}.g10-extbox{align-items:flex-start;flex-direction:column}.g10-extbox .btn{width:100%}.g10-platform-tools{width:100%;display:grid;grid-template-columns:1fr 1fr}.g10-pager .btn{padding:8px;font-size:11px}.g10-scroll{bottom:94px;right:10px}.g10-step-progress{position:sticky;top:8px;z-index:20}.g10-side-foot{position:static!important}}';
 document.head.appendChild(s);
}
function enhanceLogin(){
 var c=document.querySelector('.home-login-card'),e=document.getElementById('homeEmail'),p=document.getElementById('homePassword');if(!c||!e||!p)return;
 e.name='username';e.autocomplete='username';p.name='password';p.autocomplete='current-password';
 if(!e.value&&localStorage.getItem(KMAIL))e.value=localStorage.getItem(KMAIL);
 var bs=[].slice.call(c.querySelectorAll('.home-login-btn')),login=bs.find(function(b){return /se connecter/i.test(b.textContent||'')}),create=bs.find(function(b){return /cr.er/i.test(b.textContent||'')});
 if(create){create.textContent='Première connexion — Créer mon compte';if(login&&login.parentNode===create.parentNode)login.parentNode.insertBefore(create,login)}
 if(login)login.textContent='J’ai déjà un compte — Se connecter';
 if(!c.querySelector('.g10-first-help')){var h=document.createElement('div');h.className='g10-first-help';h.innerHTML='<b>Première connexion ?</b> Entrez votre courriel et choisissez un mot de passe, puis cliquez d’abord sur <b>Créer mon compte</b>. Utilisez Se connecter seulement si votre compte existe déjà.';var b=c.querySelector('.home-login-btn');if(b)c.insertBefore(h,b)}
}
window.loginFromHome=async function(){
 if(!auth){homeMessage('Firebase n’est pas disponible.',true);return}var email=normalizeEmail(val('homeEmail')),password=val('homePassword');if(!email||!password){homeMessage('Entrez votre adresse courriel et votre mot de passe.',true);return}
 try{if(firebase.auth.Auth&&firebase.auth.Auth.Persistence)await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);homeMessage('Connexion…');var cr=await auth.signInWithEmailAndPassword(email,password);localStorage.setItem(KMAIL,email);currentAuthUser=cr.user;currentUserRole=roleForEmail(cr.user.email||email);if(isPrivilegedRole()){await loadDirectionData();enterDirection()}else{await loadMemberFromFirebase(cr.user);enterMember()}}
 catch(err){var code=String(err&&err.code||'');if(/invalid-credential|wrong-password|user-not-found/.test(code))homeMessage('Compte introuvable ou mot de passe incorrect. Si c’est votre première connexion, cliquez sur « Créer mon compte ».',true);else homeMessage(firebaseErrorMessage(err),true)}
};
window.createAccountFromHome=async function(){
 if(!auth){homeMessage('Firebase n’est pas disponible.',true);return}var email=normalizeEmail(val('homeEmail')),password=val('homePassword');if(!email||!email.includes('@')){homeMessage('Entrez une adresse courriel valide.',true);return}if(password.length<6){homeMessage('Choisissez un mot de passe d’au moins 6 caractères.',true);return}
 try{if(firebase.auth.Auth&&firebase.auth.Auth.Persistence)await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);homeMessage('Création du compte…');var cr=await auth.createUserWithEmailAndPassword(email,password);localStorage.setItem(KMAIL,email);currentAuthUser=cr.user;currentUserRole=roleForEmail(email);currentMember=createMemberForEmail(email);currentMember.firebaseUid=cr.user.uid;currentMember.emailVerified=!!cr.user.emailVerified;await saveMemberToFirebase(currentMember);try{await cr.user.sendEmailVerification()}catch(e){}homeMessage('Compte créé. Un e-mail de vérification vient de vous être envoyé. Ouvrez-le, cliquez sur le lien pour confirmer votre adresse, puis revenez dans l’application. Vous pouvez déjà compléter votre dossier.');enterMember()}catch(err){homeMessage(firebaseErrorMessage(err),true)}
};
function findMatch(m,emailOnly){
 var email=normalizeEmail(m&&m.email||''),ph=pk(m&&m.phone),fn=key(mname(m)),first=key(m&&m.firstName),a=[];
 platform.forEach(function(p,i){var pe=normalizeEmail(p.email||''),pp=pk(p.phone||p.telephone||p.whatsapp||''),pn=key(pname(p)),sc=0,r='';if(email&&pe&&email===pe){sc=100;r='courriel'}else if(!emailOnly&&ph&&pp&&ph===pp){sc=95;r='téléphone'}else if(!emailOnly&&fn&&pn&&fn===pn){sc=90;r='nom complet'}else if(!emailOnly&&first&&pn&&first===pn){sc=82;r='prénom / nom WhatsApp'}else if(!emailOnly&&fn&&pn&&fn.length>=5&&(fn.includes(pn)||pn.includes(fn))){sc=75;r='nom proche'}if(sc)a.push({index:i,score:sc,reason:r})});
 a.sort(function(x,y){return y.score-x.score});if(!a.length)return{index:-1};if(a.length>1&&a[0].score===a[1].score&&a[0].score<95)return{index:-1,ambiguous:true};return a[0]
}
window.findPlatformByEmail=function(email){return findMatch(currentMember?Object.assign({},currentMember,{email:email||currentMember.email}):{email:email},!currentMember).index};
async function updatePlatformFrom(m,status){
 var i=Number.isInteger(m.platformIndex)?m.platformIndex:findMatch(m,false).index;if(i<0||!platform[i])return -1;m.platformIndex=i;var p=platform[i];platform[i]=Object.assign({},p,{firstName:m.firstName||p.firstName||'',firstName2:m.firstName2||p.firstName2||'',lastName:m.lastName||p.lastName||'',lastName2:m.lastName2||p.lastName2||'',email:m.email||p.email||'',phone:m.phone||p.phone||'',country:m.country||p.country||'',profession:m.profession||p.profession||'',expertise:m.expertise||p.expertise||'',status:status||p.status||'Inactif',matchedMemberId:m.id||''});if(isPrivilegedRole())await savePlatformEntryToFirebase(i);return i
}
var oldSaveProfile=window.saveProfile;window.saveProfile=function(){oldSaveProfile();if(currentMember&&currentMember.profileComplete){var m=findMatch(currentMember,false);if(m.index>=0){currentMember.platformIndex=m.index;currentMember.platformMatchStatus='Rapproché automatiquement — '+m.reason;saveMemberToFirebase(currentMember).catch(console.error)}stepUi(true)}};
async function proof(file){
 if(!file)return null;var t=String(file.type||'');if(t==='application/pdf'){if(file.size>450000)throw new Error('PDF trop volumineux : maximum 450 Ko, sinon utilisez une capture.');var x=await new Promise(function(ok,no){var r=new FileReader();r.onload=function(){ok(r.result)};r.onerror=no;r.readAsDataURL(file)});return{data:x,name:file.name,type:t}}
 if(!t.startsWith('image/'))throw new Error('Formats acceptés : JPG, PNG ou PDF.');var src=await new Promise(function(ok,no){var r=new FileReader();r.onload=function(){ok(r.result)};r.onerror=no;r.readAsDataURL(file)}),im=await new Promise(function(ok,no){var i=new Image();i.onload=function(){ok(i)};i.onerror=no;i.src=src}),scale=Math.min(1,900/Math.max(im.width,im.height)),w=Math.round(im.width*scale),h=Math.round(im.height*scale);
 function enc(q,W,H){var c=document.createElement('canvas');c.width=W;c.height=H;var z=c.getContext('2d');z.fillStyle='#fff';z.fillRect(0,0,W,H);z.drawImage(im,0,0,W,H);return c.toDataURL('image/jpeg',q)}var data=enc(.5,w,h);if(data.length>220000){scale=Math.min(1,650/Math.max(im.width,im.height));w=Math.round(im.width*scale);h=Math.round(im.height*scale);data=enc(.4,w,h)}if(data.length>300000)throw new Error('Capture trop volumineuse. Recadrez le reçu.');return{data:data,name:file.name,type:'image/jpeg'}
}
function openProof(p){if(!p||!p.data){alert('Aucun justificatif.');return}var w=window.open('','_blank');if(!w)return;if(p.type==='application/pdf')w.document.write('<iframe src="'+p.data+'" style="border:0;width:100vw;height:100vh"></iframe>');else w.document.write('<body style="margin:0;background:#111;display:grid;place-items:center;min-height:100vh"><img src="'+p.data+'" style="max-width:96vw;max-height:96vh"></body>');w.document.close()}
window.g10Proof=function(id){var m=applications.find(function(a){return a.id===id})||activeMembers.find(function(a){return a.id===id});openProof(m&&m.paymentProofData)};
window.declarePayment=async function(){
 if(!currentMember||!currentMember.formSigned){alert('Validez d’abord la fiche et la signature.');return}if(!val('transactionRef')||!val('paymentDate')){alert('Indiquez la référence et la date.');return}var i=document.getElementById('paymentProof'),f=i&&i.files&&i.files[0];if(!f){alert('Joignez votre justificatif : capture/photo ou PDF.');return}
 try{currentMember.transactionRef=val('transactionRef');currentMember.paymentDate=val('paymentDate');currentMember.paymentMethod=(document.querySelector('input[name=payMethod]:checked')||{}).value||'Airtel Money';currentMember.paymentProofData=await proof(f);currentMember.paymentDeclared=true;currentMember.status='Paiement déclaré — contrôle Direction';upsertApplication();syncMemberEverywhere(currentMember);persist();await saveMemberToFirebase(currentMember);hydrateMember();refreshDirection();stepUi(true);alert('Paiement déclaré avec justificatif. La Direction doit maintenant le vérifier.')}catch(e){alert(e.message||'Impossible de préparer le justificatif.')}
};
window.sendWhatsAppPayment=function(){
 if(!currentMember)return alert('Ouvrez d’abord votre dossier.');var ref=val('transactionRef')||currentMember.transactionRef||'à renseigner',date=val('paymentDate')||currentMember.paymentDate||'à renseigner',name=mname(currentMember)||currentMember.email||'Adhérent',dest=waDest();
 var msg='Bonjour Direction G10, je confirme mon paiement du droit d’adhésion.\nNom : '+name+'\nDossier : '+currentMember.id+'\nMontant : '+settings.membershipFee+' €\nAirtel Money officiel : '+official()+'\nRéférence transaction : '+ref+'\nDate : '+date+'\nLe justificatif est joint dans mon dossier G10. Merci de vérifier et valider mon adhésion.';window.open('https://wa.me/'+d(dest)+'?text='+encodeURIComponent(msg),'_blank','noopener')
};
function testUi(){var e=document.getElementById('paymentDestination');if(e){e.textContent='Airtel Money / WhatsApp officiel : '+official();e.classList.remove('g10-test-active')}document.querySelectorAll('.whatsapp-btn').forEach(function(b){b.textContent='Envoyer la confirmation sur WhatsApp officiel ('+official()+')'})}
function payModal(){if(document.getElementById('g10PayModal'))return;var m=document.createElement('div');m.id='g10PayModal';m.className='g10-modal';m.innerHTML='<div class="g10-dialog"><button class="g10-close">×</button><h3>Ouvrir un service de paiement</h3><p class="muted">Le paiement se fait hors de G10. Revenez ensuite joindre votre justificatif.</p><div id="g10ServiceList"></div><p class="muted">Un service absent peut être proposé à la Direction depuis votre dossier lors d’une prochaine mise à jour.</p></div>';document.body.appendChild(m);m.querySelector('.g10-close').onclick=function(){m.classList.remove('open')};m.onclick=function(e){if(e.target===m)m.classList.remove('open')}}
function extBox(){var f=document.getElementById('membershipPaymentForm');if(!f||document.getElementById('g10ExtBox'))return;var hi=f.querySelector('.payment-highlight');if(!hi)return;var b=document.createElement('div');b.id='g10ExtBox';b.className='g10-extbox';b.innerHTML='<div><b>Option 2 — ouvrir un service de paiement externe</b><small>Facultatif. Effectuez le paiement sur votre service habituel puis revenez joindre la preuve.</small></div><button type="button" class="btn btn-light">Choisir un service</button>';hi.insertAdjacentElement('afterend',b);b.querySelector('button').onclick=function(){payModal();var l=document.getElementById('g10ServiceList');l.innerHTML=services().filter(function(s){return s.active!==false&&s.url}).map(function(s){return '<button class="g10-service" data-u="'+esc(s.url)+'"><b>'+esc(s.name)+'</b><span>Ouvrir ↗</span></button>'}).join('');l.querySelectorAll('[data-u]').forEach(function(x){x.onclick=function(){window.open(x.dataset.u,'_blank','noopener')}});document.getElementById('g10PayModal').classList.add('open')}}
function settingsExt(){
 var sec=document.getElementById('dir-settings'),h=sec&&sec.querySelector('.card.panel');if(!h||document.getElementById('g10V65Settings'))return;var b=document.createElement('div');b.id='g10V65Settings';b.innerHTML='<div class="sep"></div><h3>Numéro officiel G10</h3><div class="field"><label>Airtel Money / WhatsApp</label><input type="text" value="+241 07 64 12 449" readonly></div><p class="muted">Numéro officiel unique utilisé pour les paiements Airtel Money et les confirmations WhatsApp.</p><div class="sep"></div><h3>Services de paiement externes</h3><div id="g10ServiceAdmin"></div><div class="form-grid"><div class="field"><label>Nom du service</label><input id="g10SrvName"></div><div class="field"><label>Lien https://</label><input id="g10SrvUrl" type="url"></div></div><div class="action-row"><button class="btn btn-light" id="g10AddSrv">Ajouter le service</button></div>';h.appendChild(b);document.getElementById('g10AddSrv').onclick=async function(){var n=document.getElementById('g10SrvName').value.trim(),u=document.getElementById('g10SrvUrl').value.trim();if(!n||!/^https?:\/\//i.test(u)){alert('Nom et lien https:// requis.');return}services().push({name:n,url:u,active:true});await saveSettingsToFirebase();renderSrv();document.getElementById('g10SrvName').value='';document.getElementById('g10SrvUrl').value=''};renderSrv()
}
window.g10RemoveSrv=async function(i){settings.externalPaymentServices=services().filter(function(s,j){return j!==i});await saveSettingsToFirebase();renderSrv()};
function renderSrv(){var x=document.getElementById('g10ServiceAdmin');if(x)x.innerHTML=services().map(function(s,i){return '<div style="display:flex;justify-content:space-between;gap:8px;border:1px solid #dce5ef;border-radius:10px;padding:9px;margin:6px 0"><span><b>'+esc(s.name)+'</b><br><small>'+esc(s.url)+'</small></span><button class="btn btn-light" onclick="g10RemoveSrv('+i+')">Retirer</button></div>'}).join('')}
function syncDirectionMenu(){var app=document.getElementById('directionApp'),b=document.getElementById('g10Menu');if(!b)return;var show=mobile()&&app&&!app.classList.contains('hidden');b.classList.toggle('g10-show',!!show);if(!show&&app)app.classList.remove('g10-open')}
function navFix(){var app=document.getElementById('directionApp');if(!app)return;if(!document.getElementById('g10Menu')){var b=document.createElement('button');b.id='g10Menu';b.className='g10-menu';b.innerHTML='☰ Menu';b.onclick=function(){app.classList.toggle('g10-open')};document.body.appendChild(b)}var sb=app.querySelector('.sidebar');if(sb&&!sb.dataset.v65){sb.dataset.v65='1';sb.addEventListener('click',function(e){if(mobile()&&e.target.closest('.navbtn'))app.classList.remove('g10-open')})}if(!document.getElementById('g10Scroll')){var n=document.createElement('div');n.id='g10Scroll';n.className='g10-scroll';n.innerHTML='<button>↑</button><button>↓</button>';n.children[0].onclick=function(){scrollTo({top:0,behavior:'smooth'})};n.children[1].onclick=function(){scrollTo({top:document.documentElement.scrollHeight,behavior:'smooth'})};document.body.appendChild(n)}syncDirectionMenu()}
function platformTools(){var s=document.getElementById('dir-platform'),t=s&&s.querySelector('.toolbar');if(!t||document.getElementById('g10Tools'))return;var w=document.createElement('div');w.id='g10Tools';w.className='g10-platform-tools';w.innerHTML='<select id="g10Status"><option value="">Tous les statuts</option><option>Inactif</option><option>Inscrit</option><option>Adhérent</option><option>Actif</option></select><select id="g10Size"><option>25</option><option selected>50</option><option>100</option></select><button class="btn btn-light" id="g10Csv">Exporter CSV</button><button class="btn btn-light" id="g10Xls">Exporter Excel</button>';t.appendChild(w);document.getElementById('g10Status').onchange=function(){page=1;renderPlatform()};document.getElementById('g10Size').onchange=function(e){pageSize=Number(e.target.value);page=1;renderPlatform()};document.getElementById('g10Csv').onclick=exportBase;document.getElementById('g10Xls').onclick=exportXls;var tr=s.querySelector('thead tr');if(tr)tr.innerHTML='<th>N°</th><th>Nom</th><th>Contact</th><th>Pays</th><th>Profession / expertise</th><th>Statut</th><th>Action</th>';var p=document.createElement('div');p.id='g10Pager';p.className='g10-pager';s.querySelector('.table-wrap').insertAdjacentElement('afterend',p)}
function filt(){var q=key((document.getElementById('platformSearch')||{}).value||''),st=String((document.getElementById('g10Status')||{}).value||'').toLowerCase();return platform.map(function(p,i){return Object.assign({},p,{i:i})}).filter(function(p){return(!q||key(JSON.stringify(p)).includes(q))&&(!st||String(p.status||'Inactif').toLowerCase().startsWith(st))})}
window.renderPlatform=function(){platformTools();var b=document.getElementById('platformRows');if(!b)return;var r=filt(),pages=Math.max(1,Math.ceil(r.length/pageSize));if(page>pages)page=pages;var start=(page-1)*pageSize,sh=r.slice(start,start+pageSize);b.innerHTML=sh.length?sh.map(function(p,j){var c=String(p.status||'').toLowerCase(),cl=c==='actif'?'badge-ok':c==='adhérent'?'badge-info':c==='inscrit'?'badge-warn':'badge-off';return '<tr><td>'+(start+j+1)+'</td><td><b>'+esc(pname(p)||'—')+'</b></td><td>'+esc(p.email||p.phone||'—')+'</td><td>'+esc(p.country||'—')+'</td><td>'+esc(p.profession||p.expertise||'—')+'</td><td><span class="badge '+cl+'">'+esc(p.status||'Inactif')+'</span></td><td><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-light" onclick="enterMemberFromPlatform('+p.i+')">Ouvrir dossier</button><button class="btn btn-light" onclick="g10EditPlatform('+p.i+')">Modifier</button></div></td></tr>'}).join(''):'<tr><td colspan="7">Aucun membre correspondant.</td></tr>';var p=document.getElementById('g10Pager');if(p){p.innerHTML='<button class="btn btn-light" data-p="first">«</button><button class="btn btn-light" data-p="prev">‹</button><b>Page '+page+' / '+pages+' — '+r.length+' membres</b><button class="btn btn-light" data-p="next">›</button><button class="btn btn-light" data-p="last">»</button>';p.querySelectorAll('[data-p]').forEach(function(x){x.onclick=function(){var a=x.dataset.p;if(a==='first')page=1;if(a==='prev')page=Math.max(1,page-1);if(a==='next')page=Math.min(pages,page+1);if(a==='last')page=pages;renderPlatform()}})}}
window.g10EditPlatform=async function(i){
 if(!isPrivilegedRole()||!platform[i])return;
 var p=platform[i];
 var first=prompt('Prénom',p.firstName||'');if(first===null)return;
 var last=prompt('Nom',p.lastName||p.name||'');if(last===null)return;
 var email=prompt('Adresse courriel',p.email||'');if(email===null)return;
 var phone=prompt('Téléphone / WhatsApp',p.phone||'');if(phone===null)return;
 var country=prompt('Pays',p.country||'');if(country===null)return;
 p.firstName=first.trim();p.lastName=last.trim();p.name='';p.email=email.trim();p.phone=phone.trim();p.country=country.trim();
 try{
   await savePlatformEntryToFirebase(i);
   renderPlatform();refreshDirection();
   await reconcile();
   renderPlatform();refreshDirection();
   alert('Ligne mise à jour dans Firebase. Le rapprochement avec les dossiers existants a été relancé.');
 }catch(e){console.error(e);alert('Impossible d’enregistrer cette modification.')}
};
function rows(){return[['N°','Nom','Prénom 1','Prénom 2','Adresse courriel','Téléphone / WhatsApp','Pays','Profession','Expertise','Statut']].concat(platform.map(function(p,i){return[i+1,p.lastName||p.name||'',p.firstName||'',p.firstName2||'',p.email||'',p.phone||'',p.country||'',p.profession||'',p.expertise||'',p.status||'Inactif']}))}
function exportBase(){downloadCSV('G10_base_plateforme_'+new Date().toISOString().slice(0,10)+'.csv',rows())}
function exportXls(){var rs=rows(),html='<html><meta charset="utf-8"><table border="1">'+rs.map(function(r,i){return'<tr>'+r.map(function(v){return(i?'<td>':'<th>')+esc(v)+(i?'</td>':'</th>')}).join('')+'</tr>'}).join('')+'</table></html>',blob=new Blob(['\ufeff'+html],{type:'application/vnd.ms-excel'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='G10_base_plateforme_'+new Date().toISOString().slice(0,10)+'.xls';a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},700)}
async function reconcile(){if(reconciling||!db||!isPrivilegedRole()||!platform.length)return;reconciling=true;try{for(var z=0;z<applications.length;z++){var m=applications[z];if(!m.profileComplete||!m.firebaseUid)continue;var i=Number.isInteger(m.platformIndex)?m.platformIndex:findMatch(m,false).index;if(i<0||!platform[i])continue;var sum=typeof contributionSummary==='function'?contributionSummary(m):null,status=(sum&&sum.plan&&sum.confirmed>=sum.max)?'Actif':(m.paymentConfirmed||m.active)?'Adhérent':'Inscrit';var changed=m.platformIndex!==i||platform[i].email!==m.email||platform[i].phone!==m.phone||platform[i].status!==status;if(changed){m.platformIndex=i;m.platformMatchStatus='Rapproché automatiquement';platform[i]=Object.assign({},platform[i],{firstName:m.firstName||platform[i].firstName||'',firstName2:m.firstName2||platform[i].firstName2||'',lastName:m.lastName||platform[i].lastName||'',lastName2:m.lastName2||platform[i].lastName2||'',email:m.email||platform[i].email||'',phone:m.phone||platform[i].phone||'',country:m.country||platform[i].country||'',profession:m.profession||platform[i].profession||'',expertise:m.expertise||platform[i].expertise||'',status:status,matchedMemberId:m.id||''});await savePlatformEntryToFirebase(i);await db.collection('members').doc(m.firebaseUid).set({platformIndex:i,platformMatchStatus:m.platformMatchStatus,updatedAt:new Date().toISOString()},{merge:true})}}}catch(e){console.warn(e)}reconciling=false}
function stop(){[uMembers,uPlatform,uSettings,uMember].forEach(function(f){try{if(typeof f==='function')f()}catch(e){}});uMembers=uPlatform=uSettings=uMember=null}
function dirRT(){if(!db||!isPrivilegedRole())return;uMembers=db.collection('members').onSnapshot(function(s){applications=s.docs.map(function(x){return Object.assign({},x.data(),{firebaseUid:x.id})});activeMembers=applications.filter(function(a){return a.active});refreshDirection();setTimeout(reconcile,80)});uPlatform=db.collection('platform').orderBy('order').onSnapshot(function(s){platform=s.docs.map(function(x){return Object.assign({},x.data(),{firebaseDocId:x.id})});refreshDirection();refreshLanding();setTimeout(reconcile,80)});uSettings=db.collection('settings').doc('public').onSnapshot(function(s){if(s.exists){settings=Object.assign({},settings,s.data());settings.airtel=OFFICIAL_WA;localStorage.setItem('g10_settings_v2',JSON.stringify(settings));hydrateSettings();refreshLanding();refreshDirection();renderSrv()}})}
function memberFormIsBeingEdited(){var a=document.activeElement;return !!(a&&a.closest&&a.closest('#member-account')&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))}
function memRT(){if(!db||!currentAuthUser||isPrivilegedRole())return;uMember=db.collection('members').doc(currentAuthUser.uid).onSnapshot(function(s){if(!s.exists)return;if(s.metadata&&s.metadata.hasPendingWrites)return;currentMember=Object.assign({},s.data(),{firebaseUid:currentAuthUser.uid,email:s.data().email||currentAuthUser.email||'',emailVerified:!!currentAuthUser.emailVerified});if(!memberFormIsBeingEdited()){hydrateMember();stepUi(false)}})}
var oldEnterD=window.enterDirection;window.enterDirection=function(){oldEnterD();navFix();syncDirectionMenu();platformTools();settingsExt();dirRT()};
var oldEnterM=window.enterMember;window.enterMember=function(){oldEnterM();syncDirectionMenu();extBox();payModal();memRT();stepUi(false);testUi()};
var oldGo=window.goHome;window.goHome=async function(){stop();var r=await oldGo();syncDirectionMenu();return r};
var oldHyd=window.hydrateMember;window.hydrateMember=function(){oldHyd();extBox();testUi();stepUi(false)};
window.renderApplications=function(){var p=applications.filter(function(a){return !a.active}),c=document.getElementById('appCount'),b=document.getElementById('applicationRows');if(c)c.textContent=p.length+' dossier'+(p.length>1?'s':'');if(!b)return;b.innerHTML=p.length?p.map(function(a){var pr=(a.paymentProofData&&a.paymentProofData.data)?'<br><button class="btn btn-light" onclick="g10Proof(\''+esc(a.id)+'\')">Voir justificatif</button>':'',can=a.profileComplete&&a.formSigned&&a.paymentDeclared&&a.paymentProofData&&a.paymentProofData.data;return'<tr><td><b>'+esc(a.id)+'</b></td><td>'+esc(mname(a)||'À compléter')+'<br><small>'+esc(a.email||'')+'</small></td><td>'+(a.profileComplete?'<span class="badge badge-ok">OK</span>':'<span class="badge badge-warn">À compléter</span>')+'</td><td>'+(a.formSigned?'<span class="badge badge-ok">Signée</span>':'<span class="badge badge-warn">À signer</span>')+'</td><td>'+(a.paymentDeclared?'<span class="badge badge-warn">À vérifier</span>':'<span class="badge badge-off">Non déclaré</span>')+pr+'</td><td>'+esc(a.expertise||a.profession||'—')+'</td><td><button class="btn btn-green" '+(!can?'disabled':'')+' onclick="validateApplication(\''+esc(a.id)+'\')">Valider adhésion</button></td></tr>'}).join(''):'<tr><td colspan="7">Aucun dossier en attente.</td></tr>'};
window.validateApplication=async function(id){var i=applications.findIndex(function(a){return a.id===id});if(i<0)return;var a=applications[i];if(!a.profileComplete||!a.formSigned||!a.paymentDeclared||!a.paymentProofData||!a.paymentProofData.data){alert('Profil, fiche signée, déclaration et justificatif requis.');return}a.paymentConfirmed=true;a.active=true;a.status='Adhérent';a.membershipValidatedAt=new Date().toISOString();ensureReceiptIdentity(a);applications[i]=a;var ai=activeMembers.findIndex(function(x){return x.id===id});if(ai>=0)activeMembers[ai]=JSON.parse(JSON.stringify(a));else activeMembers.push(JSON.parse(JSON.stringify(a)));await updatePlatformFrom(a,'Adhérent');if(currentMember&&currentMember.id===id)currentMember=JSON.parse(JSON.stringify(a));persist();try{await saveAnyMemberToFirebase(a)}catch(e){}refreshDirection();alert('Adhésion validée : statut « Adhérent ». Le statut « Actif » sera atteint lorsque la cotisation sera à jour.')};
var oldConfirm=window.confirmContributionPayment;if(typeof oldConfirm==='function')window.confirmContributionPayment=function(mid,pid){oldConfirm(mid,pid);setTimeout(async function(){var m=applications.find(function(a){return a.id===mid})||activeMembers.find(function(a){return a.id===mid}),s=m&&typeof contributionSummary==='function'?contributionSummary(m):null;if(m&&s&&s.plan&&s.confirmed>=s.max){await updatePlatformFrom(m,'Actif');renderPlatform()}},250)};


window.g10ResetTestPayment=async function(id){
 if(!isPrivilegedRole())return alert('Accès réservé à la Direction.');
 var m=applications.find(function(a){return a.id===id})||activeMembers.find(function(a){return a.id===id});
 if(!m)return alert('Dossier introuvable.');
 var name=mname(m)||m.email||id;
 if(!confirm('Réinitialiser uniquement le paiement TEST de '+name+' ?\n\nLe profil, la fiche et la signature seront conservés. La référence, le justificatif et la validation du paiement seront supprimés.'))return;
 ['transactionRef','paymentDate','paymentMethod','paymentProofData','paymentProofName','paymentProofType','paymentValidatedBy','paymentValidatedAt','membershipValidatedAt','receiptYear','receiptSequence'].forEach(function(k){delete m[k]});
 m.paymentDeclared=false;m.paymentConfirmed=false;m.active=false;m.status='Fiche signée — paiement à refaire';
 var ai=applications.findIndex(function(a){return a.id===id});if(ai>=0)applications[ai]=Object.assign({},m);
 activeMembers=activeMembers.filter(function(a){return a.id!==id});
 if(currentMember&&currentMember.id===id)currentMember=Object.assign({},m);
 try{await updatePlatformFrom(m,'Inscrit');await saveAnyMemberToFirebase(m)}catch(e){console.error(e);return alert('Impossible de réinitialiser ce paiement dans Firebase.');}
 persist();refreshDirection();renderApplications();renderActive();if(typeof renderHistory==='function')renderHistory();if(currentMember&&currentMember.id===id)hydrateMember();
 alert('Paiement test réinitialisé. Le profil, la fiche et la signature ont été conservés. Le dossier revient à l’étape Paiement.');
};

function activeTools(){
 var s=document.getElementById('dir-active'),tr=s&&s.querySelector('thead tr');
 if(tr&&!tr.dataset.g10edit){tr.dataset.g10edit='1';tr.innerHTML='<th>ID</th><th>Nom</th><th>Contact</th><th>Pays</th><th>Expertise</th><th>Adhésion</th><th>Cotisation</th><th>Action</th>'}
}
var oldRenderActive=window.renderActive;
window.renderActive=function(){
 activeTools();
 var b=document.getElementById('activeRows');if(!b)return;
 b.innerHTML=activeMembers.length?activeMembers.map(function(a){
   var cps=a.contributionPayments||[],confirmed=cps.filter(function(p){return p.status==='Confirmé'}).reduce(function(s,p){return s+Number(p.amount||0)},0),pending=cps.filter(function(p){return p.status!=='Confirmé'}).length;
   var cot=cps.length?'<span class="badge '+(pending?'badge-warn':'badge-ok')+'">'+confirmed+' € confirmés'+(pending?' · '+pending+' à vérifier':'')+'</span>':'<span class="badge badge-info">À démarrer</span>';
   return '<tr><td>'+esc(a.id)+'</td><td><b>'+esc([a.firstName,a.firstName2,a.lastName,a.lastName2].filter(Boolean).join(' ')||'—')+'</b></td><td>'+esc(a.email||a.phone||'—')+'</td><td>'+esc(a.country||'—')+'</td><td>'+esc(a.expertise||a.profession||'—')+'</td><td><span class="badge badge-ok">Payée & validée</span></td><td>'+cot+'</td><td><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-light" onclick="g10Receipt(\''+esc(a.id)+'\',\'membership\')">Reçu adhésion</button><button class="btn btn-light" onclick="g10EditMemberProfile(\''+esc(a.id)+'\')">Modifier profil</button><button class="btn btn-light" onclick="g10ResetTestPayment(\''+esc(a.id)+'\')">Réinitialiser paiement test</button></div></td></tr>'
 }).join(''):'<tr><td colspan="8">Aucun adhérent actif pour le moment.</td></tr>'
};
window.g10EditMemberProfile=async function(id){
 if(!isPrivilegedRole())return alert('Accès réservé à la Direction.');
 var m=applications.find(function(a){return a.id===id})||activeMembers.find(function(a){return a.id===id});
 if(!m)return alert('Dossier introuvable.');
 var first=prompt('Prénom',m.firstName||'');if(first===null)return;
 var first2=prompt('Deuxième prénom (laisser vide si aucun)',m.firstName2||'');if(first2===null)return;
 var last=prompt('Nom',m.lastName||'');if(last===null)return;
 var last2=prompt('Deuxième nom / nom complémentaire (laisser vide si aucun)',m.lastName2||'');if(last2===null)return;
 var address=prompt('Adresse / résidence',m.address||'');if(address===null)return;
 var email=prompt('Adresse courriel',m.email||'');if(email===null)return;
 var phone=prompt('Téléphone / WhatsApp',m.phone||'');if(phone===null)return;
 var country=prompt('Pays',m.country||'');if(country===null)return;
 m.firstName=first.trim();m.firstName2=first2.trim();m.lastName=last.trim();m.lastName2=last2.trim();m.address=address.trim();m.email=email.trim();m.phone=phone.trim();m.country=country.trim();
 try{
   await saveAnyMemberToFirebase(m);
   var ai=applications.findIndex(function(a){return a.id===id});if(ai>=0)applications[ai]=Object.assign({},applications[ai],m);
   var xi=activeMembers.findIndex(function(a){return a.id===id});if(xi>=0)activeMembers[xi]=Object.assign({},activeMembers[xi],m);
   if(Number.isInteger(m.platformIndex)&&platform[m.platformIndex]){
     var st=platform[m.platformIndex].status||'Adhérent';
     await updatePlatformFrom(m,st);
   }
   refreshDirection();
   alert('Profil adhérent corrigé et enregistré dans Firebase.');
 }catch(e){console.error(e);alert('Impossible d’enregistrer la correction.')}
};


function receiptMember(id){
 return applications.find(function(a){return a.id===id})||activeMembers.find(function(a){return a.id===id})||(currentMember&&currentMember.id===id?currentMember:null)
}
function receiptDate(v){
 if(!v)return '—';var x=String(v);return typeof formatDateFr==='function'?formatDateFr(x.slice(0,10)):x.slice(0,10)
}

function receiptYear(member,payment){
 var src=(payment&&payment.date)||(member&&member.paymentDate)||(member&&member.membershipValidatedAt)||new Date().toISOString();
 var m=String(src).match(/(20\d{2})/);return m?m[1]:String(new Date().getFullYear())
}
function ensureReceiptIdentity(member){
 if(!member)return {year:String(new Date().getFullYear()),seq:'001'};
 var y=member.receiptYear||receiptYear(member,null),n=Number(member.receiptSequence||0);
 if(!n){
   var all=(applications||[]).concat(activeMembers||[]),max=0,seen={};
   all.forEach(function(x){
     if(!x||x.id===member.id||seen[x.id])return;seen[x.id]=1;
     var xy=x.receiptYear||receiptYear(x,null);
     if(String(xy)!==String(y))return;
     var xs=Number(x.receiptSequence||0);if(xs>max)max=xs
   });
   n=max+1;member.receiptYear=String(y);member.receiptSequence=n;
   if(isPrivilegedRole()&&member.firebaseUid)saveAnyMemberToFirebase(member).catch(console.error);
 }
 return {year:String(y),seq:String(n).padStart(3,'0')}
}
function receiptNo(member,type,payment){
 var id=ensureReceiptIdentity(member),base=type==='membership'?'G10-REC-ADH-':'G10-REC-COT-',no=base+id.year+'-'+id.seq;
 if(type!=='membership'&&payment&&payment.plan==='two')no+='-'+String(payment.sequence||1)+'/2';
 return no
}
function receiptHtml(member,type,payment){
 var membership=type==='membership',two=!membership&&payment&&payment.plan==='two',rid=ensureReceiptIdentity(member),year=membership?rid.year:receiptYear(member,payment);
 var title=membership?'REÇU D’ADHÉSION':'REÇU DE COTISATION ANNUELLE';
 var subtitle=membership?'Droit d’adhésion':(two?'Paiement en deux fois':'Paiement en une seule fois');
 var amount=membership?Number(settings.membershipFee||0):Number(payment&&payment.amount||0);
 var method=membership?(member.paymentMethod||'—'):(payment&&payment.method||'—');
 var ref=membership?(member.transactionRef||'—'):(payment&&payment.reference||'—');
 var payDate=membership?(member.paymentDate||member.membershipValidatedAt||''):(payment&&payment.date||'');
 var confirmed=membership?(member.membershipValidatedAt||''):(payment&&payment.confirmedAt||'');
 var note=membership?'Adhésion payée et validée.':(two&&Number(payment.sequence)===1?'1ère échéance validée. 2ème échéance à régler selon le calendrier en vigueur.':(two?'2ème échéance validée. Cotisation annuelle entièrement réglée.':'Cotisation annuelle payée et validée.'));
 var thankTitle=membership?'Merci pour votre adhésion !':(two?'Merci pour votre paiement !':'Merci pour votre cotisation annuelle !');
 var thankText=membership?'Ensemble pour une communauté plus forte.':(two&&Number(payment.sequence)===1?'2ème échéance à régler selon le calendrier en vigueur.':(two?'Votre cotisation annuelle est entièrement réglée.':'Votre soutien contribue au développement de notre communauté.'));
 var name=mname(member)||member.email||member.id;
 var icon=(location.origin+location.pathname.replace(/[^/]*$/,'')+'g10-app-icon.svg');
 var period='01 janvier '+year+' – 31 décembre '+year;
 var meta=membership
   ?'<span>Nom complet</span><b>'+esc(name)+'</b><span>Dossier</span><b>'+esc(member.id||'—')+'</b><span>Pays</span><b>'+esc(member.country||'—')+'</b><span>Contact</span><b>'+esc(member.email||member.phone||'—')+'</b>'
   :'<span>Nom complet</span><b>'+esc(name)+'</b><span>Pays</span><b>'+esc(member.country||'—')+'</b><span>Catégorie</span><b>Membre adhérent</b><span>Période couverte</span><b>'+esc(period)+'</b>'+(two?'<span>Échéance</span><b>'+esc(String(payment.sequence||1))+'e échéance sur 2</b>':'')+'<span>Date du paiement</span><b>'+esc(receiptDate(payDate))+'</b>';
 var amountClass=membership?'green':(two?'blue':'yellow');
 return '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(title)+' — '+esc(name)+'</title><style>'+
 'body{margin:0;background:#eef3f8;font-family:Arial,Helvetica,sans-serif;color:#102b49}.wrap{max-width:760px;margin:24px auto;padding:14px}.receipt{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 18px 50px rgba(10,50,90,.16);border:1px solid #dbe5ef}.head{padding:20px 28px 14px;background:#fff}.brand{display:flex;align-items:center;gap:15px}.brand img{width:72px;height:72px}.brand h1{margin:0;color:#0b355a;font-size:28px;letter-spacing:.2px}.brand .motto{margin:4px 0 0;color:#0b355a;font-size:12px;font-weight:800;letter-spacing:.4px}.flagbar{height:8px;background:linear-gradient(90deg,#16945f 0 33%,#f3c929 33% 66%,#0d6fb8 66%)}.title{background:linear-gradient(135deg,#0b355a,#0d4b80);color:#fff;padding:22px 28px}.title h2{margin:0;font-size:27px}.title p{margin:5px 0 0;font-size:16px;opacity:.95}.badge12{float:right;background:#0d6fb8;padding:7px 13px;border-radius:999px;font-weight:800;margin-top:-5px}.body{padding:27px 28px 20px}.num{display:block;width:max-content;margin:0 auto 22px;padding:9px 14px;background:#edf3f9;border-radius:9px;font-weight:900;color:#0b355a;font-size:16px}.grid{display:grid;grid-template-columns:180px 1fr;gap:10px 16px;font-size:15px}.grid span{color:#5e7287}.grid b{color:#071f38}.amount{margin:24px 0;padding:18px;text-align:center;border-radius:14px}.amount.green{background:#eaf8ef}.amount.yellow{background:#fff5d7}.amount.blue{background:#e5f2ff}.amount small{display:block;font-weight:800}.amount.green small,.amount.green strong{color:#0b6b3d}.amount.yellow small,.amount.yellow strong{color:#755000}.amount.blue small,.amount.blue strong{color:#0b3f78}.amount strong{display:block;font-size:34px;margin-top:5px}.status{display:inline-block;background:#e8f7ee;color:#087a48;padding:7px 11px;border-radius:999px;font-weight:900}.validation{margin-top:25px;padding:18px;border-radius:13px;background:#f4f8fc;border:1px solid #d5e1ed;line-height:1.5}.validation b{color:#0b355a;font-size:17px}.thanks{margin:22px 0 4px;padding-top:16px;border-top:1px solid #aebdca;text-align:center}.thanks b{display:block;color:#0b355a;font-size:17px}.thanks span{display:block;color:#516b84;font-size:13px;margin-top:4px}.miniFlag{width:155px;height:6px;margin:14px auto 0;background:linear-gradient(90deg,#16945f 0 33%,#f3c929 33% 66%,#0d6fb8 66%)}.actions{display:flex;gap:10px;justify-content:center;margin:18px 0}.actions button{border:0;border-radius:10px;padding:11px 16px;font-weight:800;cursor:pointer}.primary{background:#0b355a;color:#fff}.light{background:#fff;color:#0b355a;border:1px solid #cddbea!important}@media print{body{background:#fff}.wrap{margin:0;max-width:none;padding:0}.receipt{box-shadow:none;border:0;border-radius:0}.actions{display:none}}@media(max-width:600px){.brand img{width:58px;height:58px}.brand h1{font-size:22px}.grid{grid-template-columns:1fr}.grid span{font-size:12px}.body,.head,.title{padding-left:18px;padding-right:18px}.title h2{font-size:23px}}'+
 '</style></head><body><div class="wrap"><div class="receipt"><div class="head"><div class="brand"><img src="'+icon+'"><div><h1>CONFÉDÉRATION G10</h1><div class="motto">SOLIDARITÉ • DÉVELOPPEMENT • UNITÉ</div></div></div></div><div class="flagbar"></div><div class="title">'+(two?'<span class="badge12">Échéance '+esc(String(payment.sequence||1))+'/2</span>':'')+'<h2>'+title+'</h2><p>'+subtitle+'</p></div><div class="body"><div class="num">N° '+esc(receiptNo(member,type,payment))+'</div><div class="grid">'+meta+'</div><div class="amount '+amountClass+'"><small>'+(two?'Montant payé ('+esc(String(payment.sequence||1))+'e échéance)':'Montant payé')+'</small><strong>'+esc(String(amount))+' €</strong></div><div class="grid"><span>Mode de paiement</span><b>'+esc(method)+'</b><span>Référence transaction</span><b>'+esc(ref)+'</b><span>Date de transaction</span><b>'+esc(receiptDate(payDate))+'</b><span>Statut</span><b><span class="status">✓ Payé et validé</span></b></div><div class="validation"><b>Validé par la Direction G10</b><br>Date de validation : '+esc(receiptDate(confirmed))+'<br>'+esc(note)+'</div><div class="thanks"><b>'+esc(thankTitle)+'</b><span>'+esc(thankText)+'</span><div class="miniFlag"></div></div></div></div><div class="actions"><button class="primary" onclick="window.print()">Imprimer / Enregistrer en PDF</button><button class="light" onclick="window.close()">Fermer</button></div></div></body></html>'
}
window.g10Receipt=function(memberId,type,paymentId){
 var m=receiptMember(memberId);if(!m)return alert('Dossier introuvable.');
 var p=null;
 if(type==='contribution'){
   p=(m.contributionPayments||[]).find(function(x){return x.id===paymentId});
   if(!p||p.status!=='Confirmé')return alert('Ce reçu sera disponible après confirmation par la Direction.');
 }else{
   if(!m.paymentConfirmed)return alert('Le reçu d’adhésion sera disponible après validation par la Direction.');
   type='membership';
 }
 ensureReceiptIdentity(m);
 var w=window.open('','_blank');if(!w)return alert('Autorisez les fenêtres contextuelles pour ouvrir le reçu.');
 w.document.open();w.document.write(receiptHtml(m,type,p));w.document.close()
};
function membershipReceiptButton(){
 var box=document.getElementById('membershipPaidBox');if(!box||!currentMember)return;
 var old=document.getElementById('g10MembershipReceipt');if(old)old.remove();
 if(currentMember.paymentConfirmed){
   var b=document.createElement('button');b.type='button';b.id='g10MembershipReceipt';b.className='btn btn-light';b.textContent='Voir mon reçu d’adhésion';b.onclick=function(){g10Receipt(currentMember.id,'membership')};box.appendChild(b)
 }
}
var oldHydReceipt=window.hydrateMember;
window.hydrateMember=function(){oldHydReceipt();membershipReceiptButton();setTimeout(addMemberContributionReceipts,0)};
function addMemberContributionReceipts(){
 if(!currentMember)return;var body=document.getElementById('memberContributionRows');if(!body)return;
 var rows=[].slice.call(body.querySelectorAll('tr')),payments=currentMember.contributionPayments||[];
 rows.forEach(function(tr,i){var p=payments[i],td=tr.lastElementChild;if(!p||!td||p.status!=='Confirmé'||td.querySelector('.g10-receipt-btn'))return;var b=document.createElement('button');b.type='button';b.className='btn btn-light g10-receipt-btn';b.style.marginLeft='6px';b.textContent='Voir reçu';b.onclick=function(){g10Receipt(currentMember.id,'contribution',p.id)};td.appendChild(b)})
}
var oldRenderContribMember=window.renderContributionMember;
window.renderContributionMember=function(){oldRenderContribMember();addMemberContributionReceipts()};
var oldRenderContribDir=window.renderContributionPayments;
window.renderContributionPayments=function(){
 oldRenderContribDir();
 var body=document.getElementById('contributionPaymentRows');if(!body)return;
 var flat=[];applications.forEach(function(m){(m.contributionPayments||[]).forEach(function(p){flat.push({m:m,p:p})})});
 [].slice.call(body.querySelectorAll('tr')).forEach(function(tr,i){var x=flat[i],td=tr.lastElementChild;if(!x||!td||x.p.status!=='Confirmé'||td.querySelector('.g10-receipt-btn'))return;var b=document.createElement('button');b.type='button';b.className='btn btn-light g10-receipt-btn';b.style.marginLeft='6px';b.textContent='Reçu';b.onclick=function(){g10Receipt(x.m.id,'contribution',x.p.id)};td.appendChild(b)})
};

function init(){addStyle();enhanceLogin();navFix();platformTools();markCards();extBox();payModal();settingsExt();testUi();if(auth&&firebase.auth.Auth&&firebase.auth.Auth.Persistence)auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function(){});addEventListener('resize',function(){stepUi(false);syncDirectionMenu()});console.info('G10 Adhésion V'+V+' chargé')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
/* G10-ADHESION V6.5.13 — statut actif après cotisation + accordéons + Mes documents */
(function(){
'use strict';
window.G10_APP_VERSION='6.5.13';
function g10ContributionSummary(m){try{return typeof contributionSummary==='function'?contributionSummary(m):null}catch(e){return null}}
function g10IsActive(m){var s=g10ContributionSummary(m);return !!(m&&m.paymentConfirmed&&s&&s.plan&&s.confirmed>=s.max)}
function g10ActiveMembers(){return (applications||[]).filter(g10IsActive)}

/* Les 10 € valident l'adhésion et ouvrent les cotisations. Le statut Actif exige une cotisation annuelle à jour. */
window.updatePublicSummary=async function(){
 if(!db||!isPrivilegedRole())return;
 var n=g10ActiveMembers().length;
 settings.activeCount=n;
 await db.collection('settings').doc('public').set({platformCount:platform.length||settings.platformCount||0,activeCount:n,membershipFee:Number(settings.membershipFee||0),monthlyContribution:Number(settings.monthlyContribution||0),updatedAt:new Date().toISOString()},{merge:true});
};
window.refreshLanding=function(){
 var pc=document.getElementById('landingPlatformCount'),ac=document.getElementById('landingActiveCount'),mf=document.getElementById('landingMonthlyFee'),fee=document.getElementById('landingFee');
 if(pc)pc.textContent=platform.length?platform.length:(publicSettingsLoaded?Number(settings.platformCount||900):900);
 if(ac)ac.textContent=isPrivilegedRole()?g10ActiveMembers().length:(publicSettingsLoaded?Number(settings.activeCount||0):0);
 if(mf)mf.textContent=(typeof annualAmount==='function'?annualAmount():Number(settings.monthlyContribution||10)*12)+' € / an';
 if(fee)fee.textContent=Number(settings.membershipFee||10)+' €';
};
window.refreshDirection=function(){
 var pc=platform.length||settings.platformCount||900,act=g10ActiveMembers(),adh=(applications||[]).filter(function(a){return a&&a.paymentConfirmed});
 var el=id=>document.getElementById(id);if(el('kPlatform'))el('kPlatform').textContent=pc;if(el('kInactive'))el('kInactive').textContent=Math.max(0,pc-act.length);if(el('kPending'))el('kPending').textContent=(applications||[]).filter(function(a){return !a.paymentConfirmed}).length;if(el('kActive'))el('kActive').textContent=act.length;if(el('kRevenue'))el('kRevenue').textContent=(adh.length*Number(settings.membershipFee||10))+' €';
 if(el('dirMonthly'))el('dirMonthly').textContent=(typeof annualAmount==='function'?annualAmount():120)+' € en une fois';if(el('dirAnnual'))el('dirAnnual').textContent=(typeof annualAmount==='function'?annualAmount():120)+' €';if(el('dirSemesters')){var h=typeof halfAnnualAmount==='function'?halfAnnualAmount():60;el('dirSemesters').textContent=h+' € + '+h+' €'}
 renderApplications();renderActive();renderPlatform();renderHistory();renderContributionPayments();
};
window.renderActive=function(){
 var tr=document.querySelector('#dir-active thead tr');if(tr){tr.innerHTML='<th>ID</th><th>Nom</th><th>Contact</th><th>Pays</th><th>Expertise</th><th>Adhésion</th><th>Cotisation</th><th>Action</th>'}var b=document.getElementById('activeRows');if(!b)return;var rows=g10ActiveMembers();
 b.innerHTML=rows.length?rows.map(function(a){var s=g10ContributionSummary(a),cot=s?'<span class="badge badge-ok">Cotisation à jour</span>':'<span class="badge badge-info">—</span>';return '<tr><td>'+esc(a.id)+'</td><td><b>'+esc([a.firstName,a.firstName2,a.lastName,a.lastName2].filter(Boolean).join(' ')||'—')+'</b></td><td>'+esc(a.email||a.phone||'—')+'</td><td>'+esc(a.country||'—')+'</td><td>'+esc(a.expertise||a.profession||'—')+'</td><td><span class="badge badge-ok">Payée & validée</span></td><td>'+cot+'</td><td><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-light" onclick="g10Receipt(\''+esc(a.id)+'\',\'membership\')">Reçu adhésion</button><button class="btn btn-light" onclick="g10EditMemberProfile(\''+esc(a.id)+'\')">Modifier profil</button></div></td></tr>'}).join(''):'<tr><td colspan="8">Aucun adhérent actif pour le moment.</td></tr>';
};

/* Accordéons : étapes terminées fermées, étape en cours ouverte. */
window.markCards=function(){
 var root=document.getElementById('member-account');if(!root)return;var cards=[].slice.call(root.querySelectorAll(':scope > .card.panel')).filter(function(c){return c.querySelector('.panel-head h3')&&/^[123]\./.test(c.querySelector('.panel-head h3').textContent.trim())});
 cards.forEach(function(c,i){if(c.dataset.g10Accordion)return;c.dataset.g10Accordion='1';c.classList.add('g10-step-card');var h=c.querySelector('.panel-head'),btn=document.createElement('button');btn.type='button';btn.className='g10-step-toggle';btn.setAttribute('aria-label','Ouvrir ou fermer cette étape');btn.textContent='−';h.appendChild(btn);h.style.cursor='pointer';h.addEventListener('click',function(e){if(e.target.closest('button')&&e.target!==btn)return;c.classList.toggle('g10-collapsed');btn.textContent=c.classList.contains('g10-collapsed')?'+':'−'})});
};
window.stepUi=function(force){
 markCards();var root=document.getElementById('member-account');if(!root||!currentMember)return;var cards=[].slice.call(root.querySelectorAll('.g10-step-card'));var done=[!!currentMember.profileComplete,!!currentMember.formSigned,!!currentMember.paymentConfirmed];var current=done[0]?(done[1]?(done[2]?-1:2):1):0;
 cards.forEach(function(c,i){var close=done[i]||current!==i;if(current===-1)close=true;c.classList.toggle('g10-collapsed',close);var btn=c.querySelector('.g10-step-toggle');if(btn)btn.textContent=close?'+':'−'});
};
function g10AccordionCss(){if(document.getElementById('g10v6513css'))return;var s=document.createElement('style');s.id='g10v6513css';s.textContent='.g10-step-toggle{display:block!important;margin-left:auto;border:0;background:#eef4f9;color:#0b4a7a;width:34px;height:34px;border-radius:50%;font-size:22px}.g10-step-card.g10-collapsed>:not(.panel-head){display:none!important}.g10-step-card>.panel-head{margin-bottom:0}.g10-step-card:not(.g10-collapsed)>.panel-head{margin-bottom:13px}';document.head.appendChild(s)}

/* Mes documents : justificatif d'adhésion + reçus archivés. */
function g10PersonalDocs(){
 var sec=document.getElementById('member-docs');if(!sec||!currentMember)return;var box=document.getElementById('g10PersonalDocs');if(!box){box=document.createElement('div');box.id='g10PersonalDocs';box.className='card panel';var top=sec.querySelector('.card.panel');if(top)sec.insertBefore(box,top);else sec.appendChild(box)}
 var rows=[];if(currentMember.paymentProofData&&currentMember.paymentProofData.data)rows.push('<button class="btn btn-light" id="g10OpenMembershipProof">Justificatif du droit d’adhésion</button>');if(currentMember.paymentConfirmed)rows.push('<button class="btn btn-light" onclick="g10Receipt(\''+esc(currentMember.id)+'\',\'membership\')">Reçu d’adhésion</button>');(currentMember.contributionPayments||[]).filter(function(p){return p.status==='Confirmé'}).forEach(function(p){rows.push('<button class="btn btn-light" onclick="g10Receipt(\''+esc(currentMember.id)+'\',\'contribution\',\''+esc(p.id)+'\')">Reçu cotisation '+esc(p.date||'')+'</button>')});
 box.innerHTML='<div class="panel-head"><div><h3>Mes documents</h3><p>Justificatifs et reçus conservés dans votre dossier.</p></div><span class="badge badge-info">Personnel</span></div><div class="action-row">'+(rows.length?rows.join(''):'<span class="muted">Aucun document personnel disponible pour le moment.</span>')+'</div>';var p=document.getElementById('g10OpenMembershipProof');if(p)p.onclick=function(){var d=currentMember.paymentProofData;if(!d||!d.data)return;var w=window.open('','_blank');if(!w)return;if(d.type==='application/pdf')w.document.write('<iframe src="'+d.data+'" style="border:0;width:100vw;height:100vh"></iframe>');else w.document.write('<body style="margin:0;background:#111;display:grid;place-items:center;min-height:100vh"><img src="'+d.data+'" style="max-width:96vw;max-height:96vh"></body>');w.document.close()};
}
var _show=window.showMemberView;window.showMemberView=function(view,btn){var r=_show(view,btn);if(view==='docs')setTimeout(g10PersonalDocs,0);return r};

/* Statut dans Mon compte : adhésion validée != actif tant que la cotisation n'est pas à jour. */
var _sit=window.renderMemberSituation;window.renderMemberSituation=function(){_sit();if(!currentMember)return;var badge=document.getElementById('situationBadge');if(badge){var a=g10IsActive(currentMember);badge.textContent=a?'Adhérent actif':(currentMember.paymentConfirmed?'Adhésion validée — cotisation à démarrer':'Dossier en cours');badge.className='badge '+(a?'badge-ok':'badge-info')}};

/* Après confirmation d'une cotisation, mettre immédiatement à jour Firebase + compteur public. */
var _confirm=window.confirmContributionPayment;window.confirmContributionPayment=function(mid,pid){_confirm(mid,pid);setTimeout(async function(){var m=(applications||[]).find(function(a){return a.id===mid});if(!m)return;var st=g10IsActive(m)?'Actif':'Adhérent';try{var pi=Number.isInteger(m.platformIndex)?m.platformIndex:-1;if(pi>=0&&platform[pi]){platform[pi].status=st;await savePlatformEntryToFirebase(pi)}await saveAnyMemberToFirebase(m);await updatePublicSummary()}catch(e){console.error(e)}refreshDirection();refreshLanding()},500)};

/* Nettoyage ciblé de l'ancienne cotisation de test Marie-Josée (référence YYYY), sans toucher à son profil. */
async function g10CleanupMarieTest(){if(!db||!isPrivilegedRole())return;var m=(applications||[]).find(function(a){return a.id==='G10-ADH-641501'||normalizeEmail(a.email||'')==='mariejoeseeklutsch@gmail.com'});if(!m||!Array.isArray(m.contributionPayments))return;var before=m.contributionPayments.length;m.contributionPayments=m.contributionPayments.filter(function(p){return String(p.reference||'').trim().toUpperCase()!=='YYYY'});if(m.contributionPayments.length!==before){try{await saveAnyMemberToFirebase(m)}catch(e){console.error(e)}persist();refreshDirection()}}

var _enterD=window.enterDirection;window.enterDirection=function(){var r=_enterD();g10AccordionCss();setTimeout(g10CleanupMarieTest,700);return r};
var _enterM=window.enterMember;window.enterMember=function(){var r=_enterM();g10AccordionCss();setTimeout(function(){markCards();stepUi(false);g10PersonalDocs()},0);return r};
var _hyd=window.hydrateMember;window.hydrateMember=function(){_hyd();g10AccordionCss();markCards();stepUi(false);g10PersonalDocs()};

g10AccordionCss();
console.info('G10 Adhésion V6.5.13 chargé — actif après cotisation confirmée');
})();

/* G10-ADHESION V6.5.14 — contrôle final : dédoublonnage + Mes documents visible */
(function(){
'use strict';
window.G10_APP_VERSION='6.5.14';
function keyOf(m){return String((m&&m.id)||'').trim()||('mail:'+String((m&&m.email)||'').trim().toLowerCase())}
function score(m){if(!m)return 0;return (m.paymentConfirmed?1000:0)+(m.paymentDeclared?300:0)+(m.formSigned?100:0)+(m.profileComplete?50:0)+(m.paymentProofData&&m.paymentProofData.data?25:0)+(m.contributionPayments||[]).length*10+Object.keys(m).filter(function(k){return m[k]!==''&&m[k]!=null}).length}
function mergeOne(a,b){var best=score(a)>=score(b)?a:b,other=best===a?b:a,out=Object.assign({},other,best);['profileComplete','formSigned','paymentDeclared','paymentConfirmed','eligibilityConfirmed'].forEach(function(k){out[k]=!!(a&&a[k]||b&&b[k])});if((a&&a.paymentProofData&&a.paymentProofData.data)&&!(out.paymentProofData&&out.paymentProofData.data))out.paymentProofData=a.paymentProofData;if((b&&b.paymentProofData&&b.paymentProofData.data)&&!(out.paymentProofData&&out.paymentProofData.data))out.paymentProofData=b.paymentProofData;var cp=[].concat((a&&a.contributionPayments)||[],(b&&b.contributionPayments)||[]),seen={};out.contributionPayments=cp.filter(function(x){var k=String((x&&x.id)||'')+'|'+String((x&&x.reference)||'')+'|'+String((x&&x.date)||'');if(seen[k])return false;seen[k]=1;return true});out.active=typeof g10IsActive==='function'?g10IsActive(out):!!out.active;return out}
function uniqueApps(list){var map={},order=[];(list||[]).forEach(function(m){var k=keyOf(m);if(!k)return;if(!map[k]){map[k]=m;order.push(k)}else map[k]=mergeOne(map[k],m)});return order.map(function(k){return map[k]})}
function duplicatesFor(id){return (applications||[]).filter(function(x){return keyOf(x)===String(id)})}
function normalizeMemory(){var u=uniqueApps(applications||[]);if(u.length!==(applications||[]).length)applications=u;return u}
window.g10RemoveDuplicate=async function(id){if(!db||!isPrivilegedRole())return;var snap=await db.collection('members').get(),docs=snap.docs.filter(function(d){return keyOf(Object.assign({},d.data(),{firebaseUid:d.id}))===String(id)});if(docs.length<2){alert('Aucun doublon Firebase détecté pour ce dossier.');return}var ranked=docs.map(function(d){return {d:d,m:Object.assign({},d.data(),{firebaseUid:d.id})}}).sort(function(x,y){return score(y.m)-score(x.m)}),keep=ranked[0];if(!confirm('Doublon détecté pour '+id+'. Conserver le dossier le plus complet et supprimer '+(ranked.length-1)+' copie(s) technique(s) ?'))return;var merged=ranked.map(function(x){return x.m}).reduce(function(a,b){return mergeOne(a,b)});merged.firebaseUid=keep.d.id;await db.collection('members').doc(keep.d.id).set(cleanForFirestore(merged),{merge:true});for(var i=1;i<ranked.length;i++)await db.collection('members').doc(ranked[i].d.id).delete();alert('Doublon nettoyé. Un seul dossier '+id+' est conservé.');};
window.renderApplications=function(){var all=uniqueApps(applications||[]),p=all.filter(function(a){return !a.paymentConfirmed}),c=document.getElementById('appCount'),b=document.getElementById('applicationRows');if(c)c.textContent=p.length+' dossier'+(p.length>1?'s':'');if(!b)return;b.innerHTML=p.length?p.map(function(a){var pr=(a.paymentProofData&&a.paymentProofData.data)?'<br><button class="btn btn-light" onclick="g10Proof(\''+esc(a.id)+'\')">Voir justificatif</button>':'',can=a.profileComplete&&a.formSigned&&a.paymentDeclared&&a.paymentProofData&&a.paymentProofData.data,dups=duplicatesFor(a.id).length>1?'<button class="btn btn-light" style="margin-top:6px" onclick="g10RemoveDuplicate(\''+esc(a.id)+'\')">Nettoyer doublon</button>':'';return '<tr><td><b>'+esc(a.id)+'</b></td><td>'+esc(mname(a)||'À compléter')+'<br><small>'+esc(a.email||'')+'</small></td><td>'+(a.profileComplete?'<span class="badge badge-ok">OK</span>':'<span class="badge badge-warn">À compléter</span>')+'</td><td>'+(a.formSigned?'<span class="badge badge-ok">Signée</span>':'<span class="badge badge-warn">À signer</span>')+'</td><td>'+(a.paymentDeclared?'<span class="badge badge-warn">À vérifier</span>':'<span class="badge badge-off">Non déclaré</span>')+pr+'</td><td>'+esc(a.expertise||a.profession||'—')+'</td><td><button class="btn btn-green" '+(!can?'disabled':'')+' onclick="validateApplication(\''+esc(a.id)+'\')">Valider adhésion</button>'+dups+'</td></tr>'}).join(''):'<tr><td colspan="7">Aucun dossier en attente.</td></tr>'};
var oldValidate=window.validateApplication;window.validateApplication=async function(id){normalizeMemory();return oldValidate(id)};
function docsVisible(){var navs=document.querySelectorAll('#memberApp .side-nav .navbtn');navs.forEach(function(b){if(/Documents officiels/i.test(b.textContent))b.innerHTML='📁 Mes documents'});var sec=document.getElementById('member-docs');if(sec){var h=sec.querySelector('.topbar h2'),p=sec.querySelector('.topbar p');if(h)h.textContent='Mes documents';if(p)p.textContent='Vos justificatifs, reçus et documents officiels.'}if(typeof g10PersonalDocs==='function')g10PersonalDocs()}
var oldHM=window.hydrateMember;window.hydrateMember=function(){oldHM();docsVisible()};var oldEM=window.enterMember;window.enterMember=function(){var r=oldEM();setTimeout(docsVisible,0);return r};var oldSMV=window.showMemberView;window.showMemberView=function(v,b){var r=oldSMV(v,b);if(v==='docs')setTimeout(docsVisible,0);return r};
setTimeout(docsVisible,0);
console.info('G10 Adhésion V6.5.14 chargé — dédoublonnage + Mes documents');
})();

/* G10-ADHESION V6.5.15 — FINAL : connexion Direction + séparation Documents officiels / Mes documents */
(function(){
'use strict';
window.G10_APP_VERSION='6.5.15';

/* La V6.5.14 renommait par erreur Documents officiels. On restaure les deux espaces distincts. */
function restoreDocumentAreas(){
  var navs=document.querySelectorAll('#memberApp .side-nav .navbtn');
  navs.forEach(function(b){
    var oc=b.getAttribute('onclick')||'';
    if(oc.indexOf("'docs'")>=0)b.innerHTML='📄 Documents officiels';
    if(oc.indexOf("'personaldocs'")>=0)b.innerHTML='📁 Mes documents';
  });
  var off=document.getElementById('member-docs');
  if(off){var h=off.querySelector('.topbar h2'),p=off.querySelector('.topbar p');if(h)h.textContent='Documents officiels';if(p)p.textContent='Bibliothèque de référence de la Confédération.';}
  var box=document.getElementById('g10PersonalDocs'),host=document.getElementById('g10PersonalDocsHost');
  if(box&&host&&box.parentNode!==host)host.appendChild(box);
}
function renderPersonalDocsFinal(){
  restoreDocumentAreas();
  if(typeof g10PersonalDocs==='function')g10PersonalDocs();
  restoreDocumentAreas();
}

/* Connexion : l'authentification ne doit plus être annulée si une écriture de synthèse échoue. */
async function loadDirectionSafe(){
  if(!db||!isPrivilegedRole())return;
  var rs=await Promise.allSettled([
    db.collection('members').get(),
    db.collection('settings').doc('public').get(),
    db.collection('platform').orderBy('order').get()
  ]);
  if(rs[0].status==='fulfilled'){
    applications=rs[0].value.docs.map(function(d){return Object.assign({},d.data(),{firebaseUid:d.id})});
    if(typeof uniqueApps==='function')applications=uniqueApps(applications);
    activeMembers=applications.filter(function(a){return a&&a.active===true});
  }
  if(rs[1].status==='fulfilled'&&rs[1].value.exists)settings=Object.assign({},DEFAULT_SETTINGS,rs[1].value.data());
  if(rs[2].status==='fulfilled')platform=rs[2].value.docs.map(function(d){return Object.assign({},d.data(),{firebaseDocId:d.id})});
  settings.activeCount=(activeMembers||[]).filter(function(a){return a&&a.active===true}).length;
  try{localStorage.setItem('g10_settings_v2',JSON.stringify(settings))}catch(e){}
  try{hydrateSettings()}catch(e){}
  try{refreshLanding()}catch(e){}
  try{refreshDirection()}catch(e){}
  /* Mise à jour publique non bloquante : une règle Firestore ne doit jamais empêcher l'accès Direction. */
  try{await updatePublicSummary()}catch(e){console.warn('Synthèse publique non mise à jour',e)}
}
window.loginFromHome=async function(){
  if(!auth){homeMessage('Firebase n’est pas disponible.',true);return}
  var email=normalizeEmail(val('homeEmail')),password=val('homePassword');
  if(!email||!password){homeMessage('Entrez votre adresse courriel et votre mot de passe.',true);return}
  try{
    homeMessage('Connexion…');
    var cr=await auth.signInWithEmailAndPassword(email,password);
    try{localStorage.setItem('g10_last_email_v65',email)}catch(e){}
    currentAuthUser=cr.user;currentUserRole=roleForEmail(cr.user.email||email);
    if(isPrivilegedRole()){
      await loadDirectionSafe();
      enterDirection();
      if(typeof dirRT==='function')try{dirRT()}catch(e){console.warn(e)}
    }else{
      await loadMemberFromFirebase(cr.user);enterMember();
    }
  }catch(err){
    console.error('Connexion',err);
    var code=String(err&&err.code||'');
    if(/invalid-credential|wrong-password|user-not-found/.test(code))homeMessage('Compte introuvable ou mot de passe incorrect.',true);
    else if(/too-many-requests/.test(code))homeMessage('Trop de tentatives. Réessayez dans quelques instants.',true);
    else homeMessage('Connexion Firebase impossible ('+(code||'erreur réseau')+'). Réessayez.',true);
  }
};

var smv=window.showMemberView;
window.showMemberView=function(v,b){var r=smv(v,b);if(v==='personaldocs')setTimeout(renderPersonalDocsFinal,0);if(v==='docs')setTimeout(restoreDocumentAreas,0);return r};
var em=window.enterMember;window.enterMember=function(){var r=em();setTimeout(renderPersonalDocsFinal,0);return r};
var hm=window.hydrateMember;window.hydrateMember=function(){hm();setTimeout(renderPersonalDocsFinal,0)};
setTimeout(restoreDocumentAreas,0);
console.info('G10 Adhésion V6.5.15 FINAL chargé — connexion Direction + documents séparés');
})();
