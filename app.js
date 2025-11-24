(function(){
  const $ = (sel,root=document)=>root.querySelector(sel);
  const $$ = (sel,root=document)=>Array.from(root.querySelectorAll(sel));

  // --- Datos demo
  const DEMO_JOBS = [
    { id:1, title:"Auxiliar de reforestación", type:"Temporal", org:"Bosque Vivo", city:"Neiva", mode:"Campo", desc:"Apoyo a jornadas de siembra." },
    { id:2, title:"Analista de monitoreo de fauna", type:"Contrato", org:"Fundación Biodiversidad", city:"Yaguará", mode:"Híbrido", desc:"Seguimiento a fauna local." },
    { id:3, title:"Educador ambiental comunitario", type:"Voluntario", org:"EcoEscuela", city:"Tello", mode:"Presencial", desc:"Talleres comunitarios." },
    { id:4, title:"Especialista SIG (GIS)", type:"Tiempo completo", org:"Planeta Datos", city:"Bogotá", mode:"Remoto", desc:"Cartografía y análisis espacial." }
  ];
  const DEMO_NEWS = [
    {
      id:1,
      title:"Nueva resolución promueve corredores biológicos locales",
      source:"Autoridad Ambiental",
      date:"2025-10-10",
      url:"https://example.org/resolucion-corredores",
      img:"https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80&auto=format&fit=crop",
      desc:"Resumen: La resolución impulsa corredores biológicos para conectar ecosistemas fragmentados."
    },
    {
      id:2,
      title:"Voluntariado logra sembrar 12.000 árboles nativos",
      source:"EcoNoticias",
      date:"2025-10-08",
      url:"",
      img:"https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=1200&q=80&auto=format&fit=crop",
      desc:"Crónica de la jornada de siembra, con participación de comunidades y colegios."
    },
    {
      id:3,
      title:"Monitoreo participativo de aves en humedal",
      source:"Red de Aves",
      date:"2025-09-28",
      url:"https://example.org/aves-humedal",
      img:"https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80&auto=format&fit=crop",
      desc:"Resultados preliminares del conteo comunitario en el humedal."
    }
  ];
  const DEMO_POINTS = [
    { id:1, name:"Reforestación – Vereda A", type:"Reforestación", lat:2.823, lng:-75.282,
      photo:"https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1200&auto=format&fit=crop",
      eventDate:"2025-10-15", details:"Siembra de 450 plántulas nativas (yarumo y nogal). Participación de 35 voluntarios." },
    { id:2, name:"Monitoreo de fauna – Quebrada B", type:"Monitoreo", lat:2.936, lng:-75.255,
      photo:"https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=1200&auto=format&fit=crop",
      eventDate:"2025-10-05", details:"Instalación de 3 cámaras trampa y recorrido de 4 km para registro indirecto." },
    { id:3, name:"Educación ambiental – Escuela C", type:"Educación", lat:2.873, lng:-75.3,
      photo:"https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1200&auto=format&fit=crop",
      eventDate:"2025-09-22", details:"Taller de separación en la fuente con 60 estudiantes de grado 5°." }
  ];

  // --- localStorage helpers
  const LS = {
    get:(k,f)=>{ try{ const r=localStorage.getItem(k); return r?JSON.parse(r):f }catch{return f} },
    set:(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)) }catch{} },
    del:(k)=>{ try{ localStorage.removeItem(k) }catch{} }
  };

  // --- Blocklist embebidos
  const EMBED_BL = LS.get('eco_iframe_blocklist', []);
  function saveEmbedBL(){ LS.set('eco_iframe_blocklist', EMBED_BL); }
  function hostFromUrl(u){ try { return new URL(u).hostname.toLowerCase(); } catch { return ''; } }

  const DEFAULT_DISABLE_EMBED = true;
  const KNOWN_NO_EMBED = [
    "example.com","example.org","linkedin.com","www.linkedin.com",
    "instagram.com","www.instagram.com","facebook.com","www.facebook.com",
    "x.com","twitter.com","www.twitter.com","www.x.com"
  ];
  KNOWN_NO_EMBED.forEach(h => { if(!EMBED_BL.includes(h)) EMBED_BL.push(h); });
  saveEmbedBL();

  // --- Estado
  const state = {
    user: LS.get('eco_user', null),
    active:"inicio",
    jobs: LS.get('eco_jobs', DEMO_JOBS),
    news: LS.get('eco_news', DEMO_NEWS),
    points: LS.get('eco_points', DEMO_POINTS),
    apps: LS.get('eco_apps', []),
    orgVer: LS.get('eco_org_ver', { status:"pendiente", pdfUrl:"" })
  };
  function save(){
    LS.set('eco_jobs', state.jobs);
    LS.set('eco_news', state.news);
    LS.set('eco_points', state.points);
    LS.set('eco_apps', state.apps);
    LS.set('eco_org_ver', state.orgVer);
    if(state.user) LS.set('eco_user', state.user);
  }

  // Header
  function updateHeader(){
    const logoutBtn = $('#logoutBtn');
    const ss = $('#sessionStatus');
    if(!logoutBtn || !ss) return;
    if(state.user){
      const isONG = state.user.role === 'ong';
      ss.textContent = `${state.user.name} (${isONG ? 'ong' : 'usuario'})`;
      logoutBtn.textContent = `Cerrar sesión (${isONG ? 'ONG' : 'Usuario'})`;
      logoutBtn.classList.remove('hidden');
      logoutBtn.onclick = () => {
        if (!confirm(`¿Seguro que deseas cerrar sesión de ${isONG ? 'ONG' : 'Usuario'}?`)) return;
        state.user = null;
        LS.del('eco_user');
        state.active = 'inicio';
        logoutBtn.classList.add('hidden');
        logoutBtn.textContent = 'Cerrar sesión';
        ss.textContent = 'No has iniciado sesión';
        renderLogin();
      };
    } else {
      ss.textContent = 'No has iniciado sesión';
      logoutBtn.classList.add('hidden');
      logoutBtn.textContent = 'Cerrar sesión';
      logoutBtn.onclick = null;
    }
  }

  // Login
  function renderLogin(){
    const root = $('#appRoot');
    root.innerHTML = $('#loginTpl').innerHTML;
    const roleSel = $('#roleSel');
    $('#regBtn').onclick = () => openRegisterModal(roleSel.value || 'usuario');
    $('#loginBtn').onclick = () => {
      const role = roleSel.value;
      const email = $('#emailInp').value.trim();
      const password = $('#passInp').value;
      const nameFromEmail = email ? email.split('@')[0].replace(/\W+/g,' ').trim() : (role==='ong'?'ONG Demo':'Usuario Demo');
      const prettyName = nameFromEmail ? nameFromEmail.charAt(0).toUpperCase()+nameFromEmail.slice(1) : (role==='ong'?'ONG Demo':'Usuario Demo');
      if (role==='ong' && !(state.orgVer && state.orgVer.pdfUrl)){
        openQuickVerifyModal(()=>{ state.user={name:prettyName, role, email, password}; save(); updateHeader(); renderHome(); });
        return;
      }
      state.user={name:prettyName, role, email, password}; save(); updateHeader(); renderHome();
    };
    updateHeader();
  }

  // Home
  function renderHome(){
    const root = $('#appRoot');
    root.innerHTML = $('#homeTpl').innerHTML;
    const tabs = [
      {id:'inicio',label:'Inicio'},
      {id:'calc',label:'Calculadora'},
      {id:'jobs',label:'Trabajos'},
      {id:'news',label:'Noticias'},
      {id:'map',label:'Mapa'},
      {id:'perfil',label:'Perfil'}
    ];
    const tabsEl = $('#tabs', root);
    tabs.forEach(t=>{
      const b=document.createElement('button');
      b.className='tab'+(state.active===t.id?' active':'');
      b.textContent=t.label;
      b.onclick=()=>{ state.active=t.id; renderHome(); };
      tabsEl.appendChild(b);
    });
    const view = $('#view', root);
    if(state.active==='inicio') renderInicio(view);
    if(state.active==='calc') renderCalc(view);
    if(state.active==='jobs') renderJobs(view);
    if(state.active==='news') renderNews(view);
    if(state.active==='map') renderMap(view);
    if(state.active==='perfil') renderPerfil(view);
  }

  // Inicio
  function renderInicio(view){
    view.innerHTML = $('#inicioTpl').innerHTML;
    
    // Animar entrada de tarjetas (opcional - suave)
    setTimeout(() => {
      view.querySelectorAll('.feature-card').forEach((el, idx) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        setTimeout(() => {
          el.style.transition = 'all 0.5s ease-out';
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }, idx * 60);
      });
    }, 10);

    // Hacer clickeables las tarjetas principales
    $$('[data-goto]', view).forEach(btn => {
      btn.onclick = () => {
        const target = btn.getAttribute('data-goto');
        state.active = target;
        renderHome();
      };
    });

    // Mostrar actividad reciente
    const activityList = $('#activityList', view);
    const recentItems = [];
    
    // Agregar últimas noticias
    state.news.slice(-2).reverse().forEach(n => {
      recentItems.push({
        icon: '📰',
        text: `Nueva noticia: ${n.title}`,
        time: formatTimeAgo(n.date),
        type: 'news'
      });
    });

    // Agregar últimos puntos
    state.points.slice(-2).reverse().forEach(p => {
      const icons = { 'Reforestación': '🌳', 'Monitoreo': '🔍', 'Educación': '📚' };
      recentItems.push({
        icon: icons[p.type] || '📍',
        text: `Nuevo punto: ${p.name}`,
        time: formatTimeAgo(p.eventDate),
        type: 'point'
      });
    });

    // Mostrar máximo 4 items
    recentItems.slice(0, 4).forEach(item => {
      const div = document.createElement('div');
      div.className = 'activity-item';
      div.innerHTML = `
        <div class="activity-icon">${item.icon}</div>
        <div class="activity-text">
          <div style="font-weight:500;font-size:14px">${item.text}</div>
          <div class="activity-time">${item.time}</div>
        </div>
      `;
      activityList.appendChild(div);
    });

    if (recentItems.length === 0) {
      activityList.innerHTML = '<div class="muted" style="text-align:center;padding:20px">No hay actividad reciente. ¡Sé el primero en contribuir!</div>';
    }
  }

  // Helper para formatear tiempo
  function formatTimeAgo(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return date.toLocaleDateString();
  }

  // Calculadora
  function renderCalc(view){
    view.innerHTML = $('#calcTpl').innerHTML;
    const km=$('#kmMes',view), kwh=$('#kWhMes',view), kg=$('#kgRes',view);
    [km,kwh,kg].forEach(inp=> inp.addEventListener('input', update));
    function update(){
      const factores = { transporte:0.192, energia:0.42, residuos:1.9 };
      const t=(+km.value||0)*factores.transporte;
      const e=(+kwh.value||0)*factores.energia;
      const r=(+kg.value||0)*factores.residuos;
      const total=t+e+r;
      $('#outT',view).textContent=t.toFixed(1)+' kg';
      $('#outE',view).textContent=e.toFixed(1)+' kg';
      $('#outR',view).textContent=r.toFixed(1)+' kg';
      $('#outTotal',view).textContent=total.toFixed(1)+' kg';
      $('#outTon',view).textContent=(total/1000).toFixed(3);
    }
    update();
  }

  // Trabajos
  function renderJobs(view){
    view.innerHTML = $('#jobsTpl').innerHTML;
    const q=$('#jobsQ',view), mode=$('#jobsMode',view), list=$('#jobsList',view), pager=$('#jobsPager',view);
    const createBtn = $('#createJobBtn', view);
    
    // Mostrar botón de crear vacante para ONGs
    if(state.user?.role === 'ong') {
      createBtn.classList.remove('hidden');
      createBtn.onclick = () => openJobModal();
    }
    
    let page=1, perPage=5;
    function apply(){
      const filtered = state.jobs.filter(j =>
        (mode.value==='todos' || j.mode.toLowerCase()===mode.value) &&
        (q.value.trim()==='' || `${j.title} ${j.org} ${j.city}`.toLowerCase().includes(q.value.toLowerCase()))
      );
      const totalPages=Math.max(1, Math.ceil(filtered.length/perPage));
      if(page>totalPages) page=totalPages;
      const start=(page-1)*perPage;
      const pageData=filtered.slice(start,start+perPage);
      list.innerHTML='';
      pageData.forEach(job=>{
        const c=document.createElement('div'); c.className='card';
        c.innerHTML=`<div class="row" style="align-items:flex-start;gap:12px">
          <div>
            <div style="font-weight:600">${job.title}</div>
            <div class="muted">${job.org} • ${job.city}</div>
            <div class="muted small" style="margin-top:4px">${job.desc||''}</div>
            <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;font-size:12px">
              <span class="badge badge-green">${job.type}</span>
              <span class="badge badge-blue">${job.mode}</span>
            </div>
          </div>
          <div style="display:flex;gap:8px">
            ${state.user?.role==='ong' ? `<button class="btn btn-ghost" data-edit="${job.id}">Editar</button><button class="btn btn-danger" data-del="${job.id}">Eliminar</button>`:''}
            <button class="btn btn-primary" data-apply="${job.id}">Postular</button>
          </div>
        </div>`;
        list.appendChild(c);
      });
      pager.innerHTML='';
      if(filtered.length>0){
        const prev=document.createElement('button'); prev.className='btn btn-ghost'; prev.textContent='Anterior'; prev.disabled=page===1; prev.onclick=()=>{page=Math.max(1,page-1);apply();};
        const next=document.createElement('button'); next.className='btn btn-ghost'; next.textContent='Siguiente'; next.disabled=page===totalPages; next.onclick=()=>{page=Math.min(totalPages,page+1);apply();};
        const info=document.createElement('span'); info.className='muted'; info.textContent=`Página ${page} de ${totalPages}`;
        pager.append(prev,info,next);
      }
      $$('[data-del]',list).forEach(btn=> btn.onclick=()=>{ 
        const id=+btn.dataset.del; 
        if(confirm('¿Eliminar esta vacante?')){ state.jobs=state.jobs.filter(j=>j.id!==id); save(); apply(); }
      });
      $$('[data-edit]',list).forEach(btn=> btn.onclick=()=>{ const job=state.jobs.find(j=>j.id==btn.dataset.edit); openJobModal(job); });
      $$('[data-apply]',list).forEach(btn=> btn.onclick=()=>{ 
        const job=state.jobs.find(j=>j.id==btn.dataset.apply); 
        if(!state.user){ alert('Inicia sesión para postular.'); return; }
        openApplyModal(job);
      });
    }
    q.oninput=apply; mode.onchange=apply; apply();
  }

  // Noticias
  function renderNews(view){
    view.innerHTML = $('#newsTpl').innerHTML;
    const list=$('#newsList',view), pager=$('#newsPager',view);
    const createBtn = $('#createNewsBtn', view);
    
    // Mostrar botón de crear noticia para ONGs
    if(state.user?.role === 'ong') {
      createBtn.classList.remove('hidden');
      createBtn.onclick = () => openNewsModal();
    }
    
    let page=1, perPage=5;
    function apply(){
      const totalPages=Math.max(1, Math.ceil(state.news.length/perPage));
      if(page>totalPages) page=totalPages;
      const start=(page-1)*perPage; const pageData=state.news.slice(start,start+perPage);
      list.innerHTML='';
      pageData.forEach(n=>{
        const hasDesc = !!(n.desc && n.desc.trim());
        const descSnippet = hasDesc ? `<div class="muted small" style="margin-top:6px;max-width:700px;white-space:pre-wrap">${(n.desc.length>140?n.desc.slice(0,140)+'…':n.desc)}</div>` : '';
        const c=document.createElement('div'); c.className='card row'; c.style.alignItems='center'; c.innerHTML=`
          <div>
            <div style="font-weight:600">${n.title}</div>
            <div class="muted small">${n.source} • ${new Date(n.date).toLocaleDateString()}</div>
            ${descSnippet}
          </div>
          <div style="display:flex;gap:8px">
            ${state.user?.role==='ong' ? `<button class="btn btn-ghost" data-edit="${n.id}">Editar</button><button class="btn btn-danger" data-del="${n.id}">Eliminar</button>`:''}
            <button class="btn btn-primary" data-open="${n.id}">Abrir</button>
            <button class="btn btn-ghost" data-share="${n.id}">Compartir</button>
          </div>`;
        list.appendChild(c);
      });
      pager.innerHTML='';
      if(state.news.length>0){
        const prev=document.createElement('button'); prev.className='btn btn-ghost'; prev.textContent='Anterior'; prev.disabled=page===1; prev.onclick=()=>{page=Math.max(1,page-1);apply();};
        const next=document.createElement('button'); next.className='btn btn-ghost'; next.textContent='Siguiente'; next.disabled=page===totalPages; next.onclick=()=>{page=Math.min(totalPages,page+1);apply();};
        const info=document.createElement('span'); info.className='muted'; info.textContent=`Página ${page} de ${totalPages}`;
        pager.append(prev,info,next);
      }
      // acciones
      $$('[data-del]',list).forEach(btn=> btn.onclick=()=>{ 
        const id=+btn.dataset.del; 
        if(confirm('¿Eliminar esta noticia?')){ state.news=state.news.filter(x=>x.id!==id); save(); apply(); }
      });
      $$('[data-edit]',list).forEach(btn=> btn.onclick=()=>{ const n=state.news.find(x=>x.id==btn.dataset.edit); openNewsModal(n); });
      $$('[data-open]',list).forEach(btn=> btn.onclick=()=>{ 
        const n=state.news.find(x=>x.id==btn.dataset.open);
        if(!n) return;
        if(n?.url && n.url.trim()){
          openLinkViewer(n.url.trim(), n.title, { desc:(n.desc||'').trim(), img:(n.img||'').trim() });
        } else {
          openNewsDetail(n);
        }
      });
      $$('[data-share]',list).forEach(btn=> btn.onclick=()=>{ 
        const n=state.news.find(x=>x.id==btn.dataset.share);
        shareNews(n);
      });
    }
    apply();
  }

  // Compartir
  function shareNews(n){
    const url = (n.url && n.url.trim()) ? n.url.trim() : '';
    const text = `${n.title}\n${n.source || ''} • ${new Date(n.date).toLocaleDateString()}\n\n${n.desc || ''}${url?`\n\n${url}`:''}`;

    if (navigator.share){
      navigator.share({ title: n.title, text, url: url || undefined }).catch(()=>{});
      return;
    }

    const encText = encodeURIComponent(text);
    const encUrl  = encodeURIComponent(url || '');
    const mailto  = `mailto:?subject=${encodeURIComponent(n.title)}&body=${encText}`;
    const wa      = `https://wa.me/?text=${encText}`;
    const fb      = `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`;
    const x       = `https://x.com/intent/tweet?text=${encodeURIComponent(n.title)}&url=${encUrl}`;
    const tg      = `https://t.me/share/url?url=${encUrl}&text=${encodeURIComponent(n.title)}`;
    const li      = `https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}`;

    showModal('Compartir', `
      <div class="grid" style="gap:10px">
        <div class="card" style="white-space:pre-wrap">${n.desc || 'Sin descripción.'}</div>
        <div class="row" style="flex-wrap:wrap;gap:8px">
          <a class="btn btn-primary" href="${wa}" target="_blank" rel="noopener">WhatsApp</a>
          <a class="btn btn-primary" href="${mailto}">Correo</a>
          <a class="btn btn-primary" href="${fb}" target="_blank" rel="noopener">Facebook</a>
          <a class="btn btn-primary" href="${x}" target="_blank" rel="noopener">X / Twitter</a>
          <a class="btn btn-primary" href="${tg}" target="_blank" rel="noopener">Telegram</a>
          <a class="btn btn-primary" href="${li}" target="_blank" rel="noopener">LinkedIn</a>
          <button class="btn btn-ghost" id="igBtn">Instagram</button>
          <button class="btn btn-ghost" id="copyBtn">Copiar</button>
        </div>
        <div class="muted small">Instagram no permite prellenar desde web. Te copio el texto y abro Instagram.</div>
      </div>
    `, `<button class="btn btn-ghost" id="closeShare">Cerrar</button>`);
    $('#closeShare',modalRoot).onclick=closeModal;
    $('#copyBtn',modalRoot).onclick=async ()=>{ try{ await navigator.clipboard.writeText(text); alert('Texto copiado.'); }catch{ prompt('Copia el texto:', text); } };
    $('#igBtn',modalRoot).onclick=async ()=>{ try{ await navigator.clipboard.writeText(text); }catch{} window.open('https://www.instagram.com/','_blank','noopener'); };
  }

  // Detalle (sin URL)
  function openNewsDetail(n){
    const desc = (n?.desc && n.desc.trim()) ? n.desc : 'Sin descripción.';
    const imgHtml = n?.img ? `<img src="${n.img}" alt="Imagen de la noticia" class="img-cover" style="max-height:260px;object-fit:cover;border-radius:12px">` : '';
    const textToCopy = `${n.title}\n${n.source || '—'} • ${new Date(n.date).toLocaleDateString()}\n\n${desc}`;
    
    showModal('Detalle de la noticia', `
      <div class="grid" style="gap:10px">
        <div style="font-weight:600">${n.title}</div>
        <div class="muted small">${n.source || '—'} • ${new Date(n.date).toLocaleDateString()}</div>
        ${imgHtml}
        <div class="card" style="padding:12px;white-space:pre-wrap">${desc}</div>
      </div>
    `, `
      <button class="btn btn-ghost" id="copyNewsText">Copiar enlace</button>
      <button class="btn btn-primary" id="closeNewsDet">Cerrar</button>
    `);
    
    $('#copyNewsText',modalRoot).onclick = async () => {
      try { 
        await navigator.clipboard.writeText(textToCopy); 
        alert('Contenido copiado al portapapeles'); 
      } catch { 
        prompt('Copia este contenido:', textToCopy); 
      }
    };
    $('#closeNewsDet',modalRoot).onclick=closeModal;
  }

  // Mapa
  function renderMap(view){
    view.innerHTML = $('#mapTpl').innerHTML;
    const filter=$('#mapFilter',view), list=$('#pointsList',view);
    const center = state.points[0] || { lat: 2.873, lng: -75.3 };
    
    // Inicializar mapa Leaflet
    const mapDiv = $('#map', view);
    const map = L.map(mapDiv).setView([center.lat, center.lng], 11);
    
    // Agregar capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);
    
    // Almacenar marcadores
    let markers = [];
    
    // Botón para agregar punto y modo clic en mapa
    if(state.user?.role==='ong') {
      $('#adminChip',view).classList.remove('hidden');
      
      // Mostrar botón de añadir punto
      const addBtn = $('#addPointBtn', view);
      addBtn.classList.remove('hidden');
      addBtn.onclick = () => openPointModal();
      
      // Agregar instrucciones para hacer clic en el mapa
      const filterRow = view.querySelector('.row');
      const helpText = document.createElement('div');
      helpText.className = 'badge badge-green';
      helpText.innerHTML = '💡 Tip: También puedes hacer clic directamente en el mapa';
      helpText.style.fontSize = '12px';
      filterRow.insertBefore(helpText, addBtn);
      
      // Evento de clic en el mapa
      map.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        openPointModalWithCoords(lat, lng);
      });
    }

    function apply(){
      const visibles = state.points.filter(p=> filter.value==='todos' || p.type===filter.value);
      
      // Limpiar marcadores anteriores
      markers.forEach(m => map.removeLayer(m));
      markers = [];
      
      // Limpiar lista
      list.innerHTML='';
      
      // Agregar marcadores al mapa
      visibles.forEach((p)=>{
        // Icono personalizado según tipo
        let iconColor = '#059669'; // verde por defecto
        if(p.type === 'Monitoreo') iconColor = '#3b82f6'; // azul
        if(p.type === 'Educación') iconColor = '#f59e0b'; // naranja
        
        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background:${iconColor};width:30px;height:30px;border-radius:50%;border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:16px;">📍</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });
        
        const marker = L.marker([p.lat, p.lng], { icon: customIcon })
          .bindPopup(`<div style="min-width:150px"><b>${p.name}</b><br><small>${p.type}</small><br><small>${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}</small></div>`)
          .addTo(map);
        
        markers.push(marker);
        
        // Tarjeta en la lista
        const card=document.createElement('div'); 
        card.className='card'; 
        card.innerHTML=`
          <div style="font-weight:600">${p.name}</div>
          <div class="muted" style="font-size:12px">Tipo: ${p.type} • Coord: ${p.lat.toFixed(3)}, ${p.lng.toFixed(3)}</div>
          <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
            ${state.user?.role==='ong'?`<button class="btn btn-danger" data-del="${p.id}">Eliminar</button>`:''}
            <button class="btn btn-ghost" data-detail="${p.id}">Detalle</button>
            <button class="btn btn-primary" data-report="${p.id}">Reportar</button>
            <button class="btn btn-ghost" data-center="${p.id}">Centrar en mapa</button>
          </div>`;
        list.appendChild(card);
      });

      $$('[data-del]',list).forEach(btn=> 
        btn.onclick=()=>{ 
          const id=+btn.dataset.del; 
          const pt=state.points.find(x=>x.id===id);
          if(confirm(`¿Eliminar el punto "${pt?.name}"? Esta acción no se puede deshacer.`)){
            state.points=state.points.filter(p=>p.id!==id); save(); apply(); 
          }
        });
      $$('[data-detail]',list).forEach(btn=> btn.onclick=()=>{ const id=+btn.dataset.detail; const p=state.points.find(x=>x.id===id); if(p) openPointDetail(p); });
      $$('[data-report]',list).forEach(btn=> btn.onclick=()=>{ const id=+btn.dataset.report; const p=state.points.find(x=>x.id===id); if(p) openReportModal(p); });
      $$('[data-center]',list).forEach(btn=> btn.onclick=()=>{ 
        const id=+btn.dataset.center; 
        const p=state.points.find(x=>x.id===id); 
        if(p) {
          map.setView([p.lat, p.lng], 15);
          // Abrir popup del marcador
          markers.forEach(m => {
            if(m.getLatLng().lat === p.lat && m.getLatLng().lng === p.lng) {
              m.openPopup();
            }
          });
        }
      });
    }
    filter.onchange=apply; apply();
  }

  // Perfil
  function renderPerfil(view){
    view.innerHTML = $('#perfilTpl').innerHTML;
    $('#profileCard',view).innerHTML = `<div class="row" style="gap:12px;align-items:center"><span class="badge badge-green">👤 Perfil</span><div><div style=\"font-weight:600\">${state.user?.name || 'Invitado'}</div><div class=\"muted\">Rol: ${state.user?.role==='ong'?'ONG (Administrador)':'Usuario'}</div></div></div>`;
    const actions=$('#perfilActions',view);
    if(state.user?.role==='ong'){
      const verBadge = state.orgVer.status==='verificado' ? `<span class="badge badge-blue">ONG verificada</span>` : `<span class="badge badge-gray">Estado: ${state.orgVer.status}</span>`;
      actions.innerHTML = `
        <div class="card">
          <div style="font-weight:600">Verificación ONG (PDF)</div>
          <div class="muted" style="margin:6px 0">Adjunta la URL del PDF de verificación de tu ONG. ${verBadge}</div>
          <div class="row" style="gap:8px;align-items:center">
            <button class="btn btn-primary" id="btnVerif">Enviar/Actualizar PDF</button>
            ${state.orgVer.pdfUrl ? `<button class="btn btn-ghost" id="viewPdfProfile">Ver PDF</button>`:''}
          </div>
        </div>
        <div class="card">
          <div style="font-weight:600">Postulaciones recibidas</div>
          <div class="muted" style="margin:6px 0">Total: ${state.apps.length}</div>
          <button class="btn btn-ghost" id="viewApps">Ver detalle</button>
        </div>
        <div class="card"><div style="font-weight:600">Publicar vacante</div><div class="muted" style="margin:6px 0">Comparte oportunidades de empleo verde.</div><button class="btn btn-primary" id="mkJob">Crear vacante</button></div>
        <div class="card"><div style="font-weight:600">Publicar noticia</div><div class="muted" style="margin:6px 0">Difunde iniciativas o logros.</div><button class="btn btn-primary" id="mkNews">Crear noticia</button></div>
        <div class="card"><div style="font-weight:600">Añadir punto al mapa</div><div class="muted" style="margin:6px 0">Registra reforestación, monitoreo o educación.</div><button class="btn btn-primary" id="mkPoint">Añadir punto</button></div>`;
      $('#mkJob',view).onclick=()=>openJobModal();
      $('#mkNews',view).onclick=()=>openNewsModal();
      $('#mkPoint',view).onclick=()=>openPointModal();
      $('#btnVerif',view).onclick=()=>openVerifyModal();
      $('#viewApps',view).onclick=()=>openAppsViewer();
      const profilePdfBtn = $('#viewPdfProfile', view);
      if (profilePdfBtn) profilePdfBtn.onclick = () => openPdfViewer(state.orgVer.pdfUrl);
    } else {
      actions.innerHTML = `
        <div class="card">
          <div style="font-weight:600">Mis postulaciones</div>
          <div class="muted" style="margin:6px 0">Consulta el historial.</div>
          <button class="btn btn-ghost" id="myApps">Abrir</button>
        </div>
        <div class="card">
          <div style="font-weight:600">Modificar cuenta</div>
          <div class="muted" style="margin:6px 0">Edita tu nombre, correo y contraseña.</div>
          <button class="btn btn-ghost" id="editAccount">Abrir</button>
        </div>`;
      $('#myApps',view).onclick=()=>openAppsViewer(true);
      $('#editAccount',view).onclick=()=>openAccountModal();
    }
  }

  // Modal base (SIN botón de cerrar arriba)
  const modalRoot = $('#modalRoot');
  function showModal(title, bodyHTML, actions){
    modalRoot.className='backdrop';
    modalRoot.innerHTML = `
      <div class="card modal fade">
        <div style="font-weight:700;margin-bottom:8px">${title}</div>
        ${bodyHTML}
        <div class="row" style="justify-content:flex-end;gap:8px;margin-top:12px">
          ${actions||''}
        </div>
      </div>`;
  }
  function closeModal(){ modalRoot.className='hidden'; modalRoot.innerHTML=''; }

  // PDF/Imágenes
  function openPdfViewer(url){
    const u = (url || '').trim();
    if(!u){ alert('No hay PDF configurado.'); return; }
    const isData = u.startsWith('data:');
    const isImage = /^data:image\/|(\.png|\.jpe?g|\.gif|\.webp)(\?|#|$)/i.test(u);
    const looksPdf = /^data:application\/pdf/i.test(u) || /\.pdf(\?|#|$)/i.test(u);
    const viewerUrl = (!isData && !looksPdf) ? `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(u)}` : u;
    const body = isImage
      ? `<img src="${u}" alt="Documento" class="img-cover" style="max-height:70vh;object-fit:contain">`
      : `<iframe src="${viewerUrl}" style="width:100%;height:70vh;border:0" title="Verificación ONG"></iframe>`;
    showModal('Documento de verificación', `
      <div class="grid" style="gap:8px">
        ${body}
        <div class="muted small">Si no carga, abre el enlace manualmente desde tu navegador.</div>
      </div>
    `,
    `<button class="btn btn-ghost" id="dl">Descargar</button><button class="btn btn-primary" id="closePdf">Cerrar</button>`);
    $('#dl', modalRoot).onclick = () => { const a=document.createElement('a'); a.href=u; a.download='verificacion.pdf'; document.body.appendChild(a); a.click(); a.remove(); };
    $('#closePdf', modalRoot).onclick = closeModal;
  }

  // Utils URL
  function normalizeUrl(u){
    const s = (u||"").trim();
    if(!s) return "";
    if(/^https?:\/\//i.test(s) || /^data:/i.test(s)) return s;
    return "https://" + s;
  }

  // Visor de enlaces (sin "Abrir en nueva pestaña" y sin cerrar arriba)
  function openLinkViewer(url, title="Noticia", meta={desc:"", img:""}){
    const u = normalizeUrl(url||"");

    if((!meta || (!meta.desc && !meta.img)) && u){
      try{
        const n = state.news.find(x => (x.url||"").trim() === (url||"").trim());
        if(n){ meta = { desc:(n.desc||"").trim(), img:(n.img||"").trim() }; }
      }catch(e){}
    }

    const imgHtml = meta.img ? `<img src="${meta.img}" alt="Imagen de la noticia" style="width:100%;max-height:280px;object-fit:cover;border-radius:12px">` : "";
    const descHtml = `<div class="card" style="padding:12px;white-space:pre-wrap;max-height:28vh;overflow:auto">${meta.desc ? meta.desc : '<span class="muted small">Sin descripción.</span>'}</div>`;
    const baseBody = `<div class="grid" style="gap:10px;max-height:70vh;overflow:auto">${imgHtml}${descHtml}</div>`;

    // Preparar contenido para copiar
    const textToCopy = u || `${title}\n\n${meta.desc || 'Sin descripción'}`;
    const copyButtonText = u ? 'Copiar enlace' : 'Copiar texto';

    if(!u){
      // Sin URL: mostrar botón de copiar texto
      showModal(title, baseBody, `
        <button class="btn btn-ghost" id="copyText"> ${copyButtonText}</button>
        <button class="btn btn-primary" id="closeNewsDet">Cerrar</button>
      `);
      $('#copyText',modalRoot).onclick = async () => {
        try { 
          await navigator.clipboard.writeText(textToCopy); 
          alert('Contenido copiado al portapapeles'); 
        } catch { 
          prompt('Copia este contenido:', textToCopy); 
        }
      };
      $('#closeNewsDet',modalRoot).onclick=closeModal;
      return;
    }

    const host = hostFromUrl(u);
    showModal(
      title,
      `
        ${baseBody}
        <div class="muted small" style="margin-top:6px">
          Por compatibilidad no se muestra vista previa integrada de <b>${host || 'el sitio'}</b>.
        </div>
      `,
      `
        <button class="btn btn-ghost" id="copyLink">Copiar enlace</button>
        <button class="btn btn-primary" id="closeBtn">Cerrar</button>
      `
    );
    $('#copyLink', modalRoot).onclick = async () => {
      try { await navigator.clipboard.writeText(u); alert('Enlace copiado'); }
      catch { prompt('Copia el enlace:', u); }
    };
    $('#closeBtn', modalRoot).onclick = closeModal;
  }

  // Verificación rápida ONG (login)
  function openQuickVerifyModal(onDone){
    showModal('Verificación ONG (documento)', `
      <div class="grid" style="gap:8px">
        <input id="qv_url" placeholder="URL del PDF (https://...)">
        <div class="muted small">O adjunta un archivo (PDF o imagen):</div>
        <input id="qv_file" type="file" accept="application/pdf,image/*" />
        <div class="muted small">Este paso es único. Luego podrás actualizarlo desde Perfil.</div>
      </div>
    `, `<button class="btn btn-ghost" id="qv_cancel">Cancelar</button><button class="btn btn-primary" id="qv_ok">Guardar y continuar</button>`);
    $('#qv_cancel',modalRoot).onclick=closeModal;
    $('#qv_ok',modalRoot).onclick=()=>{
      const url = ($('#qv_url',modalRoot).value || '').trim();
      const file = $('#qv_file',modalRoot).files?.[0] || null;
      const finalize = (pdfUrl) => { state.orgVer = { status:'pendiente', pdfUrl }; save(); closeModal(); try { onDone&&onDone(); } catch(e){} };
      if(url){ finalize(url); return; }
      if(file){ const reader=new FileReader(); reader.onload=()=>finalize(reader.result); reader.onerror=()=>alert('No se pudo leer el archivo.'); reader.readAsDataURL(file); return; }
      alert('Debes ingresar una URL o adjuntar un archivo.');
    };
  }

  // Registro
  function openRegisterModal(defaultRole='usuario'){
    showModal('Crear cuenta', `
      <div class="grid" style="gap:8px">
        <div class="grid grid-3" style="grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">
          <select id="r_role"><option value="usuario">Usuario</option><option value="ong">ONG</option></select>
          <input id="r_name" placeholder="Nombre" />
        </div>
        <input id="r_email" type="email" placeholder="Correo" />
        <input id="r_pass" type="password" placeholder="Contraseña" />
        <div id="r_ong_block" class="card" style="padding:12px;display:none">
          <div style="font-weight:600;margin-bottom:6px">Documento de verificación (ONG)</div>
          <input id="r_doc_url" placeholder="URL del PDF (https://...)" />
          <div class="muted small" style="margin:6px 0">O adjunta un archivo (PDF o imagen):</div>
          <input id="r_doc_file" type="file" accept="application/pdf,image/*" />
          <div class="muted small">Debes proporcionar una URL o adjuntar un archivo para completar el registro de ONG.</div>
        </div>
      </div>
    `, `<button class="btn btn-ghost" id="cancelReg">Cancelar</button><button class="btn btn-primary" id="saveReg">Registrarme</button>`);
    const roleSel = $('#r_role',modalRoot); const ongBlock = $('#r_ong_block',modalRoot);
    roleSel.value = defaultRole || 'usuario';
    ongBlock.style.display = roleSel.value==='ong' ? 'block' : 'none';
    roleSel.onchange = ()=>{ ongBlock.style.display = roleSel.value==='ong' ? 'block' : 'none'; };
    $('#cancelReg',modalRoot).onclick=closeModal;
    $('#saveReg',modalRoot).onclick=()=>{
      const role = $('#r_role',modalRoot).value;
      const name = ($('#r_name',modalRoot).value || '').trim() || (role==='ong'?'ONG Demo':'Usuario Demo');
      const email = ($('#r_email',modalRoot).value || '').trim();
      const password = $('#r_pass',modalRoot).value;
      if(!email || !email.includes('@')){ alert('Ingresa un correo válido.'); return; }
      if(role==='ong'){
        const url = ($('#r_doc_url',modalRoot).value || '').trim();
        const file = $('#r_doc_file',modalRoot).files?.[0] || null;
        const finalize = (pdfUrl) => { state.user = { name, role, email, password }; state.orgVer = { status:'pendiente', pdfUrl }; save(); closeModal(); updateHeader(); renderHome(); };
        if(url){ finalize(url); return; }
        if(file){ const reader=new FileReader(); reader.onload=()=>finalize(reader.result); reader.onerror=()=>alert('No se pudo leer el archivo.'); reader.readAsDataURL(file); return; }
        alert('Para registrar una ONG debes adjuntar un documento (URL o archivo).'); return;
      }
      state.user = { name, role, email, password }; save(); closeModal(); updateHeader(); renderHome();
    };
  }

  // Mapa: detalle y reportes
  function openPointDetail(p){
    const img = p.photo ? `<img class="img-cover" src="${p.photo}" alt="Foto del evento">` : `<div class="card" style="background:#f9fafb">Sin imagen</div>`;
    showModal('Detalle del punto', `
      <div class="grid" style="gap:8px">
        <div class="row" style="gap:8px;align-items:center"><span class="badge badge-blue">📍</span><div><div style="font-weight:600">${p.name}</div><div class="muted">Tipo: ${p.type}</div></div></div>
        ${img}
        <div class="card" style="padding:12px"><div class="muted small">Coordenadas</div><div><b>Lat:</b> ${p.lat} • <b>Lng:</b> ${p.lng}</div></div>
        <div class="card" style="padding:12px"><div class="muted small">Evento</div><div><b>Fecha:</b> ${p.eventDate || '—'}</div><div style="margin-top:6px"><b>Lo realizado:</b> ${p.details || '—'}</div></div>
      </div>
    `, `<button class="btn btn-ghost" id="closeDetail">Aceptar</button>`);
    $('#closeDetail',modalRoot).onclick=closeModal;
  }
  function openReportModal(p){
    showModal('Reportar incidencia', `
      <div class="grid" style="gap:8px">
        <div class="muted small">Estás reportando:</div>
        <div><b>${p.name}</b> • <span class="muted">${p.type}</span></div>
        <textarea id="rep_desc" placeholder="Describe la situación" rows="4"></textarea>
        <input id="rep_contact" placeholder="Tu correo (opcional)">
      </div>
    `, `<button class="btn btn-ghost" id="cancelRep">Cancelar</button><button class="btn btn-primary" id="sendRep">Enviar</button>`);
    $('#cancelRep',modalRoot).onclick=closeModal;
    $('#sendRep',modalRoot).onclick=()=>{ const desc=$('#rep_desc',modalRoot).value.trim(); if(!desc){ alert('Describe la incidencia.'); return; } alert('¡Gracias! Tu reporte fue registrado.'); closeModal(); };
  }

  // CRUD modales
  function openJobModal(job){
    const form = job || { title:'', org:'', city:'', type:'Temporal', mode:'Presencial', desc:'' };
    showModal(job?'Editar vacante':'Nueva vacante', `
      <div class="grid grid-3" style="grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">
        <input id="f_title" placeholder="Título del cargo" value="${form.title}">
        <input id="f_org" placeholder="ONG/Entidad" value="${form.org}">
        <input id="f_city" placeholder="Ciudad" value="${form.city}">
        <select id="f_type"><option>Temporal</option><option>Contrato</option><option>Voluntario</option><option>Tiempo completo</option></select>
        <select id="f_mode"><option>Remoto</option><option>Híbrido</option><option>Presencial</option><option>Campo</option></select>
        <textarea id="f_desc" placeholder="Descripción" style="grid-column:1 / -1">${form.desc||''}</textarea>
      </div>
    `, `<button class="btn btn-ghost" id="cancel">Cancelar</button><button class="btn btn-primary" id="save">Guardar</button>`);
    $('#f_type').value=form.type; $('#f_mode').value=form.mode;
    $('#cancel').onclick=closeModal;
    $('#save').onclick=()=>{
      const data={ title:$('#f_title').value, org:$('#f_org').value, city:$('#f_city').value, type:$('#f_type').value, mode:$('#f_mode').value, desc:$('#f_desc').value };
      if(!data.title || !data.org){ alert('Completa al menos Título y ONG.'); return; }
      if(job){ const idx=state.jobs.findIndex(j=>j.id===job.id); state.jobs[idx]={...state.jobs[idx], ...data}; }
      else { const id=Math.max(0,...state.jobs.map(j=>j.id))+1; state.jobs.push({ id, ...data }); }
      save(); closeModal(); state.active='jobs'; renderHome();
    };
  }
  function openNewsModal(n){
    const form = n || { title:'', source:(state.user?.role==='ong' ? state.user.name : 'ONG'), date:new Date().toISOString().slice(0,10), url:'', img:'', desc:'' };
    showModal(n?'Editar noticia':'Nueva noticia', `
      <div class="grid grid-3" style="grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">
        <input id="t_title" placeholder="Título" value="${form.title}">
        <input id="t_source" placeholder="Fuente" value="${form.source}">
        <input id="t_date" type="date" value="${form.date}">
        <input id="t_url" placeholder="URL (https://...)" value="${form.url||''}">
        <input id="t_img" placeholder="Imagen (URL)" value="${form.img||''}">
        <textarea id="t_desc" placeholder="Descripción (si no existe URL, escribe aquí el contenido de la noticia)" style="grid-column:1 / -1" rows="4">${form.desc||''}</textarea>
      </div>
    `, `<button class="btn btn-ghost" id="cancel">Cancelar</button><button class="btn btn-primary" id="save">Guardar</button>`);
    $('#cancel').onclick=closeModal;
    $('#save').onclick=()=>{
      const data={ title:$('#t_title').value, source:$('#t_source').value, date:$('#t_date').value, url:$('#t_url').value.trim(), img:$('#t_img').value.trim(), desc:$('#t_desc').value.trim() };
      if(!data.title){ alert('Agrega un título.'); return; }
      if(!data.url && !data.desc){ alert('Agrega una URL o escribe una descripción.'); return; }
      if(n){ const idx=state.news.findIndex(x=>x.id===n.id); state.news[idx]={...state.news[idx], ...data}; }
      else { const id=Math.max(0,...state.news.map(x=>x.id))+1; state.news.push({ id, ...data }); }
      save(); closeModal(); state.active='news'; renderHome();
    };
  }
  function openPointModal(){
    openPointModalWithCoords('', '');
  }
  
  function openPointModalWithCoords(lat, lng){
    const form = { 
      name:'', 
      type:'Reforestación', 
      lat: lat ? lat.toFixed(6) : '', 
      lng: lng ? lng.toFixed(6) : '', 
      photo:'', 
      eventDate:new Date().toISOString().slice(0,10), 
      details:'' 
    };
    
    const title = (lat && lng) ? 'Nuevo punto (coordenadas del mapa)' : 'Nuevo punto de encuentro';
    const helpMsg = (lat && lng) 
      ? '<div class="card" style="padding:10px;background:#d1fae5"><div class="muted small">✅ Coordenadas capturadas del mapa. Puedes ajustarlas si es necesario.</div></div>'
      : `<div class="card" style="padding:10px;background:#eff6ff">
          <div style="font-weight:600;margin-bottom:4px;font-size:13px">💡 ¿Cómo obtener las coordenadas?</div>
          <div class="muted small">
            <b>Opción 1:</b> Haz clic directamente en el mapa arriba<br>
            <b>Opción 2:</b> Usa <a href="https://www.google.com/maps" target="_blank" rel="noopener" style="color:#2563eb">Google Maps</a>:
            <ol style="margin:4px 0 0 16px;padding:0">
              <li>Haz clic derecho en el punto del mapa</li>
              <li>Copia las coordenadas que aparecen arriba</li>
              <li>Pégalas en los campos de abajo</li>
            </ol>
          </div>
        </div>`;
    
    showModal(title, `
      <div class="grid" style="gap:8px">
        <div class="grid grid-3" style="grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">
          <input id="p_name" placeholder="Nombre del punto" value="${form.name}">
          <select id="p_type"><option>Reforestación</option><option>Monitoreo</option><option>Educación</option></select>
          <input id="p_lat" type="number" step="any" placeholder="Latitud (ej: 2.873)" value="${form.lat}">
          <input id="p_lng" type="number" step="any" placeholder="Longitud (ej: -75.3)" value="${form.lng}">
          <input id="p_photo" placeholder="URL de foto (opcional)" value="${form.photo}" style="grid-column:1 / -1">
          <input id="p_date" type="date" value="${form.eventDate}">
          <textarea id="p_details" placeholder="¿Qué se realizó ese día?" style="grid-column:1 / -1" rows="3">${form.details}</textarea>
        </div>
        ${helpMsg}
      </div>
    `, `<button class="btn btn-ghost" id="cancel">Cancelar</button><button class="btn btn-primary" id="save">Guardar punto</button>`);
    $('#cancel').onclick=closeModal;
    $('#save').onclick=()=>{
      const lat=parseFloat(String($('#p_lat').value).replace(',', '.'));
      const lng=parseFloat(String($('#p_lng').value).replace(',', '.'));
      const name=$('#p_name').value, type=$('#p_type').value;
      const photo=$('#p_photo').value.trim(); const eventDate=$('#p_date').value; const details=$('#p_details').value.trim();
      if(!name || Number.isNaN(lat) || Number.isNaN(lng)){ alert('Completa nombre, lat y lng válidos'); return; }
      const id=Math.max(0,...state.points.map(p=>p.id))+1;
      state.points.push({ id, name, type, lat, lng, photo, eventDate, details });
      save(); closeModal(); state.active='map'; renderHome();
    };
  }

  // Aplicar a trabajo
  function openApplyModal(job){
    showModal(`Postular a: ${job.title}`, `
      <div class="grid" style="gap:8px">
        <input id="a_name" placeholder="Tu nombre completo" value="${state.user?.name || ''}">
        <input id="a_email" type="email" placeholder="Tu correo" value="${state.user?.email || ''}">
        <div>
          <label class="muted" style="display:block;margin-bottom:4px">Adjuntar hoja de vida (PDF)</label>
          <input id="a_cv_file" type="file" accept="application/pdf,.pdf" style="width:100%">
          <div class="muted small" style="margin-top:4px">Selecciona un archivo PDF desde tu computadora</div>
        </div>
        <textarea id="a_msg" rows="4" placeholder="Mensaje de presentación (opcional)"></textarea>
        <div class="muted small">Tus datos se guardarán localmente (este demo no envía información a servidores).</div>
      </div>
    `, `<button class="btn btn-ghost" id="cancelA">Cancelar</button><button class="btn btn-primary" id="sendA">Enviar postulación</button>`);
    $('#cancelA',modalRoot).onclick=closeModal;
    $('#sendA',modalRoot).onclick=()=>{
      const name=$('#a_name',modalRoot).value.trim();
      const email=$('#a_email',modalRoot).value.trim();
      const fileInput=$('#a_cv_file',modalRoot);
      const msg=$('#a_msg',modalRoot).value.trim();
      
      if(!name || !email){ alert('Nombre y correo son obligatorios.'); return; }
      if(!fileInput.files || !fileInput.files[0]){ alert('Por favor selecciona tu hoja de vida (PDF).'); return; }
      
      const file = fileInput.files[0];
      if(file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')){ 
        alert('Por favor selecciona un archivo PDF válido.'); 
        return; 
      }
      
      // Guardar información del archivo (nombre y tamaño)
      const cvInfo = `${file.name} (${(file.size/1024).toFixed(1)} KB)`;
      
      state.apps.push({ 
        id:Date.now(), 
        when:new Date().toISOString(), 
        jobId:job.id, 
        jobTitle:job.title, 
        name, 
        email, 
        cv: cvInfo,
        msg, 
        status:'en revisión' 
      });
      save(); 
      alert('¡Postulación enviada exitosamente!'); 
      closeModal();
    };
  }

  // Verificación ONG (perfil)
  function openVerifyModal(){
    showModal('Verificación ONG (PDF)', `
      <div class="grid" style="gap:8px">
        <input id="v_pdf" placeholder="URL del PDF (https://...)" value="${state.orgVer.pdfUrl||''}">
        <select id="v_status"><option value="pendiente">pendiente</option><option value="verificado">verificado</option><option value="rechazado">rechazado</option></select>
        <div class="muted small">Nota: Solo una simulación local. Guarda la URL de tu PDF y el estado.</div>
      </div>
    `,
    `<button class="btn btn-ghost" id="cancelV">Cancelar</button><button class="btn btn-ghost" id="viewPDF">Ver PDF</button><button class="btn btn-primary" id="saveV">Guardar</button>`);
    $('#v_status').value = state.orgVer.status || 'pendiente';
    $('#cancelV').onclick=closeModal;
    $('#viewPDF').onclick=()=>{ const url=$('#v_pdf').value.trim(); if(!url){ alert('Agrega una URL de PDF.'); return; } openPdfViewer(url); };
    $('#saveV').onclick=()=>{ const pdfUrl=$('#v_pdf').value.trim(); const status=$('#v_status').value; if(!pdfUrl){ alert('Agrega la URL del PDF.'); return; } state.orgVer={ pdfUrl, status }; save(); alert('Verificación actualizada.'); closeModal(); state.active='perfil'; renderHome(); };
  }

  // Modificar cuenta (usuario)
  function openAccountModal(){
    const u = state.user || { name:'', email:'', password:'' };
    showModal('Modificar cuenta', `
      <div class="grid" style="gap:8px">
        <input id="acc_name" placeholder="Nombre de usuario" value="${u.name||''}">
        <input id="acc_email" type="email" placeholder="Correo" value="${u.email||''}">
        <div class="card" style="padding:12px">
          <div style="font-weight:600;margin-bottom:6px">Cambiar contraseña</div>
          <input id="acc_old" type="password" placeholder="Contraseña actual">
          <div class="grid grid-3" style="grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px">
            <input id="acc_new" type="password" placeholder="Nueva contraseña">
            <input id="acc_confirm" type="password" placeholder="Confirmar nueva contraseña">
          </div>
          <div class="muted small" style="margin-top:6px">La contraseña nueva debe tener al menos 6 caracteres.</div>
        </div>
      </div>
    `, `<button class="btn btn-ghost" id="cancelAcc">Cancelar</button><button class="btn btn-primary" id="saveAcc">Guardar cambios</button>`);
    $('#cancelAcc',modalRoot).onclick=closeModal;
    $('#saveAcc',modalRoot).onclick=()=>{
      const name=$('#acc_name',modalRoot).value.trim();
      const email=$('#acc_email',modalRoot).value.trim();
      const oldPass=$('#acc_old',modalRoot).value;
      const newPass=$('#acc_new',modalRoot).value;
      const confPass=$('#acc_confirm',modalRoot).value;
      if(!name){ alert('El nombre no puede estar vacío.'); return; }
      if(!email || !email.includes('@')){ alert('Ingresa un correo válido.'); return; }
      const wantsChange = newPass || confPass || oldPass;
      if(wantsChange){
        const hadPassword = !!(u.password && u.password.length);
        if(hadPassword && oldPass !== (u.password||'')){ alert('La contraseña actual no es correcta.'); return; }
        if(newPass.length < 6){ alert('La nueva contraseña debe tener al menos 6 caracteres.'); return; }
        if(newPass !== confPass){ alert('La confirmación no coincide.'); return; }
      }
      state.user = { ...(state.user||{role:'usuario'}), role:state.user?.role||'usuario', name, email, password: wantsChange ? newPass : (u.password||'') };
      save(); updateHeader(); alert('Cuenta actualizada.'); closeModal(); state.active='perfil'; renderHome();
    };
  }

  // Postulaciones
  function openAppsViewer(onlyMine=false){
    const data = onlyMine && state.user ? state.apps.filter(a=>a.name===state.user.name) : state.apps;
    const rows = data.map(a=>`
      <tr>
        <td>${new Date(a.when).toLocaleString()}</td>
        <td>${a.jobTitle}</td>
        <td>${a.name}</td>
        <td><a href="mailto:${a.email}">${a.email}</a></td>
        <td>${a.cv ? `<span title="${a.cv}">${a.cv}</span>`:'—'}</td>
        <td>${a.status}</td>
      </tr>`).join('') || `<tr><td colspan="6" class="muted">Sin postulaciones</td></tr>`;
    showModal('Postulaciones', `
      <div class="card" style="overflow:auto">
        <table style="width:100%;border-collapse:collapse">
          <thead><tr>
            <th style="text-align:left;padding:6px;border-bottom:1px solid #eee">Fecha</th>
            <th style="text-align:left;padding:6px;border-bottom:1px solid #eee">Vacante</th>
            <th style="text-align:left;padding:6px;border-bottom:1px solid #eee">Nombre</th>
            <th style="text-align:left;padding:6px;border-bottom:1px solid #eee">Correo</th>
            <th style="text-align:left;padding:6px;border-bottom:1px solid #eee">Archivo</th>
            <th style="text-align:left;padding:6px;border-bottom:1px solid #eee">Estado</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `, `<button class="btn btn-ghost" id="closeApps">Cerrar</button>`);
    $('#closeApps').onclick=closeModal;
  }

  // Tests mínimos
  function assert(name, cond){ if(!cond) throw new Error('Test failed: '+name); console.log('✅',name); }
  function runTests(){
    const t=100*0.192 + 50*0.42 + 10*1.9; assert('Cálculo total', Math.abs(t-59.2)<1e-9);
    assert('Noticias demo', state.news.length>0);
  }

  // Boot
  if(state.user){ updateHeader(); renderHome(); } else { renderLogin(); }
  runTests();
})();