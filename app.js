/* ARSLAN LISTAS v3.4 — KIWI MOBILE TABS
   Split en 3 archivos (index/style/app)
   ✅ Precios editables en Proveedores -> se guardan en Lista de precios
   ✅ Precios SOLO exportables desde Lista de precios (WA/TXT/PDF)
*/

(function(){
"use strict";

/* ==========================
   Util DOM
========================== */
const byId = (id)=>document.getElementById(id);
const $ = (sel, root=document)=>root.querySelector(sel);
const $$ = (sel, root=document)=>Array.from(root.querySelectorAll(sel));

/* ==========================
   Tema (claro/oscuro) con persistencia
========================== */
function applyTheme(t){
  document.documentElement.setAttribute('data-theme', t==='dark'?'dark':'light');
  localStorage.setItem('arslan_theme', t);
}
function toggleTheme(){
  const cur = localStorage.getItem('arslan_theme') || 'light';
  applyTheme(cur==='light'?'dark':'light');
}

/* ==========================
   Debounce util + idle
========================== */
function debounce(fn, wait=300){
  let t=null;
  return function(...args){
    clearTimeout(t);
    t=setTimeout(()=>fn.apply(this,args), wait);
  };
}
const idle = (cb)=> (window.requestIdleCallback? requestIdleCallback(cb): setTimeout(cb, 1));

/* ==========================
   Tabs
========================== */
function showTab(key){
  const ids = ['dic','tiendas','global','proveedores'];
  ids.forEach(k=>{
    const sec = byId('tab-'+k);
    const btn = byId('btn-'+k);
    if(sec) sec.style.display = (k===key)?'block':'none';
    if(btn) btn.classList.toggle('active', k===key);
  });

  const fab = byId('fab');
  if(fab){
    fab.style.display = (key==='global')?'block':'none';
    if(key!=='global') toggleFabMenu(true);
  }

  closeAC();

  if(key==='dic'){ idle(()=>renderResumenDia()); }
  if(key==='tiendas'){ idle(()=>{ renderClientsUI(); buildRepartoSelector(); }); }
  if(key==='global'){ idle(()=>{ unificarGlobal(); buildProvBar(); }); }
  if(key==='proveedores'){ idle(()=>{ renderProvidersPanels(); buildRepartoSelector(); renderRepartoTienda(); rebuildPricesToday(); }); }
}

/* ==========================
   Config y utilidades
========================== */
const LS = {
  VOCAB:'arslan_v34_vocab',
  STORES:'arslan_v34_stores',
  ASSIGN:'arslan_v34_assign',
  ORDERS:'arslan_v34_orders',
  CLIENTS:'arslan_v34_clients',
  UNDO:'arslan_v34_undo',
  PRICES:'arslan_v34_prices'
};

const PROVEEDORES = ["ESMO","MONTENEGRO","ÁNGEL VACA","JOSÉ ANTONIO","JAVI","ANGELO"];
const IGNORE_WORDS = ['caja','cajas','kg','kgs','kilo','kilos','uds','ud','u','unidad','unidades','manojo','manojos','saco','sacos'];

function toLines(t){ return String(t||'').split(/[\n\r,]/).map(x=>x.trim()).filter(Boolean); }

function removeDiacriticsUpper(s){
  return String(s||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/ñ/g,'N').replace(/Ñ/g,'N')
    .toUpperCase();
}
function normKey(s){
  return removeDiacriticsUpper(s)
    .replace(/[^A-Z0-9\s]/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function stripGenericWords(s){
  const tokens = normKey(s).split(' ').filter(t=>!IGNORE_WORDS.includes(t.toLowerCase()));
  return tokens.join(' ').trim();
}
function num(x){
  const n = Number(String(x).replace(',','.'));
  return isNaN(n)? 0 : n;
}
function stepFromEvent(e){
  if(e && e.altKey) return 0.1;
  if(e && e.shiftKey) return 10;
  return 1;
}
function clampQty(v){
  if(!isFinite(v)) return 0;
  if(Math.abs(v) < 1e-9) return 0;
  const s = String(v);
  if(s.includes('.') || s.includes(',')) return Math.round(v*1000)/1000;
  return v;
}

/* ==========================
   Vocabulario base (tu lista)
========================== */
const OFFICIAL_VOCAB_RAW = `GRANNY FRANCIA
MANZANA PINK LADY
MANDARINA COLOMBE
MANDARINA PLASENCIA 
MANDARINA USOPRADES 
MANZANA GRNNY SMITH 
NARANJA MESA USOPRADES
NARANJA ZUMO USOPRADES
MANZANA STORY 
GUAYABA
ROMANESCU 
PATATA AGRIA 
PATATA MONALISA
PATATA SPUNTA
CEBOLLINO
ENELDO
REMOLACHA
LECHUGA ROBLE
ESCAROLA
GUISANTES 
KIWI MARIPOSA
AGUACATE LISO
KIWI ZESPRI GOLD
PARAGUAYO 
KIWI TOMASIN PLANCHA
PERA RINCON DEL SOTO
MELOCOTON PRIMERA
AGUACATE GRANEL
MARACUYA
MANZANA GOLDEN 24
PLATANO CANARIO PRIMERA
MANDARINA HOJA
MANZANA GOLDEN 20
NARANJA TOMASIN
NECTARINA
NUECES
SANDIA
LIMON SEGUNDA
MANZANA FUJI
NARANJA MESA SONRISA
JENGIBRE
BATATA
AJO PRIMERA
CEBOLLA NORMAL
CALABAZA GRANDE
PATATA LAVADA
TOMATE CHERRY RAMA
TOMATE CHERRY PERA
TOMATE DANIELA
TOMATE ROSA PRIMERA
CEBOLLINO
TOMATE ASURCADO MARRON
TOMATE RAMA
PIMIENTO PADRON
ZANAHORIA
PEPINO
CEBOLLETA
PUERROS
BROCOLI
JUDIA VERDE
BERENJENA
PIMIENTO ITALIANO VERDE
PIMIENTO ITALIANO ROJO
CHAMPINON
UVA ROJA
UVA BLANCA
ALCACHOFA
CALABACIN
COLIFLOR
BATAVIA
ICEBERG
MANDARINA SEGUNDA
MANZANA GOLDEN 28
NARANJA ZUMO
KIWI SEGUNDA
MANZANA ROYAL GALA 24
PLATANO CANARIO SUELTO
CEREZA
FRESAS
ARANDANOS
ESPINACA
PEREJIL
CILANTRO
ACELGAS
PIMIENTO VERDE
PIMIENTO ROJO
MACHO VERDE
MACHO MADURO
YUCA
AVOCADO
PERA CONFERENCIA PRIMERA BIS
REINETA PARDA
POMELO CHINO
MANDARINA TABALET
BERZA
COL DE BRUSELAS
NUECES SEGUNDA 
ESCAROLA 
CEBOLLA ROJA
MENTA
HABANERO
RABANITOS
POMELO
PAPAYA
REINETA 28
NISPERO
ALBARICOQUE
TOMATE PERA
TOMATE BOLA
TOMATE PINK
VALVENOSTA GOLDEN
MELOCOTON ROJO
MELON GALIA
APIO
NARANJA SANHUJA
LIMON PRIMERA
MANGO
MELOCOTON AMARILLO
VALVENOSTA ROJA
PINA
NARANJA HOJA
PERA CONFERENCIA SEGUNDA
CEBOLLA DULCE
TOMATE ASURCADO AZUL
ESPARRAGOS BLANCOS
ESPARRAGOS TRIGUEROS
REINETA PRIMERA
AGUACATE PRIMERA
COCO
NECTARINA SEGUNDA
REINETA 24
NECTARINA CARNE BLANCA
GUINDILLA
REINETA VERDE
PATATA 25KG
PATATA 5 KG
TOMATE RAFF
REPOLLO
KIWI ZESPRI
PARAGUAYO SEGUNDA
MELON
REINETA 26
TOMATE ROSA
MANZANA CRISPS
ALOE VERA PIEZAS
TOMATE ENSALADA
PATATA 10KG
MELON BOLLO
CIRUELA ROJA
LIMA
GUINEO VERDE
SETAS
BANANA
BONIATO
FRAMBUESA
BREVAS
PERA AGUA
YAUTIA
YAME
OKRA
MANZANA MELASSI
CACAHUETE
SANDIA NEGRA
SANDIA RAYADA
HIGOS
KUMATO
KIWI CHILE
MELOCOTON AMARILLO SEGUNDA
HIERBABUENA
REMOLACHA
LECHUGA ROMANA
KAKI
CIRUELA CLAUDIA
PERA LIMONERA
CIRUELA AMARILLA
HIGOS BLANCOS
UVA ALVILLO
LIMON EXTRA
PITAHAYA ROJA
HIGO CHUMBO
CLEMENTINA
GRANADA
NECTARINA PRIMERA BIS
CHIRIMOYA
UVA CHELVA
PIMIENTO CALIFORNIA VERDE
KIWI TOMASIN
PIMIENTO CALIFORNIA ROJO
MANDARINA SATSUMA
CASTANA
CAKI
MANZANA KANZI
PERA ERCOLINA
NABO
UVA ALVILLO NEGRA
CHAYOTE
ROYAL GALA 28
MANDARINA PRIMERA
PIMIENTO PINTON
MELOCOTON AMARILLO DE CALANDA
HINOJOS
MANDARINA DE HOJA
UVA ROJA PRIMERA
UVA BLANCA PRIMERA`;

function uniqueVocab(lines){
  const seen = new Set(); const out=[];
  for(const l of lines){
    const t = removeDiacriticsUpper(l).trim();
    if(!t) continue;
    const k = normKey(t);
    if(!seen.has(k)){ seen.add(k); out.push(t); }
  }
  return out;
}

let VOCAB_CACHE = [];
let VOCAB_KEYS = [];
function loadVocab(){
  const saved = localStorage.getItem(LS.VOCAB);
  const base = saved && saved.trim()? saved : OFFICIAL_VOCAB_RAW;
  const list = uniqueVocab(toLines(base));
  VOCAB_CACHE = list;
  VOCAB_KEYS = list.map(v=>normKey(v));
  const ta = byId('vocabTxt');
  if(ta) ta.value = list.join('\n');
  return list;
}

/* ==========================
   Estado global
========================== */
const tiendaState = { sp:[], sl:[], st:[] };
let globalRows = [];
let assignments = {};
let orders = {};
let ACTIVE_PROV = PROVEEDORES[0];

let clients = []; // { id, name, tag, input, rows:[{o,e,q,a}] }

let pricesDB = {}; // key -> { name, price, updatedAt }

/* ==========================
   Persistencia
========================== */
const persistState = debounce(function(){
  localStorage.setItem(LS.STORES, JSON.stringify(tiendaState));
  localStorage.setItem(LS.ASSIGN, JSON.stringify(assignments));
  localStorage.setItem(LS.ORDERS, JSON.stringify(orders));
  localStorage.setItem(LS.CLIENTS, JSON.stringify(clients));
  localStorage.setItem(LS.PRICES, JSON.stringify(pricesDB));
}, 350);

function loadState(){
  try{
    const s = JSON.parse(localStorage.getItem(LS.STORES)||'{}');
    ['sp','sl','st'].forEach(k=>{ if(Array.isArray(s[k])) tiendaState[k]=s[k]; });
  }catch{}
  try{ assignments = JSON.parse(localStorage.getItem(LS.ASSIGN)||'{}') || {}; }catch{ assignments={}; }
  try{ orders = JSON.parse(localStorage.getItem(LS.ORDERS)||'{}') || {}; }catch{ orders={}; }
  PROVEEDORES.forEach(p=>{ if(!Array.isArray(orders[p])) orders[p]=[]; });

  try{ clients = JSON.parse(localStorage.getItem(LS.CLIENTS)||'[]'); if(!Array.isArray(clients)) clients=[]; }catch{ clients=[]; }
  try{ pricesDB = JSON.parse(localStorage.getItem(LS.PRICES)||'{}'); if(!pricesDB || typeof pricesDB!=='object') pricesDB={}; }catch{ pricesDB={}; }
}

/* ==========================
   Reset total / Limpiar día
========================== */
function resetAll(){
  if(confirm('¿Seguro que quieres limpiar TODO (incluye vocabulario)?')){ localStorage.clear(); location.reload(); }
}
function limpiarDia(){
  if(!confirm('¿Limpiar el día? (pone en 0 tiendas, clientes, asignaciones y pedidos. NO borra vocabulario ni precios)')) return;

  tiendaState.sp = []; tiendaState.sl = []; tiendaState.st = [];
  const inSp = byId('in_sp'), inSl = byId('in_sl'), inSt = byId('in_st');
  if(inSp) inSp.value=''; if(inSl) inSl.value=''; if(inSt) inSt.value='';
  const w1=byId('tbl_sp_wrap'), w2=byId('tbl_sl_wrap'), w3=byId('tbl_st_wrap');
  if(w1) w1.innerHTML=''; if(w2) w2.innerHTML=''; if(w3) w3.innerHTML='';

  clients = clients.map(c=>({ ...c, input:'', rows:[] }));
  assignments = {};
  orders = {}; PROVEEDORES.forEach(p=>orders[p]=[]);
  for(const k in repartoState){ delete repartoState[k]; }

  persistState();
  alert('Día limpiado. (Vocabulario, precios intactos)');
  idle(()=>{ unificarGlobal(); renderProvidersPanels(); buildRepartoSelector(); renderRepartoTienda(); updateUndoPill(); rebuildPricesToday(); renderResumenDia(); });
}

/* ==========================
   Vocab actions
========================== */
function saveVocab(){
  localStorage.setItem(LS.VOCAB, (byId('vocabTxt')?.value)||'');
  loadVocab();
  alert('Vocabulario guardado.');
  renderClientsUI();
  unificarGlobal();
  renderResumenDia();
}
function addNewWord(){
  const entry = prompt("Introduce nuevo producto (uno por línea si son varios):");
  if(!entry) return;
  const current = toLines(byId('vocabTxt')?.value||'');
  const added = toLines(entry);
  const merged = uniqueVocab(current.concat(added));
  if(byId('vocabTxt')) byId('vocabTxt').value = merged.join('\n');
  saveVocab();
}
/* ==========================
   Similaridad (Dice + TokenSet)
========================== */
function bigrams(str){
  const s = stripGenericWords(str);
  const arr=[]; for(let i=0;i<s.length-1;i++){ if(s[i]!==' '&&s[i+1]!==' ') arr.push(s.slice(i,i+2)); }
  return arr;
}
function diceSim(a,b){
  const A=bigrams(a), B=bigrams(b);
  if(!A.length||!B.length) return 0;
  let hits=0; const pool=B.slice();
  A.forEach(bg=>{const idx=pool.indexOf(bg); if(idx>-1){hits++; pool.splice(idx,1);} });
  return (2*hits)/(A.length+B.length);
}
function tokenSetSim(a,b){
  const A=new Set(stripGenericWords(a).split(' ').filter(Boolean));
  const B=new Set(stripGenericWords(b).split(' ').filter(Boolean));
  if(!A.size||!B.size) return 0;
  let inter=0; A.forEach(x=>{ if(B.has(x)) inter++; });
  return inter / Math.max(A.size,B.size);
}
function similarityScore(a,b){ return 0.7*diceSim(a,b) + 0.3*tokenSetSim(a,b); }
function bestMatch(query){
  const q = stripGenericWords(query);
  let best = {name:null, score:0};
  for(let i=0;i<VOCAB_CACHE.length;i++){
    const v = VOCAB_CACHE[i];
    const sc = similarityScore(q, v);
    if(sc>best.score) best = {name:v, score:sc};
  }
  return best;
}

/* ==========================
   Parser líneas (cantidad + nombre)
========================== */
function parseLine(raw){
  if(!raw) return null;
  let s = raw.replace(/\t/g,' ').replace(/\s{2,}/g,' ').trim();
  s = s.replace(/^[-•*]\s*/,'');
  let qty=null, name=s;

  const mX = s.match(/(?:x|X|\*)\s*(\d+[\.,]?\d*)\b/);
  if(mX){ qty=Number(mX[1].replace(',','.')); name=s.replace(mX[0],'').trim(); }

  if(qty===null){
    const mEnd = s.match(/(\d+[\.,]?\d*)\s*(?:kg|kgs|kilo|kilos|uds|ud|u|unidad|unidades|caja|cajas)?\s*$/i);
    if(mEnd){ qty=Number(mEnd[1].replace(',','.')); name=s.slice(0,mEnd.index).trim(); }
  }
  if(qty===null){
    const mStart = s.match(/^\s*(\d+[\.,]?\d*)\s+(.*)$/);
    if(mStart){ qty=Number(mStart[1].replace(',','.')); name=mStart[2].trim(); }
  }
  if(qty===null){ qty=1; }

  name = stripGenericWords(name);
  return { original: removeDiacriticsUpper(s), name, qty };
}

/* ==========================
   Autocomplete
========================== */
let AC_ACTIVE = null;
let AC_OWNER = null;
function closeAC(){ if(AC_ACTIVE){ AC_ACTIVE.remove(); AC_ACTIVE=null; AC_OWNER=null; } }

document.addEventListener('click', (e)=>{
  if(AC_ACTIVE && !AC_ACTIVE.contains(e.target) && e.target!==AC_OWNER){
    closeAC();
  }
}, {capture:true});

function attachAutocomplete(cell, onPick){
  cell.addEventListener('input', ()=>{
    const val = stripGenericWords(cell.innerText||'');
    closeAC();
    if(!val) return;

    const nk = normKey(val);
    const suggestions = [];
    for(let i=0;i<VOCAB_CACHE.length;i++){
      const v = VOCAB_CACHE[i];
      if(VOCAB_KEYS[i].includes(nk)){
        suggestions.push(v);
        if(suggestions.length>=10) break;
      }
    }
    if(!suggestions.length) return;

    const rect = cell.getBoundingClientRect();
    const box = document.createElement('div');
    box.className='ac-box';
    box.style.left = (rect.left + window.scrollX) + 'px';
    box.style.top = (rect.bottom + window.scrollY) + 'px';
    box.style.width = rect.width + 'px';

    suggestions.forEach((s)=>{
      const item = document.createElement('div');
      item.className='ac-item';
      item.textContent = s;
      item.onclick = ()=>{ onPick(s); closeAC(); };
      box.appendChild(item);
    });

    document.body.appendChild(box);
    AC_ACTIVE = box;
    AC_OWNER = cell;
  }, {passive:true});
}

/* ==========================
   Atajos cantidades (delegación)
========================== */
function bindQtyShortcuts(rootEl, getCellValue, setCellValue, onChanged){
  if(!rootEl) return;
  rootEl.addEventListener('keydown', (e)=>{
    const t = e.target;
    if(!(t instanceof HTMLElement)) return;
    if(!t.isContentEditable) return;

    const f = t.dataset && t.dataset.f;
    if(f!=='q' && f!=='qty' && f!=='total') return;

    const key = e.key;
    const isPlus = (key==='+' || key==='=');
    const isMinus = (key==='-' || key==='_');
    const isUp = (key==='ArrowUp');
    const isDown = (key==='ArrowDown');
    const isEnter = (key==='Enter');

    if(isPlus || isMinus || isUp || isDown){
      e.preventDefault();
      const step = stepFromEvent(e);
      const cur = num(getCellValue(t));
      const next = clampQty(cur + ((isMinus || isDown)? -step : step));
      setCellValue(t, next);
      if(typeof onChanged==='function') onChanged(t, next);
      placeCaretAtEnd(t);
      return;
    }

    if(isEnter){
      e.preventDefault();
      focusNextEditableCell(t);
      return;
    }
  }, true);
}

function placeCaretAtEnd(el){
  try{
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }catch{}
}
function focusNextEditableCell(cur){
  try{
    const table = cur.closest('table');
    if(!table) return;
    const all = Array.from(table.querySelectorAll('td[contenteditable="true"]'));
    const idx = all.indexOf(cur);
    if(idx>-1 && all[idx+1]) all[idx+1].focus();
  }catch{}
}

/* ==========================
   Render tabla tienda
========================== */
function renderTable(code){
  const wrap = byId('tbl_'+code+'_wrap');
  const rows = tiendaState[code]||[];
  if(!wrap) return;
  if(!rows.length){ wrap.innerHTML=''; return; }

  let html = '<div class="scroll-x"><table><thead><tr><th>Original</th><th>Estandarizado</th><th>Cantidad</th><th>Tools</th><th>Estado</th></tr></thead><tbody>';
  rows.forEach((r,i)=>{
    html += `<tr>
      <td>${escapeHTML(r.o)}</td>
      <td contenteditable="true" data-i="${i}" data-f="e" ${r.a? 'class="red"':''}>${escapeHTML(r.e)}</td>
      <td contenteditable="true" data-i="${i}" data-f="q">${escapeHTML(r.q)}</td>
      <td>
        <div class="qty-tools">
          <button class="qty-btn" data-action="bumpStoreQty" data-code="${code}" data-i="${i}" data-d="-1">-</button>
          <button class="qty-btn" data-action="bumpStoreQty" data-code="${code}" data-i="${i}" data-d="1">+</button>
        </div>
      </td>
      <td>${r.a? '<span class="pill warn">Revisar</span>':'<span class="pill ok">OK</span>'}</td>
    </tr>`;
  });
  html += '</tbody></table></div>';
  wrap.innerHTML = html;

  bindQtyShortcuts(wrap, (cell)=>cell.innerText, (cell,val)=>{ cell.innerText = val; }, (cell,val)=>{
    const i = Number(cell.dataset.i);
    tiendaState[code][i].q = num(val);
    persistState();
    pushUndo({type:'edit_store_qty', code});
    idle(()=>{ unificarGlobal(); renderResumenDia(); });
  });

  wrap.querySelectorAll('td[contenteditable]').forEach(cell=>{
    const i = Number(cell.dataset.i);
    const f = cell.dataset.f;

    if(f==='e'){
      attachAutocomplete(cell, (picked)=>{
        cell.innerText = picked;
        tiendaState[code][i].e = picked;
        tiendaState[code][i].a = false;
        cell.classList.remove('red');
        cell.parentElement.querySelector('td:last-child').innerHTML = '<span class="pill ok">OK</span>';
        persistState();
        pushUndo({type:'edit_store', code});
        idle(()=>{ unificarGlobal(); renderResumenDia(); });
      });
    }

    cell.addEventListener('blur', ()=>{
      const val = cell.innerText.trim();
      if(f==='q'){
        tiendaState[code][i].q = num(val)||0;
      }else{
        const cleaned = removeDiacriticsUpper(val);
        tiendaState[code][i].e = cleaned;

        const exact = VOCAB_KEYS.includes(normKey(cleaned));
        const tdState = cell.parentElement.querySelector('td:last-child');
        if(exact){
          tiendaState[code][i].a=false; cell.classList.remove('red'); tdState.innerHTML='<span class="pill ok">OK</span>';
        }else{
          tiendaState[code][i].a=true; cell.classList.add('red'); tdState.innerHTML='<span class="pill warn">Revisar</span>';
        }
      }
      persistState();
      pushUndo({type:'edit_store', code});
      idle(()=>{ unificarGlobal(); renderResumenDia(); });
    }, {passive:true});
  });
}

function bumpStoreQty(code, idx, delta){
  if(!tiendaState[code] || !tiendaState[code][idx]) return;
  tiendaState[code][idx].q = clampQty(num(tiendaState[code][idx].q) + delta);
  persistState();
  pushUndo({type:'bump_store_qty', code});
  renderTable(code);
  idle(()=>{ unificarGlobal(); renderResumenDia(); });
}

function estandarizar(code){
  const txt = byId('in_'+code)?.value || '';
  const rows = [];
  toLines(txt).forEach(line=>{
    const p = parseLine(line);
    if(!p) return;
    const exIdx = VOCAB_KEYS.indexOf(normKey(p.name));
    if(exIdx>-1){ rows.push({o:p.original, e:VOCAB_CACHE[exIdx], q:p.qty, a:false}); return; }
    const m = bestMatch(p.name);
    const chosen = m.name || p.name;
    rows.push({o:p.original, e:chosen, q:p.qty, a:(normKey(chosen)!==normKey(p.name))});
  });
  tiendaState[code] = rows;
  renderTable(code);
  persistState();
  pushUndo({type:'estandarizar_store', code});
  idle(()=>{ unificarGlobal(); buildRepartoSelector(); renderResumenDia(); });
}

function guardarTienda(code){
  const out = (tiendaState[code]||[]).map(r=> `${r.e} ${r.q}`).join('\n');
  const ta = byId('in_'+code);
  if(ta) ta.value = out;
  alert(`Tienda ${code.toUpperCase()} guardada en el textarea.`);
}

function exportarTiendaTXT(code){
  const tienda = tiendaState[code] || [];
  if (!tienda.length) { alert('No hay datos estandarizados.'); return; }
  const okRows = tienda.filter(r => !r.a);
  if (!okRows.length) { alert('Aún hay productos por revisar (en rojo).'); return; }
  const today = new Date().toISOString().split('T')[0];
  const txt = okRows.map(x => `${x.q} ${x.e}`).join('\n');
  downloadText(txt, `${code}_estandarizado_${today}.txt`);
}
function enviarTiendaWhatsApp(code){
  const tienda = tiendaState[code] || [];
  if (!tienda.length) { alert('No hay datos estandarizados.'); return; }
  const okRows = tienda.filter(r => !r.a);
  if (!okRows.length) { alert('Aún hay productos por revisar (en rojo).'); return; }
  const txt = okRows.map(x => `${x.q} ${x.e}`).join('\n');
  wa(`🛒 *Pedido ${code.toUpperCase()}*\n\n${txt}`);
}
/* ==========================
   CLIENTES/HOTELES
========================== */
function genId(){ return 'cli_' + Math.random().toString(16).slice(2) + Date.now().toString(16); }

function addClient(){
  const name = prompt('Nombre cliente/hotel (ej: BRASEROS / RIVIERA / HOTEL CORDON):');
  if(!name) return;
  const tag = prompt('TAG / Sede (ej: CENTRO, FORUM, EDIFICIO, TOMILLARES, SEVERO, GENERAL, TARDE):') || '';
  clients.push({ id: genId(), name: removeDiacriticsUpper(name), tag: removeDiacriticsUpper(tag), input:'', rows:[] });
  persistState();
  renderClientsUI();
  renderResumenDia();
}

function saveClients(){
  persistState();
  alert('Clientes guardados.');
  idle(()=>{ unificarGlobal(); buildRepartoSelector(); renderResumenDia(); });
}
function deleteClient(id){
  if(!confirm('¿Eliminar este cliente?')) return;
  clients = clients.filter(c=>c.id!==id);
  persistState();
  renderClientsUI();
  idle(()=>{ unificarGlobal(); buildRepartoSelector(); renderResumenDia(); });
}
function updateClientField(id, field, value){
  const idx = clients.findIndex(x=>x.id===id);
  if(idx<0) return;
  if(field==='name') clients[idx].name = removeDiacriticsUpper(value);
  if(field==='tag') clients[idx].tag = removeDiacriticsUpper(value);
  persistState();
  idle(()=>{ buildRepartoSelector(); unificarGlobal(); renderResumenDia(); });
}

function renderClientsUI(){
  const wrap = byId('clients_wrap');
  if(!wrap) return;

  if(!clients.length){
    wrap.innerHTML = `<div class="hint">No hay clientes aún. Pulsa “+ Nuevo cliente”.</div>`;
    return;
  }

  let html = '';
  clients.forEach((c)=>{
    const label = c.tag ? `${c.name} — ${c.tag}` : c.name;
    html += `
      <div class="card" style="margin-bottom:10px">
        <div class="hd">
          <strong>🏨 ${escapeHTML(label)}</strong>
          <div class="toolbar">
            <button class="btn small ghost" data-action="estandarizarCliente" data-id="${c.id}">Estandarizar</button>
            <button class="btn small" data-action="guardarCliente" data-id="${c.id}">Guardar</button>
            <button class="btn small muted" data-action="exportarClienteTXT" data-id="${c.id}">TXT</button>
            <button class="btn small muted" data-action="enviarClienteWhatsApp" data-id="${c.id}">WhatsApp</button>
            <button class="btn small muted" data-action="deleteClient" data-id="${c.id}">🗑️</button>
          </div>
        </div>
        <div class="bd">
          <div class="row" style="margin-bottom:8px">
            <div>
              <div class="hint">Nombre</div>
              <input class="input" value="${escapeHTML(c.name||'')}" data-action="updateClientName" data-id="${c.id}">
            </div>
            <div>
              <div class="hint">TAG</div>
              <input class="input" value="${escapeHTML(c.tag||'')}" data-action="updateClientTag" data-id="${c.id}">
            </div>
          </div>

          <textarea id="in_${c.id}" placeholder="Pega pedido cliente/hotel...">${escapeHTML(c.input||'')}</textarea>
          <div class="hint">Edita en tabla igual que tiendas. Cantidades con teclado (+/-/↑/↓).</div>
          <div id="tbl_${c.id}_wrap" class="scroll-x" style="margin-top:8px"></div>
        </div>
      </div>
    `;
  });

  wrap.innerHTML = html;

  // inputs (name/tag)
  $$('input[data-action="updateClientName"]', wrap).forEach(inp=>{
    inp.addEventListener('blur', ()=>updateClientField(inp.dataset.id,'name',inp.value));
  });
  $$('input[data-action="updateClientTag"]', wrap).forEach(inp=>{
    inp.addEventListener('blur', ()=>updateClientField(inp.dataset.id,'tag',inp.value));
  });

  // render tablas existentes
  clients.forEach(c=>{
    if(Array.isArray(c.rows) && c.rows.length){
      renderClientTable(c.id);
    }
  });
}

function renderClientTable(id){
  const wrap = byId('tbl_'+id+'_wrap');
  const c = clients.find(x=>x.id===id);
  if(!wrap || !c) return;
  const rows = c.rows||[];
  if(!rows.length){ wrap.innerHTML=''; return; }

  let html = '<div class="scroll-x"><table><thead><tr><th>Original</th><th>Estandarizado</th><th>Cantidad</th><th>Tools</th><th>Estado</th></tr></thead><tbody>';
  rows.forEach((r,i)=>{
    html += `<tr>
      <td>${escapeHTML(r.o)}</td>
      <td contenteditable="true" data-i="${i}" data-f="e" ${r.a? 'class="red"':''}>${escapeHTML(r.e)}</td>
      <td contenteditable="true" data-i="${i}" data-f="q">${escapeHTML(r.q)}</td>
      <td>
        <div class="qty-tools">
          <button class="qty-btn" data-action="bumpClientQty" data-id="${id}" data-i="${i}" data-d="-1">-</button>
          <button class="qty-btn" data-action="bumpClientQty" data-id="${id}" data-i="${i}" data-d="1">+</button>
        </div>
      </td>
      <td>${r.a? '<span class="pill warn">Revisar</span>':'<span class="pill ok">OK</span>'}</td>
    </tr>`;
  });
  html += '</tbody></table></div>';
  wrap.innerHTML = html;

  bindQtyShortcuts(wrap, (cell)=>cell.innerText, (cell,val)=>{ cell.innerText = val; }, (cell,val)=>{
    const i = Number(cell.dataset.i);
    c.rows[i].q = num(val);
    persistState();
    pushUndo({type:'edit_client_qty', id});
    idle(()=>{ unificarGlobal(); renderResumenDia(); });
  });

  wrap.querySelectorAll('td[contenteditable]').forEach(cell=>{
    const i = Number(cell.dataset.i);
    const f = cell.dataset.f;

    if(f==='e'){
      attachAutocomplete(cell, (picked)=>{
        cell.innerText = picked;
        c.rows[i].e = picked;
        c.rows[i].a = false;
        cell.classList.remove('red');
        cell.parentElement.querySelector('td:last-child').innerHTML = '<span class="pill ok">OK</span>';
        persistState();
        pushUndo({type:'edit_client', id});
        idle(()=>{ unificarGlobal(); renderResumenDia(); });
      });
    }

    cell.addEventListener('blur', ()=>{
      const val = cell.innerText.trim();
      if(f==='q'){
        c.rows[i].q = num(val)||0;
      }else{
        const cleaned = removeDiacriticsUpper(val);
        c.rows[i].e = cleaned;
        const exact = VOCAB_KEYS.includes(normKey(cleaned));
        const tdState = cell.parentElement.querySelector('td:last-child');
        if(exact){ c.rows[i].a=false; cell.classList.remove('red'); tdState.innerHTML='<span class="pill ok">OK</span>'; }
        else { c.rows[i].a=true; cell.classList.add('red'); tdState.innerHTML='<span class="pill warn">Revisar</span>'; }
      }
      persistState();
      pushUndo({type:'edit_client', id});
      idle(()=>{ unificarGlobal(); renderResumenDia(); });
    }, {passive:true});
  });
}

function bumpClientQty(id, idx, delta){
  const c = clients.find(x=>x.id===id);
  if(!c || !c.rows || !c.rows[idx]) return;
  c.rows[idx].q = clampQty(num(c.rows[idx].q) + delta);
  persistState();
  pushUndo({type:'bump_client_qty', id});
  renderClientTable(id);
  idle(()=>{ unificarGlobal(); renderResumenDia(); });
}

function estandarizarCliente(id){
  const c = clients.find(x=>x.id===id);
  if(!c) return;
  const txt = byId('in_'+id)?.value || '';
  c.input = txt;

  const rows = [];
  toLines(txt).forEach(line=>{
    const p = parseLine(line);
    if(!p) return;

    const exIdx = VOCAB_KEYS.indexOf(normKey(p.name));
    if(exIdx>-1){ rows.push({o:p.original, e:VOCAB_CACHE[exIdx], q:p.qty, a:false}); return; }

    const m = bestMatch(p.name);
    const chosen = m.name || p.name;
    rows.push({o:p.original, e:chosen, q:p.qty, a:(normKey(chosen)!==normKey(p.name))});
  });

  c.rows = rows;
  renderClientTable(id);
  persistState();
  pushUndo({type:'estandarizar_client', id});
  idle(()=>{ unificarGlobal(); buildRepartoSelector(); renderResumenDia(); });
}

function guardarCliente(id){
  const c = clients.find(x=>x.id===id);
  if(!c) return;
  const out = (c.rows||[]).map(r=> `${r.e} ${r.q}`).join('\n');
  const ta = byId('in_'+id);
  if(ta) ta.value = out;
  c.input = out;
  persistState();
  alert('Cliente guardado.');
}

function exportarClienteTXT(id){
  const c = clients.find(x=>x.id===id);
  if(!c) return;
  const tienda = c.rows || [];
  if (!tienda.length) { alert('No hay datos estandarizados.'); return; }
  const okRows = tienda.filter(r => !r.a);
  if (!okRows.length) { alert('Aún hay productos por revisar (en rojo).'); return; }
  const today = new Date().toISOString().split('T')[0];
  const label = (c.tag? `${c.name}_${c.tag}`:c.name).replace(/\s+/g,'_');
  const txt = okRows.map(x => `${x.q} ${x.e}`).join('\n');
  downloadText(txt, `cliente_${label}_${today}.txt`);
}

function enviarClienteWhatsApp(id){
  const c = clients.find(x=>x.id===id);
  if(!c) return;
  const tienda = c.rows || [];
  if (!tienda.length) { alert('No hay datos estandarizados.'); return; }
  const okRows = tienda.filter(r => !r.a);
  if (!okRows.length) { alert('Aún hay productos por revisar (en rojo).'); return; }
  const txt = okRows.map(x => `${x.q} ${x.e}`).join('\n');
  const label = c.tag? `${c.name} — ${c.tag}`:c.name;
  wa(`🏨 *Pedido ${label}*\n\n${txt}`);
}

/* ==========================
   UNDO simple
========================== */
let undoStack = [];
function loadUndo(){
  try{ undoStack = JSON.parse(localStorage.getItem(LS.UNDO)||'[]') || []; }catch{ undoStack=[]; }
  updateUndoPill();
}
function pushUndo(meta){
  const snap = {
    meta: meta||{},
    ts: Date.now(),
    tiendaState: JSON.parse(JSON.stringify(tiendaState)),
    clients: JSON.parse(JSON.stringify(clients)),
    assignments: JSON.parse(JSON.stringify(assignments)),
    orders: JSON.parse(JSON.stringify(orders)),
    pricesDB: JSON.parse(JSON.stringify(pricesDB))
  };
  undoStack.push(snap);
  if(undoStack.length>25) undoStack.shift();
  localStorage.setItem(LS.UNDO, JSON.stringify(undoStack));
  updateUndoPill();
}
function updateUndoPill(){
  const el = byId('undoPill');
  if(el) el.textContent = 'Undo: ' + (undoStack.length||0);
}
function undoLast(){
  if(!undoStack.length){ alert('No hay nada para deshacer.'); return; }
  const snap = undoStack.pop();
  tiendaState.sp = snap.tiendaState.sp||[];
  tiendaState.sl = snap.tiendaState.sl||[];
  tiendaState.st = snap.tiendaState.st||[];
  clients = snap.clients||[];
  assignments = snap.assignments||{};
  orders = snap.orders||{};
  pricesDB = snap.pricesDB || {};

  localStorage.setItem(LS.UNDO, JSON.stringify(undoStack));
  persistState();
  updateUndoPill();

  renderTable('sp'); renderTable('sl'); renderTable('st');
  renderClientsUI();
  unificarGlobal();
  renderProvidersPanels();
  rebuildPricesToday();
  buildRepartoSelector();
  renderRepartoTienda();
  renderResumenDia();
}
