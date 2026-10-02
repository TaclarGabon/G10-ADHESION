/* G10-ADHESION V6.1
   Cotisation annuelle 120 € / 60 € + 60 €
   Justificatifs RTM Money, validation nominative, reçus et rapprochement téléphone.
*/
(function(){
  'use strict';

  function annualAmount(){
    var explicit=Number(settings&&settings.annualContribution);
    if(Number.isFinite(explicit)&&explicit>0)return explicit;
    var legacy=Number(settings&&settings.monthlyContribution);
    return Number.isFinite(legacy)&&legacy>0?legacy*12:120;
  }
  function halfAnnualAmount(){return annualAmount()/2}
  function rtmNumber(){
    return String((settings&&settings.rtm)||(settings&&settings.airtel)||'+241 76 41 24 49').trim();
  }
  function whatsappDestinationNumber(){
    // Temporary WhatsApp-only test override: add ?wa=<international number> to the app URL.
    // Persist only for this browser tab/session so login/navigation cannot lose it.
    // Never changes the official Airtel Money number and is never saved to Firebase.
    try{
      var q=new URLSearchParams(window.location.search).get('wa');
      var digits=String(q||'').replace(/\D/g,'');
      if(digits.length>=8){
        sessionStorage.setItem('g10_test_whatsapp',digits);
        return '+'+digits;
      }
      var saved=String(sessionStorage.getItem('g10_test_whatsapp')||'').replace(/\D/g,'');
      if(saved.length>=8)return '+'+saved;
    }catch(e){}
    return rtmNumber();
  }
  function normalizePhoneKey(v){
    var digits=String(v||'').replace(/\D/g,'').replace(/^00/,'');
    return digits.length>=8?digits.slice(-8):digits;
  }
  function memberFullName(m){
    return [m&&m.firstName,m&&m.firstName2,m&&m.lastName,m&&m.lastName2].filter(Boolean).join(' ')||(m&&m.email)||(m&&m.id)||'Adhérent';
  }
  function getMemberById(id){
    return applications.find(function(a){return a.id===id})||
      activeMembers.find(function(a){return a.id===id})||
      ((currentMember&&currentMember.id===id)?currentMember:null);
  }

  // Existing create-account flow still works by email; once the profile phone is saved,
  // the same function also links an imported WhatsApp/CSV row by phone number.
  findPlatformByEmail=function(email){
    var e=normalizeEmail(email),phoneKey=normalizePhoneKey(currentMember&&currentMember.phone);
    return platform.findIndex(function(p){
      var emailMatch=e&&normalizeEmail(p.email||'')===e;
      var importedPhone=normalizePhoneKey(p.phone||p.telephone||p.whatsapp||'');
      return emailMatch||(phoneKey&&importedPhone&&phoneKey===importedPhone);
    });
  };

  async function proofImageToData(file){
    if(!file)return null;
    if(!String(file.type||'').startsWith('image/'))throw new Error('Le justificatif doit être une image / capture d’écran.');
    var source=await new Promise(function(resolve,reject){
      var reader=new FileReader();
      reader.onload=function(){resolve(reader.result)};
      reader.onerror=reject;
      reader.readAsDataURL(file);
    });
    var img=await new Promise(function(resolve,reject){
      var im=new Image();
      im.onload=function(){resolve(im)};
      im.onerror=reject;
      im.src=source;
    });
    var scale=Math.min(1,850/Math.max(img.width,img.height));
    var w=Math.max(1,Math.round(img.width*scale));
    var h=Math.max(1,Math.round(img.height*scale));
    function encode(quality,W,H){
      var canvas=document.createElement('canvas');
      canvas.width=W;canvas.height=H;
      var ctx=canvas.getContext('2d');
      ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);ctx.drawImage(img,0,0,W,H);
      return canvas.toDataURL('image/jpeg',quality);
    }
    var data=encode(.48,w,h);
    if(data.length>180000){
      scale=Math.min(1,620/Math.max(img.width,img.height));
      w=Math.max(1,Math.round(img.width*scale));
      h=Math.max(1,Math.round(img.height*scale));
      data=encode(.38,w,h);
    }
    if(data.length>230000){
      throw new Error('La capture reste trop volumineuse. Recadrez-la autour du reçu RTM Money puis réessayez.');
    }
    return {data:data,name:file.name||'justificatif-rtm.jpg',type:'image/jpeg'};
  }

  function validatorIdentity(){
    var name=String((settings&&settings.validatorName)||'').trim();
    if(!name){
      name=String(prompt('Nom de la personne qui valide ce paiement pour la Direction :','')||'').trim();
      if(!name){
        alert('Validation annulée : le nom du validateur est obligatoire.');
        return null;
      }
      settings.validatorName=name;
      saveSettingsToFirebase().catch(console.error);
    }
    return {
      name:name,
      email:normalizeEmail((currentAuthUser&&currentAuthUser.email)||''),
      role:currentUserRole
    };
  }

  function receiptNumber(prefix,now){
    now=now||new Date();
    return 'G10-'+prefix+'-'+now.getFullYear()+'-'+String(now.getTime()).slice(-8);
  }
  function buildReceipt(member,kind,payment,validator){
    var now=new Date();
    var membership=kind==='membership';
    var rawDate=String(membership?(member.paymentDate||''):((payment&&payment.date)||''));
    var year=Number((rawDate||now.toISOString()).slice(0,4))||now.getFullYear();
    var plan=(payment&&payment.plan)||'';
    var sequence=Number((payment&&payment.sequence)||0);
    var object=membership
      ?'Droit d’adhésion'
      :(plan==='two'
        ?'Cotisation annuelle '+year+' — versement '+sequence+'/2'
        :'Cotisation annuelle '+year+' — paiement en une fois');
    return {
      number:receiptNumber(membership?'ADH':'COT',now),
      type:membership?'Adhésion':'Cotisation',
      object:object,
      memberId:member.id,
      memberName:memberFullName(member),
      amount:Number(membership?settings.membershipFee:((payment&&payment.amount)||0)),
      currency:'EUR',
      method:membership?(member.paymentMethod||'RTM Money'):((payment&&payment.method)||'RTM Money'),
      transactionReference:membership?(member.transactionRef||''):((payment&&payment.reference)||''),
      paymentDate:rawDate,
      contributionYear:membership?null:year,
      plan:membership?'':plan,
      sequence:membership?null:sequence,
      annualTotal:membership?null:annualAmount(),
      validatedAt:now.toISOString(),
      validatedByName:validator.name,
      validatedByEmail:validator.email,
      validatedByRole:validator.role
    };
  }
  function receiptHtml(r){
    var paymentDate=r.paymentDate?formatDateFr(r.paymentDate):'—';
    var validationDate='—';
    try{
      validationDate=new Intl.DateTimeFormat('fr-FR',{dateStyle:'long',timeStyle:'short'}).format(new Date(r.validatedAt));
    }catch(e){}
    var logo=(document.querySelector('.landing-main-logo')||{}).src||'';
    return '<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>'+esc(r.number)+'</title>'+
      '<style>body{font-family:Arial,sans-serif;background:#eef3f8;color:#17293b;margin:0;padding:28px}.sheet{max-width:780px;margin:auto;background:#fff;border-radius:18px;padding:34px}.head{border-bottom:4px solid #0b4a7a;padding-bottom:18px;margin-bottom:24px}.head img{max-width:240px;max-height:82px;object-fit:contain}.head h1{color:#0b355a}.stamp{display:inline-block;padding:7px 12px;border:2px solid #16945f;border-radius:999px;color:#16945f;font-weight:700}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:22px 0}.cell{border:1px solid #dce5ef;border-radius:12px;padding:12px}.cell small{display:block;color:#6a7a8c;margin-bottom:4px}.note{background:#f4f8fc;border-radius:12px;padding:14px;line-height:1.55}.sign{margin-top:28px;border-top:1px solid #dce5ef;padding-top:18px}.actions{text-align:center;margin:14px}button{padding:11px 18px;border:0;border-radius:10px;background:#0d6fb8;color:#fff;font-weight:700}@media print{body{background:#fff;padding:0}.actions{display:none}}</style></head><body>'+
      '<div class="sheet"><div class="head">'+(logo?'<img src="'+logo+'" alt="G10">':'')+
      '<h1>G10 — Reçu officiel</h1><p>Confédération de la Diaspora Gabonaise Multi-Continentale</p><span class="stamp">PAIEMENT VALIDÉ</span></div>'+
      '<h2>'+esc(r.object)+'</h2><div class="grid">'+
      '<div class="cell"><small>N° reçu</small><b>'+esc(r.number)+'</b></div>'+
      '<div class="cell"><small>ID adhérent</small><b>'+esc(r.memberId)+'</b></div>'+
      '<div class="cell"><small>Adhérent</small><b>'+esc(r.memberName)+'</b></div>'+
      '<div class="cell"><small>Montant validé</small><b>'+esc(r.amount)+' €</b></div>'+
      '<div class="cell"><small>Date du paiement</small><b>'+esc(paymentDate)+'</b></div>'+
      '<div class="cell"><small>Mode</small><b>'+esc(r.method)+'</b></div>'+
      '<div class="cell"><small>Référence transaction</small><b>'+esc(r.transactionReference||'—')+'</b></div>'+
      '<div class="cell"><small>Date de validation</small><b>'+esc(validationDate)+'</b></div></div>'+
      '<div class="note">La Direction G10 atteste que <b>'+esc(r.memberName)+'</b> a réglé <b>'+esc(r.amount)+' €</b> au titre de <b>'+esc(r.object)+'</b>. Ce reçu est archivé dans le dossier Firebase de l’adhérent sous le numéro <b>'+esc(r.number)+'</b>.</div>'+
      '<div class="sign"><b>Validé par : '+esc(r.validatedByName||'Direction G10')+'</b><br><small>Direction G10'+(r.validatedByEmail?' — '+esc(r.validatedByEmail):'')+'</small></div></div>'+
      '<div class="actions"><button onclick="window.print()">Imprimer / Enregistrer en PDF</button></div></body></html>';
  }
  function openReceiptData(receipt){
    if(!receipt){alert('Ce reçu n’est pas encore disponible.');return}
    var w=window.open('','_blank');
    if(!w){alert('Autorisez les fenêtres surgissantes pour ouvrir le reçu.');return}
    w.document.open();w.document.write(receiptHtml(receipt));w.document.close();
  }
  window.openReceipt=function(kind,paymentId){
    if(!currentMember)return;
    if(kind==='membership'){openReceiptData(currentMember.membershipReceipt);return}
    var p=(currentMember.contributionPayments||[]).find(function(x){return x.id===paymentId});
    openReceiptData(p&&p.receipt);
  };
  function openDirectionReceipt(memberId,kind,paymentId){
    var member=getMemberById(memberId);if(!member)return;
    if(kind==='membership'){openReceiptData(member.membershipReceipt);return}
    var p=(member.contributionPayments||[]).find(function(x){return x.id===paymentId});
    openReceiptData(p&&p.receipt);
  }
  function openProof(memberId,paymentId,kind){
    var member=getMemberById(memberId);if(!member)return;
    var p=(member.contributionPayments||[]).find(function(x){return x.id===paymentId});
    var proof=kind==='membership'?member.paymentProofData:(p&&p.proofData);
    if(!proof||!proof.data){alert('Aucun justificatif RTM Money enregistré.');return}
    var w=window.open('','_blank');
    if(!w){alert('Autorisez les fenêtres surgissantes.');return}
    w.document.write('<!doctype html><title>Justificatif RTM Money</title><body style="margin:0;background:#111;display:grid;place-items:center;min-height:100vh"><img src="'+proof.data+'" style="max-width:96vw;max-height:96vh;object-fit:contain" alt="Justificatif RTM Money"></body>');
    w.document.close();
  }
  function renderReceipts(){
    var body=document.getElementById('memberReceiptRows');if(!body||!currentMember)return;
    var rows=[];
    if(currentMember.membershipReceipt)rows.push({receipt:currentMember.membershipReceipt,kind:'membership',paymentId:''});
    (currentMember.contributionPayments||[]).forEach(function(p){
      if(p.receipt)rows.push({receipt:p.receipt,kind:'contribution',paymentId:p.id});
    });
    body.innerHTML=rows.length?rows.map(function(x){
      return '<tr><td><b>'+esc(x.receipt.number)+'</b></td><td>'+esc(x.receipt.object)+'</td><td>'+x.receipt.amount+' €</td><td>'+(x.receipt.validatedAt?formatDateFr(x.receipt.validatedAt.slice(0,10)):'—')+'</td><td>'+esc(x.receipt.validatedByName||'Direction G10')+'</td><td><button class="btn btn-light v61-member-receipt" data-kind="'+esc(x.kind)+'" data-payment="'+esc(x.paymentId)+'">Ouvrir</button></td></tr>';
    }).join(''):'<tr><td colspan="6" class="muted">Aucun reçu disponible.</td></tr>';
  }

  openContributionInfo=function(){
    var total=annualAmount(),half=halfAnnualAmount();
    openInfoCard('Cotisation annuelle','La cotisation est de <b>'+total+' € par année</b>.<br><br><b>Option 1 — En une fois :</b> '+total+' € pour l’année.<br><b>Option 2 — En deux fois :</b> '+half+' € puis '+half+' €.<br><br>Il n’existe pas d’option mensuelle.');
  };
  contributionSummary=function(member){
    var all=Array.isArray(member&&member.contributionPayments)?member.contributionPayments:[];
    var plan=(member&&member.contributionPlan)||(all[0]&&all[0].plan)||'';
    if(plan==='monthly')plan='annual';
    var same=plan?all.filter(function(p){return (p.plan==='monthly'?'annual':p.plan)===plan}):all;
    var confirmed=same.filter(function(p){return p.status==='Confirmé'});
    var pending=same.find(function(p){return p.status!=='Confirmé'});
    var max=plan==='two'?2:1;
    var label='Non commencée',next='—';
    if(plan==='two')label=confirmed.length+'/2 versement'+(confirmed.length>1?'s':'')+' confirmé'+(confirmed.length>1?'s':'');
    else if(plan)label=confirmed.length?('Cotisation annuelle réglée — '+annualAmount()+' €'):'Paiement annuel à effectuer';
    if(plan&&confirmed.length>=max)next='Cotisation annuelle à jour';
    else if(plan==='two'&&confirmed.length)next='Au plus tard le '+formatDateFr(addMonthsIso(confirmed[confirmed.length-1].date,6));
    else if(plan)next='À démarrer';
    if(pending)next='Validation Direction en attente';
    return {plan:plan,confirmed:confirmed.length,max:max,label:label,next:next};
  };
  contributionPaymentLabel=function(p){
    return p.plan==='two'?(p.sequence===1?'1er versement / 2':'2e versement / 2'):'Paiement annuel en une fois';
  };
  renderContributionMember=function(){
    if(!currentMember)return;
    normalizeContributionState();
    if(currentMember.contributionPlan==='monthly')currentMember.contributionPlan='annual';
    var locked=document.getElementById('contributionLocked'),unlocked=document.getElementById('contributionUnlocked'),badge=document.getElementById('contributionStatus');
    var active=!!(currentMember.active&&currentMember.paymentConfirmed);
    if(locked)locked.classList.toggle('hidden',active);
    if(unlocked)unlocked.classList.toggle('hidden',!active);
    if(badge){badge.textContent=active?'Cotisations ouvertes':'En attente d’activation';badge.className='badge '+(active?'badge-ok':'badge-info')}
    var annualCard=document.getElementById('monthlyContribution'),totalCard=document.getElementById('annualContribution'),halfCard=document.getElementById('semesterContribution');
    if(annualCard)annualCard.textContent=annualAmount()+' € en une fois';
    if(totalCard)totalCard.textContent=annualAmount()+' €';
    if(halfCard)halfCard.textContent='2 × '+halfAnnualAmount()+' €';
    renderReceipts();
    if(!active)return;
    var p1=document.getElementById('monthlyPlanText'),p2=document.getElementById('twoPlanText'),rtm=document.getElementById('contributionAirtelText');
    if(p1)p1.textContent=annualAmount()+' € en un seul paiement pour l’année.';
    if(p2)p2.textContent=halfAnnualAmount()+' € + '+halfAnnualAmount()+' € pour l’année.';
    if(rtm)rtm.textContent='Numéro officiel : '+rtmNumber();
    var existing=currentMember.contributionPayments||[];
    var selected=(currentMember.contributionPlan==='two'||existing.some(function(p){return p.plan==='two'}))?'two':'annual';
    currentMember.contributionPlan=selected;
    document.querySelectorAll('input[name=contributionPlan]').forEach(function(r){
      r.checked=r.value===selected;r.disabled=existing.length>0&&r.value!==selected;
    });
    refreshContributionForm();
    var body=document.getElementById('memberContributionRows');
    if(body)body.innerHTML=existing.length?existing.map(function(p){
      var proof=(p.proofData&&p.proofData.data)?'<button class="btn btn-light v61-proof" data-member="'+esc(currentMember.id)+'" data-payment="'+esc(p.id)+'" data-kind="contribution">Voir</button>':'—';
      var status=p.status==='Confirmé'
        ?'<span class="badge badge-ok">Confirmé</span> '+(p.receipt?'<button class="btn btn-light v61-member-receipt" data-kind="contribution" data-payment="'+esc(p.id)+'">Reçu</button>':'')
        :'<span class="badge badge-warn">'+esc(p.status||'À vérifier')+'</span>';
      return '<tr><td>'+esc(contributionPaymentLabel(p))+'</td><td>'+p.amount+' €</td><td>'+esc(p.date||'—')+'</td><td>'+esc(p.method||'—')+'</td><td>'+esc(p.reference||'—')+'</td><td>'+proof+'</td><td>'+status+'</td></tr>';
    }).join(''):'<tr><td colspan="7" class="muted">Aucune cotisation déclarée pour le moment.</td></tr>';
  };
  refreshContributionForm=function(){
    if(!currentMember)return;
    normalizeContributionState();
    var selected=document.querySelector('input[name=contributionPlan]:checked');
    var plan=(selected&&selected.value)||currentMember.contributionPlan||'annual';
    if(plan==='monthly')plan='annual';
    currentMember.contributionPlan=plan;
    var payments=currentMember.contributionPayments||[];
    var same=payments.filter(function(p){return (p.plan==='monthly'?'annual':p.plan)===plan});
    var nextSequence=same.length+1;
    var box=document.getElementById('contributionNextBox');if(!box)return;
    var pending=same.find(function(p){return p.status!=='Confirmé'});
    if(pending){
      box.innerHTML='<strong>'+contributionPaymentLabel(pending)+' déjà déclaré — '+pending.amount+' €.</strong><br>Statut : en attente de confirmation par la Direction.';
      return;
    }
    if(plan==='annual'){
      if(same.some(function(p){return p.status==='Confirmé'})){
        box.innerHTML='<strong>Cotisation annuelle complète.</strong><br>Le paiement de '+annualAmount()+' € a été confirmé.';
        return;
      }
      box.innerHTML='<strong>Paiement annuel : '+annualAmount()+' € en une fois.</strong><br>Joignez votre capture RTM Money. Après déclaration, la Direction vérifiera la réception.';
    }else{
      if(nextSequence>2){
        box.innerHTML='<strong>Cotisation annuelle complète.</strong><br>Les deux versements ont été confirmés.';
        return;
      }
      var due=nextSequence===2&&same[0]&&same[0].date?addMonthsIso(same[0].date,6):'';
      box.innerHTML='<strong>'+(nextSequence===1?'Premier':'Deuxième')+' versement : '+halfAnnualAmount()+' €</strong>'+(due?'<br>À régler au plus tard le '+formatDateFr(due):'')+'<br>Joignez votre capture RTM Money. Après déclaration, la Direction vérifiera la réception.';
    }
  };
  declareContributionPayment=async function(){
    if(!currentMember||!currentMember.active||!currentMember.paymentConfirmed){
      alert('Votre adhésion doit d’abord être validée par la Direction.');return;
    }
    normalizeContributionState();
    var selected=document.querySelector('input[name=contributionPlan]:checked');
    var plan=(selected&&selected.value)||'annual';if(plan==='monthly')plan='annual';
    var reference=val('contributionRef'),date=val('contributionDate');
    var methodEl=document.querySelector('input[name=contributionMethod]:checked');
    var method=(methodEl&&methodEl.value)||'RTM Money';
    var input=document.getElementById('contributionProof'),file=input&&input.files&&input.files[0];
    if(!reference||!date){alert('Merci de renseigner la référence et la date du paiement.');return}
    if(!file){alert('Joignez la capture d’écran RTM Money comme justificatif.');return}
    var same=currentMember.contributionPayments.filter(function(p){return (p.plan==='monthly'?'annual':p.plan)===plan});
    if(same.some(function(p){return p.status!=='Confirmé'})){
      alert('Le paiement précédent doit d’abord être confirmé par la Direction.');return;
    }
    var sequence=same.length+1,max=plan==='two'?2:1;
    if(sequence>max){alert('Toutes les échéances de ce plan ont déjà été confirmées.');return}
    try{
      var proof=await proofImageToData(file),amount=plan==='two'?halfAnnualAmount():annualAmount();
      currentMember.contributionPlan=plan;
      currentMember.contributionPayments.push({
        id:'COT-'+Date.now(),plan:plan,sequence:sequence,amount:amount,date:date,method:method,reference:reference,
        proofData:proof,status:'À vérifier',dueDate:plan==='two'&&sequence===1?addMonthsIso(date,6):'',
        year:Number(date.slice(0,4))||new Date().getFullYear()
      });
      syncMemberEverywhere(currentMember);persist();
      setVal('contributionRef','');setVal('contributionDate','');if(input)input.value='';
      renderContributionMember();renderMemberSituation();refreshDirection();
      alert('Cotisation déclarée avec justificatif RTM Money. Elle est visible par la Direction pour validation.');
    }catch(err){
      console.error(err);alert(err.message||'Impossible de préparer le justificatif.');
    }
  };
  renderContributionPayments=function(){
    var rows=[];
    applications.forEach(function(a){
      (a.contributionPayments||[]).forEach(function(p){rows.push({member:a,payment:p})});
    });
    var pending=rows.filter(function(x){return x.payment.status!=='Confirmé'}).length;
    var count=document.getElementById('contributionPendingCount');if(count)count.textContent=pending+' à vérifier';
    var body=document.getElementById('contributionPaymentRows');if(!body)return;
    body.innerHTML=rows.length?rows.map(function(x){
      var m=x.member,p=x.payment;
      var plan=p.plan==='two'?'2 × '+halfAnnualAmount()+' €':annualAmount()+' € en une fois';
      var proof=(p.proofData&&p.proofData.data)?'<button class="btn btn-light v61-proof" data-member="'+esc(m.id)+'" data-payment="'+esc(p.id)+'" data-kind="contribution">Voir</button>':'—';
      var action=p.status==='Confirmé'
        ?'<span class="badge badge-ok">Confirmé</span> '+(p.receipt?'<button class="btn btn-light v61-dir-receipt" data-member="'+esc(m.id)+'" data-kind="contribution" data-payment="'+esc(p.id)+'">Reçu</button>':'')
        :'<button class="btn btn-green v61-confirm-contribution" data-member="'+esc(m.id)+'" data-payment="'+esc(p.id)+'">Confirmer</button>';
      return '<tr><td><b>'+esc(memberFullName(m))+'</b><br><small>'+esc(m.id)+'</small></td><td>'+esc(plan)+'</td><td>'+esc(contributionPaymentLabel(p))+'</td><td>'+p.amount+' €</td><td>'+esc(p.date||'—')+'</td><td>'+esc(p.method||'—')+'</td><td>'+esc(p.reference||'—')+'</td><td>'+proof+'</td><td>'+action+'</td></tr>';
    }).join(''):'<tr><td colspan="9" class="muted">Aucune cotisation déclarée pour le moment.</td></tr>';
  };
  confirmContributionPayment=function(memberId,paymentId){
    var validator=validatorIdentity();if(!validator)return;
    var i=applications.findIndex(function(a){return a.id===memberId});if(i<0)return;
    var member=applications[i];
    var p=(member.contributionPayments||[]).find(function(x){return x.id===paymentId});if(!p)return;
    if(!p.proofData||!p.proofData.data){
      alert('Validation impossible : aucun justificatif RTM Money n’est enregistré.');return;
    }
    p.status='Confirmé';p.confirmedAt=new Date().toISOString();p.validatedBy=validator;
    p.receipt=buildReceipt(member,'contribution',p,validator);
    applications[i]=member;
    var ai=activeMembers.findIndex(function(a){return a.id===memberId});
    if(ai>=0)activeMembers[ai]=JSON.parse(JSON.stringify(member));
    if(currentMember&&currentMember.id===memberId)currentMember=JSON.parse(JSON.stringify(member));
    persist();saveAnyMemberToFirebase(member).catch(console.error);
    renderContributionPayments();renderActive();
    if(currentMember&&currentMember.id===memberId){
      renderContributionMember();renderMemberSituation();renderReceipts();
    }
    alert('Cotisation confirmée par '+validator.name+'. Reçu '+p.receipt.number+' archivé.');
  };

  declarePayment=async function(){
    if(!currentMember||!currentMember.formSigned){
      alert('Validez d’abord la fiche d’adhésion et la signature.');return;
    }
    if(!val('transactionRef')||!val('paymentDate')){
      alert('Indiquez la référence et la date du paiement.');return;
    }
    var input=document.getElementById('paymentProof'),file=input&&input.files&&input.files[0];
    if(!file){alert('Joignez la capture d’écran RTM Money comme justificatif.');return}
    try{
      var proof=await proofImageToData(file);
      currentMember.transactionRef=val('transactionRef');
      currentMember.paymentDate=val('paymentDate');
      var methodEl=document.querySelector('input[name=payMethod]:checked');
      currentMember.paymentMethod=(methodEl&&methodEl.value)||'RTM Money';
      currentMember.paymentProofData=proof;
      currentMember.paymentDeclared=true;
      currentMember.status='Paiement déclaré — contrôle Direction';
      upsertApplication();syncMemberEverywhere(currentMember);persist();
      hydrateMember();refreshDirection();
      alert('Paiement déclaré avec justificatif RTM Money. La Direction doit maintenant le confirmer.');
    }catch(err){
      console.error(err);alert(err.message||'Impossible de préparer le justificatif.');
    }
  };
  renderApplications=function(){
    var pending=applications.filter(function(a){return !a.active});
    document.getElementById('appCount').textContent=pending.length+' dossier'+(pending.length>1?'s':'');
    document.getElementById('applicationRows').innerHTML=pending.length?pending.map(function(a){
      var proof=(a.paymentProofData&&a.paymentProofData.data)?'<button class="btn btn-light v61-proof" data-member="'+esc(a.id)+'" data-payment="" data-kind="membership">Voir</button>':'—';
      var canValidate=a.profileComplete&&a.formSigned&&a.paymentDeclared&&a.paymentProofData&&a.paymentProofData.data;
      return '<tr><td><b>'+esc(a.id)+'</b></td><td>'+esc(memberFullName(a))+'<br><small>'+esc(a.email||'')+'</small></td>'+
        '<td>'+(a.profileComplete?'<span class="badge badge-ok">OK</span>':'<span class="badge badge-warn">À compléter</span>')+'</td>'+
        '<td>'+(a.formSigned?'<span class="badge badge-ok">'+(a.signatureMode==='manual'?'Manuscrite':'Électronique')+'</span>':'<span class="badge badge-warn">À signer</span>')+'</td>'+
        '<td>'+(a.paymentConfirmed?'<span class="badge badge-ok">Confirmé</span>':a.paymentDeclared?'<span class="badge badge-warn">À vérifier</span>':'<span class="badge badge-off">Non déclaré</span>')+'</td>'+
        '<td>'+proof+'</td><td>'+esc(a.expertise||a.profession||'—')+'</td>'+
        '<td><button class="btn btn-green v61-validate-membership" data-member="'+esc(a.id)+'" '+(!canValidate?'disabled':'')+'>Valider adhésion</button></td></tr>';
    }).join(''):'<tr><td colspan="8" class="muted">Aucun dossier en attente. Les dossiers validés se trouvent dans Historique.</td></tr>';
  };
  validateApplication=function(id){
    var validator=validatorIdentity();if(!validator)return;
    var i=applications.findIndex(function(a){return a.id===id});if(i<0)return;
    var a=applications[i];
    if(!a.paymentProofData||!a.paymentProofData.data){
      alert('Validation impossible : le justificatif RTM Money est obligatoire.');return;
    }
    a.paymentConfirmed=true;a.active=true;a.status='Adhérent actif';
    a.membershipValidatedAt=new Date().toISOString();
    a.membershipValidatedBy=validator;
    a.membershipReceipt=buildReceipt(a,'membership',null,validator);
    if(!Array.isArray(a.contributionPayments))a.contributionPayments=[];
    applications[i]=a;
    var ai=activeMembers.findIndex(function(x){return x.id===id});
    if(ai>=0)activeMembers[ai]=JSON.parse(JSON.stringify(a));else activeMembers.push(JSON.parse(JSON.stringify(a)));
    if(a.platformIndex!==undefined&&platform[a.platformIndex])platform[a.platformIndex].status='Actif';
    if(currentMember&&currentMember.id===id)currentMember=JSON.parse(JSON.stringify(a));
    persist();saveAnyMemberToFirebase(a).catch(console.error);
    if(a.platformIndex!==undefined)savePlatformEntryToFirebase(a.platformIndex).catch(console.error);
    updatePublicSummary().catch(console.error);
    refreshDirection();renderApplications();renderActive();renderHistory();
    if(currentMember&&currentMember.id===id)hydrateMember();
    alert('Adhésion validée par '+validator.name+'. Reçu '+a.membershipReceipt.number+' archivé.');
  };
  renderHistory=function(){
    var rows=applications.filter(function(a){return a.active});
    var count=document.getElementById('historyCount');
    if(count)count.textContent=rows.length+' dossier'+(rows.length>1?'s':'');
    var body=document.getElementById('historyRows');if(!body)return;
    body.innerHTML=rows.length?rows.map(function(a){
      var summary=contributionSummary(a);
      var receipt=a.membershipReceipt?'<button class="btn btn-light v61-dir-receipt" data-member="'+esc(a.id)+'" data-kind="membership" data-payment="">Reçu</button>':'';
      return '<tr><td><b>'+esc(a.id)+'</b></td><td><b>'+esc(memberFullName(a))+'</b><br><small>'+esc(a.email||'')+'</small></td>'+
        '<td><span class="badge badge-ok">Payée & validée</span></td><td>'+esc(summary.label)+'</td>'+
        '<td>'+(a.membershipValidatedAt?formatDateFr(a.membershipValidatedAt.slice(0,10)):'—')+'</td>'+
        '<td><div class="history-actions">'+receipt+
        '<button class="btn btn-light v61-edit-history" data-member="'+esc(a.id)+'">Éditer</button>'+
        '<button class="btn btn-danger v61-delete-history" data-member="'+esc(a.id)+'">Supprimer</button></div></td></tr>';
    }).join(''):'<tr><td colspan="6" class="muted">Aucune adhésion archivée pour le moment.</td></tr>';
  };

  hydrateSettings=function(){
    setVal('setPlatformCount',settings.platformCount);
    setVal('setMembershipFee',settings.membershipFee);
    setVal('setAnnual',annualAmount());
    setVal('setInstallments',2);
    setVal('setRtm',rtmNumber());
    setVal('setValidatorName',settings.validatorName||'');
    setVal('setBank',settings.bank);
  };
  saveSettings=function(){
    settings.platformCount=Number(val('setPlatformCount'))||0;
    settings.membershipFee=Number(val('setMembershipFee'))||0;
    settings.annualContribution=Number(val('setAnnual'))||120;
    settings.monthlyContribution=settings.annualContribution/12;
    settings.installments=2;
    settings.rtm=val('setRtm');
    settings.airtel=settings.rtm;
    settings.validatorName=val('setValidatorName');
    settings.bank=val('setBank');
    persist();saveSettingsToFirebase().catch(console.error);
    refreshDirection();refreshLanding();hydrateMember();
    alert('Paramètres enregistrés et synchronisés dans Firebase.');
  };
  refreshLanding=function(){
    document.getElementById('landingPlatformCount').textContent=platform.length?platform.length:settings.platformCount;
    document.getElementById('landingActiveCount').textContent=activeMembers.length||Number(settings.activeCount||0);
    document.getElementById('landingMonthlyFee').textContent=annualAmount()+' € / an';
    document.getElementById('landingFee').textContent=settings.membershipFee+' €';
  };
  refreshDirection=function(){
    var pc=platform.length||settings.platformCount;
    document.getElementById('kPlatform').textContent=pc;
    document.getElementById('kInactive').textContent=Math.max(0,pc-activeMembers.length);
    document.getElementById('kPending').textContent=applications.filter(function(a){return !a.active}).length;
    document.getElementById('kActive').textContent=activeMembers.length;
    document.getElementById('kRevenue').textContent=(activeMembers.length*settings.membershipFee)+' €';
    document.getElementById('dirMonthly').textContent=annualAmount()+' € en une fois';
    document.getElementById('dirAnnual').textContent=annualAmount()+' €';
    document.getElementById('dirSemesters').textContent=halfAnnualAmount()+' € + '+halfAnnualAmount()+' €';
    renderApplications();renderActive();renderPlatform();renderHistory();renderContributionPayments();
  };
  sendWhatsAppPayment=function(){
    if(!currentMember)return alert('Ouvrez d’abord votre dossier.');
    var ref=val('transactionRef')||currentMember.transactionRef||'à renseigner';
    var date=val('paymentDate')||currentMember.paymentDate||'à renseigner';
    var name=memberFullName(currentMember);
    var phone=whatsappDestinationNumber().replace(/\D/g,'');
    var msg='Bonjour Direction G10, je confirme mon paiement du droit d’adhésion.\nNom : '+name+
      '\nDossier : '+currentMember.id+
      '\nMontant : '+settings.membershipFee+' €'+
      '\nRTM Money : '+rtmNumber()+
      '\nRéférence transaction : '+ref+
      '\nDate : '+date+
      '\nLe justificatif est joint dans mon dossier G10. Merci de vérifier et valider mon adhésion.';
    window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(msg),'_blank','noopener');
  };

  var originalHydrateMember=hydrateMember;
  hydrateMember=function(){
    originalHydrateMember();
    if(!currentMember)return;
    var dest=document.getElementById('paymentDestination');
    if(dest)dest.textContent='RTM Money officiel : '+rtmNumber();
    var paid=document.getElementById('membershipPaidDetails');
    if(paid&&currentMember.paymentConfirmed){
      var who=(currentMember.membershipValidatedBy&&currentMember.membershipValidatedBy.name)
        ?' par '+currentMember.membershipValidatedBy.name
        :' par la Direction';
      paid.textContent='Paiement confirmé'+who+(currentMember.paymentDate?' le '+currentMember.paymentDate:'')+'. Le reçu officiel est archivé dans Paiements & cotisations.';
    }
    renderContributionMember();renderReceipts();
  };

  document.addEventListener('click',function(e){
    var button=e.target.closest&&e.target.closest('button');if(!button)return;
    if(button.classList.contains('v61-proof'))openProof(button.dataset.member,button.dataset.payment||'',button.dataset.kind);
    else if(button.classList.contains('v61-member-receipt'))window.openReceipt(button.dataset.kind,button.dataset.payment||'');
    else if(button.classList.contains('v61-dir-receipt'))openDirectionReceipt(button.dataset.member,button.dataset.kind,button.dataset.payment||'');
    else if(button.classList.contains('v61-confirm-contribution'))confirmContributionPayment(button.dataset.member,button.dataset.payment);
    else if(button.classList.contains('v61-validate-membership'))validateApplication(button.dataset.member);
    else if(button.classList.contains('v61-edit-history'))editHistoryApplication(button.dataset.member);
    else if(button.classList.contains('v61-delete-history'))deleteHistoryApplication(button.dataset.member);
  });

  // Refresh the home screen after this override file loads.
  try{refreshLanding();hydrateSettings()}catch(e){console.warn('V6.1 initial refresh',e)}
})();
