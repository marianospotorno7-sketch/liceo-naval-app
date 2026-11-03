'use strict';

// ============================================================================
// CONFIGURACIÓN — completar después de los pasos manuales (ver CONFIGURACION.md)
// ============================================================================
var CONFIG = {
  CLIENT_ID: '191749685889-0v8tsod2jdpm8le4icnp2lqc3545p9do.apps.googleusercontent.com',
  BACKEND_URL: 'https://script.google.com/macros/s/AKfycbw_QdHUyuXu6lmVXFWZdeYwW9sgz36yIEmRUHeSm4-eROFeWKFOzzwJ-lnfDSdr2661tQ/exec',
  FORM_INGRESO_URL: 'https://docs.google.com/forms/d/e/1FAIpQLScy8TN1eog6jo0YIvow0ENvc03Nv-NldtVA-zJKgkRigTTfTg/viewform'
};

// Lista "de ranking": tiene que ser EXACTAMENTE la misma que RANKING_POTENCIA en el backend —
// de acá salen los chips de la pantalla Ranking.
var EJERCICIOS_POTENCIA = ['ARRANQUE', 'CARGADA'];
// Lista solo para la pantalla de Carga: lo mismo + Tirón de Arranque y Tirón de Cargada (pedido
// de Mariano, 29/10) — quedan guardados en la base pero no se muestran en Mis Datos ni Ranking.
var EJERCICIOS_POTENCIA_CARGA = ['ARRANQUE', 'TIRÓN DE ARRANQUE', 'CARGADA', 'TIRÓN DE CARGADA'];
// Lista "de ranking": tiene que ser EXACTAMENTE la misma que RANKING_FUERZA en el backend —
// de acá salen los chips de la pantalla Ranking.
var EJERCICIOS_FUERZA = ['SENTADILLA', 'PESO MUERTO', 'DESPEGUE', 'PRESS BANCA', 'PRESS HOMBRO', 'DOMINADAS'];
// Lista solo para la pantalla de Carga: lo mismo + ejercicios que el jugador puede cargar pero
// que no se muestran en Mis Datos ni en el Ranking (pedido de Mariano, 29/10: Sentadilla Media
// — el dato queda guardado en la base, simplemente no se ve en la app salvo al cargarlo).
var EJERCICIOS_FUERZA_CARGA = ['SENTADILLA', 'SENTADILLA MEDIA', 'PESO MUERTO', 'DESPEGUE', 'PRESS BANCA', 'PRESS HOMBRO', 'DOMINADAS'];
// Campo: tiene que ser EXACTAMENTE la misma lista que RANKING_CAMPO en el backend.
var EJERCICIOS_CAMPO = ['BRONCO', 'VEL MAX'];
// Unidad para mostrar cada ejercicio en Mis Datos y Ranking (todo lo que no está acá es 'kg').
var UNIDAD_EJ = {'SALTO HORIZONTAL': 'm', 'BRONCO': 's', 'VEL MAX': 'km/h', 'MINUTOS': 'min', 'PARTIDOS': ''};
function unidadEj_(ej) { return ej in UNIDAD_EJ ? UNIDAD_EJ[ej] : 'kg'; }
// Bronco se guarda en segundos (igual que siempre) pero se muestra en minutos:segundos, más
// natural para leer que "308 s" -- en el resto de los ejercicios no cambia nada.
function partesValor_(ej, v) {
  if (ej === 'BRONCO') { var m = Math.floor(v / 60), s = Math.round(v % 60); return {num: m + ':' + (s < 10 ? '0' : '') + s, unidad: ''}; }
  return {num: String(v), unidad: unidadEj_(ej)};
}
function formatearValor_(ej, v) { var p = partesValor_(ej, v); return p.unidad ? (p.num + ' ' + p.unidad) : p.num; }
var CAMPO_ID = {
  'ARRANQUE': 'campoArranque', 'TIRÓN DE ARRANQUE': 'campoTironArranque', 'CARGADA': 'campoCargada',
  'TIRÓN DE CARGADA': 'campoTironCargada', 'SENTADILLA': 'campoSentadilla',
  'SENTADILLA MEDIA': 'campoSentadillaMedia', 'PESO MUERTO': 'campoPesoMuerto', 'DESPEGUE': 'campoDespegue',
  'PRESS BANCA': 'campoPressBanca', 'PRESS HOMBRO': 'campoPressHombro', 'DOMINADAS': 'campoDominadas'
};
// Nombres tal cual están en la base (no se tocan, serían decenas de miles de filas históricas)
// vs. cómo se muestran en la app. Pedido de Mariano (30/10): Press Banca y Press Pecho son el
// mismo ejercicio — se unifica mostrando siempre "Press de Pecho".
var ETIQUETAS = {'PRESS BANCA': 'PRESS DE PECHO', 'MINUTOS': 'MINUTOS JUGADOS', 'PARTIDOS': 'PARTIDOS JUGADOS'};
function etiqueta_(nombre) { return ETIQUETAS[nombre] || nombre; }

// Solo en la pantalla de Carga: lo que se anota como "Sentadilla" en la base es siempre
// sentadilla PROFUNDA — se aclara acá para que el jugador no cargue otra variante sin darse
// cuenta. Mis Datos y Ranking siguen mostrando "Sentadilla" como siempre.
var ETIQUETAS_CARGA = {'SENTADILLA': 'SENTADILLA PROFUNDA'};
function etiquetaCarga_(nombre) { return ETIQUETAS_CARGA[nombre] || etiqueta_(nombre); }

// Tiene que ser EXACTAMENTE la misma lista que ZONAS_LESION en el backend.
var ZONAS_LESION = ['Cabeza / conmoción', 'Cuello', 'Hombro', 'Brazo / codo', 'Mano / muñeca', 'Pecho / costillas',
  'Espalda / lumbar', 'Cadera / ingle', 'Muslo anterior (cuádriceps)', 'Muslo posterior (isquios)', 'Rodilla',
  'Pierna / gemelo', 'Tobillo', 'Pie', 'Otra'];
var CAMADAS_COACH = ['M15', 'M16', 'M17', 'M19', 'PLANTEL', 'G2 PS'];

// Listas cerradas de la pantalla Lesiones (cuerpo médico / PFs) -- tienen que ser EXACTAMENTE
// las mismas que las del backend (apps_script_base_liceo.gs).
var ZONAS_LESION_CLINICA = ['Cabeza / cara', 'Cuello / columna cervical', 'Columna dorsal / tórax / costillas', 'Abdomen',
  'Columna lumbar', 'Pelvis / sacro', 'Hombro / clavícula', 'Brazo', 'Codo', 'Antebrazo', 'Muñeca', 'Mano / dedos / pulgar',
  'Cadera / ingle', 'Muslo anterior (cuádriceps)', 'Muslo posterior (isquiotibiales)', 'Muslo aductor', 'Rodilla',
  'Pierna (gemelo / sóleo)', 'Tendón de Aquiles', 'Tobillo', 'Pie / dedos'];
var LADOS_LESION = ['Derecha', 'Izquierda', 'Bilateral'];
var TIPOS_LESION_CLINICA = ['Conmoción cerebral', 'Fractura', 'Fisura / microfractura', 'Luxación / subluxación',
  'Esguince ligamentario', 'Lesión meniscal', 'Lesión tendinosa (tendinopatía / tendinitis)', 'Ruptura muscular (desgarro)',
  'Distensión muscular', 'Sobrecarga / fatiga muscular', 'Contractura', 'Contusión / hematoma', 'Bursitis', 'Sinovitis',
  'Lesión nerviosa', 'Laceración / corte', 'Lesión dental', 'Lesión visceral / abdominal', 'Cuadro febril / enfermedad', 'Otro'];
var DIAGNOSTICOS_LESION = ['Desgarro de isquiotibiales', 'Desgarro de cuádriceps', 'Desgarro de aductores',
  'Desgarro de gemelo / sóleo', 'Sobrecarga muscular', 'Rotura de LCA', 'Rotura de LCP', 'Esguince de LCI / LLE de rodilla',
  'Lesión meniscal de rodilla', 'Síndrome patelofemoral', 'Esguince de tobillo', 'Tendinopatía de Aquiles',
  'Luxación / subluxación de hombro', 'Luxación acromioclavicular', 'Tendinopatía del manguito rotador', 'Esguince cervical',
  'Lumbalgia / lumbociatalgia', 'Pubalgia', 'Conmoción cerebral', 'Fractura (especificar en detalle)', 'Herida cortante',
  'Otro (especificar en detalle)'];
var RECURRENCIA_LESION = ['Sí', 'No'];
var CAUSAS_LESION = ['Sin contacto', 'Contacto indirecto con otro jugador', 'Contacto indirecto con un objeto (pelota / suelo / poste)',
  'Contacto directo con otro jugador', 'Contacto directo con un objeto (pelota / suelo / poste)'];
var MECANISMOS_LESION = ['Tackleador', 'Tackleado', 'Scrum', 'Maul', 'Ruck', 'Line out', 'Colisión / choque', 'Carrera / sprint',
  'Cambio de dirección', 'Salto', 'Caída', 'Patada', 'Try (anotando)', 'Pisotón', 'Sobreuso / sobrecarga (sin mecanismo puntual)', 'Otro'];

var state = {token: null, misDatos: null, ranking: null, rankingEj: 'ARRANQUE', rankingGrupo: 'fuerza', avisos: null, esCoach: false,
  jugadoresLista: [], solicitudes: [], coachCamada: 'TODAS', coachPartidos: null,
  esStaff: false, staffCamadas: null, revisar: null, revisarCamada: 'TODAS', previewJugador: null, cargaTab: 'gym',
  esMedico: false, lesionesJugadores: [], lesionesList: null};

function configLista_() {
  return CONFIG.CLIENT_ID.indexOf('PENDIENTE') < 0 && CONFIG.BACKEND_URL.indexOf('PENDIENTE') < 0;
}

// ---------------------------------------------------------------------------
// Login con Google
// ---------------------------------------------------------------------------
function iniciarGoogle(intentos) {
  intentos = intentos || 0;
  if (CONFIG.CLIENT_ID.indexOf('PENDIENTE') >= 0) {
    document.getElementById('loginMsg').textContent = 'El login con Google todavía no está configurado (falta el Client ID).';
    return;
  }
  if (!window.google || !window.google.accounts) {
    if (intentos > 40) { document.getElementById('loginMsg').textContent = 'No se pudo cargar el login de Google. Revisá tu conexión y recargá.'; return; }
    setTimeout(function () { iniciarGoogle(intentos + 1); }, 150);
    return;
  }
  google.accounts.id.initialize({client_id: CONFIG.CLIENT_ID, callback: onGoogleLogin_});
  google.accounts.id.renderButton(document.getElementById('gBtn'), {theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with'});
}

function onGoogleLogin_(resp) {
  state.token = resp.credential;
  try { localStorage.setItem('liceo_token', resp.credential); } catch (e) {}
  entrarAlApp_();
}

function salir_() {
  state.token = null; state.esCoach = false; state.esMedico = false;
  try { localStorage.removeItem('liceo_token'); } catch (e) {}
  document.getElementById('appScreen').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  document.querySelectorAll('.tab').forEach(function (t) { t.style.display = ''; });
}

// El token de Google dura ~1 hora. Si quedó uno viejo en localStorage, entrarAlApp_() lo usa
// igual (no hay forma de saber que venció sin preguntarle al backend) y recién ahí el backend
// lo rechaza -- acá se manda de nuevo a loguearse.
function sesionVencida_() {
  salir_();
  document.getElementById('loginMsg').textContent = 'Tu sesión venció, volvé a entrar con Google.';
  iniciarGoogle();
}

function entrarAlApp_() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('appScreen').classList.remove('hidden');
  // Mis Datos y Avisos no dependen uno del otro -- se pedían encadenados (uno esperaba al otro)
  // y eso duplicaba el tiempo de apertura. Van en paralelo (pedido de Mariano, 2/11: "que cargue
  // más rápido").
  cargarMisDatos_();
  cargarAvisos_();
}

// ---------------------------------------------------------------------------
// Llamadas al backend (Apps Script Web App).
// ---------------------------------------------------------------------------
function backendGet_(action, params) {
  if (!configLista_()) return Promise.reject('sin-config');
  var url = CONFIG.BACKEND_URL + '?token=' + encodeURIComponent(state.token) + '&action=' + action;
  Object.keys(params || {}).forEach(function (k) { url += '&' + k + '=' + encodeURIComponent(params[k]); });
  return fetch(url).then(function (r) { return r.json(); }).then(function (j) {
    if (j.error == 'SIN_VINCULAR') {
      if (j.esCoach) { entrarComoCoach_(); return Promise.reject('es-coach'); }
      if (j.esStaff) { entrarComoStaff_(); return Promise.reject('es-staff'); }
      if (j.esMedico) { entrarComoMedico_(); return Promise.reject('es-medico'); }
      mostrarSinVincular_(); return Promise.reject('sin-vincular');
    }
    if (j.error == 'PENDIENTE_APROBACION') { mostrarPendiente_(); return Promise.reject('pendiente'); }
    if (j.error == 'RECHAZADO') { mostrarRechazado_(); return Promise.reject('rechazado'); }
    if (j.error == 'No autorizado') { sesionVencida_(); return Promise.reject('no-autorizado'); }
    if (j.error) return Promise.reject(j.error);
    return j;
  });
}

function mostrarSinVincular_() {
  salir_();
  document.getElementById('loginMsg').textContent = 'Tu cuenta de Google todavía no está vinculada a un jugador.';
  var a = document.getElementById('ingresoLink');
  if (CONFIG.FORM_INGRESO_URL.indexOf('PENDIENTE') < 0) { a.href = CONFIG.FORM_INGRESO_URL; a.classList.remove('hidden'); }
}

// Ya completó el form de ingreso (está vinculado) pero el cuerpo técnico todavía no lo aprobó.
function mostrarPendiente_() {
  salir_();
  document.getElementById('loginMsg').textContent = 'Tu solicitud le llegó al cuerpo técnico y está esperando aprobación. En cuanto te aprueben, volvé a entrar con Google.';
}

function mostrarRechazado_() {
  salir_();
  document.getElementById('loginMsg').textContent = 'Tu solicitud fue rechazada. Si pensás que es un error, hablalo con el cuerpo técnico.';
}

// El coach (COACH_EMAILS en el backend) no tiene por qué tener fila de jugador: entra directo
// a Avisos, sin Mis Datos/Ranking/Carga (son datos de jugador que no tiene).
function entrarComoCoach_() {
  state.esCoach = true;
  document.getElementById('hNombre').textContent = 'Cuerpo técnico';
  document.getElementById('hCamada').textContent = 'Liceo Naval';
  document.querySelectorAll('.tab').forEach(function (t) {
    var pantalla = t.getAttribute('data-screen');
    t.style.display = (pantalla == 'Avisos' || pantalla == 'Ranking' || pantalla == 'Revisar' || pantalla == 'Lesiones') ? '' : 'none';
  });
  irAPantalla_('Avisos');
  cargarAvisos_();
}

// Staff: solo ve Ranking (informe de partidos y lesiones de su camada, o todo el club), de solo
// lectura -- no Avisos, no Carga, no Mis Datos, no Revisar.
function entrarComoStaff_() {
  state.esCoach = false; state.esStaff = true;
  document.getElementById('hNombre').textContent = 'Staff';
  document.getElementById('hCamada').textContent = 'Liceo Naval';
  document.querySelectorAll('.tab').forEach(function (t) {
    t.style.display = t.getAttribute('data-screen') == 'Ranking' ? '' : 'none';
  });
  irAPantalla_('Ranking');
}

// Cuerpo médico: rol nuevo (3/11/2026), todo el club, solo carga/ve Lesiones + el informe de
// Ranking (partidos/lesiones) -- no Avisos, no Carga, no Mis Datos, no Revisar.
function entrarComoMedico_() {
  state.esCoach = false; state.esStaff = false; state.esMedico = true;
  document.getElementById('hNombre').textContent = 'Cuerpo médico';
  document.getElementById('hCamada').textContent = 'Liceo Naval';
  document.querySelectorAll('.tab').forEach(function (t) {
    var pantalla = t.getAttribute('data-screen');
    t.style.display = (pantalla == 'Ranking' || pantalla == 'Lesiones') ? '' : 'none';
  });
  irAPantalla_('Lesiones');
}

// Errores que ya muestran su propia pantalla (login) y no tienen que mostrar nada más acá.
var ERRORES_CON_PANTALLA_PROPIA = ['sin-vincular', 'es-coach', 'es-staff', 'es-medico', 'no-autorizado', 'pendiente', 'rechazado'];

function cargarMisDatos_() {
  backendGet_('misdatos').then(function (d) { state.esCoach = !!d.esCoach; renderMisDatos_(d); })
    .catch(function (err) { if (ERRORES_CON_PANTALLA_PROPIA.indexOf(err) >= 0) return; console.error('misdatos', err); });
}

function cargarRanking_() {
  backendGet_('ranking').then(function (d) { state.ranking = d; renderRanking_(); })
    .catch(function (err) { if (ERRORES_CON_PANTALLA_PROPIA.indexOf(err) >= 0) return; console.error('ranking', err); });
}

function cargarRankingCoach_() {
  backendGet_('rankingCoach', {camada: state.coachCamada}).then(function (d) { state.coachPartidos = d; renderCoachPartidos_(); })
    .catch(function (err) { if (ERRORES_CON_PANTALLA_PROPIA.indexOf(err) >= 0) return; console.error('rankingCoach', err); });
}

function cargarAvisos_() {
  backendGet_('avisos').then(function (d) { state.avisos = d; state.jugadoresLista = d.jugadores || []; state.solicitudes = d.solicitudes || []; renderAvisos_(); actualizarBadge_(); })
    .catch(function (err) { if (ERRORES_CON_PANTALLA_PROPIA.indexOf(err) >= 0) return; console.error('avisos', err); });
}

function cargarLesionesJugadores_() {
  backendGet_('jugadoresLesion').then(function (d) { state.lesionesJugadores = d.jugadores || []; })
    .catch(function (err) { if (ERRORES_CON_PANTALLA_PROPIA.indexOf(err) >= 0) return; console.error('jugadoresLesion', err); });
}

function cargarLesionesList_() {
  backendGet_('lesiones').then(function (d) { state.lesionesList = d.lesiones || []; renderLesionesList_(); })
    .catch(function (err) { if (ERRORES_CON_PANTALLA_PROPIA.indexOf(err) >= 0) return; console.error('lesiones', err); });
}

// ---------------------------------------------------------------------------
// Render: Mis Datos
// ---------------------------------------------------------------------------
function fmtFecha_(iso) {
  var d = new Date(iso); if (isNaN(d)) return '';
  return d.toLocaleDateString('es-AR', {day: '2-digit', month: '2-digit', year: '2-digit'});
}

function tarjetaEj_(nombre, d) {
  var div = document.createElement('div'); div.className = 'excard';
  var nameDiv = document.createElement('div'); nameDiv.className = 'exname'; nameDiv.textContent = etiqueta_(nombre);
  div.appendChild(nameDiv);
  if (!d) {
    var vacio = document.createElement('div'); vacio.className = 'exempty'; vacio.textContent = 'Sin cargas todavía';
    div.appendChild(vacio);
    return div;
  }
  var row = document.createElement('div'); row.className = 'exrow';
  var val = document.createElement('div'); val.className = 'exval';
  var pa = partesValor_(nombre, d.actual);
  val.innerHTML = pa.num + (pa.unidad ? ' <small>' + pa.unidad + '</small>' : '');
  var rec = document.createElement('div'); rec.className = 'exrecord';
  rec.textContent = 'Récord ' + formatearValor_(nombre, d.record) + ' · ' + fmtFecha_(d.fechaRecord);
  row.appendChild(val); row.appendChild(rec);
  div.appendChild(row);
  return div;
}

function renderMisDatos_(d) {
  state.misDatos = d;
  document.getElementById('hNombre').textContent = d.nombre;
  document.getElementById('hCamada').textContent = d.puesto || '';
  document.getElementById('statTotal').textContent = d.cargasTotales;
  document.getElementById('statMes').textContent = d.cargasMes;
  document.getElementById('statPeso').textContent = d.pesoActual != null ? d.pesoActual : '—';
  document.getElementById('statAltura').textContent = d.alturaActual != null ? d.alturaActual : '—';
  document.getElementById('statPartidos').textContent = d.partidos ? d.partidos.partidos : 0;
  document.getElementById('statMinutos').textContent = d.partidos ? d.partidos.minutos : 0;

  var gp = document.getElementById('grupoPotencia'); gp.innerHTML = '';
  EJERCICIOS_POTENCIA.forEach(function (e) { gp.appendChild(tarjetaEj_(e, d.ejercicios[e])); });

  var gf = document.getElementById('grupoFuerza'); gf.innerHTML = '';
  EJERCICIOS_FUERZA.forEach(function (e) { gf.appendChild(tarjetaEj_(e, d.ejercicios[e])); });

  var gs = document.getElementById('grupoSalto'); gs.innerHTML = '';
  gs.appendChild(tarjetaEj_('SALTO HORIZONTAL', d.ejercicios['SALTO HORIZONTAL']));

  var gc = document.getElementById('grupoCampo'); gc.innerHTML = '';
  EJERCICIOS_CAMPO.forEach(function (e) { gc.appendChild(tarjetaEj_(e, d.ejercicios[e])); });
}

// ---------------------------------------------------------------------------
// Render: Ranking
// ---------------------------------------------------------------------------
// 3 sub-pestañas, igual que en Los Matreros: fuerza (potencia+fuerza+salto), campo, partidos.
var RANKING_GRUPOS = {
  fuerza: EJERCICIOS_POTENCIA.concat(EJERCICIOS_FUERZA).concat(['SALTO HORIZONTAL']),
  campo: EJERCICIOS_CAMPO,
  partidos: ['MINUTOS', 'PARTIDOS']
};
var RANKING_GRUPO_NOMBRE = {fuerza: 'Ranking fuerza', campo: 'Ranking campo', partidos: 'Ranking partidos'};

function renderRankGrupos_() {
  var cont = document.getElementById('rankGrupos'); cont.innerHTML = '';
  Object.keys(RANKING_GRUPOS).forEach(function (g) {
    var b = document.createElement('button'); b.className = 'pill' + (g == state.rankingGrupo ? ' active' : '');
    b.textContent = RANKING_GRUPO_NOMBRE[g];
    b.onclick = function () {
      state.rankingGrupo = g;
      if (RANKING_GRUPOS[g].indexOf(state.rankingEj) < 0) state.rankingEj = RANKING_GRUPOS[g][0];
      renderRanking_();
    };
    cont.appendChild(b);
  });
}

function renderRankChips_() {
  var cont = document.getElementById('rankChips'); cont.innerHTML = '';
  RANKING_GRUPOS[state.rankingGrupo].forEach(function (e) {
    var b = document.createElement('button'); b.className = 'chip' + (e == state.rankingEj ? ' active' : '');
    b.textContent = etiqueta_(e); b.onclick = function () { state.rankingEj = e; renderRanking_(); };
    cont.appendChild(b);
  });
}

function tablaRanking_(lista, mePuesto, soyNombre, ej) {
  var div = document.createElement('div');
  lista.forEach(function (r, i) {
    var row = document.createElement('div'); row.className = 'rankrow' + (i == 0 ? ' top1' : '') + (r.nombre == soyNombre ? ' me' : '');
    var pos = document.createElement('div'); pos.className = 'pos'; pos.textContent = (i + 1) + '°';
    var nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = r.nombre;
    var vv = document.createElement('div'); vv.className = 'vv'; vv.textContent = formatearValor_(ej, r.v);
    var rr = document.createElement('div'); rr.className = 'rr'; rr.textContent = r.rel ? r.rel.toFixed(2) + 'x' : '';
    row.appendChild(pos); row.appendChild(nm); row.appendChild(vv); row.appendChild(rr);
    div.appendChild(row);
  });
  return div;
}

function renderRanking_() {
  renderRankGrupos_();
  renderRankChips_();
  if (!state.ranking) return;
  var r = state.ranking.ranking[state.rankingEj];
  if (!r) return;
  var nm = state.ranking.nombre;

  var cc = document.getElementById('rankCamada'); cc.innerHTML = ''; cc.appendChild(tablaRanking_(r.camada, r.miPuestoCamada, nm, state.rankingEj));
  document.getElementById('miPosCamada').textContent = r.miPuestoCamada ? 'Tu puesto en la camada: ' + r.miPuestoCamada + '°' : 'Todavía no tenés cargas de este ejercicio';

  var cl = document.getElementById('rankClub'); cl.innerHTML = ''; cl.appendChild(tablaRanking_(r.club, r.miPuestoClub, nm, state.rankingEj));
  document.getElementById('miPosClub').textContent = r.miPuestoClub ? 'Tu puesto en el club: ' + r.miPuestoClub + '°' : 'Todavía no tenés cargas de este ejercicio';
}

// ---------------------------------------------------------------------------
// Render: Partidos y lesiones (solo coach)
// ---------------------------------------------------------------------------
function renderCoachPartidos_() {
  var d = state.coachPartidos; if (!d) return;
  state.coachCamada = d.camada;   // el backend puede haber corregido la camada pedida (fuera de permiso, etc.)
  var sel = document.getElementById('coachCamada');
  Array.from(sel.options).forEach(function (o) { o.hidden = o.value != 'TODAS' && d.camadas.indexOf(o.value) < 0; });
  var optTodas = sel.querySelector('option[value="TODAS"]');
  if (optTodas) optTodas.hidden = d.camadas.length <= 1;
  if (sel.value != d.camada) sel.value = d.camada;

  var faltanBox = document.getElementById('coachFaltanBox'); faltanBox.innerHTML = '';
  if (d.faltan && d.faltan.length) {
    var t1 = document.createElement('div'); t1.className = 'exgroup-title'; t1.textContent = '⚠️ No cargaron partido (' + d.faltan.length + ')';
    faltanBox.appendChild(t1);
    d.faltan.forEach(function (f) {
      var div = document.createElement('div'); div.className = 'avisocard';
      div.innerHTML = '<div class="meta">' + f.camada + '</div><div class="texto">' + f.nombre + (f.ultimo ? ' — último: ' + fmtFecha_(f.ultimo) : ' — nunca cargó') + '</div>';
      faltanBox.appendChild(div);
    });
  }

  var infBox = document.getElementById('coachInformeBox'); infBox.innerHTML = '';
  var t2 = document.createElement('div'); t2.className = 'exgroup-title'; t2.textContent = '📋 Informe de partidos';
  infBox.appendChild(t2);
  if (!d.informe || !d.informe.length) { infBox.innerHTML += '<div class="exempty">Sin jugadores en esta camada.</div>'; }
  (d.informe || []).forEach(function (r) {
    var div = document.createElement('div'); div.className = 'excard';
    var porEquipoTxt = Object.keys(r.porEquipo || {}).map(function (e) { return e + ': ' + r.porEquipo[e].p + 'p/' + r.porEquipo[e].m + 'min'; }).join(' · ');
    div.innerHTML = '<div class="exname">' + r.nombre + '</div>' +
      '<div class="exrow"><div class="exval">' + r.partidos + ' <small>partidos</small></div><div class="exrecord">' + r.minutos + ' min · prom ' + r.promedio + '</div></div>' +
      (porEquipoTxt ? '<div class="lastmark" style="margin-top:6px;">' + porEquipoTxt + '</div>' : '') +
      (r.lesiones ? '<div class="lastmark" style="color:var(--red);margin-top:4px;">🩹 ' + r.lesiones + (r.lesiones == 1 ? ' lesión' : ' lesiones') + '</div>' : '');
    infBox.appendChild(div);
  });

  var lesBox = document.getElementById('coachLesionesBox'); lesBox.innerHTML = '';
  var t3 = document.createElement('div'); t3.className = 'exgroup-title'; t3.textContent = '🩹 Lesiones (' + (d.lesiones ? d.lesiones.total : 0) + ')';
  lesBox.appendChild(t3);
  if (d.lesiones && d.lesiones.total) {
    function resumenLinea(titulo, lista) {
      return '<div class="lastmark" style="margin-bottom:4px;">' + titulo + ': ' + lista.map(function (x) { return x.clave + ' (' + x.n + ')'; }).join(' · ') + '</div>';
    }
    var res = document.createElement('div'); res.className = 'rankbox';
    res.innerHTML = resumenLinea('Por zona', d.lesiones.porZona) + resumenLinea('Por ' + (state.coachCamada == 'TODAS' ? 'camada' : 'equipo'), d.lesiones.porEquipo) + resumenLinea('Por momento', d.lesiones.porMomento);
    lesBox.appendChild(res);
    d.lesiones.lista.forEach(function (p) {
      var div = document.createElement('div'); div.className = 'avisocard';
      div.innerHTML = '<div class="meta">' + fmtFecha_(p.fecha) + ' · ' + p.nombre + ' · ' + p.equipo + '</div>' +
        '<div class="texto">' + (p.lesion == 'SEMANA PREVIA' ? '(semana previa) ' : '') + p.zona + (p.detalle ? ' — ' + p.detalle : '') + '</div>';
      lesBox.appendChild(div);
    });
  } else {
    lesBox.innerHTML += '<div class="exempty">Sin lesiones cargadas en esta vista.</div>';
  }
}

// ---------------------------------------------------------------------------
// Informe de partidos + lesiones: imprimir, enviar por mail, descargar Excel.
// Combinado (no separado por vista) para simplificar -- como tiene datos de lesiones, el backend
// igual restringe el envío por mail a PFs/a mí (ver VISTAS_SENSIBLES en apps_script_base_liceo.gs).
// ---------------------------------------------------------------------------
function textoInformeLesiones_() {
  var d = state.coachPartidos;
  var titulo = 'Informe de partidos y lesiones — ' + (!d || d.camada == 'TODAS' ? 'Todo el club' : d.camada);
  if (!d) return {titulo: titulo, texto: '', filas: [[titulo]]};
  var lineas = [titulo, '', 'INFORME DE PARTIDOS'];
  var filas = [[titulo], [], ['INFORME DE PARTIDOS'], ['JUGADOR', 'CAMADA', 'PARTIDOS', 'MINUTOS', 'PROMEDIO', 'LESIONES']];
  (d.informe || []).forEach(function (r) {
    lineas.push(r.nombre + ' (' + r.camada + '): ' + r.partidos + ' partidos, ' + r.minutos + ' min, prom ' + r.promedio + (r.lesiones ? ', ' + r.lesiones + ' lesión/es' : ''));
    filas.push([r.nombre, r.camada, r.partidos, r.minutos, r.promedio, r.lesiones]);
  });
  if (d.lesiones && d.lesiones.total) {
    lineas.push('', 'LESIONES (' + d.lesiones.total + ')');
    lineas.push('Por zona: ' + d.lesiones.porZona.map(function (x) { return x.clave + ' (' + x.n + ')'; }).join(', '));
    lineas.push('Por momento: ' + d.lesiones.porMomento.map(function (x) { return x.clave + ' (' + x.n + ')'; }).join(', '));
    filas.push([], ['LESIONES'], ['FECHA', 'JUGADOR', 'CAMADA', 'EQUIPO', 'MOMENTO', 'ZONA', 'DETALLE']);
    d.lesiones.lista.forEach(function (p) {
      lineas.push(fmtFecha_(p.fecha) + ' · ' + p.nombre + ' · ' + p.equipo + ' · ' + p.zona + (p.detalle ? ' — ' + p.detalle : ''));
      filas.push([fmtFecha_(p.fecha), p.nombre, p.camada, p.equipo, p.lesion, p.zona, p.detalle]);
    });
  }
  return {titulo: titulo, texto: lineas.join('\n'), filas: filas};
}

function descargarExcel_() {
  var ex = textoInformeLesiones_();
  var csv = ex.filas.map(function (fila) {
    return fila.map(function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }).join(',');
  }).join('\r\n');
  var blob = new Blob(['﻿' + csv], {type: 'text/csv;charset=utf-8;'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = ex.titulo.replace(/[^a-z0-9áéíóúñ]+/gi, '_') + '.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

function enviarInformePorMail_() {
  var msg = document.getElementById('mailMsg');
  var ex = textoInformeLesiones_();
  var destino = document.getElementById('mailDestino').value;
  var jugador = document.getElementById('mailJugador').value.trim();
  if (destino == 'JUGADOR' && !jugador) { msg.style.color = 'var(--red)'; msg.textContent = 'Escribí el nombre del jugador.'; return; }
  if (!configLista_()) { msg.style.color = 'var(--accent)'; msg.textContent = 'Backend sin configurar: no se envió nada de verdad.'; return; }
  var btn = document.getElementById('mailEnviarBtn');
  if (btn.disabled) return;
  btn.disabled = true;
  msg.style.color = 'var(--text-dim)'; msg.textContent = 'Enviando…';
  fetch(CONFIG.BACKEND_URL, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'},
    body: JSON.stringify({token: state.token, action: 'enviarInforme', vista: 'INFORME', destino: destino,
      camada: state.coachCamada, equipo: (state.coachPartidos && state.coachPartidos.equipo) || '', jugador: jugador,
      titulo: ex.titulo, texto: ex.texto})})
    .then(function (r) { return r.json(); })
    .then(function (j) {
      btn.disabled = false;
      if (j.error == 'No autorizado') { sesionVencida_(); return; }
      if (j.error) { msg.style.color = 'var(--red)'; msg.textContent = 'Error: ' + j.error; return; }
      msg.style.color = 'var(--green)'; msg.textContent = '¡Enviado a ' + j.enviados + '!';
    })
    .catch(function () { btn.disabled = false; msg.style.color = 'var(--red)'; msg.textContent = 'No se pudo conectar. Probá de nuevo.'; });
}

// ---------------------------------------------------------------------------
// 👁 Ver como jugador (solo coach): vista previa de sus datos reales, de solo lectura.
// ---------------------------------------------------------------------------
function abrirVerComoJugador_() {
  var box = document.getElementById('previewJugadorBox');
  if (!box.classList.contains('hidden') && box.getAttribute('data-modo') == 'buscar') { box.classList.add('hidden'); box.innerHTML = ''; return; }
  box.setAttribute('data-modo', 'buscar');
  box.classList.remove('hidden');
  box.innerHTML = '<div class="fitem"><label>Nombre del jugador (de tu camada)</label><input type="text" id="previewInput" placeholder="Ej. Pérez Juan" autocomplete="off"></div>' +
    '<button id="previewBuscarBtn" class="btn-outline" style="margin-bottom:14px;">Ver</button>';
  document.getElementById('previewBuscarBtn').onclick = function () {
    var nombre = document.getElementById('previewInput').value.trim();
    if (!nombre) return;
    Promise.all([backendGet_('misdatosDe', {jugador: nombre}), backendGet_('rankingDe', {jugador: nombre})])
      .then(function (res) { renderPreviewJugador_(nombre, res[0]); })
      .catch(function (err) {
        if (ERRORES_CON_PANTALLA_PROPIA.indexOf(err) >= 0) return;
        box.innerHTML = '<div class="exempty" style="color:var(--red);">No encontré a "' + nombre + '" en tu camada.</div>';
      });
  };
}

function renderPreviewJugador_(nombre, md) {
  var box = document.getElementById('previewJugadorBox');
  box.setAttribute('data-modo', 'resultado');
  var ejTxt = Object.keys(md.ejercicios || {}).map(function (e) {
    var d = md.ejercicios[e];
    return etiqueta_(e) + ': ' + formatearValor_(e, d.actual) + ' (récord ' + formatearValor_(e, d.record) + ')';
  }).join(' · ');
  box.innerHTML = '<div class="excard"><div class="exname">👁 Viendo como: ' + nombre + '</div>' +
    '<div class="lastmark" style="margin-top:8px;">' + (ejTxt || 'Sin cargas todavía') + '</div>' +
    '<div class="lastmark">Partidos: ' + (md.partidos ? md.partidos.partidos + ' · ' + md.partidos.minutos + ' min' : '—') + '</div>' +
    '<button id="previewCerrarBtn" class="btn2" style="margin-top:10px;">Cerrar</button></div>';
  document.getElementById('previewCerrarBtn').onclick = function () { box.classList.add('hidden'); box.innerHTML = ''; };
}

// ---------------------------------------------------------------------------
// 🗂 Revisar (solo coach): últimas cargas de su camada, con opción de borrar.
// ---------------------------------------------------------------------------
function cargarRevisar_() {
  backendGet_('revisar', {camada: state.revisarCamada}).then(function (d) { state.revisar = d; renderRevisar_(); })
    .catch(function (err) { if (ERRORES_CON_PANTALLA_PROPIA.indexOf(err) >= 0) return; });
}

function renderRevisar_() {
  var d = state.revisar;
  var sel = document.getElementById('revisarCamada');
  if (d) {
    state.revisarCamada = d.camada;
    Array.from(sel.options).forEach(function (o) { o.hidden = o.value != 'TODAS' && d.camadas.indexOf(o.value) < 0; });
    if (sel.value != d.camada) sel.value = d.camada;
  }
  var list = document.getElementById('revisarList'); list.innerHTML = '';
  if (!d || !d.registros || !d.registros.length) { list.innerHTML = '<div class="exempty">Sin cargas para revisar.</div>'; return; }
  d.registros.forEach(function (r) {
    var div = document.createElement('div'); div.className = 'avisocard';
    var meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = fmtFecha_(r.fecha) + ' · ' + r.nombre + ' · ' + r.camada;
    var texto = document.createElement('div'); texto.className = 'texto'; texto.textContent = r.titulo + ': ' + r.texto;
    var btn = document.createElement('button'); btn.textContent = 'Borrar';
    btn.style.cssText = 'margin-top:8px;background:none;border:1px solid var(--red);color:var(--red);font-weight:700;font-family:var(--sans);font-size:11px;padding:6px 12px;border-radius:8px;cursor:pointer;';
    btn.onclick = function () {
      if (btn.textContent == 'Borrar') { btn.textContent = '¿Seguro?'; return; }
      btn.disabled = true; btn.textContent = 'Borrando…';
      borrarCarga_(r.hoja, r.id);
    };
    div.appendChild(meta); div.appendChild(texto); div.appendChild(btn);
    list.appendChild(div);
  });
}

function borrarCarga_(hoja, id) {
  fetch(CONFIG.BACKEND_URL, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'},
    body: JSON.stringify({token: state.token, action: 'borrarCarga', hoja: hoja, id: id})})
    .then(function (r) { return r.json(); })
    .then(function () { cargarRevisar_(); })
    .catch(function () { cargarRevisar_(); });
}

// ---------------------------------------------------------------------------
// Render: Avisos
// ---------------------------------------------------------------------------
function fmtFechaHora_(iso) {
  var d = new Date(iso); if (isNaN(d)) return '';
  return d.toLocaleDateString('es-AR', {day: '2-digit', month: '2-digit'}) + ' ' + d.toLocaleTimeString('es-AR', {hour: '2-digit', minute: '2-digit'});
}

function destinoTexto_(a) {
  if (a.destinoTipo == 'TODOS') return 'A todos';
  if (a.destinoTipo == 'CAMADA') return 'A ' + a.destinoValor;
  if (a.destinoTipo == 'JUGADOR') return 'A ' + a.destinoValor;
  if (a.destinoTipo == 'COACH') return 'Solo vos';
  return '';
}

function renderSolicitudes_() {
  var box = document.getElementById('solicitudesBox');
  var lista = state.solicitudes || [];
  box.classList.toggle('hidden', !state.esCoach || !lista.length);
  if (!state.esCoach || !lista.length) { box.innerHTML = ''; return; }
  box.innerHTML = '';
  var titulo = document.createElement('div'); titulo.className = 'exgroup-title';
  titulo.textContent = 'Solicitudes pendientes (' + lista.length + ')';
  box.appendChild(titulo);
  var msg = document.createElement('div'); msg.id = 'solicitudMsg';
  msg.style.cssText = 'font-family:var(--mono);font-size:12px;margin-bottom:10px;min-height:16px;';
  box.appendChild(msg);
  lista.forEach(function (s) {
    var div = document.createElement('div'); div.className = 'avisocard unread';
    var meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = (s.camada || 'sin camada') + ' · ' + (s.puesto || 'sin puesto');
    var texto = document.createElement('div'); texto.className = 'texto'; texto.textContent = s.nombre + ' — ' + s.email;
    div.appendChild(meta); div.appendChild(texto);
    // PLANTEL/G2 PS se corrigen acá (mismo "Superior" del form ambiguo entre las dos) -- M15..M19
    // no se puede, es la fecha de nacimiento la que decide esa camada, no algo elegible a mano.
    var selMayores = null;
    if (s.camada == 'PLANTEL' || s.camada == 'G2 PS') {
      selMayores = document.createElement('select');
      selMayores.style.cssText = 'width:100%;font-family:var(--mono);font-size:13px;background:var(--panel2);border:1px solid var(--border2);color:var(--text);padding:8px 10px;border-radius:9px;margin-top:8px;';
      ['PLANTEL', 'G2 PS'].forEach(function (c) {
        var o = document.createElement('option'); o.value = c; o.textContent = c; if (c == s.camada) o.selected = true;
        selMayores.appendChild(o);
      });
      div.appendChild(selMayores);
    }
    var botones = document.createElement('div'); botones.style.cssText = 'display:flex;gap:8px;margin-top:10px;';
    var ok = document.createElement('button'); ok.textContent = 'Aprobar';
    ok.style.cssText = 'flex:1;background:var(--green);border:none;color:#06222e;font-weight:800;font-family:var(--sans);font-size:13px;padding:9px;border-radius:9px;cursor:pointer;';
    ok.onclick = function () { resolverSolicitud_(s.email, true, s.nombre, selMayores ? selMayores.value : null); };
    var no = document.createElement('button'); no.textContent = 'Rechazar';
    no.style.cssText = 'flex:1;background:var(--panel2);border:1px solid var(--border2);color:var(--text-mid);font-weight:700;font-family:var(--sans);font-size:13px;padding:9px;border-radius:9px;cursor:pointer;';
    no.onclick = function () { resolverSolicitud_(s.email, false, s.nombre, null); };
    botones.appendChild(ok); botones.appendChild(no);
    div.appendChild(botones);
    box.appendChild(div);
  });
}

function resolverSolicitud_(email, aprobar, nombre, mayores) {
  if (!configLista_()) return;
  var msg = document.getElementById('solicitudMsg');
  msg.style.color = 'var(--text-dim)'; msg.textContent = (aprobar ? 'Aprobando' : 'Rechazando') + ' a ' + nombre + '…';
  fetch(CONFIG.BACKEND_URL, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'},
    body: JSON.stringify({token: state.token, action: 'resolverSolicitud', email: email, aprobar: aprobar, mayores: mayores})})
    .then(function (r) { return r.json(); })
    .then(function (j) {
      if (j.error) { msg.style.color = 'var(--red)'; msg.textContent = 'Error: ' + j.error; return; }
      msg.style.color = 'var(--green)'; msg.textContent = (aprobar ? '¡Aprobado! ' : 'Rechazado. ') + j.nombre;
      cargarAvisos_();
    })
    .catch(function () { msg.style.color = 'var(--red)'; msg.textContent = 'No se pudo conectar. Probá de nuevo.'; });
}

// Un profe de camada no puede mandar avisos a "Todos" ni elegir otra camada que la suya --
// se achica el desplegable "Para" y las opciones de camada a lo que le corresponde.
function ajustarComposeBoxCargo_(camadasCargo) {
  var selTipo = document.getElementById('avDestinoTipo');
  var optTodos = selTipo.querySelector('option[value="TODOS"]');
  if (optTodos) { optTodos.hidden = !!camadasCargo; optTodos.disabled = !!camadasCargo; }
  if (camadasCargo && selTipo.value == 'TODOS') selTipo.value = 'CAMADA';
  var selCamada = document.getElementById('avCamada');
  Array.from(selCamada.options).forEach(function (o) { o.hidden = !!camadasCargo && camadasCargo.indexOf(o.value) < 0; });
  if (camadasCargo && camadasCargo.indexOf(selCamada.value) < 0) selCamada.value = camadasCargo[0];
  document.getElementById('avDestinoTipo').dispatchEvent(new Event('change'));
}

// ---------------------------------------------------------------------------
// ⚙️ Profes: solo jefes (COACH_EMAILS) ven y tocan esto.
// ---------------------------------------------------------------------------
// Genérico: ⚙️ Profes y ⚙️ Staff son el mismo patrón (lista por camada, agregar/sacar mail).
function renderGrupoEmails_(contId, titulo, lista, accion) {
  var box = document.getElementById(contId);
  box.classList.toggle('hidden', !lista);
  box.innerHTML = '';
  if (!lista) return;
  var t = document.createElement('div'); t.className = 'exgroup-title'; t.textContent = titulo;
  box.appendChild(t);
  lista.forEach(function (p) {
    var div = document.createElement('div'); div.className = 'excard';
    var name = document.createElement('div'); name.className = 'exname'; name.textContent = p.camada;
    div.appendChild(name);
    var list = document.createElement('div'); list.style.marginTop = '8px';
    if (!p.emails.length) { var vac = document.createElement('div'); vac.className = 'exempty'; vac.textContent = 'Sin nadie asignado.'; list.appendChild(vac); }
    p.emails.forEach(function (m) {
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:6px;font-family:var(--mono);font-size:12px;';
      var txt = document.createElement('span'); txt.style.flex = '1'; txt.textContent = m;
      var x = document.createElement('button'); x.textContent = '✕';
      x.style.cssText = 'background:none;border:1px solid var(--border2);color:var(--red);border-radius:8px;width:26px;height:26px;cursor:pointer;flex-shrink:0;';
      x.onclick = function () { guardarGrupoEmails_(accion, p.camada, p.emails.filter(function (e) { return e != m; })); };
      row.appendChild(txt); row.appendChild(x);
      list.appendChild(row);
    });
    div.appendChild(list);
    var addRow = document.createElement('div'); addRow.className = 'exrow2'; addRow.style.marginTop = '8px';
    var inp = document.createElement('input'); inp.type = 'text'; inp.placeholder = 'mail@gmail.com';
    inp.style.cssText = 'flex:1;font-family:var(--mono);font-size:13px;background:var(--panel2);border:1px solid var(--border2);color:var(--text);padding:8px 10px;border-radius:9px;';
    var add = document.createElement('button'); add.textContent = 'Agregar';
    add.style.cssText = 'background:var(--accent);border:none;color:#06222e;font-weight:700;font-family:var(--sans);font-size:12px;padding:8px 14px;border-radius:9px;cursor:pointer;flex-shrink:0;';
    add.onclick = function () {
      var m = inp.value.trim().toLowerCase(); if (!m) return;
      guardarGrupoEmails_(accion, p.camada, p.emails.concat([m]).filter(function (e, i, arr) { return arr.indexOf(e) == i; }));
    };
    addRow.appendChild(inp); addRow.appendChild(add);
    div.appendChild(addRow);
    box.appendChild(div);
  });
}

function guardarGrupoEmails_(accion, camada, mails) {
  if (!configLista_()) return;
  fetch(CONFIG.BACKEND_URL, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'},
    body: JSON.stringify({token: state.token, action: accion, camada: camada, mails: mails})})
    .then(function (r) { return r.json(); })
    .then(function (j) { if (!j.error) cargarAvisos_(); })
    .catch(function () {});
}

function renderProfes_() { renderGrupoEmails_('profesBox', '⚙️ Profes', state.avisos && state.avisos.profes, 'guardarProfes'); }
function renderStaff_() { renderGrupoEmails_('staffBox', '⚙️ Staff', state.avisos && state.avisos.staff, 'guardarStaff'); }
// Médico es siempre todo el club (sin CAMADA en la hoja) -- se envuelve en el mismo formato
// {camada, emails} que espera renderGrupoEmails_ para reusar esa UI de agregar/sacar mails.
function renderMedico_() {
  var m = state.avisos && state.avisos.medico;
  renderGrupoEmails_('medicoBox', '⚙️ Cuerpo médico (todo el club)', m ? [{camada: 'Todo el club', emails: m}] : null, 'guardarMedico');
}

function renderAvisos_() {
  var d = state.avisos; if (!d) return;
  state.camadasCargo = d.camadasCargo || null;
  document.getElementById('composeBox').classList.toggle('hidden', !d.esCoach);
  var cargoLine = document.getElementById('cargoLine');
  cargoLine.classList.toggle('hidden', !d.cargo);
  cargoLine.textContent = d.cargo || '';
  renderSolicitudes_();
  renderProfes_();
  renderStaff_();
  renderMedico_();
  if (d.esCoach) ajustarComposeBoxCargo_(d.camadasCargo);

  var cb = document.getElementById('cumpleBox'); cb.innerHTML = '';
  (d.cumpleanos || []).forEach(function (c) {
    var div = document.createElement('div'); div.className = 'cumplecard';
    div.innerHTML = '🎂 <b>' + c.nombre + '</b> — ' + (c.hoy ? '¡cumple hoy!' : 'cumple el ' + fmtFecha_(c.fecha));
    cb.appendChild(div);
  });

  var vistos = d.vistosHasta ? new Date(d.vistosHasta).getTime() : 0;
  var list = document.getElementById('avisosList'); list.innerHTML = '';
  if (!d.avisos || !d.avisos.length) { list.innerHTML = '<div class="exempty">Todavía no hay avisos.</div>'; }
  (d.avisos || []).forEach(function (a) {
    var esNuevo = new Date(a.fecha).getTime() > vistos;
    var div = document.createElement('div'); div.className = 'avisocard' + (esNuevo ? ' unread' : '');
    var meta = document.createElement('div'); meta.className = 'meta';
    meta.textContent = fmtFechaHora_(a.fecha) + (state.esCoach ? ' · ' + destinoTexto_(a) : '');
    var texto = document.createElement('div'); texto.className = 'texto'; texto.textContent = a.texto;
    div.appendChild(meta); div.appendChild(texto);
    list.appendChild(div);
  });
}

function actualizarBadge_() {
  var badge = document.getElementById('avBadge');
  var d = state.avisos;
  if (!d) { badge.classList.add('hidden'); return; }
  if (state.esCoach) {
    var pendientes = (state.solicitudes || []).length;
    if (pendientes > 0) { badge.textContent = pendientes > 9 ? '9+' : pendientes; badge.classList.remove('hidden'); }
    else badge.classList.add('hidden');
    return;
  }
  if (!d.avisos) { badge.classList.add('hidden'); return; }
  var vistos = d.vistosHasta ? new Date(d.vistosHasta).getTime() : 0;
  var noLeidos = d.avisos.filter(function (a) { return new Date(a.fecha).getTime() > vistos; }).length;
  if (noLeidos > 0) { badge.textContent = noLeidos > 9 ? '9+' : noLeidos; badge.classList.remove('hidden'); }
  else badge.classList.add('hidden');
}

function marcarAvisosVistos_() {
  if (!configLista_() || state.esCoach) return;
  fetch(CONFIG.BACKEND_URL, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'},
    body: JSON.stringify({token: state.token, action: 'marcarAvisosVistos'})}).catch(function () {});
}

function normalizarBusqueda_(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Sugerencias del buscador de jugador al escribir un aviso a "Un jugador": filtra
// state.jugadoresLista (la manda el backend solo al coach) por coincidencia en cualquier
// parte del nombre, sin importar mayúsculas/tildes.
function renderSugerenciasJugador_(q) {
  var cont = document.getElementById('avJugadorSugerencias');
  var query = normalizarBusqueda_(q).trim();
  if (!query) { cont.classList.add('hidden'); cont.innerHTML = ''; return; }
  var coincidencias = (state.jugadoresLista || [])
    .filter(function (n) { return normalizarBusqueda_(n).indexOf(query) >= 0; })
    .slice(0, 8);
  cont.innerHTML = '';
  if (!coincidencias.length) { cont.classList.add('hidden'); return; }
  coincidencias.forEach(function (n) {
    var div = document.createElement('div'); div.className = 'sug'; div.textContent = n;
    div.onclick = function () {
      document.getElementById('avJugador').value = n;
      cont.classList.add('hidden'); cont.innerHTML = '';
    };
    cont.appendChild(div);
  });
  cont.classList.remove('hidden');
}

function enviarAviso_() {
  var msg = document.getElementById('avMsg');
  var texto = document.getElementById('avTexto').value.trim();
  var destinoTipo = document.getElementById('avDestinoTipo').value;
  var destinoValor = destinoTipo == 'CAMADA' ? document.getElementById('avCamada').value
    : destinoTipo == 'JUGADOR' ? document.getElementById('avJugador').value.trim() : '';
  if (!texto) { msg.style.color = 'var(--red)'; msg.textContent = 'Escribí un mensaje.'; return; }
  if (destinoTipo == 'JUGADOR' && !destinoValor) { msg.style.color = 'var(--red)'; msg.textContent = 'Escribí el nombre del jugador.'; return; }
  if (!configLista_()) { msg.style.color = 'var(--accent)'; msg.textContent = 'Backend sin configurar: no se envió nada de verdad.'; return; }
  var btn = document.getElementById('avEnviarBtn');
  if (btn.disabled) return;   // evita doble envío por doble tap mientras ya está en curso
  btn.disabled = true;
  msg.style.color = 'var(--text-dim)'; msg.textContent = 'Enviando…';
  fetch(CONFIG.BACKEND_URL, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'},
    body: JSON.stringify({token: state.token, action: 'enviarAviso', destinoTipo: destinoTipo, destinoValor: destinoValor, texto: texto})})
    .then(function (r) { return r.json(); })
    .then(function (j) {
      btn.disabled = false;
      if (j.error == 'No autorizado') { sesionVencida_(); return; }
      if (j.error) { msg.style.color = 'var(--red)'; msg.textContent = 'Error: ' + j.error; return; }
      msg.style.color = 'var(--green)'; msg.textContent = '¡Aviso enviado!';
      document.getElementById('avTexto').value = '';
      cargarAvisos_();
    })
    .catch(function () { btn.disabled = false; msg.style.color = 'var(--red)'; msg.textContent = 'No se pudo conectar. Probá de nuevo.'; });
}

// ---------------------------------------------------------------------------
// Carga
// ---------------------------------------------------------------------------
function campoRM_(nombre) {
  var div = document.createElement('div'); div.className = 'exrow2';
  var last = state.misDatos && state.misDatos.ejercicios[nombre];
  var etq = etiquetaCarga_(nombre);
  div.innerHTML =
    '<div class="fitem"><label>' + etq + ' · Kg</label><input type="text" inputmode="decimal" data-ej="' + nombre + '" data-campo="kg"></div>' +
    '<div class="fitem"><label>' + etq + ' · Reps (1 a 15)</label><input type="text" inputmode="numeric" data-ej="' + nombre + '" data-campo="reps"></div>';
  var wrap = document.createElement('div');
  if (last) { var l = document.createElement('div'); l.className = 'lastmark'; l.textContent = 'Última: ' + last.actual + ' kg'; wrap.appendChild(l); }
  wrap.appendChild(div);
  return wrap;
}

function cambiarCargaTab_(tab) {
  state.cargaTab = tab;
  document.querySelectorAll('#cargaPills .pill').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-carga') == tab); });
  document.getElementById('cargaGymPanel').classList.toggle('hidden', tab != 'gym');
  document.getElementById('cargaCampoPanel').classList.toggle('hidden', tab != 'campo');
  document.getElementById('cargaPartidoPanel').classList.toggle('hidden', tab != 'partido');
  document.getElementById('cargaCierre').classList.toggle('hidden', tab == 'partido');
  document.getElementById('submitBtn').classList.toggle('hidden', tab == 'partido');
  document.getElementById('cargaMsg').classList.toggle('hidden', tab == 'partido');
  document.getElementById('cFechaWrap').classList.toggle('hidden', tab == 'partido');
  document.getElementById('submitBtn').textContent = tab == 'campo' ? 'Cargar sesión de campo' : 'Cargar sesión de gym';
}

function pintarCamposCarga_() {
  EJERCICIOS_POTENCIA_CARGA.concat(EJERCICIOS_FUERZA_CARGA).forEach(function (e) {
    var cont = document.getElementById(CAMPO_ID[e]); if (!cont) return;
    cont.innerHTML = ''; cont.appendChild(campoRM_(e));
  });
  var saltoInfo = state.misDatos && state.misDatos.ejercicios['SALTO HORIZONTAL'];
  document.getElementById('lastSalto').textContent = saltoInfo ? 'Última: ' + saltoInfo.actual + ' m' : '';
  var broncoInfo = state.misDatos && state.misDatos.ejercicios['BRONCO'];
  document.getElementById('lastBronco').textContent = broncoInfo ? 'Última: ' + formatearValor_('BRONCO', broncoInfo.actual) : '';
  var velMaxInfo = state.misDatos && state.misDatos.ejercicios['VEL MAX'];
  document.getElementById('lastVelMax').textContent = velMaxInfo ? 'Última: ' + velMaxInfo.actual + ' km/h' : '';
  var pesoInfo = state.misDatos && state.misDatos.pesoActual;
  document.getElementById('lastPeso').textContent = pesoInfo != null ? 'Último: ' + pesoInfo + ' kg' : '';
  var alturaInfo = state.misDatos && state.misDatos.alturaActual;
  document.getElementById('lastAltura').textContent = alturaInfo != null ? 'Última: ' + alturaInfo + ' cm' : '';
  document.getElementById('cFecha').value = new Date().toISOString().slice(0, 10);
  cambiarCargaTab_(state.cargaTab || 'gym');
  pintarCamposPartido_();
}

function pintarCamposPartido_() {
  var equipos = (state.misDatos && state.misDatos.equiposPartido) || [];
  var sel = document.getElementById('pEquipo');
  sel.innerHTML = '<option value="">Elegí el equipo</option>' + equipos.map(function (e) { return '<option value="' + e + '">' + e + '</option>'; }).join('');
  var selZona = document.getElementById('pZona');
  if (selZona.options.length <= 1) {
    selZona.innerHTML = '<option value="">Elegí la zona</option>' + ZONAS_LESION.map(function (z) { return '<option value="' + z + '">' + z + '</option>'; }).join('');
  }
  document.getElementById('pFecha').value = new Date().toISOString().slice(0, 10);
  var p = state.misDatos && state.misDatos.partidos;
  document.getElementById('lastPartido').textContent = (p && p.ultimo) ? 'Último: ' + p.ultimo.equipo + ' · ' + p.ultimo.minutos + ' min · ' + fmtFecha_(p.ultimo.fecha) : '';
}

function recolectarEjercicios_() {
  var out = [];
  document.querySelectorAll('[data-ej]').forEach(function (inp) {
    var ej = inp.getAttribute('data-ej'), campo = inp.getAttribute('data-campo');
    if (!inp.value) return;
    var existente = out.filter(function (o) { return o.nombre == ej; })[0];
    if (!existente) { existente = {nombre: ej}; out.push(existente); }
    existente[campo] = inp.value;
  });
  return out.filter(function (o) { return o.reps || o.kg; });
}

function enviarCarga_() {
  var msg = document.getElementById('cargaMsg');
  var ejercicios = [];
  if (state.cargaTab == 'campo') {
    var min = document.getElementById('cBroncoMin').value, seg = document.getElementById('cBroncoSeg').value;
    if (min || seg) ejercicios.push({nombre: 'BRONCO', valor: String((Number(min) || 0) * 60 + (Number(seg) || 0))});
    var velMax = document.getElementById('cVelMax').value;
    if (velMax) ejercicios.push({nombre: 'VEL MAX', valor: velMax});
  } else {
    ejercicios = recolectarEjercicios_();
    var salto = document.getElementById('cSalto').value;
    if (salto) ejercicios.push({nombre: 'SALTO HORIZONTAL', valor: salto});
  }
  var body = {
    token: state.token, fecha: document.getElementById('cFecha').value,
    pesoCorporal: document.getElementById('cPeso').value, altura: document.getElementById('cAltura').value,
    rpeSesion: document.getElementById('cRpe').value,
    duracionMin: document.getElementById('cMin').value, ejercicios: ejercicios
  };
  if (!ejercicios.length && !body.pesoCorporal && !body.altura) { msg.style.color = 'var(--red)'; msg.textContent = 'Cargá al menos un dato.'; return; }
  var repsInvalidas = ejercicios.filter(function (e) { return e.reps && (Number(e.reps) < 1 || Number(e.reps) > 15); });
  if (repsInvalidas.length) { msg.style.color = 'var(--red)'; msg.textContent = 'Reps fuera de rango en ' + repsInvalidas.map(function (e) { return e.nombre; }).join(', ') + ' (tiene que ser de 1 a 15).'; return; }
  if (!configLista_()) { msg.style.color = 'var(--accent)'; msg.textContent = 'Backend sin configurar: no se envió nada de verdad.'; return; }
  var btn = document.getElementById('submitBtn');
  if (btn.disabled) return;   // evita doble envío por doble tap mientras ya está en curso
  btn.disabled = true;
  msg.style.color = 'var(--text-dim)'; msg.textContent = 'Enviando…';
  fetch(CONFIG.BACKEND_URL, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'}, body: JSON.stringify(body)})
    .then(function (r) { return r.json(); })
    .then(function (j) {
      btn.disabled = false;
      if (j.error == 'No autorizado') { sesionVencida_(); return; }
      if (j.error) { msg.style.color = 'var(--red)'; msg.textContent = 'Error: ' + j.error; return; }
      msg.style.color = 'var(--green)'; msg.textContent = '¡Cargado! (' + j.cargados + ' registros)';
      cargarMisDatos_(); cargarAvisos_();   // la carga puede generar avisos automáticos (récord, cambio brusco)
    })
    .catch(function () { btn.disabled = false; msg.style.color = 'var(--red)'; msg.textContent = 'No se pudo conectar. Probá de nuevo.'; });
}

function enviarPartido_() {
  var msg = document.getElementById('partidoMsg');
  var lesion = document.getElementById('pLesion').value;
  var body = {
    token: state.token, action: 'partido', fecha: document.getElementById('pFecha').value,
    equipo: document.getElementById('pEquipo').value, minutos: document.getElementById('pMinutos').value,
    lesion: lesion, zona: document.getElementById('pZona').value, detalle: document.getElementById('pDetalle').value
  };
  if (!body.equipo) { msg.style.color = 'var(--red)'; msg.textContent = 'Elegí el equipo.'; return; }
  if (lesion == 'NO' && !body.minutos) { msg.style.color = 'var(--red)'; msg.textContent = 'Cargá los minutos que jugaste.'; return; }
  if (lesion != 'NO' && !body.zona) { msg.style.color = 'var(--red)'; msg.textContent = 'Elegí la zona de la lesión.'; return; }
  if (lesion != 'NO' && !body.detalle.trim()) { msg.style.color = 'var(--red)'; msg.textContent = 'Escribí qué fue la lesión.'; return; }
  if (!configLista_()) { msg.style.color = 'var(--accent)'; msg.textContent = 'Backend sin configurar: no se envió nada de verdad.'; return; }
  var btn = document.getElementById('partidoBtn');
  if (btn.disabled) return;
  btn.disabled = true;
  msg.style.color = 'var(--text-dim)'; msg.textContent = 'Enviando…';
  fetch(CONFIG.BACKEND_URL, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'}, body: JSON.stringify(body)})
    .then(function (r) { return r.json(); })
    .then(function (j) {
      btn.disabled = false;
      if (j.error == 'No autorizado') { sesionVencida_(); return; }
      if (j.error) { msg.style.color = 'var(--red)'; msg.textContent = 'Error: ' + j.error; return; }
      msg.style.color = 'var(--green)'; msg.textContent = '¡Partido cargado!';
      document.getElementById('pMinutos').value = ''; document.getElementById('pDetalle').value = '';
      document.getElementById('pLesion').value = 'NO';
      document.getElementById('pZonaWrap').classList.add('hidden'); document.getElementById('pDetalleWrap').classList.add('hidden');
      cargarMisDatos_(); cargarAvisos_();
    })
    .catch(function () { btn.disabled = false; msg.style.color = 'var(--red)'; msg.textContent = 'No se pudo conectar. Probá de nuevo.'; });
}

// ---------------------------------------------------------------------------
// Lesiones (cuerpo médico / PFs): carga con listas cerradas + últimas cargadas.
// ---------------------------------------------------------------------------
function pintarCamposLesion_() {
  document.getElementById('lesFecha').value = new Date().toISOString().slice(0, 10);
  cargarLesionesJugadores_();
  cargarLesionesList_();
}

// Mismo patrón que renderSugerenciasJugador_ (Avisos), sobre state.lesionesJugadores y el
// buscador de la pantalla Lesiones -- no se reusa la misma lista: Avisos solo la manda al coach,
// y el cuerpo médico (sin cargo) la pide por su cuenta con la acción 'jugadoresLesion'.
function renderSugerenciasJugadorLesion_(q) {
  var cont = document.getElementById('lesJugadorSugerencias');
  var query = normalizarBusqueda_(q).trim();
  if (!query) { cont.classList.add('hidden'); cont.innerHTML = ''; return; }
  var coincidencias = (state.lesionesJugadores || [])
    .filter(function (n) { return normalizarBusqueda_(n).indexOf(query) >= 0; })
    .slice(0, 8);
  cont.innerHTML = '';
  if (!coincidencias.length) { cont.classList.add('hidden'); return; }
  coincidencias.forEach(function (n) {
    var div = document.createElement('div'); div.className = 'sug'; div.textContent = n;
    div.onclick = function () { document.getElementById('lesJugador').value = n; cont.classList.add('hidden'); cont.innerHTML = ''; };
    cont.appendChild(div);
  });
  cont.classList.remove('hidden');
}

function renderLesionesList_() {
  var list = document.getElementById('lesList'); list.innerHTML = '';
  var lista = state.lesionesList || [];
  if (!lista.length) { list.innerHTML = '<div class="exempty">Sin lesiones cargadas todavía.</div>'; return; }
  lista.forEach(function (x) {
    var div = document.createElement('div'); div.className = 'avisocard';
    var contexto = x.contexto == 'PARTIDO' ? ('Partido' + (x.minuto ? ' (min ' + x.minuto + ')' : '')) : 'Entrenamiento';
    div.innerHTML = '<div class="meta">' + fmtFecha_(x.fecha) + ' · ' + x.jugador + ' · ' + x.camada + '</div>' +
      '<div class="texto">' + contexto + ' — ' + x.zona + ' (' + x.lado + ') — ' + x.tipo + (x.diagnostico ? ' / ' + x.diagnostico : '') + '</div>' +
      '<div class="lastmark" style="margin-top:4px;">' + x.causa + ' · ' + x.mecanismo + (x.recurrencia == 'Sí' ? ' · Recurrencia' : '') + '</div>' +
      (x.detalle ? '<div class="lastmark">' + x.detalle + '</div>' : '');
    list.appendChild(div);
  });
}

function enviarLesion_() {
  var msg = document.getElementById('lesMsg');
  var jugador = document.getElementById('lesJugador').value.trim();
  var contexto = document.getElementById('lesContexto').value;
  var body = {
    token: state.token, action: 'registrarLesion', jugador: jugador,
    fecha: document.getElementById('lesFecha').value, contexto: contexto,
    minuto: contexto == 'PARTIDO' ? document.getElementById('lesMinuto').value : '',
    zona: document.getElementById('lesZona').value, lado: document.getElementById('lesLado').value,
    tipo: document.getElementById('lesTipo').value, diagnostico: document.getElementById('lesDiagnostico').value,
    recurrencia: document.getElementById('lesRecurrencia').value, causa: document.getElementById('lesCausa').value,
    mecanismo: document.getElementById('lesMecanismo').value, detalle: document.getElementById('lesDetalle').value.trim()
  };
  if (!jugador) { msg.style.color = 'var(--red)'; msg.textContent = 'Elegí el jugador.'; return; }
  if (!body.zona || !body.lado || !body.tipo || !body.diagnostico || !body.recurrencia || !body.causa || !body.mecanismo) {
    msg.style.color = 'var(--red)'; msg.textContent = 'Completá todos los campos.'; return;
  }
  if (contexto == 'PARTIDO' && !body.minuto) { msg.style.color = 'var(--red)'; msg.textContent = 'Elegí el minuto.'; return; }
  if (!configLista_()) { msg.style.color = 'var(--accent)'; msg.textContent = 'Backend sin configurar: no se envió nada de verdad.'; return; }
  var btn = document.getElementById('lesEnviarBtn');
  if (btn.disabled) return;
  btn.disabled = true;
  msg.style.color = 'var(--text-dim)'; msg.textContent = 'Enviando…';
  fetch(CONFIG.BACKEND_URL, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'}, body: JSON.stringify(body)})
    .then(function (r) { return r.json(); })
    .then(function (j) {
      btn.disabled = false;
      if (j.error == 'No autorizado') { sesionVencida_(); return; }
      if (j.error) { msg.style.color = 'var(--red)'; msg.textContent = 'Error: ' + j.error; return; }
      msg.style.color = 'var(--green)'; msg.textContent = '¡Lesión cargada!';
      document.getElementById('lesJugador').value = ''; document.getElementById('lesDetalle').value = '';
      ['lesZona', 'lesLado', 'lesTipo', 'lesDiagnostico', 'lesRecurrencia', 'lesCausa', 'lesMecanismo'].forEach(function (id) {
        document.getElementById(id).value = '';
      });
      cargarLesionesList_();
    })
    .catch(function () { btn.disabled = false; msg.style.color = 'var(--red)'; msg.textContent = 'No se pudo conectar. Probá de nuevo.'; });
}

// ---------------------------------------------------------------------------
// Navegación entre pantallas
// ---------------------------------------------------------------------------
function irAPantalla_(nombre) {
  document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
  document.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('active', t.getAttribute('data-screen') == nombre); });
  document.getElementById('screen' + nombre).classList.add('active');
  if (nombre == 'Ranking') {
    var esStaffOCoach = state.esCoach || state.esStaff || state.esMedico;
    document.getElementById('coachPartidosBox').classList.toggle('hidden', !esStaffOCoach);
    document.getElementById('miRankingBox').classList.toggle('hidden', esStaffOCoach && !state.misDatos);
    document.getElementById('verComoJugadorBtn').classList.toggle('hidden', !state.esCoach);   // staff no "ve como jugador"
    document.getElementById('coachExportBox').classList.toggle('hidden', !esStaffOCoach);
    document.getElementById('excelBtn').classList.toggle('hidden', !state.esCoach);   // staff: solo imprimir, no excel ni mail
    document.getElementById('mailBtn').classList.toggle('hidden', !state.esCoach);
    if (esStaffOCoach) cargarRankingCoach_();
    if (state.misDatos && !state.ranking) cargarRanking_();
  }
  if (nombre == 'Carga') pintarCamposCarga_();
  if (nombre == 'Avisos') { cargarAvisos_(); marcarAvisosVistos_(); document.getElementById('avBadge').classList.add('hidden'); }
  if (nombre == 'Revisar') cargarRevisar_();
  if (nombre == 'Lesiones') pintarCamposLesion_();
}

// ---------------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.tab').forEach(function (t) { t.onclick = function () { irAPantalla_(t.getAttribute('data-screen')); }; });
  document.getElementById('logoutBtn').onclick = salir_;
  document.getElementById('submitBtn').onclick = enviarCarga_;
  document.getElementById('cRpe').oninput = function (e) { document.getElementById('rpeVal').textContent = e.target.value; };
  document.getElementById('avEnviarBtn').onclick = enviarAviso_;
  document.getElementById('avDestinoTipo').onchange = function (e) {
    document.getElementById('avCamadaWrap').classList.toggle('hidden', e.target.value != 'CAMADA');
    document.getElementById('avJugadorWrap').classList.toggle('hidden', e.target.value != 'JUGADOR');
    document.getElementById('avJugadorSugerencias').classList.add('hidden');
  };
  document.getElementById('avJugador').oninput = function (e) { renderSugerenciasJugador_(e.target.value); };
  document.getElementById('avJugador').addEventListener('blur', function () {
    setTimeout(function () { document.getElementById('avJugadorSugerencias').classList.add('hidden'); }, 150);
  });
  document.getElementById('coachCamada').onchange = function (e) { state.coachCamada = e.target.value; cargarRankingCoach_(); };
  document.getElementById('partidoBtn').onclick = enviarPartido_;
  document.getElementById('pLesion').onchange = function (e) {
    var hayLesion = e.target.value != 'NO';
    document.getElementById('pZonaWrap').classList.toggle('hidden', !hayLesion);
    document.getElementById('pDetalleWrap').classList.toggle('hidden', !hayLesion);
  };
  document.querySelectorAll('#cargaPills .pill').forEach(function (b) { b.onclick = function () { cambiarCargaTab_(b.getAttribute('data-carga')); }; });
  document.getElementById('revisarCamada').onchange = function (e) { state.revisarCamada = e.target.value; cargarRevisar_(); };
  document.getElementById('verComoJugadorBtn').onclick = abrirVerComoJugador_;
  document.getElementById('mailBtn').onclick = function () { document.getElementById('mailBox').classList.toggle('hidden'); };
  document.getElementById('mailDestino').onchange = function (e) {
    document.getElementById('mailJugadorWrap').classList.toggle('hidden', e.target.value != 'JUGADOR');
  };
  document.getElementById('mailEnviarBtn').onclick = enviarInformePorMail_;
  document.getElementById('imprimirBtn').onclick = function () { window.print(); };
  document.getElementById('excelBtn').onclick = descargarExcel_;

  function llenarSelect_(id, lista) {
    var sel = document.getElementById(id);
    lista.forEach(function (v) { var o = document.createElement('option'); o.value = v; o.textContent = v; sel.appendChild(o); });
  }
  llenarSelect_('lesZona', ZONAS_LESION_CLINICA);
  llenarSelect_('lesLado', LADOS_LESION);
  llenarSelect_('lesTipo', TIPOS_LESION_CLINICA);
  llenarSelect_('lesDiagnostico', DIAGNOSTICOS_LESION);
  llenarSelect_('lesRecurrencia', RECURRENCIA_LESION);
  llenarSelect_('lesCausa', CAUSAS_LESION);
  llenarSelect_('lesMecanismo', MECANISMOS_LESION);
  document.getElementById('lesEnviarBtn').onclick = enviarLesion_;
  document.getElementById('lesContexto').onchange = function (e) {
    document.getElementById('lesMinutoWrap').classList.toggle('hidden', e.target.value != 'PARTIDO');
  };
  document.getElementById('lesJugador').oninput = function (e) { renderSugerenciasJugadorLesion_(e.target.value); };
  document.getElementById('lesJugador').addEventListener('blur', function () {
    setTimeout(function () { document.getElementById('lesJugadorSugerencias').classList.add('hidden'); }, 150);
  });

  var token = null;
  try { token = localStorage.getItem('liceo_token'); } catch (e) {}
  if (token) { state.token = token; entrarAlApp_(); } else { iniciarGoogle(); }

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(function () {});
});
