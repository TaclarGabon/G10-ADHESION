/* G10.4 — Rapports réels, lecture seule, aucun jeu de données fictives */
let g10LiveTab='members';
const g10Esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const g10Name=m=>[m.lastName,m.lastName2,m.firstName,m.firstName2].filter(Boolean).join(' ').trim();
const g10Slug=m=>g10Name(m).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'');
const g10Num=v=>Number(v)||0;
const g10Date=v=>{if(!v)return '';const d=new Date(v);return Number.isNaN(d.getTime())?String(v).slice(0,10):d.toLocaleDateString('fr-FR')};
const g10Due=v=>{const iso=String(v||'').slice(0,10);const result=typeof window.g10ComputeSecondDue==='function'?window.g10ComputeSecondDue(iso):'';return /^\d{4}-\d{2}-\d{2}$/.test(result)?result.slice(8,10)+'/'+result.slice(5,7)+'/'+result.slice(0,4):''};
const g10Active=()=>Array.isArray(applications)?applications.filter(m=>m.active&&m.paymentConfirmed):(Array.isArray(activeMembers)?activeMembers.filter(m=>m.active&&m.paymentConfirmed):[]);
function g10Records(){
 const members=g10Active().slice().sort((a,b)=>g10Name(a).localeCompare(g10Name(b),'fr'));
 const rows=[];
 members.forEach(m=>{
  const name=g10Name(m),slug=g10Slug(m),id=m.firebaseUid||m.id||name;
  rows.push({id,name,op:'Adhésion unique',ref:'ADH-'+slug,date:g10Date(m.membershipValidatedAt),eur:m.g10MembershipCurrency==='XAF'?null:g10Num(m.membershipFeePaid??m.membershipFee??settings.membershipFee),refXaf:m.g10MembershipCurrency==='XAF'?Number(m.g10MembershipReferenceXaf||6560):null,state:'Payé',kind:'adh',confirmed:true,xaf:Number.isFinite(Number(m.g10ReceivedXaf))&&Number(m.g10ReceivedXaf)>0?Number(m.g10ReceivedXaf):null});
  const paid=(m.contributionPayments||[]).filter(p=>p.status==='Confirmé').sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
  const rawPlan=String(m.contributionPlan||(paid[0]&&paid[0].plan)||'').trim().toLowerCase();
  const plan=['monthly','one','once','single','1','option1','option 1','une fois'].includes(rawPlan)?'monthly':(['two','2','option2','option 2','twice','deux fois'].includes(rawPlan)?'two':'');
  if(plan==='monthly'){
    const p=paid[0];rows.push({id,name,op:'Cotisation option 1 — une fois',ref:'COT-1FOIS-'+slug,date:p?g10Date(p.date):'',eur:p&&p.currency!=='XAF'?g10Num(p.amount):null,refXaf:p&&p.currency==='XAF'?g10Num(p.amount):null,state:p?'Payé':'À venir',kind:'cot',confirmed:!!p,xaf:p&&Number(p.g10ReceivedXaf)>0?Number(p.g10ReceivedXaf):null});
  } else if(plan==='two'){
    for(let i=0;i<2;i++){const p=paid[i];rows.push({id,name,op:`Cotisation option 2 — ${i+1}/2`,ref:`COT-${i+1}SUR2-${slug}`,date:p?g10Date(p.date):(i===1&&paid[0]?'Échéance : '+g10Due(paid[0].date):''),eur:p&&p.currency!=='XAF'?g10Num(p.amount):null,refXaf:p&&p.currency==='XAF'?g10Num(p.amount):null,state:p?'Payé':'À venir',kind:'cot',confirmed:!!p,xaf:p&&Number(p.g10ReceivedXaf)>0?Number(p.g10ReceivedXaf):null});}
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

function g10LiveRender(tab){g10LiveTab=tab;const {members,rows}=g10Records();const count=rows.filter(r=>r.confirmed).length;
 const realTotal=rows.filter(r=>r.confirmed&&r.xaf!==null).reduce((sum,r)=>sum+r.xaf,0);const pendingCount=rows.filter(r=>r.confirmed&&r.xaf===null).length;const kpis=`<div style="display:flex;gap:12px;flex-wrap:wrap;margin:15px 0">${[['Adhérents actifs',members.length],['Paiements confirmés',count],['FCFA vérifiés',realTotal.toLocaleString('fr-FR')+' FCFA']].map(([a,b],i)=>`<div style="background:${['#dbeafe','#dcfce7','#ffedd5'][i]};border-radius:14px;padding:14px 22px;color:#173b5b"><b>${a}</b><div style="font-size:22px;font-weight:800">${b}</div></div>`).join('')}</div>`;
 let header=[],data=[];
 if(tab==='members'){header=['Référence','Adhérent','Statut','Date validation','Contact'];data=members.map((m,i)=>['G10-'+String(i+1).padStart(3,'0'),g10Name(m),'Actif',g10Date(m.membershipValidatedAt),m.phone||m.email||'']);}
 if(tab==='finance'){header=['Adhérent','Opération','Référence','Date paiement / échéance','FCFA réellement reçus','État'];data=rows.map(r=>[r.name,r.op,r.ref,r.date,r.xaf===null?'':r.xaf,r.state]);}
 if(tab==='history'){header=['Lot','Du','Au','Paiements','Total FCFA'];data=[];}
 window.g10LiveCurrent={header,data,tab,rows,members};
 const table=`<div style="overflow:auto"><table class="table" style="min-width:${tab==='finance'?'670':'780'}px;width:100%;border-collapse:collapse"><thead><tr>${header.map(h=>`<th style="background:#176a9b;color:white;padding:12px">${g10Esc(h)}</th>`).join('')}</tr></thead><tbody>${data.map((r,i)=>`<tr style="background:${tab==='finance'?['#e3f0ff','#e8f7ec','#fff2db'][Math.max(0,members.findIndex(m=>g10Name(m)===r[0]))%3]:i%2?'#f1f6fc':'#ffffff'}">${r.map(v=>`<td style="padding:10px;border-bottom:1px solid #d9e5ef">${g10Esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
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
 '<p style="margin:0 0 12px">Montant réellement reçu en FCFA · double confirmation avant toute modification. Les paiements historiques restent inchangés.</p>'+
 (rows.length?rows.map((r,i)=>{
 const v=Number(r.received),ok=Number.isSafeInteger(v)&&v>0;
 return '<div style="padding:12px;border:1px solid #dce7f0;border-radius:9px;margin:8px 0;background:#fff">'+
 '<b>'+safe(r.m.firstName||'')+' '+safe(r.m.lastName||'')+'</b> · '+safe(r.label)+
 ' · '+(r.m.g10MembershipCurrency==='XAF'||r.p?.currency==='XAF'?'Référence : '+fmt(r.p?.amount||r.m.g10MembershipReferenceXaf||6560)+' FCFA':'Paiement historique')+
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
 // Conserver uniquement les montants à vérifier en vue directe.
 // Les montants confirmés restent consultables et modifiables dans l’accordéon.
 const cards=[...panel.children].filter(el=>el.tagName==='DIV');
 const waiting=document.createElement('section');
 waiting.id='g10-payments-to-verify';
 const heading=document.createElement('h4');heading.textContent='À vérifier ('+rows.filter(r=>!(Number.isSafeInteger(Number(r.received))&&Number(r.received)>0)).length+')';
 heading.style.cssText='margin:16px 0 8px;color:#173b5b';
 waiting.append(heading);
 const archive=document.createElement('details');
 archive.id='g10-payments-verified';
 archive.style.cssText='margin:14px 0;border:1px solid #c4d8eb;border-radius:10px;padding:12px;background:#fff';
 const archiveHeading=document.createElement('summary');
 archiveHeading.style.cssText='font-weight:800;cursor:pointer;padding:8px 5px;color:#123c5f';
 archiveHeading.textContent='Montants déjà validés ('+rows.filter(r=>Number.isSafeInteger(Number(r.received))&&Number(r.received)>0).length+')';
 archive.append(archiveHeading);
 cards.forEach((card,i)=>{
  const amt=Number(rows[i]?.received);
  if(Number.isSafeInteger(amt)&&amt>0)archive.append(card);else waiting.append(card);
 });
 if(waiting.children.length===1){const empty=document.createElement('p');empty.textContent='Aucun nouveau montant à vérifier.';waiting.append(empty);}
 panel.append(waiting,archive);
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
// Données lues sur le RIB UBA officiel fourni par la Confédération (08/11/2026).
// Le nom du titulaire est tronqué sur la photo : ne jamais inventer sa fin.
const G10_UBA_RIB=Object.freeze({
 bank:"UBA — United Bank for Africa",
 agency:"Agence Boulevard — Libreville",
 bankCode:"40025",
 branchCode:"05811",
 account:"81103100057",
 key:"67",
 full:"40025 05811 81103100057 67",
 holderVisible:"CONFEDERATION DE LA DIASPORA GABONA"
});
function bankData(){return G10_UBA_RIB.full;}
function g10SecondDueDate(firstDate){
 const match=String(firstDate||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
 if(!match)return '';
 const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
 const origin=new Date(Date.UTC(year,month-1,day));
 if(origin.getUTCFullYear()!==year||origin.getUTCMonth()!==month-1||origin.getUTCDate()!==day)return '';
 const lastDay=new Date(Date.UTC(year,month+6,0)).getUTCDate();
 const sixMonths=new Date(Date.UTC(year,month-1+6,Math.min(day,lastDay)));
 sixMonths.setUTCDate(sixMonths.getUTCDate()-1);
 const dayBefore=sixMonths.toISOString().slice(0,10);
 const end=match[1]+'-12-30';
 return dayBefore<end?dayBefore:end;
}
window.g10ComputeSecondDue=g10SecondDueDate;
function bankPanel(group){
 const input=document.querySelector('input[name="'+group+'"][value="Virement bancaire"]');
 const parent=input?.closest('.payment-options');
 if(!parent)return;
 const id='g10BankPanel-'+group;
 let el=document.getElementById(id);
 if(!el){
  el=document.createElement('section');el.id=id;el.className='card';
  el.style.cssText='margin:12px 0;padding:14px;border:1px solid #c0d8ee;border-radius:12px;background:#f3f9ff';
  parent.insertAdjacentElement('afterend',el);
 }
 el.style.display=input.checked?'block':'none';
 if(!input.checked)return;
 // Reproduction HTML du RIB UBA — vrai texte, sélectionnable et copiable, aucune icône "Copier".
 el.innerHTML=String.raw`
 <div style="overflow-x:auto;max-width:100%;-webkit-overflow-scrolling:touch">
 <div style="min-width:720px;background:#fff;border:1px solid #d1dae2;padding:27px 30px 28px 44px;font:13px Arial,sans-serif;color:#122238;user-select:text;-webkit-user-select:text;position:relative">
  <div style="position:absolute;top:26%;left:10px;writing-mode:vertical-rl;transform:rotate(180deg);font-size:10px;font-weight:800">RELEVÉ D’IDENTITÉ BANCAIRE</div>
  <div style="display:flex;justify-content:space-between;gap:18px;align-items:start">
   <div style="color:#d31325"><div style="font-size:42px;font-weight:900;font-style:italic;letter-spacing:-3px">UBA ◢</div><div>United Bank for Africa</div></div>
   <div style="text-align:right;font-weight:800;font-size:16px">RELEVÉ D’IDENTITÉ BANCAIRE<br><i style="font-size:14px">STATEMENT OF BANKING IDENTITY</i></div>
  </div>
  <p style="font-size:11px;line-height:1.55;margin:24px 0 12px">Ce relevé est destiné à être remis à vos créanciers ou débiteurs appelés à faire inscrire des opérations sur votre compte (virement, paiement de quittance, etc.). Son utilisation vous garantit le bon enregistrement de ces opérations et vous évite des réclamations pour des erreurs ou retard d’imputation.</p>
  <p style="font-size:11px;line-height:1.55;margin:0 0 20px">This statement is intended to be handed to your creditors or debtors called to make register operations on your account (transfer, payment of receipt, etc.). Its use guarantees to you the good registration of these operations and avoids complaints for errors or delays for imputation.</p>
  <div style="text-align:right;margin:6px 0 33px;font-size:12px">À / At _____________________&nbsp;&nbsp;&nbsp;&nbsp; Le / The _____________________</div>
  <div style="display:grid;grid-template-columns:1.03fr 1.18fr .83fr;gap:13px">
    <fieldset style="border:1px solid #243344;min-height:140px;padding:10px 9px;margin:0"><legend style="font-size:14px;font-weight:800;text-align:center">Domiciliation</legend><div style="text-align:center;font-weight:800;font-size:13px;line-height:2;padding-top:15px">AGENCE BOULEVARD<br>LIBREVILLE</div></fieldset>
    <fieldset style="border:1px solid #243344;min-height:140px;padding:10px 8px;margin:0;min-width:0"><legend style="text-align:center;font-size:14px;font-weight:800">Titulaire du compte <small style="font-size:10px;font-style:italic;display:block;font-weight:400">Holder of the account</small></legend>
     <div style="font-weight:800;font-size:12px;line-height:1.8;margin-top:7px;overflow-wrap:anywhere"><span style="user-select:text;-webkit-user-select:text">40025 05811 81103100057 67</span><br>CONFEDERATION DE LA DIASPORA GABONA…<br>BP: LIBREVILLE</div>
    </fieldset>
    <fieldset style="border:1px solid #243344;min-height:140px;margin:0"><legend style="font-size:13px;font-weight:800;text-align:center">Nom du destinataire</legend></fieldset>
  </div><div style="height:1px;background:#243344;margin-top:17px"></div>
 </div></div>`;
}function methods(){
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
 textOf('twoPlanText',fmtXAF(RATES.half)+' maintenant puis '+fmtXAF(RATES.half)+' au plus tard dans six mois, et avant le 30 décembre de l’année du premier paiement.');
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
    const due=next===2&&same[0]?.date?' — échéance : '+g10SecondDueDate(same[0].date):'';
    box.innerHTML='<strong>'+(next===1?'Premier':'Deuxième')+' versement : '+fmtXAF(RATES.half)+'</strong>'+due+'<br>Après déclaration, la Direction vérifiera la réception.';
   }
  }
 }
}

function directionCfaSettings(){
 const fee=document.getElementById('setMembershipFee'),monthly=document.getElementById('setMonthly');
 const a=fee?.closest('.field')||fee?.parentElement;
 const b=monthly?.closest('.field')||monthly?.parentElement;
 if(!a||!b)return;
 a.style.display='none';b.style.display='none';
 let note=document.getElementById('g10CommitteeCfaTariffs');
 if(!note){
  note=document.createElement('div');note.id='g10CommitteeCfaTariffs';note.className='notice';
  note.style.cssText='margin:12px 0;padding:14px;border:1px solid #b9d8eb;background:#f0f7ff;border-radius:10px';
  a.insertAdjacentElement('beforebegin',note);
 }
 note.textContent='Tarifs CFA pour les nouvelles adhésions : droit d’adhésion 6 560 FCFA (hors frais de retrait) ; cotisation annuelle 80 000 FCFA en une fois ou deux fois 40 000 FCFA. Les anciens paramètres en euros sont conservés uniquement pour les dossiers historiques et ne doivent pas être réutilisés comme nouveaux tarifs.';
}
function directionDisplay(){
 directionCfaSettings();
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
wrap('hydrateSettings',directionCfaSettings);
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
 if(plan==='two'&&sequence===1&&date>date.slice(0,4)+'-12-30'){alert('La deuxième échéance doit intervenir avant le 30 décembre de la même année. Choisissez le paiement annuel en une fois ou contactez la Direction.');return;}
 const amount=plan==='monthly'?RATES.annual:RATES.half;
 const proofInput=document.getElementById('contributionProof');
 const file=proofInput?.files?.[0]||null;
 if(!file){
  if(proofInput){proofInput.required=true;proofInput.setAttribute('aria-invalid','true');proofInput.scrollIntoView({block:'center',behavior:'smooth'});proofInput.focus({preventScroll:true});}
  alert('Justificatif obligatoire : joignez une photo, une capture ou un PDF de la transaction avant de déclarer votre cotisation. Aucun paiement n’a été enregistré.');
  return;
 }
 if(file.size<=0){alert('Le fichier justificatif est vide. Sélectionnez une autre pièce.');return;}
 if(!(String(file.type||'').startsWith('image/')||file.type==='application/pdf'||/\.(pdf|png|jpg|jpeg|webp|heic|heif)$/i.test(file.name||''))){
  alert('Le justificatif doit être une image ou un PDF.');return;
 }
 if(typeof uploadProofFile!=='function'){
  alert('L’enregistrement des justificatifs est indisponible. Aucune déclaration effectuée.');return;
 }
 const id='COT-'+Date.now();
 let proof=null;
 try{
  proof=await uploadProofFile(file,'contributions',id);
  if(!proof||typeof proof!=='object'||!(proof.url||proof.path||proof.dataUrl||proof.data))
   throw new Error('Aucun justificatif archivé n’a été confirmé');
 }catch(e){alert('Le justificatif n’a pas pu être enregistré : '+(e.message||e)+'. La cotisation n’a pas été déclarée.');return;}
 const payment={id,plan,sequence,amount,currency:'XAF',date,method,reference,proof,status:'À vérifier',dueDate:plan==='two'&&sequence===1?g10SecondDueDate(date):''};
 if(typeof db==='undefined'||!db||typeof currentAuthUser==='undefined'||!currentAuthUser){
  alert('Connexion Firebase nécessaire pour déclarer une cotisation. Aucune déclaration enregistrée.');return;
 }
 const revised={...currentMember,contributionPlan:plan,contributionPayments:[...(currentMember.contributionPayments||[]),payment]};
 try{await saveMemberToFirebase(revised);}catch(e){console.error(e);alert('Enregistrement Firebase non confirmé. La cotisation n’a pas été ajoutée au dossier : '+(e.message||e));return;}
 Object.assign(currentMember,revised);
 syncMemberEverywhere(currentMember);persist();
 setVal('contributionRef','');setVal('contributionDate','');
 const f=document.getElementById('contributionProof');if(f)f.value='';
 renderContributionMember();renderMemberSituation();refreshDirection();
 alert('Cotisation de '+fmtXAF(amount)+' déclarée avec justificatif archivé. La Direction doit confirmer le paiement.');
};
window.openMembershipInfo=function(){openInfoCard('Droit d’adhésion','Droit d’adhésion : <b>'+fmtXAF(RATES.membership)+'</b>, une seule fois, <b>hors frais de retrait</b>.');};
window.openContributionInfo=function(){openInfoCard('Cotisation annuelle','<b>Option 1 :</b> '+fmtXAF(RATES.annual)+' en une seule fois.<br><b>Option 2 :</b> '+fmtXAF(RATES.half)+' maintenant, puis '+fmtXAF(RATES.half)+' au plus tard la veille du sixième mois après le premier versement, et au plus tard le 30 décembre de la même année.');};
document.addEventListener('change',e=>{if(e.target?.matches('input[name="payMethod"],input[name="contributionMethod"],input[name="contributionPlan"]')){methods();details();}});
function init(){methods();details();directionDisplay();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();



/* G10 — audit non destructif : références identiques dans plusieurs dossiers.
   La Direction seule peut consulter cette alerte ; aucun dossier n'est fusionné ou modifié. */
(function(){
'use strict';
function audit(){
 if(typeof isPrivilegedRole!=='function'||!isPrivilegedRole())return;
 if(typeof applications==='undefined'||!Array.isArray(applications))return;
 const main=document.querySelector('#directionApp .main');
 if(!main||applications.length===0)return;
 let box=document.getElementById('g10ArchiveReferenceAudit');
 if(!box){
  box=document.createElement('section');box.id='g10ArchiveReferenceAudit';
  box.style.cssText='border:1px solid #cbdff1;background:#f2f8ff;border-radius:11px;padding:10px 14px;margin:10px 0;font-size:13px;color:#173b5b';
  main.prepend(box);
 }
 const refs=new Map();
 applications.filter(m=>m?.paymentConfirmed).forEach(m=>{
  const key=String(m.transactionRef||'').trim().toUpperCase();
  if(!key)return;
  const uid=String(m.firebaseUid||m.id||'').trim();
  if(!uid)return;
  if(!refs.has(key))refs.set(key,new Map());
  refs.get(key).set(uid,[m.firstName,m.lastName].filter(Boolean).join(' ')||m.id||uid);
 });
 const duplicates=[...refs.entries()].filter(([ref,people])=>people.size>1);
 box.textContent=duplicates.length
  ?'⚠ Références à vérifier : '+duplicates.map(([ref,people])=>ref+' ('+[...people.values()].join(', ')+')').join(' ; ')+'. Vérifier les preuves avant toute correction.'
  :'✓ Références d’adhésion : aucune répétition entre dossiers distincts dans les données actuellement chargées par la Direction.';
}
const old=window.refreshDirection;
if(typeof old==='function')window.refreshDirection=function(){const r=old.apply(this,arguments);audit();return r;};
const oldReport=window.g10LiveOpen;
if(typeof oldReport==='function')window.g10LiveOpen=function(){const r=oldReport.apply(this,arguments);audit();return r;};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',audit,{once:true});else audit();
})();


/* G10_OFFICIAL_DOCS_081126
   Active les quatre documents officiels et la fiche vierge mise à jour du 08/11/2026
   lorsque les PDF originaux sont publiés à la racine de GitHub Pages.
   Ne remplace pas les liens actifs par des fichiers 404.
*/
(function(){
'use strict';
const manifest=[
 {key:'charte',file:'G10_Charte_2026-11-08.pdf',title:'Charte G10 — édition du 08/11/2026'},
 {key:'statuts',file:'G10_Statuts_2026-11-08.pdf',title:'Statuts G10 — édition du 08/11/2026'},
 {key:'reglement',file:'G10_Reglement_Interieur_2026-11-08.pdf',title:'Règlement intérieur G10 — édition du 08/11/2026'},
 {key:'g10241',file:'G10_241_2026-11-08.pdf',title:'G10-241 — Délégation opérationnelle du G10'},
 {key:'fiche',file:'Fiche_Adhesion_G10_2026-11-08.pdf',title:'Fiche officielle d’adhésion — 6 560 FCFA'}
];
async function documentReady(filename){
 try{
  const u=new URL(filename,location.origin+location.pathname.replace(/[^/]*$/,''));
  const res=await fetch(u.href,{method:'HEAD',cache:'no-store'});
  const mime=(res.headers.get('content-type')||'').toLowerCase();
  return res.ok&&(mime.includes('pdf')||mime.includes('octet-stream'))?u.href:null;
 }catch(e){return null;}
}
function createCard(container){
 if(container.querySelector('[data-g10-doc="g10241"]'))return;
 const article=document.createElement('article');
 article.className='doc';article.dataset.g10Doc='g10241';
 article.innerHTML='<div class="icon statuts">PDF</div><h4>G10-241</h4><p>Délégation opérationnelle du G10 au Gabon — document officiel du 08/11/2026.</p>';
 const b=document.createElement('button');b.className='btn btn-primary';b.type='button';b.textContent='Ouvrir';
 b.onclick=()=>{if(typeof openOfficialDocument==='function')openOfficialDocument('g10241');};
 article.appendChild(b);container.appendChild(article);
}
async function init(){
 if(typeof OFFICIAL_DOCUMENTS==='undefined')return;
 const missing=[];
 for(const entry of manifest){
  const url=await documentReady(entry.file);
  if(!url){missing.push(entry.file);continue;}
  if(entry.key==='g10241'){
   OFFICIAL_DOCUMENTS.g10241={title:entry.title,src:url};
   const member=document.querySelector('#member-docs .doc-grid');
   if(member)createCard(member);
   const dir=document.querySelector('#directionApp .doc-grid');
   if(dir)createCard(dir);
  }else if(OFFICIAL_DOCUMENTS[entry.key]){
   OFFICIAL_DOCUMENTS[entry.key].title=entry.title;
   OFFICIAL_DOCUMENTS[entry.key].src=url;
  }
 }
 // Informe la Direction en cas de fichier absent : un ancien PDF peut encore être lié.
 const root=document.querySelector('#directionApp .main');
 if(root){
  let notice=document.getElementById('g10OfficialDocsPublication');
  if(!notice){notice=document.createElement('p');notice.id='g10OfficialDocsPublication';
   notice.style.cssText='margin:10px 0;padding:12px 15px;border-radius:10px;border:1px solid #d7e0ec;font-size:13px';
   root.prepend(notice);
  }
  if(missing.length){notice.style.background='#fff8e9';notice.textContent='Documents G10 du 08/11/2026 : publication en attente pour '+missing.length+' fichier(s). Ne pas considérer les anciennes versions comme les nouvelles.';}
  else{notice.style.background='#e6f7eb';notice.textContent='Documents officiels G10 du 08/11/2026 disponibles : Charte, Statuts, Règlement intérieur, G10-241 et fiche d’adhésion.';}
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

(function(){const st=document.createElement('style');st.id='g10-amount-label-gap';st.textContent="\n/* Montant actuel séparé de son libellé. */\n#membershipSummary{display:flex!important;gap:15px!important;align-items:baseline!important;flex-wrap:wrap!important}\n";document.head.append(st);})();


/* G10_DIRECTION_REVIEW_V1 — dossiers en lecture seule, suppression de fiches test strictement non payées.
   N'efface pas les comptes Firebase Authentication ni d'autres données externes. */
(function(){
'use strict';
const privileged=()=>typeof isPrivilegedRole==='function'&&isPrivilegedRole();
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const members=()=>Array.isArray(applications)?applications:[];
function findMember(id){
 return members().find(m=>String(m?.id)===String(id))||
 (Array.isArray(activeMembers)?activeMembers:[]).find(m=>String(m?.id)===String(id));
}
const keyLabel={
 id:'Numéro de dossier',firstName:'Prénom',firstName2:'Autre prénom',
 lastName:'Nom',lastName2:'Autre nom',email:'Adresse courriel',
 phone:'Téléphone',country:'Pays',city:'Ville',address:'Adresse',
 expertise:'Expertise',profession:'Profession',organization:'Organisation',
 profileComplete:'Profil complété',formSigned:'Fiche signée',signPlace:'Fait à',
 signDate:'Date de signature',signedAt:'Signature enregistrée le',
 paymentDeclared:'Paiement déclaré',paymentConfirmed:'Paiement confirmé',
 paymentMethod:'Moyen de paiement',paymentDate:'Date du paiement',
 transactionRef:'Référence de transaction',g10ReceivedXaf:'FCFA vérifiés',
 membershipValidatedAt:'Validation de l’adhésion',contributionPlan:'Formule de cotisation',
 active:'Statut actif',status:'État du dossier'
};
const hidden=/password|token|secret|private|session|auth|firebase|raw|credential|data|blob|base64|html|uid|hash|url|storage|file|photo|image|pointer|documenturi/i;
window.g10ReadOnlyMember=function(id){
 if(!privileged())return alert('Accès réservé à la Direction.');
 const m=findMember(id);if(!m)return alert('Dossier introuvable. Actualisez la page.');
 document.getElementById('g10MemberReadOnlyDialog')?.remove();
 const d=document.createElement('dialog');d.id='g10MemberReadOnlyDialog';
 d.style.cssText='border:1px solid #c7d9e9;border-radius:15px;max-width:850px;width:calc(100vw - 30px);max-height:88dvh;padding:0;box-shadow:0 24px 60px #0b315855;color:#143754;background:#fff';
 const name=[m.firstName,m.firstName2,m.lastName,m.lastName2].filter(Boolean).join(' ')||m.email||m.id;
 const groups={Profil:[], 'Fiche et signature':[], 'Paiement d’adhésion':[], 'Informations complémentaires':[]};
 for(const [k,v] of Object.entries(m)){
  if(hidden.test(k)||v===undefined||v===null||typeof v==='object'||typeof v==='function'||String(v)==='')continue;
  const target=/payment|transaction|g10Received|membershipValid/i.test(k)?'Paiement d’adhésion':/sign|form|profileComplete/i.test(k)?'Fiche et signature':/^(id|firstName|firstName2|lastName|lastName2|email|phone|country|city|address|expertise|profession|organization)$/i.test(k)?'Profil':'Informations complémentaires';
  groups[target].push([keyLabel[k]||k,typeof v==='boolean'?(v?'Oui':'Non'):String(v)]);
 }
 const cards=Object.entries(groups).filter(([k,items])=>items.length).map(([k,items])=>'<section style="margin:17px 0"><h3 style="margin:0 0 9px">'+safe(k)+'</h3><table style="width:100%;border-collapse:collapse">'+items.map(([a,b])=>'<tr><th style="padding:8px;border:1px solid #d8e6ef;background:#f0f6fb;text-align:left;width:40%">'+safe(a)+'</th><td style="padding:8px;border:1px solid #d8e6ef;overflow-wrap:anywhere">'+safe(b)+'</td></tr>').join('')+'</table></section>').join('');
 const cp=Array.isArray(m.contributionPayments)?m.contributionPayments:[];
 const contributions=cp.length?'<section><h3>Cotisations enregistrées</h3><table style="width:100%;border-collapse:collapse"><thead><tr><th>Date</th><th>Montant</th><th>État</th><th>Référence</th></tr></thead><tbody>'+
 cp.map(p=>'<tr>'+[p.date||'',(p.amount??'')+(p.currency?' '+p.currency:''),p.status||'',p.reference||''].map(x=>'<td style="padding:8px;border:1px solid #d8e6ef">'+safe(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></section>':'';
 d.innerHTML='<header style="position:sticky;top:0;display:flex;gap:8px;align-items:center;justify-content:space-between;background:#103c63;color:white;padding:16px 20px;z-index:1"><div><strong style="font-size:19px">Dossier en lecture seule</strong><div style="font-size:13px">'+safe(name)+' — '+safe(m.id)+'</div></div><button type="button" data-close style="border:0;border-radius:8px;background:#fff;color:#103c63;padding:10px 14px;cursor:pointer">Fermer</button></header>'+
 '<div style="overflow:auto;max-height:calc(88dvh - 85px);padding:16px 20px"><p>Aucune modification n’est possible depuis cet écran.</p>'+cards+contributions+
 (m.paymentProofData?.data?'<button type="button" data-proof class="btn btn-light">Voir le justificatif d’adhésion</button>':'')+'</div>';
 document.body.append(d);
 d.querySelector('[data-close]').onclick=()=>d.close();
 d.querySelector('[data-proof]')?.addEventListener('click',()=>{if(typeof window.g10Proof==='function')window.g10Proof(m.id)});
 d.addEventListener('close',()=>d.remove(),{once:true});
 if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','');
};
// Un dossier actif/payé ne peut jamais être supprimé depuis les dossiers en attente.
window.g10DeletePendingMember=async function(id){
 if(!privileged())return alert('Suppression réservée à la Direction.');
 const m=findMember(id);
 if(!m)return alert('Dossier introuvable.');
 if(m.active||m.paymentConfirmed||m.paymentDeclared||(m.contributionPayments||[]).length||Number(m.g10ReceivedXaf)>0)
  return alert('Suppression refusée : ce dossier comporte une adhésion ou des opérations à conserver.');
 if(!m.firebaseUid||typeof db==='undefined'||!db)return alert('Impossible de retrouver de manière sûre le document Firebase à supprimer.');
 const label=[m.firstName,m.lastName].filter(Boolean).join(' ')||m.email||m.id;
 if(!confirm('Supprimer définitivement le dossier incomplet '+m.id+' ('+label+') ?\n\nCette action supprime sa fiche et son historique contenu dans Firebase. Elle ne supprime pas le compte de connexion Firebase Authentication, ni d’éventuels fichiers externes.'))return;
 if(prompt('Deuxième confirmation : recopiez exactement le numéro '+m.id+' pour supprimer ce dossier.')!==m.id)return;
 try{
  const ref=db.collection('members').doc(m.firebaseUid);
  const doc=await ref.get();
  if(!doc.exists)return alert('Ce dossier n’existe déjà plus dans Firebase. Actualisez.');
  const actual=doc.data()||{};
  if(String(actual.id||'')!==String(m.id)||String(actual.email||'').toLowerCase()!==String(m.email||'').toLowerCase())
   return alert('Identité Firebase différente : suppression annulée.');
  if(actual.active||actual.paymentConfirmed||actual.paymentDeclared||(actual.contributionPayments||[]).length||Number(actual.g10ReceivedXaf)>0)
   return alert('Le dossier a évolué ou comporte un paiement. Suppression annulée.');
  await ref.delete();
  applications=members().filter(x=>String(x.id)!==String(id));
  if(Array.isArray(activeMembers))activeMembers=activeMembers.filter(x=>String(x.id)!==String(id));
  if(typeof persist==='function')persist();
  if(typeof renderApplications==='function')renderApplications();
  if(typeof refreshDirection==='function')refreshDirection();
  alert('Fiche incomplète supprimée de Firebase : '+id+'. Le compte de connexion, s’il existe, nécessite une suppression distincte.');
 }catch(e){console.error(e);alert('Suppression non confirmée par Firebase : '+(e.message||e));}
};
function activeButtons(){
 if(!privileged())return;
 const t=document.querySelector('#dir-active thead tr');
 if(t&&!t.querySelector('[data-g10-read-head]')){
  const th=document.createElement('th');th.dataset.g10ReadHead='yes';th.textContent='Dossier';
  const action=[...t.children].find(e=>/actions?/i.test(e.textContent||''))||t.lastElementChild;
  if(action)t.insertBefore(th,action);
 }
 const body=document.getElementById('activeRows');if(!body)return;
 for(const tr of body.querySelectorAll('tr')){
  if(tr.querySelector('[data-g10-read-only]'))continue;
  const id=tr.cells[0]?.textContent?.trim(),m=findMember(id);
  if(!m)continue;
  const td=document.createElement('td'),button=document.createElement('button');
  button.type='button';button.className='btn btn-light';button.textContent='Ouvrir le profil complet';
  button.dataset.g10ReadOnly='yes';button.addEventListener('click',()=>{
    // Réutiliser exactement la vue complète déjà accessible depuis les dossiers en attente.
    // Elle clone l'espace adhérent dans une fenêtre isolée, sans droit d'écriture.
    if(typeof window.g10ViewFullApplication!=='function')return alert('La vue complète est indisponible. Actualisez la page.');
    if(!m.firebaseUid)return alert('Ce dossier ne dispose pas d’identifiant Firebase. Actualisez la Direction.');
    window.g10ViewFullApplication(m.firebaseUid);
  });
  td.append(button);
  const last=tr.cells[tr.cells.length-1];if(last)tr.insertBefore(td,last);
 }
}
function pendingButtons(){
 if(!privileged())return;
 const body=document.getElementById('applicationRows');if(!body)return;
 for(const tr of body.querySelectorAll('tr')){
  if(tr.querySelector('[data-g10-pending-delete]'))continue;
  const id=tr.cells[0]?.textContent?.trim(),m=findMember(id);
  if(!m||m.paymentConfirmed||m.active)continue;
  const cell=tr.cells[tr.cells.length-1];if(!cell)continue;
  const b=document.createElement('button');
  b.type='button';b.className='btn btn-light';b.dataset.g10PendingDelete='yes';
  b.textContent='Supprimer';b.style.cssText='display:block;margin-top:7px;background:#fff0f2;color:#a11d38;border:1px solid #f4bcc4';
  b.addEventListener('click',()=>window.g10DeletePendingMember(m.id));
  cell.append(b);
 }
}
const previousActive=window.renderActive;
if(typeof previousActive==='function')window.renderActive=function(){const out=previousActive.apply(this,arguments);activeButtons();return out;};
const previousPending=window.renderApplications;
if(typeof previousPending==='function')window.renderApplications=function(){const out=previousPending.apply(this,arguments);pendingButtons();return out;};
const previousRefresh=window.refreshDirection;
if(typeof previousRefresh==='function')window.refreshDirection=function(){const out=previousRefresh.apply(this,arguments);activeButtons();pendingButtons();return out;};
function init(){activeButtons();pendingButtons();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();


/* G10_DIRECTION_SHARED_OFFICIAL_DOCS — onglet officiel Direction,
   alimenté par la même bibliothèque HTML que l'espace adhérent. */
(function(){
 'use strict';
 const id='dir-g10-official-docs';
 function privileged(){return typeof isPrivilegedRole==='function'&&isPrivilegedRole();}
 function install(){
  const app=document.getElementById('directionApp');
  const nav=app?.querySelector('.side-nav');
  const main=app?.querySelector('main.main');
  if(!nav||!main)return;
  let section=document.getElementById(id);
  if(!section){
   section=document.createElement('section');section.id=id;section.className='hidden';
   section.innerHTML='<div class="card panel"><div class="panel-head"><div><h3>Documents officiels</h3><p>Bibliothèque commune à la Direction et aux adhérents G10.</p></div></div><div class="doc-grid" id="g10-dir-shared-document-grid"></div></div>';
   main.appendChild(section);
  }
  if(nav.querySelector('[data-g10-official-dir]'))return;
  const button=document.createElement('button');button.type='button';button.className='navbtn';button.dataset.g10OfficialDir='1';button.textContent='📄 Documents officiels';
  const settings=[...nav.querySelectorAll('button')].find(x=>/Paramètres/i.test(x.textContent||''));
  if(settings)nav.insertBefore(button,settings);else nav.appendChild(button);
  const prior=window.showDirTab;
  if(typeof prior==='function'){
   window.showDirTab=function(name,btn){
    section.classList.add('hidden');
    return prior.apply(this,arguments);
   };
  }
  button.addEventListener('click',()=>{
   if(!privileged())return alert('Accès réservé à la Direction.');
   const source=document.querySelector('#member-docs .doc-grid');
   const target=section.querySelector('#g10-dir-shared-document-grid');
   if(!source||!target)return alert('Bibliothèque officielle temporairement indisponible.');
   target.replaceChildren(...[...source.children].map(x=>x.cloneNode(true)));
   if(typeof window.showDirTab==='function')window.showDirTab('settings',button);
   document.getElementById('dir-settings')?.classList.add('hidden');
   section.classList.remove('hidden');
   nav.querySelectorAll('.navbtn').forEach(el=>el.classList.toggle('active',el===button));
   const title=document.getElementById('dirTitle');if(title)title.textContent='Documents officiels';
   const subtitle=document.getElementById('dirSubtitle');if(subtitle)subtitle.textContent='La même bibliothèque officielle que dans les profils adhérents.';
   section.scrollIntoView({block:'start'});
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();


/* G10 — Alerte d'échéance de cotisation option 2, consultation uniquement.
   Date = min(veille du 6e mois, 30 décembre de l'année du 1er versement).
   Se recalcule au chargement, au retour sur l'onglet et après actualisation des données.
   Aucun paiement n'est modifié ni créé. */
(function(){
 'use strict';
 const dueDate=first=>typeof window.g10ComputeSecondDue==='function'?window.g10ComputeSecondDue(first):'';
 function todayInGabon(){
  const now=new Date();
  try{
   const parts=new Intl.DateTimeFormat('fr-FR',{timeZone:'Africa/Libreville',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
   const p={};for(const x of parts)p[x.type]=x.value;
   return p.year+'-'+p.month+'-'+p.day;
  }catch(e){
   return now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
  }
 }
 const dayNumber=iso=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(iso))return NaN;const [y,m,d]=iso.split('-').map(Number);return Math.floor(Date.UTC(y,m-1,d)/86400000)};
 const frDate=iso=>/^\d{4}-\d{2}-\d{2}$/.test(iso)?iso.slice(8,10)+'/'+iso.slice(5,7)+'/'+iso.slice(0,4):'';
 const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const isVerified=p=>String(p?.status||'').toLowerCase()==='confirmé';
 function dueForMember(m){
  const payments=Array.isArray(m?.contributionPayments)?m.contributionPayments:[];
  const confirmedFirst=payments.filter(p=>p.plan==='two'&&Number(p.sequence)===1&&isVerified(p)&&/^\d{4}-\d{2}-\d{2}$/.test(String(p.date||''))).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  for(const first of confirmedFirst){
   const year=String(first.date).slice(0,4);
   const sameYearSeconds=payments.filter(p=>p.plan==='two'&&Number(p.sequence)===2&&String(p.date||'').slice(0,4)===year);
   if(sameYearSeconds.some(isVerified))continue;
   const due=dueDate(first.date);
   if(!due)continue;
   const diff=dayNumber(due)-dayNumber(todayInGabon());
   if(!Number.isFinite(diff))continue;
   return {m,first,due,days:diff,pendingConfirmation:sameYearSeconds.some(p=>!isVerified(p))};
  }
  return null;
 }
 const fmtName=m=>[m.firstName,m.firstName2,m.lastName,m.lastName2].filter(Boolean).join(' ')||m.email||m.id||'Adhérent';
 function summary(r){
  const date=frDate(r.due);
  if(r.pendingConfirmation)return 'Deuxième versement déclaré, en attente de validation par la Direction · Échéance : '+date;
  if(r.days<0)return 'Deuxième versement en retard de '+(-r.days)+' jour(s) · Échéance : '+date;
  if(r.days===0)return 'Deuxième versement à régler aujourd’hui ('+date+')';
  if(r.days<=7)return 'Échéance proche : '+r.days+' jour(s) avant le deuxième versement ('+date+')';
  if(r.days<=30)return 'Deuxième versement à régler dans '+r.days+' jour(s), au plus tard le '+date;
  return 'Prochaine échéance du deuxième versement : '+date;
 }
 function getPanel(host,id){
  if(!host)return null;
  let el=document.getElementById(id);
  if(!el){
   el=document.createElement('section');el.id=id;el.setAttribute('role','status');el.setAttribute('aria-live','polite');
   el.style.cssText='padding:14px 17px;margin:12px 0;border-radius:12px;border:1px solid #c4dae9;background:#f0f8ff;color:#133b5c;font-size:14px;line-height:1.5';
   host.insertAdjacentElement('afterbegin',el);
  }
  return el;
 }
 function render(){
  const memberPanel=document.getElementById('member-payments');
  const current=typeof currentMember!=='undefined'&&currentMember?dueForMember(currentMember):null;
  if(memberPanel){
   const box=getPanel(memberPanel,'g10SecondDueMemberAlert');
   if(box){
    box.hidden=!current;
    if(current){box.style.background=current.days<0?'#fff0ee':current.days<=7?'#fff7dc':'#f0f8ff';box.innerHTML='<b>Suivi de votre cotisation — option 2</b><div>'+safe(summary(current))+'</div>';}
   }
  }
  const privileged=typeof isPrivilegedRole==='function'&&isPrivilegedRole();
  const members=typeof applications!=='undefined'&&Array.isArray(applications)?applications:[];
  const alerts=privileged?members.map(dueForMember).filter(r=>r&&(r.days<=30||r.pendingConfirmation)).sort((a,b)=>a.days-b.days):[];
  for(const id of ['dir-overview','dir-contributions']){
   const host=document.getElementById(id);
   if(!host)continue;
   const box=getPanel(host,'g10SecondDueDirAlert-'+id);
   if(!box)continue;
   box.hidden=!privileged||alerts.length===0;
   if(!box.hidden){
    box.innerHTML='<b>Échéances de cotisation à surveiller ('+alerts.length+')</b>'+
      '<div style="margin-top:7px">'+alerts.slice(0,25).map(r=>'<div style="padding:5px 0;border-top:1px solid #dbe6ef"><strong>'+safe(fmtName(r.m))+'</strong> · '+safe(summary(r))+'</div>').join('')+
      (alerts.length>25?'<div>Et '+(alerts.length-25)+' autre(s) échéance(s).</div>':'')+'</div>';
   }
  }
 }
 function refresh(){if(document.readyState!=='loading')render();}
 const originalDirection=window.refreshDirection;
 if(typeof originalDirection==='function')window.refreshDirection=function(){const value=originalDirection.apply(this,arguments);refresh();return value;};
 const originalMember=window.renderContributionMember;
 if(typeof originalMember==='function')window.renderContributionMember=function(){const value=originalMember.apply(this,arguments);refresh();return value;};
 const originalDirTab=window.showDirTab;
 if(typeof originalDirTab==='function')window.showDirTab=function(){const value=originalDirTab.apply(this,arguments);refresh();return value;};
 const originalMemberView=window.showMemberView;
 if(typeof originalMemberView==='function')window.showMemberView=function(){const value=originalMemberView.apply(this,arguments);refresh();return value;};
 window.addEventListener('pageshow',refresh);
 window.addEventListener('focus',refresh);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
})();


/* G10 — harmoniser l'échéance dans "Ma situation" avec les paiements et le tableau Direction. */
(function(){
 'use strict';
 const old=window.renderMemberSituation;
 if(typeof old!=='function')return;
 window.renderMemberSituation=function(){
  const result=old.apply(this,arguments);
  if(typeof currentMember==='undefined'||!currentMember)return result;
  const m=currentMember,ps=Array.isArray(m.contributionPayments)?m.contributionPayments:[];
  const first=ps.filter(p=>p.plan==='two'&&Number(p.sequence)===1&&p.status==='Confirmé'&&/^\d{4}-\d{2}-\d{2}$/.test(String(p.date||''))).sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];
  if(!first||typeof window.g10ComputeSecondDue!=='function')return result;
  const inYear=ps.filter(p=>p.plan==='two'&&Number(p.sequence)===2&&String(p.date||'').slice(0,4)===first.date.slice(0,4));
  if(inYear.some(p=>p.status==='Confirmé')||inYear.some(p=>p.status!=='Confirmé'))return result;
  const d=window.g10ComputeSecondDue(first.date);
  const label=document.getElementById('situationNextDue');
  if(label&&/^\d{4}-\d{2}-\d{2}$/.test(d))label.textContent='Au plus tard le '+d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4);
  return result;
 };
})();


/* G10_INSCRIPTION_COMPLETE_V1 — contrôle guidé des nouveaux dossiers.
 * L'inscription reste enregistrable en brouillon ; seule la validation / déclaration d'un paiement
 * et sa notification WhatsApp sont bloquées tant que les pièces obligatoires ne sont pas là.
 * Ne modifie pas rétroactivement les adhérents payés ou les justificatifs existants. */
(function(){
 'use strict';
 const byId=id=>document.getElementById(id);
 const member=()=>typeof currentMember!=='undefined'?currentMember:null;
 const v=id=>String(byId(id)?.value||'').trim();
 const hasStoredFile=p=>!!(p&&typeof p==='object'&&(p.dataUrl||p.url||p.path||p.data));
 const storedPaymentProof=m=>!!m&&(hasStoredFile(m.membershipProof)||hasStoredFile(m.paymentProofData));
 const validMember=m=>!!m?.profileComplete&&!!m?.eligibilityConfirmed;
 function showError(message,section,field){
  if(byId('smartFormModal')?.classList.contains('open')&&typeof closeModal==='function')closeModal('smartFormModal');
  const body=byId('memberAccordionBody-'+section);
  const card=byId('memberAccordion-'+section);
  if(typeof window.showMemberView==='function')window.showMemberView('account');
  if(typeof window.toggleMemberAccordion==='function')window.toggleMemberAccordion(section,true);
  if(body){
    let note=body.querySelector('.g10-inscription-error');
    if(!note){note=document.createElement('div');note.className='g10-inscription-error';note.setAttribute('role','alert');note.style.cssText='background:#fff0ed;color:#842b20;padding:11px 13px;border:1px solid #df9d8f;border-radius:10px;font-size:14px;font-weight:650;margin:10px 0';body.prepend(note);}
    note.textContent=message;
  }
  if(field&&byId(field)){const el=byId(field);el.setAttribute('aria-invalid','true');el.style.outline='2px solid #d44839';if(typeof el.focus==='function')el.focus({preventScroll:true});}
  (card||body)?.scrollIntoView?.({behavior:'smooth',block:'center'});
  return false;
 }
 function cleared(section){byId('memberAccordionBody-'+section)?.querySelector('.g10-inscription-error')?.remove();}
 const fields={
  civility:'civilité',firstName:'premier prénom',lastName:'premier nom',birthDate:'date de naissance',birthPlace:'lieu de naissance',
  nationality:'nationalité',address:'adresse',postal:'code postal',city:'ville',country:'pays',idType:'type de document',
  idNumber:'numéro du document',idIssue:'date de délivrance',idExpiry:'date d’expiration',
  email:'adresse courriel',phone:'numéro de téléphone / WhatsApp',profession:'métier / profession',degree:'diplôme',expertise:'expertise / compétences'
 };
 function checkProfileForm(){
  for(const [id,label] of Object.entries(fields)){if(!v(id))return showError('Veuillez renseigner le champ obligatoire : '+label+'.','profile',id);}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email')))return showError('Veuillez saisir une adresse courriel valide.','profile','email');
  if(v('phone').replace(/\D/g,'').length<8)return showError('Veuillez saisir un numéro de téléphone / WhatsApp complet.','profile','phone');
  // Seuls le deuxième prénom et le deuxième nom sont facultatifs.
  // Pour un champ non applicable, l'adhérent peut écrire « Sans objet ».
  if(!byId('diasporaEligibility')?.checked)return showError('Vous devez cocher « Condition d’adhésion » avant d’enregistrer votre profil.','profile','diasporaEligibility');
  cleared('profile');return true;
 }
 function checkSigned(){
  const m=member();
  if(!validMember(m))return showError('Complétez et enregistrez d’abord votre profil et confirmez les conditions d’adhésion.','profile','diasporaEligibility');
  if(!m.formSigned)return showError('Vous devez finaliser la fiche et sa signature avant de déclarer un paiement. Choisissez « Document intelligent » ou « PDF + signature manuscrite ».','form','modeElectronicBtn');
  if(m.signatureMode==='manual'&&!hasStoredFile(m.manualSignedProof)){
   return showError('La fiche manuscrite doit être réellement jointe et archivée, pas seulement nommée. Veuillez la téléverser.','form','manualSignedFile');
  }
  return true;
 }
 function checkPaymentInputs(){
  if(!checkSigned())return false;
  if(!v('transactionRef'))return showError('La référence du paiement est obligatoire.','payment','transactionRef');
  if(!v('paymentDate'))return showError('Indiquez la date du paiement.','payment','paymentDate');
  const input=byId('paymentProof'),file=input?.files?.[0];
  if(!file&&!storedPaymentProof(member()))return showError('Vous devez joindre une photo, une capture ou un PDF du justificatif avant de déclarer le paiement.','payment','paymentProof');
  if(file&&file.size===0)return showError('Le justificatif sélectionné est vide. Choisissez un autre document.','payment','paymentProof');
  cleared('payment');return true;
 }
 function wrap(key,guard){
  const previous=window[key];
  if(typeof previous!=='function')return;
  window[key]=function(){if(!guard())return;return previous.apply(this,arguments);};
 }
 wrap('saveProfile',checkProfileForm);
 wrap('validateSmartForm',function(){
  if(!validMember(member()))return showError('Enregistrez votre profil et acceptez les conditions avant la signature.','profile','diasporaEligibility');
  if(!v('signPlace'))return showError('Indiquez le lieu où vous signez la fiche.','form','signPlace');
  if(!v('signDate'))return showError('Indiquez la date de votre signature.','form','signDate');
  if(!byId('acceptRules')?.checked)return showError('Cochez « Engagement » pour confirmer que vous acceptez les statuts et le règlement intérieur.','form','acceptRules');
  if(!byId('acceptInitials')?.checked)return showError('Cochez « Signature électronique par initiales » pour valider votre signature.','form','acceptInitials');
  cleared('form');return true;
 });
 // Le mode PDF doit archiver une vraie pièce dans Firebase, pas uniquement le nom du fichier.
 window.saveManualSignedForm=async function(){
  const m=member();
  if(!validMember(m))return showError('Enregistrez votre profil et acceptez les conditions avant de transmettre la fiche signée.','profile','diasporaEligibility');
  const file=byId('manualSignedFile')?.files?.[0];
  if(!file)return showError('Sélectionnez la fiche remplie et signée en PDF ou en image.','form','manualSignedFile');
  if(file.size<=0)return showError('Le document signé sélectionné est vide.','form','manualSignedFile');
  if(!/\.pdf$/i.test(file.name)&&!String(file.type||'').startsWith('image/'))return showError('La fiche signée doit être un PDF ou une image.','form','manualSignedFile');
  if(typeof uploadProofFile!=='function'||typeof saveMemberToFirebase!=='function'||typeof currentAuthUser==='undefined'||!currentAuthUser||typeof db==='undefined'||!db)
    return showError('Le stockage sécurisé n’est pas disponible. Reconnectez-vous avant de transmettre la fiche.','form','manualSignedFile');
  const button=document.querySelector('#manualFormBlock button[onclick*="saveManualSignedForm"]');
  if(button?.disabled)return;
  if(button)button.disabled=true;
  try{
    const proof=await uploadProofFile(file,'membership-signed',m.id||'adhesion');
    if(!hasStoredFile(proof))throw new Error('Le document n’a pas été archivé.');
    const copy={...m,signatureMode:'manual',manualSignedProof:proof,manualSignedFileName:file.name,manualSignedAt:new Date().toISOString(),formSigned:true,status:'Fiche manuscrite transmise'};
    await saveMemberToFirebase(copy);
    Object.assign(m,copy);
    if(typeof upsertApplication==='function')upsertApplication();
    if(typeof syncMemberEverywhere==='function')syncMemberEverywhere(m);
    if(typeof persist==='function')persist();
    if(typeof hydrateMember==='function')hydrateMember();
    const label=byId('manualFileStatus');if(label)label.textContent='Fiche signée archivée : '+file.name;
    cleared('form');
    alert('Votre fiche manuscrite signée a bien été enregistrée et archivée.');
  }catch(err){console.error('Fiche signée',err);showError('La fiche signée n’a pas pu être archivée : '+(err.message||err)+'. Réessayez.','form','manualSignedFile');}
  finally{if(button)button.disabled=false;}
 };
 // Prévalidation avant les écritures Firebase et avant toute notification.
 wrap('declarePayment',checkPaymentInputs);
 window.sendWhatsAppPayment=function(){
  const m=member();
  if(!m)return showError('Ouvrez votre dossier pour continuer.','profile');
  if(!checkSigned())return;
  if(!m.paymentDeclared)return showError('Déclarez d’abord votre paiement avec son justificatif, puis attendez l’enregistrement avant d’envoyer le message WhatsApp.','payment','paymentProof');
  if(!storedPaymentProof(m))return showError('Le justificatif du paiement n’a pas été archivé. Joignez-le et déclarez le paiement à nouveau.','payment','paymentProof');
  if(!m.transactionRef||!m.paymentDate)return showError('La référence et la date du paiement doivent être enregistrées.','payment','transactionRef');
  const phone=String(typeof settings!=='undefined'?settings.airtel||'':'').replace(/\D/g,'');
  if(phone.length<8)return alert('Le numéro WhatsApp officiel n’est pas disponible. Contactez la Direction.');
  const name=[m.firstName,m.firstName2,m.lastName,m.lastName2].filter(Boolean).join(' ')||m.email||'Adhérent';
  const msg='Bonjour Direction G10, je confirme ma déclaration du droit d’adhésion.\nNom : '+name+
    '\nDossier : '+m.id+'\nMontant de référence : 6 560 FCFA'+
    '\nMoyen de paiement : '+(m.paymentMethod||'Non précisé')+
    '\nRéférence de transaction : '+m.transactionRef+
    '\nDate du paiement : '+m.paymentDate+
    '\nLe justificatif est enregistré dans mon dossier G10. Merci de vérifier le paiement.';
  window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(msg),'_blank','noopener');
 };
 function decorate(){
  const input=byId('paymentProof');
  if(input){input.required=true;input.setAttribute('aria-required','true');const label=input.closest('.field')?.querySelector('label');if(label)label.textContent='Justificatif de paiement * (PDF ou image)';}
  const whatsapp=document.querySelector('#memberAccordion-payment button[onclick*="sendWhatsAppPayment"]');
  if(whatsapp)whatsapp.title='Disponible après une déclaration complète et l’archivage du justificatif.';
  document.querySelectorAll('#memberAccordion-profile input,#memberAccordion-profile select,#memberAccordion-profile textarea').forEach(el=>{
    if(fields[el.id]){
     el.required=true;el.setAttribute('aria-required','true');
     const lab=el.closest('.field')?.querySelector('label');
     if(lab&&!lab.textContent.includes('*'))lab.append(' *');
    }
   });
   const profileBody=byId('memberAccordionBody-profile');
   if(profileBody&&!byId('g10RequiredFieldsExplanation')){
    const p=document.createElement('div');p.id='g10RequiredFieldsExplanation';p.style.cssText='background:#f0f8ff;border:1px solid #caddea;border-radius:9px;padding:9px 12px;margin-bottom:12px;font-size:13px;color:#153e5a';
    p.textContent='Complétez tous les champs marqués *. Seuls Prénom 2 et Nom 2 sont facultatifs. Si un renseignement ne s’applique pas (code postal, diplôme, etc.), indiquez « Sans objet ». Les conditions d’adhésion doivent aussi être acceptées.';
    profileBody.prepend(p);
   }
 }
 function init(){
  decorate();
  document.getElementById('memberApp')?.addEventListener('input',e=>{if(e.target?.getAttribute('aria-invalid')==='true'){e.target.removeAttribute('aria-invalid');e.target.style.outline='';}});
  document.getElementById('memberApp')?.addEventListener('change',e=>{if(e.target?.getAttribute('aria-invalid')==='true'){e.target.removeAttribute('aria-invalid');e.target.style.outline='';}});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();


/* G10 — contrôle des justificatifs réellement enregistrés avant la notification Direction.
   Signale également les dossiers historiques incomplets, sans les effacer ni les régulariser. */
(function(){
 'use strict';
 const hasFile=p=>!!(p&&typeof p==='object'&&(p.dataUrl||p.url||p.path||p.data));
 const signed=m=>!!m?.formSigned&&(m.signatureMode!=='manual'||hasFile(m.manualSignedProof));
 const hasPaymentProof=m=>hasFile(m?.membershipProof)||hasFile(m?.paymentProofData);
 const oldSend=window.sendWhatsAppPayment;
 if(typeof oldSend==='function')window.sendWhatsAppPayment=async function(){
  const m=typeof currentMember!=='undefined'?currentMember:null;
  if(!m)return oldSend.apply(this,arguments);
  if(!m.firebaseUid)return alert('Ce dossier n’est pas encore rattaché à un compte Firebase. Aucun message WhatsApp n’a été envoyé.');
  if(!m.profileComplete||!m.eligibilityConfirmed||!signed(m)||!m.paymentDeclared||!hasPaymentProof(m)){
   return oldSend.apply(this,arguments);
  }
  if(typeof db==='undefined'||!db)return alert('Impossible de vérifier votre dossier en ligne. Reconnectez-vous puis réessayez.');
  try{
   const doc=await db.collection('members').doc(m.firebaseUid).get({source:'server'});
   const saved=doc.exists?doc.data():null;
   if(!saved||String(saved.id||'')!==String(m.id||'')||!saved.paymentDeclared||!hasPaymentProof(saved)||!signed(saved)){
    return alert('Votre paiement ou votre justificatif n’est pas encore enregistré dans Firebase. Vérifiez votre dossier puis réessayez. Aucun message WhatsApp n’a été envoyé.');
   }
   return oldSend.apply(this,arguments);
  }catch(err){
   console.error('Vérification Firebase avant WhatsApp',err);
   return alert('Impossible de confirmer le justificatif enregistré sur le serveur. Aucun message WhatsApp n’a été envoyé. Réessayez avec une connexion stable.');
  }
 };
 function missingLegacy(){
  if(typeof isPrivilegedRole!=='function'||!isPrivilegedRole())return;
  if(typeof applications==='undefined'||!Array.isArray(applications))return;
  const body=document.getElementById('applicationRows');if(!body)return;
  for(const row of body.querySelectorAll('tr')){
   if(row.querySelector('[data-g10-missing-proof]'))continue;
   const id=row.cells[0]?.textContent?.trim();
   const m=applications.find(a=>String(a.id)===id);
   if(!m||!m.paymentDeclared||m.paymentConfirmed||hasPaymentProof(m))continue;
   const cell=row.cells[4]||row.lastElementChild;
   const marker=document.createElement('div');marker.dataset.g10MissingProof='yes';
   marker.style.cssText='margin-top:6px;color:#a63320;background:#fff1ee;border:1px solid #eeae9e;border-radius:7px;padding:6px 8px;font-weight:750;font-size:12px';
   marker.textContent='⚠ Justificatif absent — demander la pièce à l’adhérent';
   cell?.append(marker);
  }
 }
 const oldRender=window.renderApplications;
 if(typeof oldRender==='function')window.renderApplications=function(){
  const result=oldRender.apply(this,arguments);
  missingLegacy();
  return result;
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',missingLegacy,{once:true});else missingLegacy();
})();


/* G10 — empêcher la Direction de valider un dossier incomplet.
   Ne concerne pas les adhésions actives déjà confirmées. */
(function(){
 'use strict';
 const hasProof=p=>!!(p&&typeof p==='object'&&(p.dataUrl||p.url||p.path||p.data));
 function complete(m){
  return !!m&&!!m.profileComplete&&!!m.eligibilityConfirmed&&!!m.formSigned&&
    !!m.paymentDeclared&&(hasProof(m.membershipProof)||hasProof(m.paymentProofData))&&
    (m.signatureMode!=='manual'||hasProof(m.manualSignedProof))&&
    !!String(m.transactionRef||'').trim()&&!!String(m.paymentDate||'').trim();
 }
 const original=window.validateApplicationByUid;
 if(typeof original==='function')window.validateApplicationByUid=async function(uid){
  if(typeof isPrivilegedRole!=='function'||!isPrivilegedRole())return alert('Accès réservé à la Direction.');
  const m=typeof applications!=='undefined'&&Array.isArray(applications)?applications.find(x=>String(x.firebaseUid||'')===String(uid)):null;
  if(!m)return alert('Dossier introuvable. Actualisez la liste.');
  if(m.active||m.paymentConfirmed)return alert('Cette adhésion est déjà confirmée.');
  if(!complete(m))return alert('Validation impossible : le profil, l’engagement, la signature, la référence/date et le justificatif archivé doivent être complets. Demandez à l’adhérent de finaliser son dossier.');
  if(typeof db==='undefined'||!db)return alert('Firebase indisponible. Validation annulée.');
  try{
   const snap=await db.collection('members').doc(uid).get({source:'server'});
   if(!snap.exists||String(snap.data()?.id||'')!==String(m.id||'')||!complete(snap.data())){
    return alert('Le dossier sur Firebase est incomplet ou différent : impossible de valider cette adhésion.');
   }
  }catch(e){console.error('Validation Direction',e);return alert('Impossible de vérifier les pièces sur Firebase. Aucune validation effectuée.');}
  return original.apply(this,arguments);
 };
})();


/* G10_COTISATION_JUSTIFICATIF_OBLIGATOIRE_V1
   La déclaration est impossible sans preuve et une déclaration ancienne incomplète
   peut être régularisée sans nouveau paiement ni suppression de l'historique. */
(function(){
 'use strict';
 const hasProof=p=>!!(p&&typeof p==='object'&&(p.url||p.path||p.dataUrl||p.data));
 function renderRepair(){
  const host=document.getElementById('contributionNextBox')?.parentElement||document.getElementById('contributionUnlocked');
  if(!host)return;
  let pane=document.getElementById('g10MissingContributionProof');
  const m=typeof currentMember!=='undefined'?currentMember:null;
  const missing=(Array.isArray(m?.contributionPayments)?m.contributionPayments:[])
     .filter(p=>p&&p.status!=='Confirmé'&&!hasProof(p.proof));
  if(!missing.length){if(pane)pane.remove();return;}
  if(!pane){
   pane=document.createElement('section');pane.id='g10MissingContributionProof';
   pane.setAttribute('role','region');pane.setAttribute('aria-label','Justificatifs manquants');
   pane.style.cssText='margin:12px 0;padding:14px;background:#fff5e9;color:#603b15;border:1px solid #edbf85;border-radius:11px';
   host.appendChild(pane);
  }
  pane.replaceChildren();
  const heading=document.createElement('strong');
  heading.textContent='Justificatif manquant — cotisation déjà déclarée';
  pane.appendChild(heading);
  const desc=document.createElement('p');
  desc.textContent='Joignez le reçu de transaction à la déclaration existante. Aucun second paiement ne sera créé.';
  pane.appendChild(desc);
  for(const item of missing){
   const wrap=document.createElement('div');wrap.style.cssText='margin:10px 0;padding:9px;background:white;border-radius:9px';
   const title=document.createElement('p');title.style.cssText='margin:0 0 7px;font-weight:700';
   title.textContent=(item.plan==='two'?'Versement '+String(item.sequence||1)+'/2':'Cotisation annuelle')+' — '+Number(item.amount||0).toLocaleString('fr-FR')+' FCFA · '+String(item.date||'Date manquante')+' · réf. '+String(item.reference||'—');
   wrap.appendChild(title);
   const label=document.createElement('label');label.textContent='Justificatif de transaction (obligatoire) ';
   label.style.cssText='display:block;font-size:13px;margin-bottom:8px';
   const input=document.createElement('input');input.type='file';input.accept='application/pdf,image/*';
   input.style.cssText='display:block;width:100%;margin-top:6px';input.setAttribute('aria-label','Choisir le justificatif manquant');
   label.appendChild(input);wrap.appendChild(label);
   const button=document.createElement('button');button.type='button';button.className='btn btn-primary';button.textContent='Joindre au paiement existant';
   button.addEventListener('click',async()=>{
    const selected=input.files?.[0];
    if(!selected)return alert('Sélectionnez un justificatif avant de continuer.');
    if(selected.size<=0)return alert('Le fichier justificatif est vide.');
    if(!(String(selected.type||'').startsWith('image/')||selected.type==='application/pdf'||/\.(pdf|png|jpg|jpeg|webp|heic|heif)$/i.test(selected.name||'')))
     return alert('Joignez une image ou un PDF.');
    if(typeof db==='undefined'||!db||typeof currentAuthUser==='undefined'||!currentAuthUser||typeof saveMemberToFirebase!=='function'||typeof uploadProofFile!=='function')
     return alert('Connexion Firebase nécessaire pour enregistrer cette pièce.');
    if(button.disabled)return;
    button.disabled=true;button.textContent='Enregistrement du justificatif…';
    try{
     const proof=await uploadProofFile(selected,'contributions',item.id);
     if(!hasProof(proof))throw new Error('Le stockage n’a pas confirmé le justificatif.');
     const original=typeof currentMember!=='undefined'?currentMember:null;
     if(!original||!original.contributionPayments?.some(p=>p.id===item.id&&p.status!=='Confirmé'&&!hasProof(p.proof)))
      throw new Error('La déclaration a changé. Actualisez la page.');
     const revised={...original,contributionPayments:original.contributionPayments.map(p=>p.id===item.id?{...p,proof}:p)};
     await saveMemberToFirebase(revised);
     Object.assign(original,revised);
     if(typeof syncMemberEverywhere==='function')syncMemberEverywhere(original);
     if(typeof persist==='function')persist();
     if(typeof renderContributionMember==='function')renderContributionMember();
     if(typeof refreshDirection==='function')refreshDirection();
     alert('Justificatif ajouté à la déclaration existante. La Direction peut maintenant l’examiner.');
    }catch(err){
     console.error('Justificatif de cotisation',err);
     alert('Pièce non enregistrée : '+(err.message||err));
    }finally{
     button.disabled=false;button.textContent='Joindre au paiement existant';
    }
   });
   wrap.appendChild(button);pane.appendChild(wrap);
  }
 }
 const oldMemberRender=window.renderContributionMember;
 if(typeof oldMemberRender==='function')window.renderContributionMember=function(){
  const result=oldMemberRender.apply(this,arguments);
  renderRepair();
  return result;
 };
 const oldConfirm=window.confirmContributionPayment;
 if(typeof oldConfirm==='function')window.confirmContributionPayment=function(memberId,paymentId){
  const m=(typeof applications!=='undefined'&&Array.isArray(applications))?applications.find(m=>String(m.id)===String(memberId)):null;
  const p=m?.contributionPayments?.find(p=>String(p.id)===String(paymentId));
  if(!m||!p)return alert('Cotisation introuvable. Actualisez la Direction.');
  if(!hasProof(p.proof))return alert('Confirmation impossible : le justificatif de transaction est absent. Demandez à l’adhérent de joindre la pièce à sa cotisation.');
  return oldConfirm.apply(this,arguments);
 };
 function init(){
  const input=document.getElementById('contributionProof');
  if(input){
   input.required=true;input.setAttribute('aria-required','true');
   const label=input.closest('label');
   if(label&&!label.textContent.includes('*'))label.prepend('Justificatif obligatoire * — ');
  }
  renderRepair();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();


/* G10_COTISATION_PREUVE_TELEVERSEMENT_V1
   Secours de stockage limité pour fichiers de preuve lorsque Firebase Storage n'est pas configuré.
   Présente la pièce archivée à la Direction sans valider le paiement. */
(function(){
 'use strict';
 const hasProof=p=>!!(p&&typeof p==='object'&&(p.data||p.dataUrl||p.url||p.path));
 if(typeof window.uploadProofFile!=='function'){
  window.uploadProofFile=async function(file,folder,id){
   if(!file||file.size<=0)throw new Error('Fichier justificatif manquant ou vide.');
   const type=String(file.type||'');
   const read=f=>new Promise((ok,fail)=>{
    const reader=new FileReader();
    reader.onload=()=>ok(reader.result);
    reader.onerror=()=>fail(new Error('Lecture du fichier impossible.'));
    reader.readAsDataURL(f);
   });
   if(type==='application/pdf'||/\.pdf$/i.test(file.name||'')){
    if(file.size>180000)throw new Error('PDF trop volumineux pour le dossier Firebase (180 Ko maximum). Utilisez une capture ou compressez le PDF.');
    return {data:await read(file),name:file.name,type:'application/pdf'};
   }
   if(!(type.startsWith('image/')||/\.(png|jpe?g|webp|heic|heif)$/i.test(file.name||'')))
     throw new Error('Sélectionnez une image ou un PDF.');
   const src=await read(file);
   const img=await new Promise((ok,fail)=>{
    const element=new Image();
    element.onload=()=>ok(element);
    element.onerror=()=>fail(new Error('Cette image ne peut pas être lue. Essayez une photo JPG ou PNG.'));
    element.src=src;
   });
   let scale=Math.min(1,900/Math.max(img.width,img.height));
   let width=Math.max(1,Math.round(img.width*scale)),height=Math.max(1,Math.round(img.height*scale));
   const render=(w,h,q)=>{
    const canvas=document.createElement('canvas');
    canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext('2d');
    if(!ctx)throw new Error('Compression de l’image indisponible.');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
    ctx.drawImage(img,0,0,w,h);
    return canvas.toDataURL('image/jpeg',q);
   };
   let data=render(width,height,.62);
   if(data.length>215000){
    scale=Math.min(1,680/Math.max(img.width,img.height));
    width=Math.max(1,Math.round(img.width*scale));height=Math.max(1,Math.round(img.height*scale));
    data=render(width,height,.43);
   }
   if(data.length>215000)throw new Error('Image trop volumineuse. Recadrez la capture puis réessayez.');
   return {data,name:file.name,type:'image/jpeg'};
  };
 }
 function showProof(p){
  if(!hasProof(p))return alert('Aucun justificatif enregistré.');
  const data=String(p.data||p.dataUrl||'');
  const url=String(p.url||'');
  if(!data&&/^https:\/\//i.test(url)){window.open(url,'_blank','noopener');return;}
  if(!data&&p.path&&typeof firebase!=='undefined'&&firebase.storage){
   const win=window.open('','_blank');
   firebase.storage().ref(p.path).getDownloadURL().then(u=>{if(win)win.location.href=u;else window.open(u,'_blank','noopener');}).catch(err=>{if(win)win.close();alert('Impossible d’ouvrir le justificatif : '+err.message);});
   return;
  }
  if(!/^data:(application\/pdf|image\/)/i.test(data))return alert('Format de justificatif non reconnu.');
  const w=window.open('','_blank');
  if(!w)return alert('Autorisez l’ouverture du justificatif.');
  w.document.title='Justificatif de cotisation G10';
  w.document.body.style.cssText='margin:0;background:#f5f7fa;min-height:100vh;display:grid;place-items:center';
  const isPdf=/^data:application\/pdf/i.test(data)||(p.type==='application/pdf');
  const element=w.document.createElement(isPdf?'iframe':'img');
  element.src=data;
  element.style.cssText=isPdf?'width:100vw;height:100vh;border:0':'max-width:98vw;max-height:96vh;object-fit:contain';
  w.document.body.appendChild(element);
 }
 function decorateDirection(){
  const body=document.getElementById('contributionPaymentRows');
  if(!body||typeof applications==='undefined'||!Array.isArray(applications))return;
  const rows=[];
  applications.forEach(m=>(m.contributionPayments||[]).forEach(p=>rows.push({m,p})));
  [...body.rows].forEach((tr,i)=>{
   if(tr.querySelector('[data-g10-proof-verified]'))return;
   const p=rows[i]?.p;
   if(!p)return;
   const cell=tr.cells[tr.cells.length-1];
   if(!cell)return;
   if(hasProof(p.proof)){
    const b=document.createElement('button');b.type='button';b.className='btn btn-light';
    b.dataset.g10ProofVerified='yes';
    b.textContent='Voir justificatif';b.style.cssText='display:block;margin-top:6px;font-size:12px';
    b.addEventListener('click',()=>showProof(p.proof));cell.appendChild(b);
   }else{
    const note=document.createElement('small');note.dataset.g10ProofVerified='yes';
    note.textContent='⚠ Justificatif absent';note.style.cssText='display:block;color:#a42f1e;margin-top:5px;font-weight:700';cell.appendChild(note);
   }
  });
 }
 const old=window.renderContributionPayments;
 if(typeof old==='function')window.renderContributionPayments=function(){
  const result=old.apply(this,arguments);
  decorateDirection();
  return result;
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorateDirection,{once:true});else decorateDirection();
})();


/* G10_SORT_ACTIFS_ET_TEST_EMAIL_20261111
   Ordre chronologique de présentation uniquement, sans écrire dans Firebase.
   Essai de courriel préparé dans la messagerie : l'envoi G10 automatisé reste à configurer côté serveur.
*/
(function(){
 'use strict';
 const TEST_EMAIL='judicael.edanngomo@gmail.com';
 const OFFICIAL_SENDER='contact@g10.ga';
 function privilegedG10(){
   try{return typeof isPrivilegedRole==='function' && !!isPrivilegedRole();}
   catch(e){return false;}
 }
 function timeOf(m){
   if(!m)return -Infinity;
   const raw=m.membershipValidatedAt||m.paymentValidatedAt||m.validatedAt||m.paymentDate||'';
   if(raw&&typeof raw.toDate==='function')return +raw.toDate();
   if(typeof raw==='number')return raw;
   const value=String(raw).trim();
   const french=value.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s|$)/);
   if(french){const d=new Date(+french[3],+french[2]-1,+french[1]);return +d;}
   const n=Date.parse(value);return Number.isFinite(n)?n:-Infinity;
 }
 function ordered(){
   if(!privilegedG10()||typeof activeMembers==='undefined'||!Array.isArray(activeMembers))return;
   activeMembers.sort((a,b)=>timeOf(b)-timeOf(a)||
     String(a.id||'').localeCompare(String(b.id||''),'fr'));
 }
 function sortRows(){
   const tb=document.getElementById('activeRows');
   if(!tb||!privilegedG10())return;
   const rows=[...tb.querySelectorAll(':scope > tr')];
   if(rows.length<2)return;
   const byId=new Map();
   try{
     (typeof activeMembers!=='undefined'?activeMembers:[]).forEach((m,i)=>{
       if(m&&m.id)byId.set(String(m.id).replace(/\s/g,''),{t:timeOf(m),i});
     });
   }catch(e){}
   const scored=rows.map((tr,index)=>{
     const id=(tr.cells[0]?.textContent||'').replace(/\s/g,'');
     const found=byId.get(id);
     const fallback=(tr.cells[6]?.textContent||'').trim();
     const match=fallback.match(/(\d{2})\/(\d{2})\/(\d{4})/);
     const parsed=match?+new Date(+match[3],+match[2]-1,+match[1]):-Infinity;
     return {tr,index,t:found?.t??parsed};
   });
   scored.sort((a,b)=>b.t-a.t||a.index-b.index);
   scored.forEach(x=>tb.appendChild(x.tr));
 }
 const oldRender=window.renderActive;
 if(typeof oldRender==='function'){
   window.renderActive=function(){
     ordered();
     const output=oldRender.apply(this,arguments);
     sortRows();
     return output;
   };
 }
 const oldRefresh=window.refreshDirection;
 if(typeof oldRefresh==='function'){
   window.refreshDirection=function(){
     ordered();
     const output=oldRefresh.apply(this,arguments);
     sortRows();
     return output;
   };
 }
 function setupTest(){
   if(!privilegedG10())return;
   const host=document.getElementById('dir-settings');
   if(!host||document.getElementById('g10EmailTestPanel'))return;
   const panel=document.createElement('section');
   panel.id='g10EmailTestPanel';panel.className='card panel';
   panel.style.cssText='margin:12px 0 16px;padding:20px;border:1px solid #d5e2ef;border-radius:17px;background:#fff';
   const heading=document.createElement('h3');heading.textContent='Test des notifications e-mail G10';
   const p=document.createElement('p');p.style.cssText='font-size:14px;line-height:1.6;margin:12px 0';
   p.textContent='Expéditeur à sélectionner dans Outlook : '+OFFICIAL_SENDER+'. Destinataire unique : '+TEST_EMAIL+'. Aucun paiement ni statut ne sera modifié.';
   const btn=document.createElement('button');
   btn.type='button';btn.className='btn btn-green';
   btn.textContent='Préparer le test dans Outlook';
   const note=document.createElement('p');note.style.cssText='font-size:12px;color:#61778f;margin:12px 0 0;line-height:1.55';
   note.textContent='L’envoi automatique depuis G10 nécessite encore un service serveur sécurisé relié à Hostinger. Ce bouton ouvre seulement un brouillon dans votre messagerie.';
   // G10_DUAL_TEMPLATE_TEST_20261111 : deux simulations vers une seule adresse.
   const second=document.createElement('button');second.type='button';second.className='btn btn-light';
   second.style.cssText='margin-left:10px;margin-top:8px';
   btn.textContent='Tester le message adhérent actif';
   second.textContent='Tester le rappel dossier incomplet';
   note.textContent='SIMULATIONS UNIQUEMENT : les deux e-mails portent [TEST G10], vers '+TEST_EMAIL+'. Aucun envoi collectif.';
   async function sendTemplate(mode,control){
     if(!privilegedG10())return;
     if(typeof auth==='undefined'||!auth||!auth.currentUser){note.textContent='Connectez-vous au compte Direction Firebase avant le test.';return;}
     const label=mode==='active'?'adhérent actif':'dossier incomplet';
     if(!window.confirm('Envoyer le modèle TEST « '+label+' » à '+TEST_EMAIL+' ? Votre statut réel restera inchangé.'))return;
     btn.disabled=true;second.disabled=true;control.textContent='Envoi en cours…';
     note.textContent='Vérification du compte Firebase et du service SMTP Hostinger…';
     try{
       const token=await auth.currentUser.getIdToken();
       const response=await fetch('https://g10.ga/g10-mail-api/send-test.php',{method:'POST',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({mode}),cache:'no-store',credentials:'omit'});
       const data=await response.json();
       note.textContent=(response.ok&&data.ok?'✓ ':'Échec : ')+(data.message||'Réponse inconnue');
     }catch(err){console.error('G10 e-mail test',err);note.textContent='Test non confirmé : vérifiez le service Hostinger.';}
     finally{btn.disabled=false;second.disabled=false;btn.textContent='Tester le message adhérent actif';second.textContent='Tester le rappel dossier incomplet';}
   }
   btn.onclick=()=>sendTemplate('active',btn);
   second.onclick=()=>sendTemplate('incomplete',second);
   panel.append(heading,p,btn,second,note);
   host.insertBefore(panel,host.firstChild);
 }
 const oldDirection=window.enterDirection;
 if(typeof oldDirection==='function'){
   window.enterDirection=function(){
     const result=oldDirection.apply(this,arguments);
     setTimeout(setupTest,0);
     return result;
   };
 }
 // Les connexions Firebase et la navigation Direction sont asynchrones.
 // Le seul DOMContentLoaded est trop tôt : installer lorsque Paramètres devient visible.
 function armEmailPanel(){
   const settings=document.getElementById('dir-settings');
   const direction=document.getElementById('directionApp');
   if(!settings||!direction)return;
   const check=function(){
     if(!settings.classList.contains('hidden')&&!direction.classList.contains('hidden'))setupTest();
   };
   check();
   const observer=new MutationObserver(check);
   observer.observe(settings,{attributes:true,attributeFilter:['class']});
   observer.observe(direction,{attributes:true,attributeFilter:['class']});
   document.addEventListener('click',function(event){
     const nav=event.target.closest&&event.target.closest('button,a');
     if(nav&&/paramètres/i.test(nav.textContent||''))setTimeout(check,0);
   },true);
 }
 if(document.readyState==='loading'){
   document.addEventListener('DOMContentLoaded',()=>{ordered();sortRows();armEmailPanel();},{once:true});
 }else{ordered();sortRows();armEmailPanel();}
 console.info('G10 : actifs classés par validation décroissante ; test e-mail manuel dans Direction');
})();


/* G10_NOTIFICATION_SEGMENTS_PREVIEW_20261111
   Préparation en lecture seule des campagnes ; aucun destinataire n'est transmis
   au service d'envoi de TEST, et aucun email n'est expédié. */
(function(){
 'use strict';
 const key='g10NotificationPreview';
 const safeEmail=x=>typeof x==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.trim());
 function authorized(){
   try{return typeof isPrivilegedRole==='function'&&isPrivilegedRole();}
   catch(e){return false;}
 }
 function candidates(){
   const all=typeof applications!=='undefined'&&Array.isArray(applications)?applications:[];
   const unique=new Map();
   for(const m of all){
     const email=String(m?.email||'').trim().toLowerCase();
     if(!safeEmail(email)||m?.notificationOptOut===true||m?.emailOptOut===true)continue;
     const active=m?.paymentConfirmed===true&&m?.active===true;
     const pending=!m?.paymentConfirmed&&!m?.active;
     if(!active&&!pending)continue;
     // On ne regroupe pas les situations conflictuelles sous un envoi automatique.
     if(unique.has(email)){
       unique.set(email,{conflict:true});continue;
     }
     unique.set(email,{m,email,type:active?'active':'pending'});
   }
   return [...unique.values()].filter(x=>!x.conflict);
 }
 const textActive='Bonjour,\n\nNous vous remercions de votre confiance et de votre engagement au sein du G10.\n\nVotre droit d’adhésion a été vérifié et validé par la Direction. Vous pouvez consulter votre dossier et vos documents depuis votre espace personnel : https://adhesion.g10.ga/\n\nLes cotisations sont suivies séparément selon leur état réel dans la plateforme.\n\nLa Direction du G10\ncontact@g10.ga';
 const textPending='Bonjour,\n\nVous avez créé un compte sur la plateforme d’adhésion G10, mais votre dossier n’est pas encore finalisé.\n\nNous vous invitons à vous reconnecter sur https://adhesion.g10.ga/ pour compléter votre profil, valider votre fiche d’adhésion et, si vous ne l’avez pas encore fait, effectuer le règlement prévu et transmettre son justificatif.\n\nSi votre paiement a déjà été déclaré, n’effectuez pas un second versement : consultez votre dossier et attendez sa vérification par la Direction.\n\nPour toute question, contactez contact@g10.ga.\n\nLa Direction du G10';
 function install(){
   if(!authorized())return;
   const host=document.getElementById('dir-settings');
   if(!host||document.getElementById(key))return;
   const panel=document.createElement('section');panel.id=key;panel.className='card panel';
   panel.style.cssText='margin:14px 0;padding:20px;border:1px solid #d7e4ef;border-radius:16px;background:#fff';
   const h=document.createElement('h3');h.textContent='Notifications aux adhérents — préparation';
   const p=document.createElement('p');p.style.cssText='line-height:1.5;font-size:14px';
   p.textContent='Deux communications distinctes selon le statut réel. Aucun envoi collectif n’est activé ; la passerelle SMTP actuelle reste limitée au test individuel.';
   const status=document.createElement('p');status.style.cssText='font-weight:700;margin:12px 0';
   const select=document.createElement('select');select.setAttribute('aria-label','Type de notification');
   select.style.cssText='padding:10px;border:1px solid #d7e4ef;border-radius:9px;max-width:100%';
   for(const [value,label] of [['pending','Dossiers incomplets — relance'],['active','Adhérents actifs — remerciement']]){
     const o=document.createElement('option');o.value=value;o.textContent=label;select.appendChild(o);
   }
   const body=document.createElement('textarea');body.readOnly=true;body.rows=11;
   body.style.cssText='width:100%;min-height:170px;margin-top:12px;padding:12px;border-radius:10px;border:1px solid #d7e4ef;line-height:1.5';
   const refresh=document.createElement('button');refresh.type='button';refresh.className='btn btn-light';
   refresh.textContent='Actualiser les destinataires';
   const notice=document.createElement('p');notice.style.cssText='color:#626f7f;font-size:12px;margin-top:12px;line-height:1.5';
   notice.textContent='Prévisualisation seulement. Aucun e-mail envoyé. Avant activation : vérification du statut en base sur le serveur, journal des envois et prévention des doublons.';
   function update(){
     const entries=candidates(),pending=entries.filter(x=>x.type==='pending'),active=entries.filter(x=>x.type==='active');
     status.textContent='Adresses éligibles (aperçu) : '+pending.length+' dossiers incomplets · '+active.length+' adhérents actifs.';
     body.value=select.value==='active'?textActive:textPending;
   }
   select.addEventListener('change',update);refresh.addEventListener('click',update);
   panel.append(h,p,status,select,body,refresh,notice);
   host.appendChild(panel);
   update();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
 const anchor=document.getElementById('dir-settings');
 if(anchor){
   const observer=new MutationObserver(()=>{if(!anchor.classList.contains('hidden'))install();});
   observer.observe(anchor,{attributes:true,attributeFilter:['class']});
 }
 const old=window.refreshDirection;
 if(typeof old==='function')window.refreshDirection=function(){const result=old.apply(this,arguments);if(document.getElementById(key)){const refresh=document.querySelector('#'+key+' button');if(refresh)refresh.click();}else install();return result;};
})();


/* G10_PILOTE_2_PERSONNES_SELECTION_111126 — Interface test réel, une personne par catégorie. */
(function(){
'use strict';
const ENDPOINT='https://g10.ga/g10-mail-api/send-selected.php';
function can(){try{return typeof isPrivilegedRole==='function'&&isPrivilegedRole();}catch(e){return false;}}
function people(mode){
 let data=[];
 try{if(typeof applications!=='undefined'&&Array.isArray(applications))data.push(...applications);
 if(typeof activeMembers!=='undefined'&&Array.isArray(activeMembers))data.push(...activeMembers);}catch(e){}
 const out=new Map();
 for(const m of data){
  if(!m||!m.firebaseUid||!m.email)continue;
  const isActive=m.active===true&&m.paymentConfirmed===true;
  const incomplete=m.active!==true&&m.paymentConfirmed!==true;
  if(mode==='active'&&!isActive||mode==='incomplete'&&!incomplete)continue;
  if(m.notificationOptOut===true||m.emailOptOut===true)continue;
  const email=String(m.email).trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||['contact@g10.ga','judicael.edanngomo@gmail.com'].includes(email))continue;
  const name=[m.firstName,m.firstName2,m.lastName,m.lastName2].filter(Boolean).join(' ')||m.id||'Adhérent';
  out.set(String(m.firebaseUid),{uid:String(m.firebaseUid),email,name});
 }
 return [...out.values()].sort((a,b)=>a.name.localeCompare(b.name,'fr'));
}
function el(tag,value){const e=document.createElement(tag);if(value!==undefined)e.textContent=value;return e;}
function install(){
 if(!can())return;
 const host=document.getElementById('dir-settings');
 if(!host||document.getElementById('g10-pilot-real-mails'))return;
 const card=el('section');card.id='g10-pilot-real-mails';card.className='card panel';
 card.style.cssText='margin:16px 0;padding:20px;border:1px solid #b8d3eb;border-radius:16px;background:#fff';
 card.append(el('h3','Envois nominatifs G10 — commencer par deux personnes'),
 el('p','Commencez par un adhérent actif et un dossier incomplet. Après leur confirmation, vous pourrez continuer individuellement sans revenir dans Hostinger. Aucun envoi collectif.'));
 const blocks=[];
 for(const mode of ['active','incomplete']){
  const group=el('div');group.style.cssText='border-top:1px solid #e1eaf2;margin-top:15px;padding-top:14px';
  const title=el('strong',mode==='active'?'1. Adhérent actif — remerciement':'2. Dossier incomplet — relance');
  const select=el('select');select.style.cssText='display:block;width:100%;max-width:580px;margin:10px 0;padding:10px;border:1px solid #c7d9ea;border-radius:8px';
  const preview=el('button','Vérifier le dossier');preview.type='button';preview.className='btn btn-light';
  const send=el('button','Envoyer à cette personne');send.type='button';send.className='btn btn-green';send.disabled=true;send.style.marginLeft='8px';
  const status=el('p','');status.style.cssText='font-size:13px;margin:12px 0';status.setAttribute('role','status');
  let checked='';
  function populate(){
   const old=select.value;select.replaceChildren(new Option('— Sélectionner un destinataire —',''));
   for(const p of people(mode))select.add(new Option(p.name+' · '+p.email,p.uid));
   select.value=people(mode).some(p=>p.uid===old)?old:'';
   checked='';send.disabled=true;status.textContent='';
  }
  select.onchange=()=>{checked='';send.disabled=true;status.textContent='';};
  async function request(action){
   const p=people(mode).find(x=>x.uid===select.value);
   if(!p){status.textContent='Sélectionnez un dossier.';return;}
   if(typeof auth==='undefined'||!auth||!auth.currentUser){status.textContent='Connexion Firebase Direction requise.';return;}
   if(action==='send'&&checked!==p.uid)return;
   if(action==='send'&&!confirm('Envoyer MAINTENANT un véritable e-mail G10 à '+p.name+' ('+p.email+') ?'))return;
   preview.disabled=true;send.disabled=true;status.textContent=action==='preview'?'Vérification Firebase en cours…':'Transmission SMTP en cours…';
   try{
    const token=await auth.currentUser.getIdToken();
    const res=await fetch(ENDPOINT,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({mode,uid:p.uid,action}),credentials:'omit',cache:'no-store'});
    const data=await res.json();status.textContent=(res.ok&&data.ok?'✓ ':'Échec : ')+(data.message||'Réponse inconnue');
    checked=action==='preview'&&res.ok&&data.ok?p.uid:'';
    send.disabled=checked!==p.uid;
   }catch(err){status.textContent='Service Hostinger non joignable : aucun envoi confirmé.';checked='';send.disabled=true;}
   finally{preview.disabled=false;if(action==='send')send.disabled=true;}
  }
  preview.onclick=()=>request('preview');send.onclick=()=>request('send');
  group.append(title,select,preview,send,status);card.append(group);blocks.push(populate);populate();
 }
 const update=el('button','Actualiser les deux listes');update.type='button';update.className='btn btn-light';update.style.marginTop='12px';update.onclick=()=>blocks.forEach(fn=>fn());
 card.append(update,el('p','Un destinataire par envoi, contrôle Firebase, confirmation et historique anti-doublon. Délai d’une minute entre envois, maximum 25 sur 24 heures. Aucun bouton « Envoyer à tous ».'));
 host.appendChild(card);
}
function setup(){
 const host=document.getElementById('dir-settings');if(!host)return;
 install();
 const watcher=new MutationObserver(()=>{if(!host.classList.contains('hidden'))install();});
 watcher.observe(host,{attributes:true,attributeFilter:['class']});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
