/* G10.4 — Rapports réels, lecture seule, aucun jeu de données fictives */
let g10LiveTab='members';
const g10Esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const g10Name=m=>[m.lastName,m.lastName2,m.firstName,m.firstName2].filter(Boolean).join(' ').trim();
const g10Slug=m=>g10Name(m).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'');
const g10Num=v=>Number(v)||0;
const g10Date=v=>{if(!v)return '';const d=new Date(v);return Number.isNaN(d.getTime())?String(v).slice(0,10):d.toLocaleDateString('fr-FR')};
const g10Due=v=>{const d=new Date(v);if(Number.isNaN(d.getTime()))return '';d.setMonth(d.getMonth()+6);return g10Date(d)};
const g10Active=()=>Array.isArray(applications)?applications.filter(m=>m.active&&m.paymentConfirmed):(Array.isArray(activeMembers)?activeMembers.filter(m=>m.active&&m.paymentConfirmed):[]);
function g10Records(){
 const members=g10Active().slice().sort((a,b)=>g10Name(a).localeCompare(g10Name(b),'fr'));
 const rows=[];
 members.forEach(m=>{
  const name=g10Name(m),slug=g10Slug(m),id=m.firebaseUid||m.id||name;
  rows.push({id,name,op:'Adhésion unique',ref:'ADH-'+slug,date:g10Date(m.membershipValidatedAt),eur:g10Num(m.membershipFeePaid??m.membershipFee??settings.membershipFee),state:'Payé',kind:'adh',confirmed:true,xaf:Number.isFinite(Number(m.g10ReceivedXaf))&&Number(m.g10ReceivedXaf)>0?Number(m.g10ReceivedXaf):null});
  const paid=(m.contributionPayments||[]).filter(p=>p.status==='Confirmé').sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
  const rawPlan=String(m.contributionPlan||(paid[0]&&paid[0].plan)||'').trim().toLowerCase();
  const plan=['monthly','one','once','single','1','option1','option 1','une fois'].includes(rawPlan)?'monthly':(['two','2','option2','option 2','twice','deux fois'].includes(rawPlan)?'two':'');
  if(plan==='monthly'){
    const p=paid[0];rows.push({id,name,op:'Cotisation option 1 — une fois',ref:'COT-1FOIS-'+slug,date:p?g10Date(p.date):'',eur:p?g10Num(p.amount):null,state:p?'Payé':'À venir',kind:'cot',confirmed:!!p,xaf:p&&Number(p.g10ReceivedXaf)>0?Number(p.g10ReceivedXaf):null});
  } else if(plan==='two'){
    for(let i=0;i<2;i++){const p=paid[i];rows.push({id,name,op:`Cotisation option 2 — ${i+1}/2`,ref:`COT-${i+1}SUR2-${slug}`,date:p?g10Date(p.date):(i===1&&paid[0]?'Échéance : '+g10Due(paid[0].date):''),eur:p?g10Num(p.amount):null,state:p?'Payé':'À venir',kind:'cot',confirmed:!!p,xaf:p&&Number(p.g10ReceivedXaf)>0?Number(p.g10ReceivedXaf):null});}
  } else {
    rows.push({id,name,op:'Cotisation option 1 — une fois',ref:'COT-1FOIS-'+slug,date:'',eur:null,state:'Non choisie',kind:'cot',confirmed:false,xaf:null});
    rows.push({id,name,op:'Cotisation option 2 — 1/2',ref:'COT-1SUR2-'+slug,date:'',eur:null,state:'Non choisie',kind:'cot',confirmed:false,xaf:null});
    rows.push({id,name,op:'Cotisation option 2 — 2/2',ref:'COT-2SUR2-'+slug,date:'',eur:null,state:'Non choisie',kind:'cot',confirmed:false,xaf:null});
  }
 });return {members,rows};
}
function g10LiveOpen(){
 if(typeof isPrivilegedRole==='function'&&!isPrivilegedRole()){alert('Accès réservé à la Direction.');return;}
 document.querySelectorAll('[id^="dir-"]').forEach(el=>el.classList.add('hidden'));
 const panel=document.getElementById('g10-live-extractions');if(!panel){alert('La section Extractions et rapports est introuvable.');return;}panel.classList.remove('hidden');panel.scrollIntoView({block:'start'});
 const t=document.getElementById('dirTitle');if(t)t.textContent='Extractions et rapports';g10LiveRender('members');
}
function g10LiveFinance(){g10LiveOpen();g10LiveRender('finance');}
// Le raccourci Finances du tableau Adhérents actifs doit ouvrir l'onglet Finances.
document.addEventListener('click',function(event){const button=event.target.closest('button,a');if(!button)return;const label=(button.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();if(label==='prévisualiser finances'||label==='previsualiser finances'){event.preventDefault();event.stopImmediatePropagation();g10LiveFinance();}},true);

function g10LiveRender(tab){g10LiveTab=tab;const {members,rows}=g10Records();const total=rows.filter(r=>r.confirmed).reduce((s,r)=>s+r.eur,0),count=rows.filter(r=>r.confirmed).length;
 const realTotal=rows.filter(r=>r.confirmed&&r.xaf!==null).reduce((sum,r)=>sum+r.xaf,0);const pendingCount=rows.filter(r=>r.confirmed&&r.xaf===null).length;const kpis=`<div style="display:flex;gap:12px;flex-wrap:wrap;margin:15px 0">${[['Adhérents actifs',members.length],['Paiements confirmés',count],['Total €',total.toLocaleString('fr-FR')+' €'],['FCFA vérifiés',realTotal.toLocaleString('fr-FR')+' FCFA']].map(([a,b],i)=>`<div style="background:${['#dbeafe','#dcfce7','#ede9fe','#ffedd5'][i]};border-radius:14px;padding:14px 22px;color:#173b5b"><b>${a}</b><div style="font-size:22px;font-weight:800">${b}</div></div>`).join('')}</div>`;
 let header=[],data=[];
 if(tab==='members'){header=['Référence','Adhérent','Statut','Date validation','Contact'];data=members.map((m,i)=>['G10-'+String(i+1).padStart(3,'0'),g10Name(m),'Actif',g10Date(m.membershipValidatedAt),m.phone||m.email||'']);}
 if(tab==='finance'){header=['Adhérent','Opération','Référence','Date paiement / échéance','Montant €','Montant FCFA','État'];data=rows.map(r=>[r.name,r.op,r.ref,r.date,r.eur===null?'':r.eur,r.xaf===null?'':r.xaf,r.state]);}
 if(tab==='history'){header=['Lot','Du','Au','Paiements','Total €','Total FCFA'];data=[];}
 window.g10LiveCurrent={header,data,tab,rows,members};
 const table=`<div style="overflow:auto"><table class="table" style="min-width:900px;width:100%;border-collapse:collapse"><thead><tr>${header.map(h=>`<th style="background:#176a9b;color:white;padding:12px">${g10Esc(h)}</th>`).join('')}</tr></thead><tbody>${data.map((r,i)=>`<tr style="background:${tab==='finance'?['#e3f0ff','#e8f7ec','#fff2db'][Math.max(0,members.findIndex(m=>g10Name(m)===r[0]))%3]:i%2?'#f1f6fc':'#ffffff'}">${r.map(v=>`<td style="padding:10px;border-bottom:1px solid #d9e5ef">${g10Esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 document.getElementById('g10-live-content').innerHTML=kpis+(tab==='history'?'<p>Les lots historiques ne sont pas encore enregistrés dans Firebase. Aucun historique fictif ne sera affiché.</p>':table)+(tab==='finance'?`<p><b>Total FCFA vérifié : ${realTotal.toLocaleString('fr-FR')} FCFA</b> · ${pendingCount} paiement(s) sans montant FCFA validé.</p><small>Les montants FCFA non validés restent vides. Aucun taux indicatif n'est comptabilisé.</small>`:'');
}
async function g10LiveExcel(){
 if(!window.ExcelJS){alert('La bibliothèque Excel ne s’est pas chargée. Vérifiez la connexion Internet.');return;}
 const {header,data,tab}=window.g10LiveCurrent||{};if(!header)return;
 const wb=new ExcelJS.Workbook(),ws=wb.addWorksheet(({members:'Adhérents',finance:'Finances',history:'Historique'})[tab]);
 ws.mergeCells(1,1,1,header.length);ws.getCell('A1').value='G10 — '+tab.toUpperCase()+' — DONNÉES RÉELLES';ws.getCell('A1').font={bold:true,color:{argb:'FFFFFFFF'},size:17};ws.getCell('A1').fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF123B64'}};ws.getRow(1).height=32;
 const r=ws.getRow(3);header.forEach((h,i)=>{const c=r.getCell(i+1);c.value=h;c.font={bold:true,color:{argb:'FFFFFFFF'}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF176A9B'}};c.alignment={vertical:'middle',horizontal:'center'}});r.height=29;
 data.forEach((row,i)=>{const rr=ws.getRow(i+4);row.forEach((v,j)=>{const c=rr.getCell(j+1);c.value=v;c.fill={type:'pattern',pattern:'solid',fgColor:{argb:tab==='finance'?['FFE3F0FF','FFE8F7EC','FFFFF2DB'][Math.max(0,window.g10LiveCurrent.members.findIndex(m=>g10Name(m)===row[0]))%3]:(i%2?'FFF0F6FC':'FFFFFFFF')}};c.alignment={vertical:'middle',horizontal:(typeof v==='number'?'center':'left')};c.border={bottom:{style:'hair',color:{argb:'FFD9E5EF'}}}});rr.height=25});
 ws.columns=header.map((h,i)=>({width:Math.min(55,Math.max(19,...data.map(row=>String(row[i]??'').length+4),h.length+5))}));ws.autoFilter={from:{row:3,column:1},to:{row:Math.max(3,data.length+3),column:header.length}};ws.views=[{state:'frozen',ySplit:3}];
 const bytes=await wb.xlsx.writeBuffer();const a=document.createElement('a');const u=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));a.href=u;a.download='G10_'+tab+'_reel.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);
}
function g10OfficialBrandImage(){
 const img=document.querySelector('#memberApp .sidebar img, #memberApp aside img, #memberApp .side-nav img, #dirApp .sidebar img, #dirApp aside img, #dirApp .side-nav img');
 const src=img&&(img.currentSrc||img.getAttribute('src'))||'';
 if(!src)return '';
 try{return src.startsWith('data:image/')?src:new URL(src,location.href).href;}catch(e){return '';}
}
function g10BrandHeader(){
 const src=g10OfficialBrandImage();
 return '<header class="g10-print-header">'+(src?'<img src="'+g10Esc(src)+'" alt="Logo officiel G10">':'')+
 '<div><strong>CONFÉDÉRATION DE LA DIASPORA GABONAISE MULTICONTINENTALE — G10</strong></div></header>';
}
function g10LivePDF(){
 const {header,data,tab}=window.g10LiveCurrent||{};
 if(!header||!Array.isArray(data))return alert('Ouvrez les extractions à imprimer.');
 const w=window.open('','_blank');
 if(!w)return alert('Autorisez les fenêtres contextuelles pour imprimer.');
 const name=({members:'Adhérents',finance:'Finances',history:'Historique'})[tab]||'Extractions';
 const table='<table><thead><tr>'+header.map(h=>'<th>'+g10Esc(h)+'</th>').join('')+'</tr></thead><tbody>'+
 data.map(row=>'<tr>'+row.map(v=>'<td>'+g10Esc(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
 const html='<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>G10 — '+name+'</title>'+
 '<style>@page{size:landscape;margin:13mm}body{font:12px Arial,sans-serif;color:#163754;margin:0}'+
 '.g10-print-header{display:flex;align-items:center;gap:20px;border-bottom:2px solid #176a9b;padding:0 0 14px;margin:0 0 20px}'+
 '.g10-print-header img{width:235px;max-height:86px;object-fit:contain;object-position:left center}'+
 'h2{font-size:20px;margin:0 0 15px}table{border-collapse:collapse;width:100%;table-layout:auto}thead{display:table-header-group}'+
 'th{background:#176a9b;color:white}th,td{border:1px solid #c6d4e0;padding:7px;text-align:left;word-break:break-word}tr{break-inside:avoid}'+
 '.actions{margin:18px 0}@media print{.actions{display:none}}</style></head><body>'+
 g10BrandHeader()+'<h2>Extractions et rapports — '+g10Esc(name)+'</h2>'+table+
 '<div class="actions"><button onclick="window.print()">Imprimer / Enregistrer en PDF</button></div></body></html>';
 w.document.open();w.document.write(html);w.document.close();w.focus();
 setTimeout(()=>w.print(),450);
}


/* G10.4 — confirmation du choix de cotisation, distincte du paiement.
   Ajout non destructif : aucune ligne de paiement n'est créée par ce bouton. */
(function(){
  function installChoiceButton(){
    const grid=document.querySelector('#contributionUnlocked .contribution-plan-grid');
    if(!grid||document.getElementById('g10-confirm-contribution-plan'))return;
    const wrap=document.createElement('div');
    wrap.style.cssText='margin:12px 0 16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap';
    const button=document.createElement('button');
    button.type='button';button.id='g10-confirm-contribution-plan';
    button.className='btn btn-primary';button.textContent='Confirmer mon choix de cotisation';
    const feedback=document.createElement('span');
    feedback.id='g10-contribution-choice-status';feedback.setAttribute('role','status');
    feedback.style.cssText='font-size:13px;color:#31516a';
    wrap.append(button,feedback);grid.insertAdjacentElement('afterend',wrap);
    button.addEventListener('click',async function(){
      if(!currentMember?.active||!currentMember?.paymentConfirmed){alert('Votre adhésion doit d’abord être validée par la Direction.');return}
      const selected=document.querySelector('input[name="contributionPlan"]:checked')?.value;
      if(selected!=='monthly'&&selected!=='two'){alert('Sélectionnez une formule.');return}
      const paid=currentMember.contributionPayments||[];
      if(paid.length&&paid.some(p=>p.plan!==selected)){alert('Une cotisation a déjà été déclarée pour une autre formule. Contactez la Direction pour modifier ce choix.');return}
      if(!db||!currentAuthUser||!currentMember.firebaseUid||currentMember.firebaseUid!==currentAuthUser.uid){
        feedback.textContent='Connexion Firebase requise pour enregistrer le choix.';return;
      }
      button.disabled=true;feedback.textContent='Enregistrement en cours…';
      try{
        // Ecriture ciblée pour ne pas écraser des paiements et validations parallèles.
        await db.collection('members').doc(currentAuthUser.uid).update({
          contributionPlan:selected,contributionPlanChosenAt:new Date().toISOString()
        });
        currentMember.contributionPlan=selected;
        currentMember.contributionPlanChosenAt=new Date().toISOString();
        if(typeof syncMemberEverywhere==='function')syncMemberEverywhere(currentMember);
        feedback.textContent='Choix enregistré dans Firebase. Aucun paiement déclaré.';
        if(typeof renderContributionMember==='function')renderContributionMember();
        if(typeof renderMemberSituation==='function')renderMemberSituation();
        if(typeof refreshDirection==='function')refreshDirection();
      }catch(error){
        console.error('Enregistrement de la formule G10',error);
        feedback.textContent='Échec de sauvegarde : votre choix n’a pas été confirmé. Vérifiez votre connexion ou les droits Firebase.';
      }finally{button.disabled=false}
    });
  }
  function adaptDirectionRows(){
    if(typeof window.g10Records!=='function')return;
    const prior=window.g10Records;
    window.g10Records=function(){
      const result=prior();
      if(!result||!Array.isArray(result.rows)||!Array.isArray(result.members))return result;
      const planById=new Map(result.members.map(m=>[
        m.firebaseUid||m.id||g10Name(m),
        ['monthly','two'].includes(m.contributionPlan)?m.contributionPlan:''
      ]));
      const confirmedIds=new Set(result.rows.filter(r=>r.kind==='cot'&&r.confirmed).map(r=>r.id));
      return {...result,rows:result.rows.filter(r=>{
        if(r.kind!=='cot'||confirmedIds.has(r.id))return true;
        const plan=planById.get(r.id);
        if(!plan)return true;
        return plan==='monthly'
          ? r.op==='Cotisation option 1 — une fois'
          : r.op.startsWith('Cotisation option 2 —');
      }).map(r=>{
        if(r.kind!=='cot'||r.confirmed||confirmedIds.has(r.id))return r;
        const plan=planById.get(r.id);
        if(!plan)return r;
        return {...r,state:'Choix confirmé — paiement à venir'};
      })};
    };
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{installChoiceButton();adaptDirectionRows()},{once:true});
  }else{installChoiceButton();adaptDirectionRows()}
})();


/* G10 — vérification manuelle XAF et pièces complémentaires.
 * Aucune confirmation ne crée de nouveau paiement ; les recettes restent vides jusqu'à vérification.
 */
(function(){
'use strict';
const id='g10-xaf-verify';
const fmt=v=>Number(v).toLocaleString('fr-FR');
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const members=()=>Array.isArray(applications)?applications:[];
const privileged=()=>typeof isPrivilegedRole==='function'&&isPrivilegedRole();
function match(mid){return members().find(m=>String(m.id)===String(mid));}
function key(m){return String(m.id||'');}
function refresh(){
 if(typeof refreshDirection==='function')refreshDirection();
 if(typeof g10LiveRender==='function'&&typeof g10LiveTab!=='undefined')g10LiveRender(g10LiveTab);
 if(typeof hydrateMember==='function'&&typeof currentMember!=='undefined'&&currentMember)hydrateMember();
}
async function save(m){
 if(typeof saveAnyMemberToFirebase!=='function')throw Error('La sauvegarde Firebase est indisponible.');
 await saveAnyMemberToFirebase(m);
 if(typeof persist==='function')persist();
}
function allPayments(){
 const result=[];
 members().filter(m=>m.paymentConfirmed).forEach(m=>{
  result.push({m,p:null,label:'Droit d’adhésion',amount:Number(m.membershipFeePaid??m.membershipFee??settings.membershipFee)||10,received:m.g10ReceivedXaf,confirmedAt:m.membershipValidatedAt});
  (m.contributionPayments||[]).filter(p=>p.status==='Confirmé').forEach(p=>result.push({m,p,label:'Cotisation '+(p.sequence||''),amount:Number(p.amount)||0,received:p.g10ReceivedXaf,confirmedAt:p.confirmedAt}));
 });
 return result;
}
function renderPanel(){
 const box=document.getElementById('g10-live-content');
 if(!box||!privileged())return;
 let panel=document.getElementById(id);
 if(!panel){panel=document.createElement('section');panel.id=id;panel.style.cssText='margin:18px 0;padding:18px;border:1px solid #c5d8e9;border-radius:14px;background:#f7fbff;color:#123c5f';}
 const rows=allPayments();
 panel.innerHTML='<h3 style="margin:0 0 8px">Vérification des montants réellement reçus en FCFA</h3>'+
 '<p style="margin:0 0 12px">Cotisation de référence en euros · saisie du montant crédité en FCFA · double confirmation avant toute mise à jour. Aucun montant indicatif.</p>'+
 (rows.length?rows.map((r,i)=>{
 const v=Number(r.received),ok=Number.isSafeInteger(v)&&v>0;
 return '<div style="padding:12px;border:1px solid #dce7f0;border-radius:9px;margin:8px 0;background:#fff">'+
 '<b>'+safe(r.m.firstName||'')+' '+safe(r.m.lastName||'')+'</b> · '+safe(r.label)+
 ' · Référence : '+safe(r.amount)+' €'+
 (ok?'<div data-g10-summary="'+i+'" style="display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-top:10px"><span style="color:#17603d">✓ Montant validé : <b>'+fmt(v)+' FCFA</b></span><button type="button" data-g10-edit="'+i+'" class="btn btn-light">Modifier</button></div>':'')+
 '<div data-g10-editform="'+i+'" style="'+(ok?'display:none;':'display:flex;')+'flex-wrap:wrap;gap:9px;align-items:end;margin-top:8px"><label style="flex:1;min-width:170px">Montant reçu en FCFA<input aria-label="Montant reçu en FCFA" data-g10-amount="'+i+'" type="number" min="1" step="1" placeholder="Montant à vérifier" value="'+(ok?v:'')+'" style="display:block;width:100%;padding:9px;border:1px solid #aac4dc;border-radius:8px"></label>'+
 '<button type="button" data-g10-confirm="'+i+'" class="btn btn-primary" style="padding:10px">'+(ok?'Enregistrer la correction':'Valider le montant')+'</button>'+
 (ok?'<button type="button" data-g10-cancel="'+i+'" class="btn btn-light" style="padding:10px">Annuler</button>':'')+'</div>'+
 (!ok?'<small>À vérifier — aucun FCFA comptabilisé</small>':'')+
 (Array.isArray(r.p?r.p.g10XafHistory:r.m.g10XafHistory)&& (r.p?r.p.g10XafHistory:r.m.g10XafHistory).length?'<details><summary>Historique des validations</summary>'+
 (r.p?r.p.g10XafHistory:r.m.g10XafHistory).map(h=>'<div>'+safe(h.at)+' · '+safe(h.by)+' : '+safe(h.old??'—')+' → '+safe(h.value)+' FCFA</div>').join('')+'</details>':'')+
 '</div>';
 }).join(''):'<p>Aucun paiement confirmé.</p>');
 box.prepend(panel);
 panel.querySelectorAll('[data-g10-edit]').forEach(b=>b.addEventListener('click',()=>{
  const i=b.dataset.g10Edit,summary=panel.querySelector('[data-g10-summary="'+i+'"]'),form=panel.querySelector('[data-g10-editform="'+i+'"]');
  if(summary)summary.style.display='none';
  if(form)form.style.display='flex';
  const input=panel.querySelector('[data-g10-amount="'+i+'"]');if(input)input.focus();
 }));
 panel.querySelectorAll('[data-g10-cancel]').forEach(b=>b.addEventListener('click',()=>{
  const i=b.dataset.g10Cancel,r=allPayments()[Number(i)],summary=panel.querySelector('[data-g10-summary="'+i+'"]'),form=panel.querySelector('[data-g10-editform="'+i+'"]'),input=panel.querySelector('[data-g10-amount="'+i+'"]');
  if(input&&r)input.value=String(r.received||'');
  if(form)form.style.display='none';
  if(summary)summary.style.display='flex';
 }));
 panel.querySelectorAll('[data-g10-confirm]').forEach(b=>b.addEventListener('click',async()=>{
  if(!privileged())return alert('Action réservée à la Direction.');
  const idx=Number(b.dataset.g10Confirm),r=allPayments()[idx];
  if(!r)return alert('Paiement introuvable. Actualisez la page.');
  const inp=panel.querySelector('[data-g10-amount="'+idx+'"]');
  const value=Number(inp&&inp.value);
  if(!Number.isSafeInteger(value)||value<=0)return alert('Saisissez un montant entier en FCFA supérieur à zéro.');
  const target=r.p||r.m;
  const previous=Number(target.g10ReceivedXaf)||null;
  if(previous===value)return alert('Ce montant est déjà enregistré.');
  const verb=previous?'corriger':'valider';
  if(!confirm('Voulez-vous '+verb+' le montant reçu de '+fmt(value)+' FCFA pour '+(r.m.firstName||'')+' '+(r.m.lastName||'')+' ('+r.label+') ?\n\nCette opération mettra à jour les extractions financières.'))return;
  b.disabled=true;
  try{
   const who=(typeof auth!=='undefined'&&auth.currentUser&&(auth.currentUser.email||auth.currentUser.uid))||'Direction G10';
   const history=[...(target.g10XafHistory||[])];
   history.push({old:previous,value,at:new Date().toISOString(),by:who});
   target.g10ReceivedXaf=value;target.g10XafHistory=history;
   await save(r.m);
   if(typeof currentMember!=='undefined'&&currentMember&&currentMember.id===r.m.id)Object.assign(currentMember,r.m);
   refresh();
   alert('Montant confirmé : '+fmt(value)+' FCFA. Les extractions ont été actualisées.');
  }catch(e){target.g10ReceivedXaf=previous;if(Array.isArray(target.g10XafHistory))target.g10XafHistory=target.g10XafHistory.slice(0,-1);alert('Enregistrement non confirmé. '+(e.message||e));b.disabled=false;}
 }));
}
const oldRender=window.g10LiveRender;
if(typeof oldRender==='function'){
 window.g10LiveRender=function(tab){const res=oldRender(tab);if(tab==='finance')renderPanel();return res;};
}
function extras(m){
 const out=[];
 if(m.paymentProofData&&m.paymentProofData.data)out.push({name:'Justificatif de transaction'+(m.paymentMethod?' — '+String(m.paymentMethod):''),data:m.paymentProofData.data,type:m.paymentProofData.type});
 (m.g10ExtraProofs||[]).forEach(x=>out.push(x));
 return out;
}
function renderDocs(){
 if(typeof currentMember==='undefined'||!currentMember)return;
 const m=currentMember;
 const host=document.getElementById('g10PersonalDocs');
 if(!host)return;
 let section=document.getElementById('g10-extra-docs');
 if(!section){section=document.createElement('section');section.id='g10-extra-docs';section.style.cssText='margin-top:14px;padding:14px;border:1px solid #d4e2ed;border-radius:12px';host.appendChild(section);}
 const x=extras(m);
 section.innerHTML='<h3>Justificatifs de transaction</h3><p>Documents transmis par l’adhérent. Le moyen de paiement dépend de chaque transaction ; les fichiers ajoutés ne remplacent pas les pièces existantes.</p>'+
 x.map((f,i)=>'<div style="padding:7px"><button class="btn btn-light" type="button" data-open-proof="'+i+'">Ouvrir · '+safe(f.name||('Pièce '+(i+1)))+'</button></div>').join('')+
 '<label>Ajouter un justificatif de transaction (PDF ou image, 250 Ko maximum par fichier)<input type="file" accept="application/pdf,image/*" id="g10-extra-proof-input"></label>'+
 '<button class="btn btn-primary" type="button" id="g10-extra-proof-save">Ajouter sans remplacer</button><small style="display:block">Pour protéger les dossiers Firebase, les fichiers restent limités en taille. Aucun document n’est supprimé automatiquement.</small>';
 section.querySelectorAll('[data-open-proof]').forEach(button=>button.onclick=()=>{
  const f=extras(currentMember)[Number(button.dataset.openProof)];
  if(!f||!f.data)return;
  const w=window.open('','_blank');
  if(!w)return alert('Autorisez les fenêtres contextuelles.');
  w.document.write(f.type==='application/pdf'?'<iframe src="'+f.data+'" style="width:100%;height:98vh;border:0"></iframe>':'<img src="'+f.data+'" style="max-width:100%;height:auto">');
  w.document.close();
 });
 const btn=section.querySelector('#g10-extra-proof-save');
 btn.onclick=async()=>{
  const file=section.querySelector('#g10-extra-proof-input').files[0];
  if(!file)return alert('Sélectionnez un document.');
  if(!(['application/pdf','image/jpeg','image/png','image/webp'].includes(file.type)))return alert('Formats acceptés : PDF, JPEG, PNG ou WebP.');
  if(file.size>250000)return alert('Document trop volumineux. Limite : 250 Ko.');
  if((m.g10ExtraProofs||[]).length>=3)return alert('Limite de 3 pièces complémentaires pour ce dossier. Contactez la Direction pour un archivage externe.');
  const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
  const old=[...(m.g10ExtraProofs||[])];
  // Firestore limite la taille d'une fiche ; aucune écriture ne doit approcher 1 Mio.
  const used=JSON.stringify(m).length+data.length;
  if(used>850000)return alert('Le dossier est trop volumineux pour enregistrer cette pièce. Aucune pièce existante n’a été modifiée.');
  if(!confirm('Ajouter « '+file.name+' » au dossier sans remplacer les justificatifs existants ?'))return;
  btn.disabled=true;
  m.g10ExtraProofs=[...old,{name:file.name,type:file.type,data,addedAt:new Date().toISOString()}];
  try{await save(m);renderDocs();alert('Justificatif ajouté au dossier.');}
  catch(e){m.g10ExtraProofs=old;btn.disabled=false;alert('Pièce non enregistrée : '+(e.message||e));}
 };
}

/* Exposer les documents personnels au même endroit que les archives d'adhésion.
   Le menu séparé est facultatif ; cette zone est accessible dans Paiements & cotisations. */

/* Reçu G10 autonome : fonctionne même si l'ancien module v65.js n'est pas chargé.
   N'invente ni signature nominative, ni montant reçu, ni numéro de reçu attribué. */
function g10OpenMembershipReceipt(m){
 if(!m||!m.paymentConfirmed){alert('Le paiement doit être confirmé par la Direction avant émission du reçu.');return;}
 const received=Number(m.g10ReceivedXaf)||0;
 if(!received){alert('Le montant FCFA doit d’abord être validé par la Direction pour établir le reçu.');return;}
 const name=[m.firstName,m.firstName2,m.lastName,m.lastName2].filter(Boolean).join(' ').trim()||
  [m.lastName,m.firstName].filter(Boolean).join(' ')||m.id||'Adhérent';
 const ref=String(m.transactionRef||'Non renseignée');
 const fmtDate=v=>{if(!v)return 'Non renseignée';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleDateString('fr-FR');};
 const euro=Number(m.membershipFeePaid??m.membershipFee??10)||10;
 const membershipReference=m.g10MembershipCurrency==='XAF'?(Number(m.g10MembershipReferenceXaf||6560).toLocaleString('fr-FR')+' FCFA'):(euro+' €');
 const history=Array.isArray(m.g10XafHistory)?m.g10XafHistory:[];
 const last=history.length?history[history.length-1]:null;
 const proof=m.paymentProofData;
 const embedded=proof&&proof.data&&String(proof.type||'').startsWith('image/')?
  '<div class="proof"><h3>Justificatif original transmis</h3><img src="'+proof.data+'" alt="Justificatif de transfert"></div>':
  '<p class="note">Le justificatif original est conservé dans le dossier G10 et consultable séparément depuis « Mes justificatifs et reçus ».</p>';
 const logoElement=document.querySelector('#memberApp .sidebar img, #memberApp aside img, #memberApp .side-nav img, #memberApp img');
 const logoSource=logoElement&&(logoElement.currentSrc||logoElement.getAttribute('src'))||'';
 const logoUrl=logoSource?(logoSource.startsWith('data:image/')?logoSource:new URL(logoSource,location.href).href):'';
 const logoHeader=logoUrl?'<img src="'+logoUrl.replace(/"/g,'&quot;')+'" alt="Logo officiel G10" style="display:block;width:285px;max-width:100%;height:auto;max-height:100px;object-fit:contain;object-position:left center;margin-bottom:18px">':'';
 const html='<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>G10 — Reçu d’adhésion</title>'+
 '<style>body{font-family:Arial,sans-serif;background:#eef3f8;color:#143754;margin:0}.sheet{max-width:760px;background:white;margin:25px auto;padding:40px;border-radius:14px}'+
 'h1{font-size:25px;margin:0;color:#104a72}.tag{display:inline-block;background:#def5e7;color:#116638;padding:9px 14px;border-radius:9px;margin-top:15px;font-weight:bold}'+
 'h2{margin:30px 0 16px}table{border-collapse:collapse;width:100%}td{padding:13px;border:1px solid #d6e4eb}td:first-child{width:42%;background:#f2f7fb}'+
 '.amount{font-size:27px;color:#10633d;font-weight:bold}.note{color:#42566a;font-size:13px;line-height:1.5}.proof img{max-width:100%;max-height:750px;object-fit:contain}'+
 '.actions{margin:20px auto;text-align:center}.actions button{padding:12px 20px;border:0;border-radius:8px;background:#176ba0;color:white;cursor:pointer}'+
 '@media print{body{background:white}.sheet{margin:0;max-width:none;padding:12px}.actions{display:none}}</style></head><body>'+
 '<div class="sheet">'+logoHeader+'<h1>G10 — Reçu de paiement du droit d’adhésion</h1><div class="tag">Paiement validé par la Direction</div>'+
 '<h2>Récapitulatif officiel</h2><table>'+
 '<tr><td>Adhérent</td><td>'+safe(name)+'</td></tr>'+
 '<tr><td>Identifiant du dossier</td><td>'+safe(m.id||'—')+'</td></tr>'+
 '<tr><td>Nature du paiement</td><td>Droit d’adhésion</td></tr>'+
 '<tr><td>Montant de référence</td><td>'+safe(membershipReference)+'</td></tr>'+
 '<tr><td>Montant reçu et confirmé</td><td class="amount">'+fmt(received)+' FCFA</td></tr>'+
 '<tr><td>Mode de paiement déclaré</td><td>'+safe(m.paymentMethod||'Non renseigné')+'</td></tr>'+
 '<tr><td>Référence de transaction</td><td>'+safe(ref)+'</td></tr>'+
 '<tr><td>Date du transfert déclarée</td><td>'+safe(fmtDate(m.paymentDate))+'</td></tr>'+
 '<tr><td>Date de validation de l’adhésion</td><td>'+safe(fmtDate(m.membershipValidatedAt))+'</td></tr>'+
 '<tr><td>Date de vérification du montant FCFA</td><td>'+safe(fmtDate(last&&last.at))+'</td></tr>'+
 '</table><p class="note">Émis à partir des informations du dossier G10 après confirmation de l’adhésion et validation du montant reçu. Une cotisation annuelle distincte peut rester à régler.</p>'+
 embedded+'<div class="actions"><button onclick="window.print()">Imprimer / Enregistrer en PDF</button></div></div></body></html>';
 const w=window.open('','_blank');
 if(!w){alert('Autorisez les fenêtres contextuelles pour ouvrir le reçu.');return;}
 w.document.open();w.document.write(html);w.document.close();
}

function g10AttachDocsToPayments(){
 if(typeof currentMember==='undefined'||!currentMember||!currentMember.paymentConfirmed)return;
 const app=document.getElementById('memberApp');
 if(!app)return;
 // Priorité à la section de paiement visible, quel que soit son habillage.
 const paymentView=[...app.querySelectorAll('section,div')].filter(e=>e.children.length<12&&
  [...e.children].some(c=>/Paiements\s*&\s*cotisations/i.test(c.textContent||''))&&e.getBoundingClientRect().width>0)
  .sort((a,b)=>a.querySelectorAll('*').length-b.querySelectorAll('*').length)[0];
 const archiveTitle=[...app.querySelectorAll('h2,h3,h4,strong,b')].find(e=>
  /Archives de mon adhésion/i.test(e.textContent||''));
 const archive=archiveTitle?archiveTitle.closest('.card,.panel,section,article')||archiveTitle.parentElement:
  document.getElementById('membershipPaidBox');
 const anchor=archive||document.getElementById('membershipPaidBox')||paymentView;
 if(!anchor)return;
 // Le bloc doit être propre aux archives de paiement, pas à la bibliothèque officielle.
 let host=document.getElementById('g10PaymentsPersonalFiles');
 if(!host){
   host=document.createElement('section');
   host.id='g10PaymentsPersonalFiles';
   host.style.cssText='margin-top:16px;padding:16px;border:1px solid #d4e2ed;border-radius:12px;background:#fff;color:#143754';
 }
 // Placer après les archives plutôt que dans un bloc réécrit par l'application.
 if(host.previousElementSibling!==anchor)anchor.insertAdjacentElement('afterend',host);
 const exists=host.querySelector('#g10PaymentsDocsHost');
 if(!exists){
   host.innerHTML='<h3>Mes justificatifs et reçus</h3>'+
    '<p>Justificatif de transaction conservé · reçu officiel G10 · ajout de pièces complémentaires.</p>'+
    '<div id="g10PaymentsDocsHost"></div>';
 }
 const target=host.querySelector('#g10PaymentsDocsHost');
 let receipt=target.querySelector('#g10MembershipOfficialReceiptLink');
 if(!receipt){
   receipt=document.createElement('button');
   receipt.id='g10MembershipOfficialReceiptLink';
   receipt.type='button';
   receipt.className='btn btn-light';
   receipt.textContent='Ouvrir mon reçu officiel G10';
   target.appendChild(receipt);
 }
 receipt.onclick=()=>g10OpenMembershipReceipt(currentMember);
 // Reprendre le même module de pièces : aucune modification de paymentProofData.
 let docs=target.querySelector('#g10PersonalDocs');
 if(!docs){
   docs=document.getElementById('g10PersonalDocs');
   if(!docs){docs=document.createElement('div');docs.id='g10PersonalDocs';}
   target.appendChild(docs);
 }
 renderDocs();
}
const oldHydrateForPayments=window.hydrateMember;
if(typeof oldHydrateForPayments==='function')window.hydrateMember=function(){const x=oldHydrateForPayments.apply(this,arguments);setTimeout(g10AttachDocsToPayments,0);return x;};
const oldShowForPayments=window.showMemberView;
if(typeof oldShowForPayments==='function')window.showMemberView=function(){const x=oldShowForPayments.apply(this,arguments);setTimeout(g10AttachDocsToPayments,0);return x;};
const oldEnterForPayments=window.enterMember;
if(typeof oldEnterForPayments==='function')window.enterMember=function(){const x=oldEnterForPayments.apply(this,arguments);setTimeout(g10AttachDocsToPayments,0);return x;};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(g10AttachDocsToPayments,0));
else setTimeout(g10AttachDocsToPayments,0);

const oldHydrate=window.hydrateMember;
if(typeof oldHydrate==='function')window.hydrateMember=function(){const res=oldHydrate.apply(this,arguments);setTimeout(renderDocs,0);return res;};
const oldShow=window.showMemberView;
if(typeof oldShow==='function')window.showMemberView=function(){const res=oldShow.apply(this,arguments);setTimeout(renderDocs,0);return res;};
const oldEnter=window.enterMember;
if(typeof oldEnter==='function')window.enterMember=function(){const res=oldEnter.apply(this,arguments);setTimeout(renderDocs,0);return res;};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(renderDocs,200));else setTimeout(renderDocs,200);
})();


/* Attestation G10 : modèle commun avec le logo officiel pour les dossiers validés.
 * Génération à la demande depuis l'espace personnel ; aucune nouvelle validation en base.
 */
(function(){
'use strict';
function openOfficialMembershipAttestation(){
 if(typeof currentMember==='undefined'||!currentMember||!currentMember.paymentConfirmed){
  alert('L’attestation est disponible après validation de l’adhésion par la Direction.');return;
 }
 const m=currentMember;
 const name=[m.firstName,m.firstName2,m.lastName,m.lastName2].filter(Boolean).join(' ').trim()||m.id||'Adhérent';
 const date=v=>{if(!v)return 'Non renseignée';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleDateString('fr-FR');};
 const euro=Number(m.membershipFeePaid??m.membershipFee??10)||10;
 const membershipReference=m.g10MembershipCurrency==='XAF'?(Number(m.g10MembershipReferenceXaf||6560).toLocaleString('fr-FR')+' FCFA'):(euro+' €');
 const received=Number(m.g10ReceivedXaf)||0;
 const logo=typeof g10BrandHeader==='function'?g10BrandHeader():'';
 const active=typeof g10IsActive==='function'?g10IsActive(m):false;
 const html='<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>G10 — Attestation d’adhésion</title>'+
 '<style>body{margin:0;background:#edf3f8;font:16px Arial,sans-serif;color:#123c5f}.sheet{max-width:760px;margin:22px auto;padding:45px;background:white;box-sizing:border-box;min-height:860px}'+
 '.g10-print-header{display:flex;align-items:center;gap:20px;border-bottom:2px solid #176a9b;padding:0 0 15px;margin:0 0 32px}.g10-print-header img{width:265px;max-height:90px;object-fit:contain;object-position:left center}'+
 '.g10-print-header strong{font-size:16px;color:#14649c}h1{text-align:center;margin:22px 0 38px;font-size:27px;color:#103756}'+
 '.detail{margin:24px 0;padding:18px;background:#f2f7fc;border:1px solid #d5e3ee;border-radius:9px}'+
 '.detail p{margin:8px 0}p{line-height:1.65}.sign{text-align:right;margin:55px 0 35px}.foot{font-size:12px;color:#557086;border-top:1px solid #dae4ec;padding-top:16px;margin-top:65px}'+
 '.actions{text-align:center;margin:20px}.actions button{background:#126ba7;color:white;border:0;border-radius:7px;padding:12px 18px;cursor:pointer}'+
 '@media print{body{background:white}.sheet{margin:0;padding:14px;max-width:none;min-height:auto}.actions{display:none}}</style></head><body>'+
 '<div class="actions"><button onclick="window.print()">Imprimer / Enregistrer en PDF</button></div>'+
 '<main class="sheet">'+logo+'<h1>ATTESTATION D’ADHÉSION</h1>'+
 '<p>La Direction de la Confédération atteste que :</p>'+
 '<div class="detail"><p><strong>'+g10Esc(name)+'</strong></p>'+
 '<p>Numéro de dossier : <strong>'+g10Esc(m.id||'—')+'</strong></p>'+
 (m.email?'<p>Adresse courriel : '+g10Esc(m.email)+'</p>':'')+'</div>'+
 '<p>a satisfait aux formalités d’adhésion enregistrées dans l’application G10 et que son droit d’adhésion de <strong>'+g10Esc(membershipReference)+'</strong> a été confirmé par la Direction.</p>'+
 (received?'<p>Montant effectivement reçu et vérifié : <strong>'+received.toLocaleString('fr-FR')+' FCFA</strong>.</p>':'')+
 '<p>Adhésion validée le <strong>'+g10Esc(date(m.membershipValidatedAt))+'</strong>.</p>'+
 '<p>Statut du dossier : <strong>'+(active?'Adhérent actif':'Adhésion validée')+'</strong>.</p>'+
 '<div class="sign"><strong>Pour la Direction G10</strong><p>Validation électronique du dossier</p></div>'+
 '<div class="foot">Attestation générée depuis l’espace personnel G10. Elle confirme la validation électronique du dossier et ne reproduit aucune signature manuscrite.</div>'+
 '</main></body></html>';
 const w=window.open('','_blank');if(!w)return alert('Autorisez les fenêtres contextuelles pour ouvrir l’attestation.');
 w.document.open();w.document.write(html);w.document.close();
}
document.addEventListener('click',function(e){
 const target=e.target.closest('button,a');if(!target)return;
 const label=(target.textContent||'').replace(/\s+/g,' ').trim();
 if(!/^Attestation d['’]adhésion$/i.test(label))return;
 const member=document.getElementById('memberApp');
 if(!member||!member.contains(target))return;
 e.preventDefault();e.stopImmediatePropagation();
 openOfficialMembershipAttestation();
},true);
})();


/* G10 — accueil fluide : le fond plein écran et la maquette utilisent
   la même largeur de viewport. Aucune modification des dossiers ni des modes de paiement.
   Le zoom du navigateur reste contrôlé par l'utilisateur (accessibilité). */
(function(){
 'use strict';
 const style=document.createElement('style');
 style.id='g10-fluid-landing-2026';
 style.textContent=[
   '#landing{min-height:100vh;min-height:100dvh;background-size:cover;background-position:center center}',
   '#landing>.container{width:calc(100% - clamp(24px,5vw,120px))!important;max-width:none!important;margin-inline:auto}',
   '#landing .final-home{width:100%;grid-template-columns:minmax(0,1.4fr) minmax(340px, min(34vw,560px));gap:clamp(22px,3.5vw,78px)!important;min-height:100vh;min-height:100dvh}',
   '#landing .final-left{width:100%;max-width:940px;min-width:0}',
   '#landing .final-left .landing-copy{width:100%;max-width:940px}',
   '#landing .home-login-card{width:100%;max-width:560px;justify-self:end}',
   '@media(max-width:980px){#landing .final-home{grid-template-columns:minmax(0,1fr) minmax(300px,38%);gap:20px!important}}',
   '@media(max-width:820px){#landing>.container{width:calc(100% - 28px)!important}#landing .final-home{grid-template-columns:1fr!important;gap:24px!important}#landing .home-login-card{justify-self:center;max-width:560px}}',
   '@media(max-width:520px){#landing>.container{width:calc(100% - 18px)!important}#landing .final-home{gap:18px!important}}'
 ].join('\n');
 (document.head||document.documentElement).appendChild(style);
})();



/* G10 navigation mobile consolidée : un seul menu, contrôle Fermer placé APRÈS les onglets.
   Barre de navigation adhérent déplacée sous BODY pour rester fixe sur Safari iOS.
   Présentation uniquement, aucune écriture en base. */
(function(){
 'use strict';
 const css="@media(max-width:800px){\nhtml,body{max-width:100%!important;overflow-x:hidden!important}\n#memberApp:not(.hidden),#directionApp:not(.hidden){display:block!important;width:100%!important;min-width:0!important;max-width:100%!important}\n#memberApp .main,#directionApp .main{margin-left:0!important;width:100%!important;min-width:0!important;max-width:100%!important;box-sizing:border-box!important;padding:66px 12px calc(132px + env(safe-area-inset-bottom))!important}\n#memberApp .main>*,#directionApp .main>*{min-width:0!important;max-width:100%;box-sizing:border-box}\n#memberApp .sidebar,#directionApp .sidebar{position:fixed!important;left:0!important;top:0!important;bottom:auto!important;width:min(86vw,320px)!important;max-width:320px!important;height:100dvh!important;height:100svh!important;padding:18px 14px 120px!important;display:block!important;transform:translate3d(-110%,0,0)!important;transition:transform .2s ease!important;visibility:visible!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;z-index:10020!important;box-shadow:8px 0 28px #091b3040!important}\n#memberApp.g10-mobile-drawer-open .sidebar,#directionApp.g10-mobile-drawer-open .sidebar{transform:translate3d(0,0,0)!important;pointer-events:auto!important;filter:none!important;opacity:1!important}\n#memberApp .g10-mobile-close-bottom,#directionApp .g10-mobile-close-bottom{display:inline-flex!important;align-items:center;justify-content:center;width:auto!important;min-width:130px;min-height:44px;padding:11px 17px;margin:22px 0 20px 4px!important;border:0;border-radius:11px;background:#155886;color:#fff;font-weight:800;font-size:15px;box-shadow:0 4px 10px #05284550}\n#g10MobileMenuOpen{display:inline-flex!important;align-items:center;justify-content:center;position:fixed!important;top:max(10px,env(safe-area-inset-top))!important;left:12px!important;z-index:10030!important;border:0;border-radius:11px;background:#0b4a7a;color:white;padding:11px 15px;min-height:44px;font:700 15px Arial,sans-serif;box-shadow:0 3px 12px #0b355a33}\n#g10MobileMenuOpen[hidden]{display:none!important}\n#g10Menu,.g10-mobile-nav-trigger,.g10-mobile-nav-backdrop,#g10GlobalMobileMenu,#g10GlobalMobileShade{display:none!important;pointer-events:none!important}\n.mobile-member-nav.g10-mobile-bottom-visible{position:fixed!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;left:10px!important;right:10px!important;width:auto!important;bottom:max(10px,env(safe-area-inset-bottom))!important;z-index:9000!important;max-width:100%!important;transform:none!important;background:white!important;box-shadow:0 12px 35px #102e4e30!important}\n.mobile-member-nav:not(.g10-mobile-bottom-visible){display:none!important}\n}\n@media(min-width:801px){#g10MobileMenuOpen,#memberApp .g10-mobile-close-bottom,#directionApp .g10-mobile-close-bottom{display:none!important}.mobile-member-nav{display:none!important}}";
 const style=document.createElement('style');style.id='g10MobileConsolidated';style.textContent=css;
 (document.head||document.documentElement).appendChild(style);
 let button, bottomNav, openApp=null, scrollY=0, lockStyles=null;
 const narrow=()=>window.matchMedia('(max-width:800px)').matches;
 const visible=el=>!!el&&!el.classList.contains('hidden')&&getComputedStyle(el).display!=='none'&&el.getClientRects().length>0;
 const active=()=>['memberApp','directionApp'].map(id=>document.getElementById(id)).find(visible)||null;
 function lockScroll(){
  if(lockStyles)return;
  const b=document.body, h=document.documentElement;scrollY=window.scrollY||0;
  lockStyles={position:b.style.position,top:b.style.top,left:b.style.left,width:b.style.width,overflow:b.style.overflow,htmlOverflow:h.style.overflow};
  b.style.position='fixed';b.style.top=(-scrollY)+'px';b.style.left='0';b.style.width='100%';b.style.overflow='hidden';h.style.overflow='hidden';
 }
 function unlockScroll(){
  if(!lockStyles)return;
  const b=document.body,h=document.documentElement,x=lockStyles;lockStyles=null;
  b.style.position=x.position;b.style.top=x.top;b.style.left=x.left;b.style.width=x.width;b.style.overflow=x.overflow;h.style.overflow=x.htmlOverflow;
  window.scrollTo(0,scrollY);
 }
 function close(){
  for(const id of ['memberApp','directionApp'])document.getElementById(id)?.classList.remove('g10-mobile-drawer-open');
  openApp=null;unlockScroll();if(button)button.hidden=false;
 }
 function install(){
  const member=document.getElementById('memberApp');
  bottomNav=document.querySelector('.mobile-member-nav');
  if(bottomNav&&bottomNav.parentElement!==document.body)document.body.appendChild(bottomNav);
  if(!button){
    button=document.createElement('button');
    button.id='g10MobileMenuOpen';button.type='button';button.textContent='☰ Menu';button.hidden=true;
    button.setAttribute('aria-label','Ouvrir les rubriques');
    document.body.appendChild(button);
    button.addEventListener('click',()=>{
      const app=active();if(!app||!narrow())return;
      const sidebar=app.querySelector('.sidebar');if(!sidebar)return;
      app.classList.add('g10-mobile-drawer-open');openApp=app;button.hidden=true;lockScroll();
    });
  }
  for(const id of ['memberApp','directionApp']){
    const app=document.getElementById(id),nav=app?.querySelector('.sidebar .side-nav');
    if(!app||!nav||app.querySelector('.g10-mobile-close-bottom'))continue;
    const closeButton=document.createElement('button');closeButton.type='button';closeButton.className='g10-mobile-close-bottom';closeButton.textContent='✕ Fermer';
    closeButton.addEventListener('click',close);
    nav.insertAdjacentElement('afterend',closeButton);
    nav.addEventListener('click',e=>{if(openApp===app&&e.target.closest('button,a'))close();});
  }
  if(member&&bottomNav&&bottomNav.dataset.g10NavPrepared!=='yes'){
    bottomNav.dataset.g10NavPrepared='yes';
    bottomNav.addEventListener('click',()=>{if(openApp)close();});
  }
  sync();
 }
 function sync(){
   if(!button)return;
   const app=active(),mobile=narrow();
   if(openApp&&(!mobile||openApp!==app))close();
   const show=!!(mobile&&app);
   button.hidden=!show||!!openApp;
   bottomNav?.classList.toggle('g10-mobile-bottom-visible',!!(mobile&&app&&app.id==='memberApp'&&!openApp));
 }
 function schedule(){window.requestAnimationFrame(sync);}
 function start(){
   install();
   for(const id of ['memberApp','directionApp']){
    const app=document.getElementById(id);
    if(app)new MutationObserver(schedule).observe(app,{attributes:true,attributeFilter:['class']});
   }
   window.addEventListener('resize',schedule);window.addEventListener('orientationchange',schedule);
   document.addEventListener('keydown',e=>{if(e.key==='Escape'&&openApp)close();});
   document.addEventListener('click',e=>{
     if(!openApp)return;
     if(!openApp.querySelector('.sidebar')?.contains(e.target)&&e.target!==button){
      e.preventDefault();e.stopPropagation();close();
     }
   },true);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();


/* G10_CFA_COMMITTEE_V1 — Tarifs de référence CFA approuvés pour la nouvelle campagne.
   Les trois anciens paiements restent dans leur devise historique.
   Les frais de retrait sont distincts de la cotisation de référence.
   Le RIB n'est pas inventé : il sera affiché dès réception de l'information officielle.
*/
(function(){
'use strict';
const RATES=Object.freeze({membership:6560,annual:80000,half:40000});
const fmtXAF=n=>Number(n||0).toLocaleString('fr-FR')+' FCFA';
function textOf(id,v){const e=document.getElementById(id);if(e)e.textContent=v;}
function isNewXaf(p){return p&&(p.currency==='XAF'||p.currency==='FCFA'||Number(p.amount)>=40000);}
function bankData(){try{return String(settings.bank||'').trim()}catch(_){return ''}}
function bankPanel(group){
 const input=document.querySelector('input[name="'+group+'"][value="Virement bancaire"]');
 const parent=input?.closest('.payment-options');
 if(!parent)return;
 const id='g10BankPanel-'+group;
 let el=document.getElementById(id);
 if(!el){
  el=document.createElement('section');el.id=id;el.className='card';
  el.style.cssText='display:none;margin:12px 0;padding:16px;border:1px solid #c0d8ee;border-radius:12px;background:#f3f9ff;color:#143754';
  parent.insertAdjacentElement('afterend',el);
 }
 const selected=!!input?.checked;
 el.style.display=selected?'block':'none';
 if(!selected)return;
 el.textContent='';
 const title=document.createElement('strong');title.textContent='RIB officiel G10 — Virement bancaire';
 el.appendChild(title);
 const bank=bankData();
 if(!bank){
  const msg=document.createElement('p');msg.textContent='Coordonnées bancaires officielles en attente. La Direction doit intégrer le RIB avant tout virement.';el.appendChild(msg);
  return;
 }
 const p=document.createElement('p');p.textContent='Coordonnées actuellement renseignées dans les paramètres Direction (à vérifier sur le RIB officiel).';el.appendChild(p);
 bank.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).forEach(line=>{
  const row=document.createElement('div');row.style.cssText='display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap;border-bottom:1px solid #dae8f5;padding:8px 0';
  const txt=document.createElement('span');txt.textContent=line;txt.style.overflowWrap='anywhere';
  const btn=document.createElement('button');btn.type='button';btn.className='btn btn-light';btn.textContent='Copier';btn.addEventListener('click',()=>{if(navigator.clipboard?.writeText)navigator.clipboard.writeText(line).then(()=>{btn.textContent='Copié ✓'}).catch(()=>alert('Sélectionnez la ligne pour la copier.'));else alert('Sélectionnez la ligne pour la copier.');});
  row.append(txt,btn);el.appendChild(row);
 });
}
function methods(){
 for(const group of ['payMethod','contributionMethod']){
  document.querySelectorAll('input[name="'+group+'"]').forEach(r=>{
   if(r.value==='MoneyGram'||r.value==='Autre'){
    if(r.checked){const airtel=document.querySelector('input[name="'+group+'"][value="Airtel Money"]');if(airtel)airtel.checked=true;}
    r.closest('label')?.remove();
   }
  });
  bankPanel(group);
 }
 for(const id of ['payMethodOtherBox','contributionMethodOtherBox']){const e=document.getElementById(id);if(e)e.style.display='none';}
}
function details(){
 methods();
 const fm=document.getElementById('membershipFeeDisplay');if(fm)fm.value=fmtXAF(RATES.membership)+' — une seule fois (hors frais de retrait)';
 textOf('membershipFeeBig',fmtXAF(RATES.membership));
 textOf('paymentAmount',fmtXAF(RATES.membership));
 textOf('landingFee',fmtXAF(RATES.membership));
 for(const h of document.querySelectorAll('#memberApp h3,#memberApp .panel-head h3,#memberApp label,#memberApp h4')){
  if(/^Droit d[’']adhésion$/.test((h.textContent||'').trim()))h.textContent='Droit d’adhésion (hors frais de retrait)';
 }
 textOf('monthlyContribution',fmtXAF(RATES.annual)+' en 1 fois');
 textOf('annualContribution',fmtXAF(RATES.annual));
 textOf('semesterContribution','2 × '+fmtXAF(RATES.half));
 textOf('monthlyPlanText',fmtXAF(RATES.annual)+' en une seule fois.');
 textOf('twoPlanText',fmtXAF(RATES.half)+' maintenant puis '+fmtXAF(RATES.half)+' six mois plus tard.');
 const grid=document.querySelector('#contributionUnlocked .grid3');
 const notice=grid?.nextElementSibling;
 if(notice&&/versements|cotisation annuelle/i.test(notice.textContent||''))notice.innerHTML='Choisissez la <b>cotisation annuelle de '+fmtXAF(RATES.annual)+'</b> en une seule fois ou <b>deux versements de '+fmtXAF(RATES.half)+'</b>. Chaque paiement est déclaré puis confirmé par la Direction.';
 const archive=document.getElementById('membershipArchiveDetails');
 if(archive&&typeof currentMember!=='undefined'&&currentMember?.paymentConfirmed&&currentMember.g10MembershipCurrency==='XAF'){
  archive.textContent=fmtXAF(Number(currentMember.g10MembershipReferenceXaf)||RATES.membership)+' — '+(currentMember.paymentMethod||'Mode non renseigné')+' — Réf. '+(currentMember.transactionRef||'—')+(currentMember.paymentDate?' — '+currentMember.paymentDate:'');
 }
 const sf=document.getElementById('sfFee');if(sf)sf.textContent=fmtXAF(RATES.membership)+' — une seule fois, hors frais de retrait';
 const sc=document.getElementById('sfContribution');if(sc)sc.textContent=fmtXAF(RATES.annual)+' en 1 fois ou 2 × '+fmtXAF(RATES.half);
 const memberRows=document.getElementById('memberContributionRows');
 if(memberRows&&typeof currentMember!=='undefined'&&currentMember){
  [...memberRows.rows].forEach((tr,i)=>{
   const p=(currentMember.contributionPayments||[])[i];if(p&&isNewXaf(p)&&tr.cells[1])tr.cells[1].textContent=fmtXAF(p.amount);
  });
 }
 const box=document.getElementById('contributionNextBox');
 if(box&&typeof currentMember!=='undefined'&&currentMember?.active){
  const plan=document.querySelector('input[name="contributionPlan"]:checked')?.value||currentMember.contributionPlan||'monthly';
  const same=(currentMember.contributionPayments||[]).filter(p=>p.plan===plan);
  const pending=same.find(p=>p.status!=='Confirmé');
  if(pending){
   box.innerHTML='<strong>'+((plan==='monthly')?'Cotisation annuelle':'Versement '+(pending.sequence||1))+' déjà déclaré — '+(isNewXaf(pending)?fmtXAF(pending.amount):pending.amount+' €')+'</strong><br>Statut : en attente de confirmation par la Direction.';
  }else if(plan==='monthly'){
   box.innerHTML=same.length?'<strong>Cotisation annuelle complète.</strong><br>Le paiement annuel a été confirmé.':'<strong>Cotisation annuelle : '+fmtXAF(RATES.annual)+' en une seule fois</strong><br>Après déclaration, la Direction vérifiera la réception.';
  }else{
   const next=same.length+1;
   if(next>2)box.innerHTML='<strong>Cotisation annuelle complète.</strong><br>Les deux versements ont été confirmés.';
   else{
    const due=next===2&&same[0]?.dueDate?' — échéance : '+String(same[0].dueDate):'';
    box.innerHTML='<strong>'+(next===1?'Premier':'Deuxième')+' versement : '+fmtXAF(RATES.half)+'</strong>'+due+'<br>Après déclaration, la Direction vérifiera la réception.';
   }
  }
 }
}
function directionDisplay(){
 const el=document.getElementById('contributionPaymentRows');
 if(el&&typeof applications!=='undefined'){
  const payments=[];(applications||[]).forEach(m=>(m.contributionPayments||[]).forEach(p=>payments.push(p)));
  [...el.rows].forEach((tr,i)=>{if(payments[i]&&isNewXaf(payments[i])&&tr.cells[3])tr.cells[3].textContent=fmtXAF(payments[i].amount);});
 }
 textOf('dirAnnual',fmtXAF(RATES.annual));
 textOf('dirSemesters',fmtXAF(RATES.half)+' + '+fmtXAF(RATES.half));
 textOf('dirMonthly','Cotisation annuelle : '+fmtXAF(RATES.annual));
 const revenue=document.getElementById('kRevenue');
 if(revenue&&typeof applications!=='undefined'){
  const total=(applications||[]).filter(m=>m.paymentConfirmed).reduce((sum,m)=>sum+Number(m.g10ReceivedXaf||0),0);
  revenue.textContent=fmtXAF(total)+' vérifiés';
 }
}
function wrap(name,fn){
 const old=window[name];if(typeof old!=='function')return;
 window[name]=function(){const v=old.apply(this,arguments);fn();return v;};
}
for(const name of ['hydrateMember','renderContributionMember','refreshContributionForm','fillSmartForm'])wrap(name,details);
wrap('refreshLanding',()=>textOf('landingFee',fmtXAF(RATES.membership)));
for(const name of ['refreshDirection','renderContributionPayments'])wrap(name,directionDisplay);
const oldMembership=window.declarePayment;
if(typeof oldMembership==='function')window.declarePayment=async function(){
 const method=document.querySelector('input[name="payMethod"]:checked')?.value||'Airtel Money';
 if(!['Airtel Money','Virement bancaire'].includes(method))return alert('Choisissez Airtel Money ou Virement bancaire.');
 if(method==='Virement bancaire'&&!bankData())return alert('Le RIB officiel n’est pas encore disponible. Merci de patienter avant de choisir le virement.');
 const member=typeof currentMember!=='undefined'?currentMember:null;
 const previous=member?{currency:member.g10MembershipCurrency,ref:member.g10MembershipReferenceXaf}:null;
 if(member&&!member.paymentConfirmed){member.g10MembershipCurrency='XAF';member.g10MembershipReferenceXaf=RATES.membership;}
 const result=await oldMembership.apply(this,arguments);
 if(member&&!member.paymentDeclared&&previous){if(previous.currency===undefined)delete member.g10MembershipCurrency;else member.g10MembershipCurrency=previous.currency;if(previous.ref===undefined)delete member.g10MembershipReferenceXaf;else member.g10MembershipReferenceXaf=previous.ref;}
 details();return result;
};
window.declareContributionPayment=async function(){
 if(typeof currentMember==='undefined'||!currentMember?.active||!currentMember?.paymentConfirmed){alert('Votre adhésion doit d’abord être validée par la Direction.');return;}
 normalizeContributionState();
 const plan=document.querySelector('input[name="contributionPlan"]:checked')?.value||'monthly';
 const method=document.querySelector('input[name="contributionMethod"]:checked')?.value||'Airtel Money';
 if(!['Airtel Money','Virement bancaire'].includes(method)){alert('Choisissez Airtel Money ou Virement bancaire.');return;}
 if(method==='Virement bancaire'&&!bankData()){alert('Le RIB officiel n’est pas encore disponible.');return;}
 const reference=val('contributionRef'),date=val('contributionDate');
 if(!reference||!date){alert('Merci de renseigner la référence et la date du paiement.');return;}
 const same=(currentMember.contributionPayments||[]).filter(p=>p.plan===plan);
 if(same.some(p=>p.status!=='Confirmé')){alert('Le paiement précédent doit d’abord être confirmé.');return;}
 const sequence=same.length+1,max=plan==='monthly'?1:2;
 if(sequence>max){alert('Toutes les échéances ont déjà été déclarées.');return;}
 const amount=plan==='monthly'?RATES.annual:RATES.half;
 const id='COT-'+Date.now(),file=document.getElementById('contributionProof')?.files?.[0]||null;
 let proof=null;
 if(file){try{proof=await uploadProofFile(file,'contributions',id)}catch(e){alert('Le justificatif n’a pas pu être enregistré : '+(e.message||e));return;}}
 const payment={id,plan,sequence,amount,currency:'XAF',date,method,reference,proof,status:'À vérifier',dueDate:plan==='two'&&sequence===1?addMonthsIso(date,6):''};
 currentMember.contributionPlan=plan;currentMember.contributionPayments.push(payment);
 syncMemberEverywhere(currentMember);persist();
 try{await saveMemberToFirebase(currentMember);}catch(e){console.error(e);alert('Enregistrement Firebase non confirmé : vérifiez avec la Direction avant de réessayer.');return;}
 setVal('contributionRef','');setVal('contributionDate','');
 const f=document.getElementById('contributionProof');if(f)f.value='';
 renderContributionMember();renderMemberSituation();refreshDirection();
 alert('Cotisation de '+fmtXAF(amount)+' déclarée. La Direction doit confirmer le paiement.'+(proof?' Justificatif archivé.':''));
};
window.openMembershipInfo=function(){openInfoCard('Droit d’adhésion','Droit d’adhésion : <b>'+fmtXAF(RATES.membership)+'</b>, une seule fois, <b>hors frais de retrait</b>.');};
window.openContributionInfo=function(){openInfoCard('Cotisation annuelle','<b>Option 1 :</b> '+fmtXAF(RATES.annual)+' en une seule fois.<br><b>Option 2 :</b> '+fmtXAF(RATES.half)+' maintenant, puis '+fmtXAF(RATES.half)+' six mois plus tard.');};
document.addEventListener('change',e=>{if(e.target?.matches('input[name="payMethod"],input[name="contributionMethod"],input[name="contributionPlan"]')){methods();details();}});
function init(){methods();details();directionDisplay();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
