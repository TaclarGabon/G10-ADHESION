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
function g10LivePDF(){const c=document.getElementById('g10-live-content');if(!c)return;const w=window.open('','_blank');if(!w){alert('Autorisez les fenêtres contextuelles pour imprimer.');return;}w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>G10 rapport</title><style>body{font:12px Arial;padding:22px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccd;padding:7px}@page{size:landscape}</style></head><body><h2>G10 — Extractions et rapports</h2>'+c.innerHTML+'</body></html>');w.document.close();w.focus();setTimeout(()=>w.print(),350)}


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
 if(m.paymentProofData&&m.paymentProofData.data)out.push({name:'Justificatif initial',data:m.paymentProofData.data,type:m.paymentProofData.type});
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
 section.innerHTML='<h3>Pièces complémentaires du paiement d’adhésion</h3><p>Les fichiers ajoutés ne remplacent pas le justificatif initial.</p>'+
 x.map((f,i)=>'<div style="padding:7px"><button class="btn btn-light" type="button" data-open-proof="'+i+'">Ouvrir · '+safe(f.name||('Pièce '+(i+1)))+'</button></div>').join('')+
 '<label>Ajouter un justificatif supplémentaire (PDF ou image, 250 Ko maximum par fichier)<input type="file" accept="application/pdf,image/*" id="g10-extra-proof-input"></label>'+
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
 '<tr><td>Montant de référence</td><td>'+safe(euro)+' €</td></tr>'+
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
    '<p>Justificatif initial conservé · reçu officiel G10 · ajout de pièces complémentaires.</p>'+
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
