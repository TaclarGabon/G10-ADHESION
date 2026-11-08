/* G10.4 — Rapports réels, lecture seule, aucun jeu de données fictives */
let g10LiveTab='members';
const g10Esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const g10Name=m=>[m.lastName,m.lastName2,m.firstName,m.firstName2].filter(Boolean).join(' ').trim();
const g10Slug=m=>g10Name(m).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'');
const g10Num=v=>Number(v)||0;
const g10Date=v=>{if(!v)return '';const d=new Date(v);return Number.isNaN(d.getTime())?String(v).slice(0,10):d.toLocaleDateString('fr-FR')};
const g10Due=v=>{const d=new Date(v);if(Number.isNaN(d.getTime()))return '';d.setMonth(d.getMonth()+6);return g10Date(d)};
const g10Active=()=>Array.isArray(activeMembers)?activeMembers.filter(m=>m.active&&m.paymentConfirmed):[];
function g10Records(){
 const members=g10Active().slice().sort((a,b)=>g10Name(a).localeCompare(g10Name(b),'fr'));
 const rows=[];
 members.forEach(m=>{
  const name=g10Name(m),slug=g10Slug(m),id=m.firebaseUid||m.id||name;
  rows.push({id,name,op:'Adhésion unique',ref:'ADH-'+slug,date:g10Date(m.membershipValidatedAt),eur:g10Num(m.membershipFeePaid??m.membershipFee??settings.membershipFee),state:'Payé',kind:'adh',confirmed:true});
  const paid=(m.contributionPayments||[]).filter(p=>p.status==='Confirmé').sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
  const rawPlan=String(m.contributionPlan||(paid[0]&&paid[0].plan)||'').trim().toLowerCase();
  const plan=['monthly','one','once','single','1','option1','option 1','une fois'].includes(rawPlan)?'monthly':(['two','2','option2','option 2','twice','deux fois'].includes(rawPlan)?'two':'');
  if(plan==='monthly'){
    const p=paid[0];rows.push({id,name,op:'Cotisation option 1 — une fois',ref:'COT-1FOIS-'+slug,date:p?g10Date(p.date):'',eur:p?g10Num(p.amount):null,state:p?'Payé':'À venir',kind:'cot',confirmed:!!p});
  } else if(plan==='two'){
    for(let i=0;i<2;i++){const p=paid[i];rows.push({id,name,op:`Cotisation option 2 — ${i+1}/2`,ref:`COT-${i+1}SUR2-${slug}`,date:p?g10Date(p.date):(i===1&&paid[0]?'Échéance : '+g10Due(paid[0].date):''),eur:p?g10Num(p.amount):null,state:p?'Payé':'À venir',kind:'cot',confirmed:!!p});}
  } else {
    rows.push({id,name,op:'Cotisation option 1 — une fois',ref:'COT-1FOIS-'+slug,date:'',eur:null,state:'Non choisie',kind:'cot',confirmed:false});
    rows.push({id,name,op:'Cotisation option 2 — 1/2',ref:'COT-1SUR2-'+slug,date:'',eur:null,state:'Non choisie',kind:'cot',confirmed:false});
    rows.push({id,name,op:'Cotisation option 2 — 2/2',ref:'COT-2SUR2-'+slug,date:'',eur:null,state:'Non choisie',kind:'cot',confirmed:false});
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
 const kpis=`<div style="display:flex;gap:12px;flex-wrap:wrap;margin:15px 0">${[['Adhérents actifs',members.length],['Paiements confirmés',count],['Total €',total.toLocaleString('fr-FR')+' €'],['Total FCFA',Math.round(total*665).toLocaleString('fr-FR')+' FCFA']].map(([a,b],i)=>`<div style="background:${['#dbeafe','#dcfce7','#ede9fe','#ffedd5'][i]};border-radius:14px;padding:14px 22px;color:#173b5b"><b>${a}</b><div style="font-size:22px;font-weight:800">${b}</div></div>`).join('')}</div>`;
 let header=[],data=[];
 if(tab==='members'){header=['Référence','Adhérent','Statut','Date validation','Contact'];data=members.map((m,i)=>['G10-'+String(i+1).padStart(3,'0'),g10Name(m),'Actif',g10Date(m.membershipValidatedAt),m.phone||m.email||'']);}
 if(tab==='finance'){header=['Adhérent','Opération','Référence','Date paiement / échéance','Montant €','Montant FCFA','État'];data=rows.map(r=>[r.name,r.op,r.ref,r.date,r.eur===null?'':r.eur,r.eur===null?'':Math.round(r.eur*665),r.state]);}
 if(tab==='history'){header=['Lot','Du','Au','Paiements','Total €','Total FCFA'];data=[];}
 window.g10LiveCurrent={header,data,tab,rows,members};
 const table=`<div style="overflow:auto"><table class="table" style="min-width:900px;width:100%;border-collapse:collapse"><thead><tr>${header.map(h=>`<th style="background:#176a9b;color:white;padding:12px">${g10Esc(h)}</th>`).join('')}</tr></thead><tbody>${data.map((r,i)=>`<tr style="background:${tab==='finance'?['#e3f0ff','#e8f7ec','#fff2db'][Math.max(0,members.findIndex(m=>g10Name(m)===r[0]))%3]:i%2?'#f1f6fc':'#ffffff'}">${r.map(v=>`<td style="padding:10px;border-bottom:1px solid #d9e5ef">${g10Esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 document.getElementById('g10-live-content').innerHTML=kpis+(tab==='history'?'<p>Les lots historiques ne sont pas encore enregistrés dans Firebase. Aucun historique fictif ne sera affiché.</p>':table)+(tab==='finance'?`<p><b>Total encaissé : ${total.toLocaleString('fr-FR')} € — ${Math.round(total*665).toLocaleString('fr-FR')} FCFA</b></p><small>Conversion indicative de présentation : 1 € = 665 FCFA. Vérifier les montants réellement encaissés dans chaque devise avant usage comptable.</small>`:'');
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
